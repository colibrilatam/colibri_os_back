// src/micro-action-definitions/micro-action-definitions.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MicroActionDefinition } from './entities/micro-action-definition.entity';
import { CreateMicroActionDefinitionDto } from './dto/create-micro-action-definition.dto';
import { UpdateMicroActionDefinitionDto } from './dto/update-micro-action-definition.dto';
import { PacsService } from '../pacs/pacs.service';
import { Rubric } from '../evaluation/entities/rubric.entity';

@Injectable()
export class MicroActionDefinitionsService {
  constructor(
    @InjectRepository(MicroActionDefinition)
    private readonly madRepository: Repository<MicroActionDefinition>,
    @InjectRepository(Rubric)
    private readonly rubricRepository: Repository<Rubric>,
    private readonly pacsService: PacsService,
  ) {}

  private async validateRubric(rubricId: string): Promise<void> {
    const rubric = await this.rubricRepository.findOne({
      where: { id: rubricId },
    });
    if (!rubric) {
      throw new NotFoundException(`Rubric con id "${rubricId}" no encontrada`);
    }
  }

  async create(dto: CreateMicroActionDefinitionDto): Promise<MicroActionDefinition> {
    await this.pacsService.findOne(dto.pacId);

    if (dto.rubricId) {
      await this.validateRubric(dto.rubricId);
    }

    const existing = await this.madRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe una microacción con el código "${dto.code}"`,
      );
    }

    const mad = this.madRepository.create(dto);
    return this.madRepository.save(mad);
  }

  async findAll(): Promise<MicroActionDefinition[]> {
    return this.madRepository.find({
      order: { sortOrder: 'ASC' },
      relations: ['pac'],
    });
  }

  async findByPac(pacId: string): Promise<MicroActionDefinition[]> {
    await this.pacsService.findOne(pacId);
    return this.madRepository.find({
      where: { pacId },
      order: { sortOrder: 'ASC' },
      relations: ['pac'],
    });
  }

  async findOne(id: string): Promise<MicroActionDefinition> {
    const mad = await this.madRepository.findOne({
      where: { id },
      relations: ['pac', 'pac.category', 'rubric'],
    });
    if (!mad) {
      throw new NotFoundException(
        `MicroActionDefinition con id "${id}" no encontrada`,
      );
    }
    return mad;
  }

  async update(
  id: string,
  dto: UpdateMicroActionDefinitionDto,
): Promise<MicroActionDefinition> {
  const mad = await this.findOne(id);

  const { pacId, rubricId, code } = dto as Partial<CreateMicroActionDefinitionDto>;

  if (pacId && pacId !== mad.pacId) {
    await this.pacsService.findOne(pacId);
  }

  if (rubricId && rubricId !== mad.rubricId) {
    await this.validateRubric(rubricId);
  }

  if (code && code !== mad.code) {
    const existing = await this.madRepository.findOne({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe una microacción con el código "${code}"`,
      );
    }
  }

  Object.assign(mad, dto);
  return this.madRepository.save(mad);
}

  async remove(id: string): Promise<void> {
    const mad = await this.findOne(id);
    await this.madRepository.remove(mad);
  }
}