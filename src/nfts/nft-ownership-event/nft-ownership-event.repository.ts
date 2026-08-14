import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NftOwnershipEvent } from '../entities/nft-ownership-event.entity';
import { ICreateNftOwnershipEvent } from './interfaces/create-nft-ownership.interface';
import {
  NftChainProofStatus,
} from '../entities/nft-chain-proof.entity';

@Injectable()
export class NftOwnershipEventRepository {
  constructor(
    @InjectRepository(NftOwnershipEvent)
    private readonly nftOwnershipEventRepository: Repository<NftOwnershipEvent>,
  ) {}

  async create(
    data: Partial<NftOwnershipEvent>,
  ): Promise<NftOwnershipEvent> {
    const event =
      this.nftOwnershipEventRepository.create(data);

    return this.nftOwnershipEventRepository.save(event);
  }

  async findByNftProjectId(
    nftProjectId: string,
  ): Promise<NftOwnershipEvent[]> {
    return this.nftOwnershipEventRepository.find({
      where: { nftProjectId },
      relations: ['fromUser', 'toUser'],
      order: {
        occurredAt: 'ASC',
        recordedAt: 'ASC',
      },
    });
  }

  async findByUserId(
    userId: string,
  ): Promise<NftOwnershipEvent[]> {
    return this.nftOwnershipEventRepository.find({
      where: [
        { fromUserId: userId },
        { toUserId: userId },
      ],
      relations: ['fromUser', 'toUser'],
      order: {
        occurredAt: 'ASC',
        recordedAt: 'ASC',
      },
    });
  }

  async findReconciliationCandidates(): Promise<
    NftOwnershipEvent[]
  > {
    return this.nftOwnershipEventRepository.find({
      where: [
        {
          chainStatus: NftChainProofStatus.PENDING,
        },
        {
          chainStatus: NftChainProofStatus.CONFIRMED,
        },
      ],
      relations: ['nftProject'],
      order: {
        lastReconciledAt: 'ASC',
      },
      take: 500,
    });
  }

  async findOneByTxHash(
    txHash: string,
    nftProjectId: string,
  ): Promise<NftOwnershipEvent | null> {
    return this.nftOwnershipEventRepository.findOne({
      where: {
        txHash,
        nftProjectId,
      },
      relations: ['nftProject', 'fromUser', 'toUser'],
    });
  }
}