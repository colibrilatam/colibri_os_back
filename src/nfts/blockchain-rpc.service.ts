import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface JsonRpcResponse<T> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

export interface RpcTransaction {
  hash: string;
  from: string;
  to: string | null;
  blockHash: string | null;
  blockNumber: string | null;
  transactionIndex: string | null;
}

export interface RpcLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  logIndex: string;
  removed?: boolean;
}

export interface RpcReceipt {
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  blockNumber: string;
  from: string;
  to: string | null;
  status: string;
  logs: RpcLog[];
}

export interface RpcBlock {
  number: string;
  hash: string;
  timestamp: string;
}

/**
 * WEB3-003: un `eth_call` que revierte (p.ej. `ownerOf` de un token
 * inexistente) es una respuesta RPC válida, no un fallo de
 * infraestructura. Se distingue de `ServiceUnavailableException` para que
 * el llamador lo trate como resultado negativo en vez de "no disponible".
 */
export class RpcCallRevertedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RpcCallRevertedError';
  }
}

@Injectable()
export class BlockchainRpcService {
  private readonly logger = new Logger(BlockchainRpcService.name);

  constructor(private readonly configService: ConfigService) {}

  private getRpcUrls(): Record<string, string> {
    const raw = this.configService.get<string>('BLOCKCHAIN_RPC_URLS');

    if (!raw) {
      throw new ServiceUnavailableException(
        'BLOCKCHAIN_RPC_URLS no está configurado',
      );
    }

    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      throw new ServiceUnavailableException(
        'BLOCKCHAIN_RPC_URLS no contiene JSON válido',
      );
    }
  }

  private getConfirmations(): Record<string, number> {
    const raw =
      this.configService.get<string>('BLOCKCHAIN_CONFIRMATIONS');

    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as Record<string, number>;
    } catch {
      throw new ServiceUnavailableException(
        'BLOCKCHAIN_CONFIRMATIONS no contiene JSON válido',
      );
    }
  }

  getRequiredConfirmations(chainId: number): number {
    const configured = this.getConfirmations();

    const value = configured[String(chainId)];

    if (value === undefined) {
      return Number(
        this.configService.get<string>(
          'BLOCKCHAIN_DEFAULT_CONFIRMATIONS',
        ) ?? 12,
      );
    }

    return value;
  }

  private getRpcUrl(chainId: number): string {
    const urls = this.getRpcUrls();
    const url = urls[String(chainId)];

    if (!url) {
      throw new ServiceUnavailableException(
        `No existe RPC configurado para chainId ${chainId}`,
      );
    }

    return url;
  }

  async call<T>(
    chainId: number,
    method: string,
    params: unknown[] = [],
  ): Promise<T> {
    const rpcUrl = this.getRpcUrl(chainId);

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `RPC ${chainId} respondió HTTP ${response.status}`,
      );
    }

    const payload =
      (await response.json()) as JsonRpcResponse<T>;

    if (payload.error) {
      const message = payload.error.message ?? 'error desconocido';

      this.logger.warn(
        `RPC ${method} falló en chain ${chainId}: ${message}`,
      );

      // Un revert de ejecución (p.ej. `eth_call` sobre un token
      // inexistente) es una respuesta válida del nodo, no una caída de
      // infraestructura. Se expone como error tipado para que el servicio
      // lo traduzca a un resultado negativo.
      if (
        method === 'eth_call' &&
        this.isExecutionRevert(payload.error.code, message)
      ) {
        throw new RpcCallRevertedError(message);
      }

      throw new ServiceUnavailableException(
        `Error RPC: ${message}`,
      );
    }

    return payload.result as T;
  }

  /**
   * Distingue un revert de ejecución de un fallo de infraestructura.
   *
   * `-32000` es el código genérico de error de servidor de Geth y **no**
   * implica revert ("header not found", "block not found",
   * "insufficient funds", "nonce too low", etc.), por lo que nunca alcanza
   * por sí solo. `3` sí es específico de "execution reverted" en varios
   * providers. `-32015` se acepta únicamente acompañado de un mensaje de
   * ejecución/VM, ya que algunos nodos lo usan para el mismo fin.
   */
  private isExecutionRevert(code: number, message: string): boolean {
    if (code === 3) {
      return true;
    }

    if (/revert/i.test(message)) {
      return true;
    }

    return code === -32015 && /execution|VM/i.test(message);
  }

  async getChainId(chainId: number): Promise<number> {
    const result = await this.call<string>(
      chainId,
      'eth_chainId',
    );

    return Number.parseInt(result, 16);
  }

  async getTransaction(
    chainId: number,
    txHash: string,
  ): Promise<RpcTransaction | null> {
    return this.call<RpcTransaction | null>(
      chainId,
      'eth_getTransactionByHash',
      [txHash],
    );
  }

  async getTransactionReceipt(
    chainId: number,
    txHash: string,
  ): Promise<RpcReceipt | null> {
    return this.call<RpcReceipt | null>(
      chainId,
      'eth_getTransactionReceipt',
      [txHash],
    );
  }

  async getBlockByNumber(
    chainId: number,
    blockNumber: string,
  ): Promise<RpcBlock | null> {
    return this.call<RpcBlock | null>(
      chainId,
      'eth_getBlockByNumber',
      [blockNumber, false],
    );
  }

  async getLatestBlockNumber(chainId: number): Promise<number> {
    const result = await this.call<string>(
      chainId,
      'eth_blockNumber',
    );

    return Number.parseInt(result, 16);
  }

  /**
   * WEB3-003: código de bytes desplegado en una dirección. `0x` significa
   * que no hay contrato, por lo que no tiene sentido invocar `ownerOf`.
   */
  async getCode(
    chainId: number,
    address: string,
  ): Promise<string> {
    return this.call<string>(chainId, 'eth_getCode', [
      address,
      'latest',
    ]);
  }

  /**
   * WEB3-003: `eth_call` contra un bloque pinneado. Un revert lanza
   * `RpcCallRevertedError` (respuesta válida); un fallo de transporte lanza
   * `ServiceUnavailableException`.
   */
  async ethCall(
    chainId: number,
    to: string,
    data: string,
    blockTag: string,
  ): Promise<string> {
    return this.call<string>(chainId, 'eth_call', [
      { to, data },
      blockTag,
    ]);
  }
}