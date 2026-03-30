import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { LearningResource } from 'src/curriculum/entities/learning-resource.entity';
import { QueryLearningResourceDto } from './dto/query.learning-resource.dto';
import { PaginatedResult } from './interface/paginated-result.interface';
import { ICreateLearningResource } from './interface/create-learning-resource.interface';
import { IUpdateLearningResource } from './interface/update-learning-resource.interface';

@Injectable()
export class LearningResourceRepository {
  constructor(
    @InjectRepository(LearningResource)
    private readonly repo: Repository<LearningResource>,
  ) {}

  async create(dto: ICreateLearningResource) {
    const entity = this.repo.create(dto);
    return await this.repo.save(entity);
  }

  async findAll(
    query: QueryLearningResourceDto,
  ): Promise<PaginatedResult<LearningResource>> {
    const { page = 1, limit = 20, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<LearningResource> = {};

    if (filters.pacId !== undefined) where.pacId = filters.pacId;
    if (filters.resourceType !== undefined)where.resourceType = filters.resourceType;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.isRequired !== undefined)where.isRequired = filters.isRequired;
   
    if (filters.microActionDefinitionId !== undefined) {
      where.microActionDefinitionId = filters.microActionDefinitionId;
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
      skip,
      take: limit,
      relations: ['pac', 'microActionDefinition'],
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<LearningResource | null> {
    return await this.repo.findOne({
      where: { id },
      relations: ['pac', 'microActionDefinition'],
    });
  }

  async findByPacId(pacId: string): Promise<LearningResource[]> {
    return await this.repo.find({
      where: { pacId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
      relations: ['microActionDefinition'],
    });
  }

  async findByMicroActionId(
    microActionDefinitionId: string,
  ): Promise<LearningResource[]> {
    return await this.repo.find({
      where: { microActionDefinitionId },
      order: { sortOrder: 'ASC' },
    });
  }

  async update(
    id: string,
    dto: IUpdateLearningResource,
  ) {
    const updatePayload: Partial<LearningResource> = {};

    if (dto.pacId !== undefined) updatePayload.pacId = dto.pacId;
    if (dto.title !== undefined) updatePayload.title = dto.title;
    if (dto.resourceType !== undefined)updatePayload.resourceType = dto.resourceType;
    if (dto.url !== undefined) updatePayload.url = dto.url;
    if (dto.description !== undefined)updatePayload.description = dto.description;
    if (dto.sortOrder !== undefined) updatePayload.sortOrder = dto.sortOrder;
    if (dto.isRequired !== undefined)updatePayload.isRequired = dto.isRequired;
    if ('microActionDefinitionId' in dto) {
      updatePayload.microActionDefinitionId =
        dto.microActionDefinitionId ?? undefined;
    }

    await this.repo.update(id, updatePayload);
    return await this.findById(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repo.update(id, { isActive: false });
    return (result.affected ?? 0) > 0;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

}