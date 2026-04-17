// src/tramos/tramos.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Tramo } from './entities/tramo.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectTramoHistory } from './entities/project-tramo-history.entity';
import { CreateTramoDto } from './dto/create-tramo.dto';
import { UpdateTramoDto } from './dto/update-tramo.dto';
import { ChangeTramoDto } from './dto/change-tramo.dto';

@Injectable()
export class TramosService {
  constructor(
    @InjectRepository(Tramo)
    private readonly tramoRepository: Repository<Tramo>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,


    @InjectRepository(ProjectTramoHistory)
    private readonly historyRepository: Repository<ProjectTramoHistory>,
  ) {}


  // ─── CRUD básico ────────────────────────────────────────────────────────────

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

    if (!project.currentTramoId) return [];
    
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

  // ─── Historial de tramos ────────────────────────────────────────────────────

  /**
   * Cambia el tramo activo de un proyecto:
   * 1. Cierra el registro de historia anterior (leftAt + daysInTramo).
   * 2. Crea un nuevo registro de historia abierto.
   * 3. Actualiza currentTramoId en el proyecto.
   */
  async changeTramo(
    projectId: string,
    dto: ChangeTramoDto,
    changedByUserId?: string,
  ): Promise<ProjectTramoHistory> {
    // Validar que el proyecto existe
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Proyecto ${projectId} no encontrado`);
    }

    // Validar que el nuevo tramo existe
    const newTramo = await this.tramoRepository.findOne({
      where: { id: dto.newTramoId },
    });
    if (!newTramo) {
      throw new NotFoundException(`Tramo ${dto.newTramoId} no encontrado`);
    }

    // Evitar asignar el mismo tramo que ya tiene
    if (project.currentTramoId === dto.newTramoId) {
      throw new BadRequestException(
        `El proyecto ya se encuentra en el tramo "${newTramo.name}"`,
      );
    }

    const now = new Date();

    // Cerrar el registro de historia abierto anterior (leftAt === NULL)
    const openRecord = await this.historyRepository.findOne({
      where: { projectId, leftAt: IsNull() },
    });

    if (openRecord) {
      const diffMs = now.getTime() - openRecord.enteredAt.getTime();
      openRecord.leftAt = now;
      openRecord.daysInTramo = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      await this.historyRepository.save(openRecord);
    }

    // Crear el nuevo registro de historia abierto
    const newRecord = this.historyRepository.create({
      projectId,
      tramoId: dto.newTramoId,
      enteredAt: now,
      leftAt: null,
      changeReason: dto.changeReason ?? null,
      changedByUserId: changedByUserId ?? null,
    });
    const saved = await this.historyRepository.save(newRecord);

    // Actualizar el proyecto
    project.currentTramoId = dto.newTramoId;
    await this.projectRepository.save(project);

    return saved;
  }

  /**
   * Devuelve el historial completo de tramos de un proyecto, ordenado por fecha de entrada.
   */
  async getTramoHistory(projectId: string): Promise<ProjectTramoHistory[]> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Proyecto ${projectId} no encontrado`);
    }

    return this.historyRepository.find({
      where: { projectId },
      relations: ['tramo'],
      order: { enteredAt: 'ASC' },
    });
  }

  /**
   * Inicializa el primer registro de historia cuando se crea un proyecto
   * y se le asigna su tramo inicial. Llamar desde ProjectsService.
   */
  async initTramoHistory(
    projectId: string,
    tramoId: string,
    changedByUserId?: string,
  ): Promise<ProjectTramoHistory> {
    const record = this.historyRepository.create({
      projectId,
      tramoId,
      enteredAt: new Date(),
      leftAt: null,
      changeReason: 'Inicio de trayectoria',
      changedByUserId: changedByUserId ?? null,
    });
    return this.historyRepository.save(record);
  }
}