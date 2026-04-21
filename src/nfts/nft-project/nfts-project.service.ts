import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NftProject } from '../entities/nft-project.entity';
import { CreateNftProjectDto } from './dto/create-nft-project.dto';
import { UpdateNftProjectDto } from './dto/update-nft-project.dto';


@Injectable()
export class NftProjectService {
  constructor(
    @InjectRepository(NftProject)
    private readonly nftProjectRepository: Repository<NftProject>,
  ) { }

  async create(projectId: string, dto: CreateNftProjectDto): Promise<NftProject> {
    const existing = await this.nftProjectRepository.findOne({ where: { projectId } });
    if (existing) {
      throw new ConflictException(`El proyecto ${projectId} ya tiene un NFT asociado`);
    }
    const nftProject = this.nftProjectRepository.create({
      ...dto,
      projectId,
      mintedAt: new Date(),
    });
    return this.nftProjectRepository.save(nftProject);
  }

  async findAll(): Promise<NftProject[]> {
    return this.nftProjectRepository.find({
      relations: ['project', 'currentHolder'],
    });
  }

  async findOne(id: string): Promise<NftProject> {
    const nftProject = await this.nftProjectRepository.findOne({
      where: { id },
      relations: ['project', 'currentHolder', 'ownershipEvents'],
    });
    if (!nftProject) {
      throw new NotFoundException(`NFT de proyecto con id ${id} no encontrado`);
    }
    return nftProject;
  }

  async findByProject(projectId: string): Promise<NftProject> {
    const nftProject = await this.nftProjectRepository.findOne({
      where: { projectId },
      relations: ['project', 'currentHolder', 'ownershipEvents'],
    });
    if (!nftProject) {
      throw new NotFoundException(`El proyecto ${projectId} no tiene NFT asociado`);
    }
    return nftProject;
  }

  async update(id: string, dto: UpdateNftProjectDto): Promise<NftProject> {
    const nftProject = await this.findOne(id);
    Object.assign(nftProject, dto);
    return this.nftProjectRepository.save(nftProject);
  }

  async remove(id: string): Promise<void> {
    const nftProject = await this.findOne(id);
    await this.nftProjectRepository.remove(nftProject);
  }

  async createSimulated(currentHolderUserId: string, index: number): Promise<NftProject> {
    const nftProject = this.nftProjectRepository.create({
      projectId: null,
      chainId: 0,
      contractAddress: 'PENDING_BLOCKCHAIN',
      tokenId: `COLIBRI-${Date.now()}-${index}-${currentHolderUserId}`,
      currentHolderUserId,
      mintedAt: new Date(),
    });
    return this.nftProjectRepository.save(nftProject);
  }

  // 1. BIFURCACIÓN — verificar si un proyecto tiene NFT
async checkNftStatus(projectId: string): Promise<{
  hasNft: boolean;
  nftProject: NftProject | null;
}> {
  const nftProject = await this.nftProjectRepository.findOne({
    where: { projectId },
    relations: ['currentHolder'],
  });

  return {
    hasNft: !!nftProject,
    nftProject: nftProject ?? null,
  };
}

// 2. COMPUERTA 2 — asociar un NFT sin proyecto al proyecto del emprendedor
async associateToProject(
  nftProjectId: string,
  projectId: string,
): Promise<NftProject> {
  const nft = await this.findOne(nftProjectId);

  if (nft.projectId) {
    throw new ConflictException(
      `Este NFT ya está asociado al proyecto ${nft.projectId}`,
    );
  }

  const alreadyLinked = await this.nftProjectRepository.findOne({
    where: { projectId },
  });

  if (alreadyLinked) {
    throw new ConflictException(
      `El proyecto ${projectId} ya tiene un NFT asociado`,
    );
  }

  nft.projectId = projectId;
  return this.nftProjectRepository.save(nft);
}

// 3. CIERRE DE TRAMO — evolucionar visualmente el NFT
async evolveVisual(
  projectId: string,
  newTramoId: string,
  newVisualVersion: string,
): Promise<NftProject> {
  const nft = await this.findByProject(projectId);

  nft.representedTramoId = newTramoId;
  nft.currentVisualVersion = newVisualVersion;

  return this.nftProjectRepository.save(nft);
}
}