// src/pacs/pacs.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pac } from './entities/pac.entity';
import { CreatePacDto } from './dto/create-pac.dto';
import { UpdatePacDto } from './dto/update-pac.dto';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class PacsService {
  constructor(
    @InjectRepository(Pac)
    private readonly pacRepository: Repository<Pac>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(dto: CreatePacDto): Promise<Pac> {
    // Valida que la categoría exista
    await this.categoriesService.findOne(dto.categoryId);

    const existing = await this.pacRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un PAC con el código "${dto.code}"`);
    }

    const pac = this.pacRepository.create(dto);
    return this.pacRepository.save(pac);
  }

  async findAll(): Promise<Pac[]> {
    return this.pacRepository.find({
      order: { sortOrder: 'ASC' },
      relations: ['category'],
    });
  }

  async findByCategory(categoryId: string): Promise<Pac[]> {
    await this.categoriesService.findOne(categoryId);
    return this.pacRepository.find({
      where: { categoryId },
      order: { sortOrder: 'ASC' },
      relations: ['category'],
    });
  }

  async findOne(id: string): Promise<Pac> {
    const pac = await this.pacRepository.findOne({
      where: { id },
      relations: ['category', 'category.tramo', 'microActionDefinitions'],
    });
    if (!pac) {
      throw new NotFoundException(`PAC con id "${id}" no encontrado`);
    }
    return pac;
  }

  async update(id: string, dto: UpdatePacDto): Promise<Pac> {
    const pac = await this.findOne(id);

    const { categoryId, code } = dto as Partial<CreatePacDto>;

    if (categoryId && categoryId !== pac.categoryId) {
      await this.categoriesService.findOne(categoryId);
    }

    if (code && code !== pac.code) {
      const existing = await this.pacRepository.findOne({
        where: { code },
      });
      if (existing) {
        throw new ConflictException(`Ya existe un PAC con el código "${code}"`);
      }
    }

    Object.assign(pac, dto);
    return this.pacRepository.save(pac);
  }

  async remove(id: string): Promise<void> {
    const pac = await this.findOne(id);
    await this.pacRepository.remove(pac);
  }
}