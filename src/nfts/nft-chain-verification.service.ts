import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  NftChainProofStatus,
} from './entities/nft-chain-proof.entity';
import {
  NftEventType,
  NftOwnershipEvent,
} from './entities/nft-ownership-event.entity';
import { NftProject } from './entities/nft-project.entity';
import { User } from '../users/entities/user.entity';
import {
  BlockchainRpcService,
  RpcLog,
  RpcReceipt,
} from './blockchain-rpc.service';

const ERC721_TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a9df523b3ef';

const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000';

export interface NftChainVerificationResult {
  status: NftChainProofStatus;

  chainId: number;

  contractAddress: string;

  tokenId: string;

  txHash: string;

  txFromAddress: string | null;

  txToAddress: string | null;

  eventFromAddress: string | null;

  eventToAddress: string | null;

  blockNumber: string | null;

  blockHash: string | null;

  transactionIndex: number | null;

  confirmations: number;

  requiredConfirmations: number;

  blockTimestamp: Date | null;

  validationError: string | null;
}

@Injectable()
export class NftChainVerificationService {
  private readonly logger = new Logger(
    NftChainVerificationService.name,
  );

  constructor(
    private readonly blockchainRpc: BlockchainRpcService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async verifyOwnershipEvent(params: {
    nftProject: NftProject;
    txHash: string;
    eventType: NftEventType;
    fromUserId?: string;
    toUserId?: string;
  }): Promise<NftChainVerificationResult> {
    const {
      nftProject,
      txHash,
      eventType,
      fromUserId,
      toUserId,
    } = params;

    const chainId = nftProject.chainId;
    const contractAddress =
      nftProject.contractAddress.toLowerCase();

    if (!chainId || chainId <= 0) {
      return this.invalid(
        chainId,
        contractAddress,
        nftProject.tokenId,
        txHash,
        'El NFT no tiene un chainId blockchain válido',
      );
    }

    if (
      !contractAddress ||
      contractAddress === 'pending_blockchain'
    ) {
      return this.invalid(
        chainId,
        contractAddress,
        nftProject.tokenId,
        txHash,
        'El NFT no tiene un contrato blockchain válido',
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 1. Validar que el RPC realmente corresponde a la red esperada
    // ─────────────────────────────────────────────────────────────

    const rpcChainId =
      await this.blockchainRpc.getChainId(chainId);

    if (rpcChainId !== chainId) {
      return this.invalid(
        chainId,
        contractAddress,
        nftProject.tokenId,
        txHash,
        `RPC conectado a chainId ${rpcChainId}, pero el NFT requiere ${chainId}`,
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Buscar la transacción
    // ─────────────────────────────────────────────────────────────

    const transaction =
      await this.blockchainRpc.getTransaction(
        chainId,
        txHash,
      );

    if (!transaction) {
      return this.invalid(
        chainId,
        contractAddress,
        nftProject.tokenId,
        txHash,
        'La transacción no existe en la red configurada',
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Validar que la transacción apunte al contrato esperado
    // ─────────────────────────────────────────────────────────────

    if (
      !transaction.to ||
      transaction.to.toLowerCase() !== contractAddress
    ) {
      return this.invalid(
        chainId,
        contractAddress,
        nftProject.tokenId,
        txHash,
        `La transacción apunta a ${transaction.to ?? 'null'}, no al contrato ${contractAddress}`,
        transaction.from,
        transaction.to,
      );
    }

    const receipt =
      await this.blockchainRpc.getTransactionReceipt(
        chainId,
        txHash,
      );

    // Transaction existe pero todavía no tiene receipt:
    // existe on-chain como pending.
    if (!receipt) {
      return {
        status: NftChainProofStatus.PENDING,
        chainId,
        contractAddress,
        tokenId: nftProject.tokenId,
        txHash,
        txFromAddress: transaction.from,
        txToAddress: transaction.to,
        eventFromAddress: null,
        eventToAddress: null,
        blockNumber: null,
        blockHash: null,
        transactionIndex: null,
        confirmations: 0,
        requiredConfirmations:
          this.blockchainRpc.getRequiredConfirmations(chainId),
        blockTimestamp: null,
        validationError:
          'La transacción existe pero todavía no tiene receipt confirmado',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Receipt revertido
    // ─────────────────────────────────────────────────────────────

    if (receipt.status === '0x0') {
      return {
        status: NftChainProofStatus.REVERTED,
        chainId,
        contractAddress,
        tokenId: nftProject.tokenId,
        txHash,
        txFromAddress: receipt.from,
        txToAddress: receipt.to,
        eventFromAddress: null,
        eventToAddress: null,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        transactionIndex: this.hexToNumber(
          receipt.transactionIndex,
        ),
        confirmations: 0,
        requiredConfirmations:
          this.blockchainRpc.getRequiredConfirmations(chainId),
        blockTimestamp: null,
        validationError:
          'La transacción fue incluida pero su ejecución fue revertida',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 5. Validar logs
    // ─────────────────────────────────────────────────────────────

    const transferLogs = receipt.logs.filter(
      (log) =>
        log.address.toLowerCase() === contractAddress &&
        log.topics[0]?.toLowerCase() ===
          ERC721_TRANSFER_TOPIC &&
        log.topics.length >= 4,
    );

    const matchingLogs = transferLogs.filter((log) => {
      const tokenId = this.decodeUint256(log.topics[3]);

      return (
        tokenId === this.normalizeTokenId(nftProject.tokenId)
      );
    });

    if (matchingLogs.length === 0) {
      return this.invalid(
        chainId,
        contractAddress,
        nftProject.tokenId,
        txHash,
        `No existe un evento ERC-721 Transfer para el tokenId ${nftProject.tokenId}`,
        receipt.from,
        receipt.to,
        receipt.blockNumber,
        receipt.blockHash,
        this.hexToNumber(receipt.transactionIndex),
      );
    }

    if (matchingLogs.length > 1) {
      return this.invalid(
        chainId,
        contractAddress,
        nftProject.tokenId,
        txHash,
        `La transacción contiene ${matchingLogs.length} eventos Transfer para el mismo tokenId; la prueba es ambigua`,
        receipt.from,
        receipt.to,
        receipt.blockNumber,
        receipt.blockHash,
        this.hexToNumber(receipt.transactionIndex),
      );
    }

    const transferLog = matchingLogs[0];

    if (transferLog.removed) {
      return {
        status: NftChainProofStatus.REVERTED,
        chainId,
        contractAddress,
        tokenId: nftProject.tokenId,
        txHash,
        txFromAddress: receipt.from,
        txToAddress: receipt.to,
        eventFromAddress: null,
        eventToAddress: null,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        transactionIndex: this.hexToNumber(
          receipt.transactionIndex,
        ),
        confirmations: 0,
        requiredConfirmations:
          this.blockchainRpc.getRequiredConfirmations(chainId),
        blockTimestamp: null,
        validationError:
          'El log Transfer fue marcado como removido por el nodo',
      };
    }

    const eventFromAddress =
      this.decodeAddress(transferLog.topics[1]);

    const eventToAddress =
      this.decodeAddress(transferLog.topics[2]);

    const tokenId =
      this.decodeUint256(transferLog.topics[3]);

    // ─────────────────────────────────────────────────────────────
    // 6. Validar semántica MINT/BURN/TRANSFER
    // ─────────────────────────────────────────────────────────────

    if (
      eventType === NftEventType.MINT &&
      eventFromAddress !== ZERO_ADDRESS
    ) {
      return this.invalid(
        chainId,
        contractAddress,
        nftProject.tokenId,
        txHash,
        `El evento declarado como mint tiene from=${eventFromAddress} en vez de zero address`,
        receipt.from,
        receipt.to,
        receipt.blockNumber,
        receipt.blockHash,
        this.hexToNumber(receipt.transactionIndex),
        eventFromAddress,
        eventToAddress,
      );
    }

    if (
      eventType === NftEventType.BURN &&
      eventToAddress !== ZERO_ADDRESS
    ) {
      return this.invalid(
        chainId,
        contractAddress,
        nftProject.tokenId,
        txHash,
        `El evento declarado como burn tiene to=${eventToAddress} en vez de zero address`,
        receipt.from,
        receipt.to,
        receipt.blockNumber,
        receipt.blockHash,
        this.hexToNumber(receipt.transactionIndex),
        eventFromAddress,
        eventToAddress,
      );
    }

    if (
      [NftEventType.TRANSFER, NftEventType.ASSIGN, NftEventType.SALE]
        .includes(eventType) &&
      (eventFromAddress === ZERO_ADDRESS ||
        eventToAddress === ZERO_ADDRESS)
    ) {
      return this.invalid(
        chainId,
        contractAddress,
        nftProject.tokenId,
        txHash,
        `El evento ${eventType} no corresponde a un Transfer normal`,
        receipt.from,
        receipt.to,
        receipt.blockNumber,
        receipt.blockHash,
        this.hexToNumber(receipt.transactionIndex),
        eventFromAddress,
        eventToAddress,
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 7. Validar actor interno contra wallet on-chain
    // ─────────────────────────────────────────────────────────────

    await this.validateUserWallet(
      fromUserId,
      eventFromAddress,
      'fromUserId',
      eventType === NftEventType.MINT,
    );

    await this.validateUserWallet(
      toUserId,
      eventToAddress,
      'toUserId',
      eventType === NftEventType.BURN,
    );

    // ─────────────────────────────────────────────────────────────
    // 8. Bloque y timestamp
    // ─────────────────────────────────────────────────────────────

    const block =
      await this.blockchainRpc.getBlockByNumber(
        chainId,
        receipt.blockNumber,
      );

    if (!block) {
      return {
        status: NftChainProofStatus.PENDING,
        chainId,
        contractAddress,
        tokenId,
        txHash,
        txFromAddress: receipt.from,
        txToAddress: receipt.to,
        eventFromAddress,
        eventToAddress,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        transactionIndex: this.hexToNumber(
          receipt.transactionIndex,
        ),
        confirmations: 0,
        requiredConfirmations:
          this.blockchainRpc.getRequiredConfirmations(chainId),
        blockTimestamp: null,
        validationError:
          'El receipt existe pero el bloque todavía no pudo reconstruirse',
      };
    }

    // Evita aceptar un receipt cuyo hash de bloque no coincida.
    if (
      block.hash.toLowerCase() !==
      receipt.blockHash.toLowerCase()
    ) {
      return this.invalid(
        chainId,
        contractAddress,
        tokenId,
        txHash,
        'El blockHash del receipt no coincide con el bloque consultado',
        receipt.from,
        receipt.to,
        receipt.blockNumber,
        receipt.blockHash,
        this.hexToNumber(receipt.transactionIndex),
        eventFromAddress,
        eventToAddress,
      );
    }

    const latestBlock =
      await this.blockchainRpc.getLatestBlockNumber(chainId);

    const blockNumber =
      Number.parseInt(receipt.blockNumber, 16);

    const confirmations =
      Math.max(0, latestBlock - blockNumber + 1);

    const requiredConfirmations =
      this.blockchainRpc.getRequiredConfirmations(chainId);

    const status =
      confirmations >= requiredConfirmations
        ? NftChainProofStatus.CONFIRMED
        : NftChainProofStatus.PENDING;

    return {
      status,
      chainId,
      contractAddress,
      tokenId,
      txHash,
      txFromAddress: receipt.from,
      txToAddress: receipt.to,
      eventFromAddress,
      eventToAddress,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      transactionIndex: this.hexToNumber(
        receipt.transactionIndex,
      ),
      confirmations,
      requiredConfirmations,
      blockTimestamp: new Date(
        Number.parseInt(block.timestamp, 16) * 1000,
      ),
      validationError:
        status === NftChainProofStatus.PENDING
          ? `La transacción está confirmada en bloque pero necesita ${requiredConfirmations} confirmaciones`
          : null,
      verifiedAt:
        status === NftChainProofStatus.CONFIRMED
          ? new Date()
          : null,
    } as NftChainVerificationResult;
  }

  private async validateUserWallet(
    userId: string | undefined,
    blockchainAddress: string,
    fieldName: string,
    allowZeroAddress: boolean,
  ): Promise<void> {
    if (!userId) {
      if (allowZeroAddress && blockchainAddress === ZERO_ADDRESS) {
        return;
      }

      return;
    }

    const user =
      await this.userRepository.findOne({
        where: { id: userId },
      });

    if (!user) {
      throw new NotFoundException(
        `Usuario ${userId} no encontrado`,
      );
    }

    if (!user.cryptoWallet) {
      throw new ConflictException(
        `${fieldName} no tiene una cryptoWallet vinculada`,
      );
    }

    if (
      user.cryptoWallet.toLowerCase() !==
      blockchainAddress.toLowerCase()
    ) {
      throw new BadRequestException(
        `${fieldName} no coincide con la wallet registrada: esperado ${user.cryptoWallet}, recibido ${blockchainAddress}`,
      );
    }
  }

  private invalid(
    chainId: number,
    contractAddress: string,
    tokenId: string,
    txHash: string,
    validationError: string,
    txFromAddress: string | null = null,
    txToAddress: string | null = null,
    blockNumber: string | null = null,
    blockHash: string | null = null,
    transactionIndex: number | null = null,
    eventFromAddress: string | null = null,
    eventToAddress: string | null = null,
  ): NftChainVerificationResult {
    return {
      status: NftChainProofStatus.INVALID,
      chainId,
      contractAddress,
      tokenId,
      txHash,
      txFromAddress,
      txToAddress,
      eventFromAddress,
      eventToAddress,
      blockNumber,
      blockHash,
      transactionIndex,
      confirmations: 0,
      requiredConfirmations:
        this.blockchainRpc.getRequiredConfirmations(chainId),
      blockTimestamp: null,
      validationError,
    };
  }

  private decodeAddress(topic: string): string {
    return `0x${topic.slice(-40)}`.toLowerCase();
  }

  private decodeUint256(topic: string): string {
    return BigInt(topic).toString();
  }

  private normalizeTokenId(value: string): string {
    try {
      return BigInt(value).toString();
    } catch {
      throw new BadRequestException(
        `tokenId inválido: ${value}`,
      );
    }
  }

  private hexToNumber(value: string | null): number | null {
    if (!value) {
      return null;
    }

    return Number.parseInt(value, 16);
  }
}