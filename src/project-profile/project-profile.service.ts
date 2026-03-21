import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectProfile } from './entities/project-profile.entity';
import { ProjectsService } from '../projects/projects.service';
import { CreateProjectProfileDto } from './dto/create-project-profile.dto';
import { UpdateProjectProfileDto } from './dto/update-project-profile.dto';

@Injectable()
export class ProjectProfileService {
  constructor(
    @InjectRepository(ProjectProfile)
    private readonly profileRepository: Repository<ProjectProfile>,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(projectId: string, dto: CreateProjectProfileDto): Promise<ProjectProfile> {
    await this.projectsService.findOne(projectId);
    const existing = await this.profileRepository.findOne({ where: { projectId } });
    if (existing) {
      throw new ConflictException(`El proyecto ${projectId} ya tiene un perfil`);
    }
    const profile = this.profileRepository.create({ ...dto, projectId });
    return this.profileRepository.save(profile);
  }

  async findOne(projectId: string): Promise<ProjectProfile> {
    await this.projectsService.findOne(projectId);
    const profile = await this.profileRepository.findOne({ where: { projectId } });
    if (!profile) {
      throw new NotFoundException(`El proyecto ${projectId} no tiene perfil todavía`);
    }
    return profile;
  }

  async update(projectId: string, dto: UpdateProjectProfileDto): Promise<ProjectProfile> {
    const profile = await this.findOne(projectId);
    Object.assign(profile, dto);
    return this.profileRepository.save(profile);
  }

  async remove(projectId: string): Promise<void> {
    const profile = await this.findOne(projectId);
    await this.profileRepository.remove(profile);
  }
}