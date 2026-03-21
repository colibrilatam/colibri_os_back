import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectsService } from '../projects/projects.service';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';

@Injectable()
export class ProjectMemberService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(projectId: string, dto: CreateProjectMemberDto): Promise<ProjectMember> {
    await this.projectsService.findOne(projectId);
    const existing = await this.memberRepository.findOne({
      where: { projectId, userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException('El usuario ya es miembro de este proyecto');
    }
    const member = this.memberRepository.create({
      ...dto,
      projectId,
      joinedAt: new Date(),
      isActive: true,
    });
    return this.memberRepository.save(member);
  }

  async findAll(projectId: string): Promise<ProjectMember[]> {
    await this.projectsService.findOne(projectId);
    return this.memberRepository.find({
      where: { projectId },
      relations: ['user'],
    });
  }

  async findOne(projectId: string, memberId: string): Promise<ProjectMember> {
    const member = await this.memberRepository.findOne({
      where: { id: memberId, projectId },
      relations: ['user'],
    });
    if (!member) {
      throw new NotFoundException(`Miembro ${memberId} no encontrado en el proyecto ${projectId}`);
    }
    return member;
  }

  async update(projectId: string, memberId: string, dto: UpdateProjectMemberDto): Promise<ProjectMember> {
    const member = await this.findOne(projectId, memberId);
    Object.assign(member, dto);
    return this.memberRepository.save(member);
  }

  async remove(projectId: string, memberId: string): Promise<void> {
    const member = await this.findOne(projectId, memberId);
    member.isActive = false;
    member.leftAt = new Date();
    await this.memberRepository.save(member);
  }
}