import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NftOwnershipEventRepository } from './nft-ownership-event.repository';
import {
  ICreateNftOwnershipEvent,
} from './interfaces/create-nft-ownership.interface';
import { NftProjectService } from '../nft-project/nfts-project.service';
import {
  NftOwnershipEvent,
} from '../entities/nft-ownership-event.entity';
import {
  NftChainProofStatus,
} from '../entities/nft-chain-proof.entity';
import {
  NftChainVerificationService,
  NftChainVerificationResult,
} from '../nft-chain-verification.service';

@Injectable()
export class NftOwnershipEventService {
  private readonly logger = new Logger(
    NftOwnershipEventService.name,
  );

  constructor(
    private readonly nftOwnershipEventRepository: NftOwnershipEventRepository,

    private readonly nftProjectService: NftProjectService,

    private readonly nftChainVerificationService: NftChainVerificationService,

    @InjectRepository(NftOwnershipEvent)
    private readonly ownershipEventRepository: Repository<NftOwnershipEvent>,
  ) {}

  async create(data: ICreateNftOwnershipEvent) {
    const nftProject =
      await this.nftProjectService.findOne(
        data.nftProjectId,
      );

    const existing =
      await this.nftOwnershipEventRepository.findOneByTxHash(
        data.txHash,
        nftProject.id,
      );

    if (existing) {
      return {
        ...existing,
        replayed: true,
      };
    }

    const verification =
      await this.nftChainVerificationService.verifyOwnershipEvent(
        {
          nftProject,
          txHash: data.txHash,
          eventType: data.eventType,
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
        },
      );

    const event =
      this.ownershipEventRepository.create({
        nftProjectId: nftProject.id,
        fromUserId: data.fromUserId ?? null,
        toUserId: data.toUserId ?? null,
        eventType: data.eventType,
        txHash: data.txHash,

        chainStatus: verification.status,
        chainId: verification.chainId,
        contractAddress:
          verification.contractAddress,
        tokenId: verification.tokenId,

        fromAddress:
          verification.eventFromAddress,
        toAddress:
          verification.eventToAddress,

        blockNumber:
          verification.blockNumber,
        blockHash:
          verification.blockHash,

        confirmations:
          verification.confirmations,

        requiredConfirmations:
          verification.requiredConfirmations,

        occurredAt:
          verification.blockTimestamp ??
          new Date(),

        validationError:
          verification.validationError,

        verifiedAt:
          verification.status ===
          NftChainProofStatus.CONFIRMED
            ? new Date()
            : null,

        lastReconciledAt:
          new Date(),
      });

    const saved =
      await this.ownershipEventRepository.save(event);

    // ───────────────────────────────────────────────
    // INVALID
    // ───────────────────────────────────────────────

    if (
      verification.status ===
      NftChainProofStatus.INVALID
    ) {
      throw new BadRequestException(
        verification.validationError ??
          'La prueba blockchain es inválida',
      );
    }

    // ───────────────────────────────────────────────
    // REVERTED
    // ───────────────────────────────────────────────

    if (
      verification.status ===
      NftChainProofStatus.REVERTED
    ) {
      throw new ConflictException(
        verification.validationError ??
          'La transacción blockchain fue revertida',
      );
    }

    return saved;
  }

  async findByNftProjectId(
    nftProjectId: string,
  ) {
    return this.nftOwnershipEventRepository.findByNftProjectId(
      nftProjectId,
    );
  }

  async findByUserId(userId: string) {
    return this.nftOwnershipEventRepository.findByUserId(
      userId,
    );
  }

  async reconcileEvent(
    eventId: string,
  ): Promise<NftOwnershipEvent> {
    const event =
      await this.ownershipEventRepository.findOne({
        where: { id: eventId },
        relations: ['nftProject'],
      });

    if (!event) {
      throw new NotFoundException(
        `Evento NFT ${eventId} no encontrado`,
      );
    }

    if (!event.txHash) {
      event.chainStatus =
        NftChainProofStatus.INVALID;

      event.validationError =
        'El evento no tiene txHash y no puede reconstruirse desde blockchain';

      event.lastReconciledAt = new Date();

      return this.ownershipEventRepository.save(
        event,
      );
    }

    const verification =
      await this.nftChainVerificationService.verifyOwnershipEvent(
        {
          nftProject: event.nftProject,
          txHash: event.txHash,
          eventType: event.eventType,
          fromUserId: event.fromUserId ?? undefined,
          toUserId: event.toUserId ?? undefined,
        },
      );

    event.chainStatus =
      verification.status;

    event.chainId =
      verification.chainId;

    event.contractAddress =
      verification.contractAddress;

    event.tokenId =
      verification.tokenId;

    event.fromAddress =
      verification.eventFromAddress;

    event.toAddress =
      verification.eventToAddress;

    event.blockNumber =
      verification.blockNumber;

    event.blockHash =
      verification.blockHash;

    event.confirmations =
      verification.confirmations;

    event.requiredConfirmations =
      verification.requiredConfirmations;

    if (verification.blockTimestamp) {
      event.occurredAt =
        verification.blockTimestamp;
    }

    event.validationError =
      verification.validationError;

    event.verifiedAt =
      verification.status ===
      NftChainProofStatus.CONFIRMED
        ? event.verifiedAt ?? new Date()
        : null;

    event.lastReconciledAt =
      new Date();

    return this.ownershipEventRepository.save(
      event,
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcilePendingAndConfirmed(): Promise<void> {
    const candidates =
      await this.nftOwnershipEventRepository.findReconciliationCandidates();

    if (candidates.length === 0) {
      return;
    }

    this.logger.log(
      `CHAIN-001: reconciliando ${candidates.length} eventos blockchain`,
    );

    for (const event of candidates) {
      try {
        await this.reconcileEvent(event.id);
      } catch (error) {
        this.logger.error(
          `CHAIN-001: no se pudo reconciliar evento ${event.id}: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`,
        );
      }
    }
  }
}