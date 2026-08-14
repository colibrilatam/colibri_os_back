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
      this.logger.warn(
        `RPC ${method} falló en chain ${chainId}: ${payload.error.message}`,
      );

      throw new ServiceUnavailableException(
        `Error RPC: ${payload.error.message}`,
      );
    }

    return payload.result as T;
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
}