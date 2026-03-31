// src/categories/categories.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { TramosService } from '../tramos/tramos.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly tramosService: TramosService,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    // Valida que el tramo exista
    await this.tramosService.findOne(dto.tramoId);

    const existing = await this.categoryRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Ya existe una categoría con el código "${dto.code}"`);
    }

    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { sortOrder: 'ASC' },
      relations: ['tramo'],
    });
  }

  async findByTramo(tramoId: string): Promise<Category[]> {
    await this.tramosService.findOne(tramoId);
    return this.categoryRepository.find({
      where: { tramoId },
      order: { sortOrder: 'ASC' },
      relations: ['tramo'],
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['tramo', 'pacs'],
    });
    if (!category) {
      throw new NotFoundException(`Categoría con id "${id}" no encontrada`);
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.tramoId && dto.tramoId !== category.tramoId) {
      await this.tramosService.findOne(dto.tramoId);
    }

    if (dto.code && dto.code !== category.code) {
      const existing = await this.categoryRepository.findOne({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException(`Ya existe una categoría con el código "${dto.code}"`);
      }
    }

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }
}