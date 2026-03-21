import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NftProject } from './entities/nft-project.entity';
import { CreateNftProjectDto } from './dto/create-nft-project.dto';
import { UpdateNftProjectDto } from './dto/update-nft-project.dto';

@Injectable()
export class NftProjectService {
  constructor(
    @InjectRepository(NftProject)
    private readonly nftProjectRepository: Repository<NftProject>,
  ) {}

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
}