import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TramosService } from '../tramos/tramos.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import type { Express } from 'express';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    private readonly tramosService: TramosService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async create(
    ownerUserId: string,
    dto: CreateProjectDto,
    file?: Express.Multer.File,
  ) {
    let imageUrl: string | null = null;

    if (file) {
      const uploadResult: any =
        await this.cloudinaryService.uploadImage(file);

      imageUrl = uploadResult.secure_url;
    }

    const project = this.projectRepository.create({
      ...dto,
      projectImageUrl: imageUrl,
      ownerUserId,
      openedAt: new Date(),
    });

    const saved = await this.projectRepository.save(project);

    // Si el proyecto ya nace con un tramo asignado, iniciamos el historial
    if (saved.currentTramoId) {
      await this.tramosService.initTramoHistory(
        saved.id,
        saved.currentTramoId,
        ownerUserId,
      );
    }

    return saved;
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      relations: ['owner', 'profile'],
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['owner', 'profile', 'members', 'projectPacs', 'projectPacs.pac'],
    });
    if (!project) {
      throw new NotFoundException(`Proyecto con id ${id} no encontrado`);
    }
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, dto);
    return this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
  }
}