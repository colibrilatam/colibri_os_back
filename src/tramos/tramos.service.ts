// src/tramos/tramos.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tramo } from './entities/tramo.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateTramoDto } from './dto/create-tramo.dto';
import { UpdateTramoDto } from './dto/update-tramo.dto';

@Injectable()
export class TramosService {
  constructor(
    @InjectRepository(Tramo)
    private readonly tramoRepository: Repository<Tramo>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(dto: CreateTramoDto): Promise<Tramo> {
    const existing = await this.tramoRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe un tramo con el código "${dto.code}"`,
      );
    }
    const tramo = this.tramoRepository.create(dto);
    return this.tramoRepository.save(tramo);
  }

  async findAll(): Promise<Tramo[]> {
    return this.tramoRepository.find({
      order: { sortOrder: 'ASC' },
    });
  }

  async findAllByProject(
    projectId: string,
  ): Promise<(Tramo & { isCurrent: boolean; isUnlocked: boolean })[]> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Proyecto ${projectId} no encontrado`);
    }

    const tramos = await this.tramoRepository.find({
      order: { sortOrder: 'ASC' },
      relations: ['categories'],
    });

    const currentTramo = tramos.find((t) => t.id === project.currentTramoId);
    const currentSortOrder = currentTramo?.sortOrder ?? 1;

    return tramos.map((tramo) => ({
      ...tramo,
      isCurrent: tramo.id === project.currentTramoId,
      isUnlocked: tramo.sortOrder <= currentSortOrder,
    }));
  }

  async findOne(id: string): Promise<Tramo> {
    const tramo = await this.tramoRepository.findOne({
      where: { id },
      relations: ['categories'],
    });
    if (!tramo) {
      throw new NotFoundException(`Tramo con id "${id}" no encontrado`);
    }
    return tramo;
  }

  async update(id: string, dto: UpdateTramoDto): Promise<Tramo> {
    const tramo = await this.findOne(id);

    if (dto.code && dto.code !== tramo.code) {
      const existing = await this.tramoRepository.findOne({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un tramo con el código "${dto.code}"`,
        );
      }
    }

    Object.assign(tramo, dto);
    return this.tramoRepository.save(tramo);
  }

  async remove(id: string): Promise<void> {
    const tramo = await this.findOne(id);
    await this.tramoRepository.remove(tramo);
  }
}