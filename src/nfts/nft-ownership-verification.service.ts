import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BlockchainRpcService, RpcCallRevertedError } from './blockchain-rpc.service';
import {
  NftOwnershipVerification,
  NftOwnershipVerificationStatus,
} from './entities/nft-ownership-verification.entity';
import { NftProject } from './entities/nft-project.entity';
import { UsersService } from '../users/users.service';

/**
 * WEB3-003 — selector `ownerOf(uint256)` de ERC-721.
 * ERC-1155 (`balanceOf`) queda explícitamente fuera de alcance.
 */
const OWNER_OF_SELECTOR = '0x6352211e';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export interface NftOwnershipVerificationResult {
  nftProjectId: string;
  owned: boolean;
  status: NftOwnershipVerificationStatus;
  chainId: number;
  contractAddress: string;
  tokenId: string;
  walletAddress: string;
  ownerAddress: string | null;
  blockNumber: string | null;
  blockHash: string | null;
  blockTimestamp: Date | null;
  checkedAt: Date;
  validationError: string | null;
}

interface VerificationContext {
  nftProjectId: string;
  chainId: number;
  contractAddress: string;
  tokenId: string;
  walletAddress: string;
}

@Injectable()
export class NftOwnershipVerificationService {
  private readonly logger = new Logger(NftOwnershipVerificationService.name);

  constructor(
    private readonly blockchainRpc: BlockchainRpcService,
    private readonly usersService: UsersService,
    @InjectRepository(NftProject)
    private readonly nftProjectRepository: Repository<NftProject>,
    @InjectRepository(NftOwnershipVerification)
    private readonly verificationRepository: Repository<NftOwnershipVerification>,
  ) {}

