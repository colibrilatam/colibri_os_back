import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TramosService } from '../tramos/tramos.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import type { Express } from 'express';
import { ProjectPac, ProjectPacStatus } from './entities/project.pac.entity';
import { Pac } from 'src/pacs/entities/pac.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Pac)
    private readonly pacRepository: Repository<Pac>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectPac) private readonly projectPacRepository: Repository<ProjectPac>,
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

  async updateProjectPac(projectPacId: string, status: ProjectPacStatus){
    const projectPac = await this.projectPacRepository.findOneBy({id: projectPacId});
    if (!projectPac) {
      throw new NotFoundException(`ProjectPac con id ${projectPacId} no encontrado`);
    }
    projectPac.status = status;
    await this.projectPacRepository.save(projectPac);
  }

async createProjectPac(projectId: string, pacId: string) {

  const existingProject = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!existingProject) {
    throw new NotFoundException('Project not found');
  }

  const existingPac = await this.pacRepository.findOne({
    where: { id: pacId },
  });

  if (!existingPac) {
    throw new NotFoundException('Pac not found');
  }

  const existingProjectPacRelation = await this.projectPacRepository.findOne({
    where: {
      projectId,
      pacId,
    },
  });

  if (existingProjectPacRelation) {
    throw new BadRequestException(
      'This PAC is already assigned to the project',
    );
  }
  const newProjectPacRelation = this.projectPacRepository.create({
    projectId,
    pacId,
    status: ProjectPacStatus.PENDING,
    progress: 0
  });

  const savedProjectPacRelation = await this.projectPacRepository.save(
    newProjectPacRelation,
  );

  return savedProjectPacRelation;
}
}