  /**
   * Verifica que la wallet vinculada al usuario de la sesión sea la
   * propietaria actual del NFT contra la red y contrato configurados.
   */
  async verifyCurrentOwnership(params: {
    nftProjectId: string;
    userId: string;
  }): Promise<NftOwnershipVerificationResult> {
    const user = await this.usersService.findOneById(params.userId);

    if (!user.cryptoWallet) {
      throw new ConflictException(
        'El usuario no tiene una wallet vinculada; no se puede verificar la propiedad',
      );
    }

    const walletAddress = user.cryptoWallet.toLowerCase();

    const nftProject = await this.nftProjectRepository.findOne({
      where: { id: params.nftProjectId },
    });

    if (!nftProject) {
      throw new NotFoundException(`NFT de proyecto ${params.nftProjectId} no encontrado`);
    }

    const chainId = nftProject.chainId;
    const contractAddress = (nftProject.contractAddress ?? '').toLowerCase();

    // ─────────────────────────────────────────────────────────────
    // 409: la configuración del NFT no permite evaluar el request
    // ─────────────────────────────────────────────────────────────
    if (!chainId || chainId <= 0) {
      throw new ConflictException('El NFT no tiene una red blockchain configurada');
    }

    if (!contractAddress || contractAddress === 'pending_blockchain') {
      throw new ConflictException('El NFT no tiene un contrato blockchain configurado');
    }

    let tokenIdBigInt: bigint;
    try {
      tokenIdBigInt = BigInt(nftProject.tokenId);
    } catch {
      throw new ConflictException(
        `El tokenId configurado no es un uint256 válido: ${nftProject.tokenId}`,
      );
    }

    const ctx: VerificationContext = {
      nftProjectId: nftProject.id,
      chainId,
      contractAddress,
      tokenId: nftProject.tokenId,
      walletAddress,
    };

    // ─────────────────────────────────────────────────────────────
    // 1. La red del RPC debe coincidir con la del NFT
    // ─────────────────────────────────────────────────────────────
    let rpcChainId: number;
    try {
      rpcChainId = await this.blockchainRpc.getChainId(chainId);
    } catch (error) {
      return this.failUnavailable(ctx, error);
    }

    if (rpcChainId !== chainId) {
      return this.record(ctx, {
        status: NftOwnershipVerificationStatus.INVALID,
        validationError: `RPC conectado a chainId ${rpcChainId}, pero el NFT requiere ${chainId}`,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. El contrato debe tener código desplegado
    // ─────────────────────────────────────────────────────────────
    let code: string;
    try {
      code = await this.blockchainRpc.getCode(chainId, contractAddress);
    } catch (error) {
      return this.failUnavailable(ctx, error);
    }

    if (!code || code === '0x') {
      return this.record(ctx, {
        status: NftOwnershipVerificationStatus.INVALID,
        validationError: 'No hay contrato desplegado en la dirección configurada',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Pinnear el bloque y leer ownerOf(tokenId)
    // ─────────────────────────────────────────────────────────────
    let latestBlockNumber: number;
    try {
      latestBlockNumber = await this.blockchainRpc.getLatestBlockNumber(chainId);
    } catch (error) {
      return this.failUnavailable(ctx, error);
    }

    const blockTag = '0x' + latestBlockNumber.toString(16);

    let ownerAddress: string;
    try {
      const result = await this.blockchainRpc.ethCall(
        chainId,
        contractAddress,
        this.encodeOwnerOf(tokenIdBigInt),
        blockTag,
      );

      if (!result || result === '0x' || result.length < 42 || result === '0x' + '0'.repeat(64)) {
        return this.record(ctx, {
          status: NftOwnershipVerificationStatus.INVALID,
          validationError: 'ownerOf devolvió vacío o un resultado malformado (token inexistente)',
          blockNumber: latestBlockNumber.toString(),
        });
      }

      ownerAddress = this.decodeAddress(result).toLowerCase();
    } catch (error) {
      if (error instanceof RpcCallRevertedError) {
        return this.record(ctx, {
          status: NftOwnershipVerificationStatus.INVALID,
          validationError: 'ownerOf revirtió: el token no existe en el contrato',
          blockNumber: latestBlockNumber.toString(),
        });
      }

      return this.failUnavailable(ctx, error);
    }

    if (!ownerAddress || ownerAddress === ZERO_ADDRESS) {
      return this.record(ctx, {
        status: NftOwnershipVerificationStatus.INVALID,
        validationError: 'ownerOf devolvió el zero address (token inexistente)',
        blockNumber: latestBlockNumber.toString(),
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Bloque pinneado (hash + timestamp) para trazabilidad
    // ─────────────────────────────────────────────────────────────
    let blockHash: string | null = null;
    let blockTimestamp: Date | null = null;
    try {
      const block = await this.blockchainRpc.getBlockByNumber(chainId, blockTag);

      if (block) {
        blockHash = block.hash;
        blockTimestamp = new Date(Number.parseInt(block.timestamp, 16) * 1000);
      }
    } catch (error) {
      // Decisión consciente: el criterio WEB3-003 exige registrar bloque y
      // timestamp. Si `ownerOf` respondió pero el bloque no se pudo leer,
      // la trazabilidad queda incompleta → se descarta el resultado y se
      // reporta 503 (`unavailable`), en vez de persistir un `verified`
      // sin bloque. No es un descarte accidental.
      return this.failUnavailable(ctx, error);
    }

    const owned = ownerAddress === walletAddress;

    return this.record(ctx, {
      status: owned
        ? NftOwnershipVerificationStatus.VERIFIED
        : NftOwnershipVerificationStatus.NOT_OWNER,
      ownerAddress,
      blockNumber: latestBlockNumber.toString(),
      blockHash,
      blockTimestamp,
      validationError: owned
        ? null
        : `El propietario on-chain es ${ownerAddress}, no la wallet verificada ${walletAddress}`,
    });
  }

  private encodeOwnerOf(tokenId: bigint): string {
    return OWNER_OF_SELECTOR + tokenId.toString(16).padStart(64, '0');
  }

  private decodeAddress(hex: string): string {
    return `0x${hex.slice(-40)}`;
  }

  /**
   * Persiste el resultado y lo devuelve como DTO. `checkedAt` se setea
   * siempre (todos los caminos, incluido `unavailable`).
   */
  private async record(
    ctx: VerificationContext,
    data: {
      status: NftOwnershipVerificationStatus;
      ownerAddress?: string | null;
      blockNumber?: string | null;
      blockHash?: string | null;
      blockTimestamp?: Date | null;
      rpcError?: string | null;
      validationError?: string | null;
    },
  ): Promise<NftOwnershipVerificationResult> {
    const entity = this.verificationRepository.create({
      nftProjectId: ctx.nftProjectId,
      chainId: ctx.chainId,
      contractAddress: ctx.contractAddress,
      tokenId: ctx.tokenId,
      walletAddress: ctx.walletAddress,
      ownerAddress: data.ownerAddress ?? null,
      status: data.status,
      blockNumber: data.blockNumber ?? null,
      blockHash: data.blockHash ?? null,
      blockTimestamp: data.blockTimestamp ?? null,
      rpcError: data.rpcError ?? null,
      validationError: data.validationError ?? null,
      checkedAt: new Date(),
    });

    const saved = await this.verificationRepository.save(entity);

    return {
      nftProjectId: saved.nftProjectId ?? ctx.nftProjectId,
      owned: saved.status === NftOwnershipVerificationStatus.VERIFIED,
      status: saved.status,
      chainId: saved.chainId,
      contractAddress: saved.contractAddress,
      tokenId: saved.tokenId,
      walletAddress: saved.walletAddress,
      ownerAddress: saved.ownerAddress,
      blockNumber: saved.blockNumber,
      blockHash: saved.blockHash,
      blockTimestamp: saved.blockTimestamp,
      checkedAt: saved.checkedAt,
      validationError: saved.validationError,
    };
  }

  /**
   * Registra el fallo de infraestructura como `unavailable` (nunca como
   * verificación correcta) y responde 503.
   */
  private async failUnavailable(ctx: VerificationContext, error: unknown): Promise<never> {
    const message = error instanceof Error ? error.message : String(error);

    this.logger.warn(
      `WEB3-003: verificación de propiedad no disponible para ${ctx.nftProjectId}: ${message}`,
    );

    try {
      await this.record(ctx, {
        status: NftOwnershipVerificationStatus.UNAVAILABLE,
        rpcError: message,
        validationError: 'No se pudo consultar la red blockchain',
      });
    } catch (persistError) {
      this.logger.error(
        `WEB3-003: no se pudo persistir la verificación unavailable: ${
          persistError instanceof Error ? persistError.message : String(persistError)
        }`,
      );
    }

    throw new ServiceUnavailableException('No se pudo consultar la red blockchain');
  }
}
