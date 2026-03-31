import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { LearningResourceRepository } from './learning-resource.repository';
import { LearningResource } from 'src/learning-resource/entities/learning-resource.entity';
import { QueryLearningResourceDto } from './dto/query.learning-resource.dto';
import { PaginatedResult } from './interface/paginated-result.interface';
import { Repository } from 'typeorm';
import { Pac } from 'src/curriculum/entities/pac.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MicroActionDefinition } from 'src/micro-action-definitions/entities/micro-action-definition.entity';
import { ICreateLearningResource } from './interface/create-learning-resource.interface';
import { IUpdateLearningResource } from './interface/update-learning-resource.interface';

@Injectable()
export class LearningResourceService {
  constructor(
    private readonly learningResourceRepository: LearningResourceRepository,
    @InjectRepository(Pac) private readonly pacRepository: Repository<Pac>,
    @InjectRepository(MicroActionDefinition) private readonly microActionDefinitionRepository: Repository<MicroActionDefinition>,
  ) {}

  async create(dto: ICreateLearningResource): Promise<LearningResource> {
    try {
      const pacExists = await this.pacRepository.findOneBy({ id: dto.pacId });
      if (!pacExists) {
        throw new NotFoundException(`PAC con id "${dto.pacId}" no encontrado`);
      }

      if (dto.microActionDefinitionId) {
        const microAction = await this.microActionDefinitionRepository.findOneBy({ id: dto.microActionDefinitionId });
        if (!microAction) {
          throw new NotFoundException(
            `MicroActionDefinition con id "${dto.microActionDefinitionId}" no encontrado`,
          );
        }
        if (microAction.pacId !== dto.pacId) {
          throw new BadRequestException(
            `MicroActionDefinition "${dto.microActionDefinitionId}" no pertenece al PAC "${dto.pacId}"`,
          );
        }
      }

      return await this.learningResourceRepository.create(dto);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Ocurrió un error inesperado al crear el recurso de aprendizaje',
      );
    }
  }

  async findAll(
    query: QueryLearningResourceDto,
  ): Promise<PaginatedResult<LearningResource>> {
    try {
      return await this.learningResourceRepository.findAll(query);
    } catch (error) {
      throw new InternalServerErrorException(
        'Ocurrió un error inesperado al recuperar los recursos de aprendizaje',
      );
    }
  }

  async findById(id: string): Promise<LearningResource> {
    try {
      const resource = await this.learningResourceRepository.findById(id);
      if (!resource) {
        throw new NotFoundException(
          `LearningResource con id "${id}" no encontrado`,
        );
      }
      return resource;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Ocurrió un error inesperado al recuperar el recurso de aprendizaje',
      );
    }
  }

  async update(
    id: string,
    dto: IUpdateLearningResource,
  ){
    try {
      const resource = await this.learningResourceRepository.findById(id);
      if (!resource) {
        throw new NotFoundException(
          `LearningResource con id "${id}" no encontrado`,
        );
      }
      const targetPacId = dto.pacId ?? resource.pacId;
      if (dto.pacId !== resource.pacId) {
        const pacExists = await this.pacRepository.findOneBy({ id: dto.pacId });
        if (!pacExists) {
          throw new NotFoundException(`PAC con id "${dto.pacId}" no encontrado`);
        }
      }
      if (dto.microActionDefinitionId !== undefined) {
        if (dto.microActionDefinitionId !== null) {
          const microAction = await this.microActionDefinitionRepository.findOneBy({ id: dto.microActionDefinitionId });
          if (!microAction) {
            throw new NotFoundException(
              `MicroActionDefinition con id "${dto.microActionDefinitionId}" no encontrado`,
            );
          }
          if (microAction.pacId !== targetPacId) {
            throw new BadRequestException(
              `MicroActionDefinition "${dto.microActionDefinitionId}" no pertenece al PAC "${targetPacId}"`,
            );
          }
        }
      }

      const updated = await this.learningResourceRepository.update(id, dto);
      return `Recurso de aprendizaje "${dto.title}" actualizado exitosamente`;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Ocurrió un error inesperado al actualizar el recurso de aprendizaje',
      );
    }
  }

  async softDelete(id: string): Promise<{ message: string }> {
    try {
      const exists = await this.learningResourceRepository.findById(id);
      if (!exists) {
        throw new NotFoundException(
          `LearningResource con el id "${id}" no encontrado`,
        );
      }

      const success = await this.learningResourceRepository.softDelete(id);
      if (!success) {
        throw new InternalServerErrorException(
          'No se pudo desactivar el recurso de aprendizaje',
        );
      }

      return { message: `LearningResource "${id}" desactivado exitosamente` };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Ocurrió un error inesperado al eliminar el recurso de aprendizaje',
      );
    }
  }

  async hardDelete(id: string): Promise<{ message: string }> {
    try {
      const exists = await this.learningResourceRepository.findById(id);
      if (!exists) {
        throw new NotFoundException(
          `LearningResource con el id "${id}" no encontrado`,
        );
      }

      const success = await this.learningResourceRepository.hardDelete(id);
      if (!success) {
        throw new InternalServerErrorException(
          'No se pudo eliminar permanentemente el recurso de aprendizaje',
        );
      }

      return {
        message: `LearningResource "${id}" eliminado permanentemente`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Ocurrió un error inesperado al eliminar permanentemente el recurso de aprendizaje',
      );
    }
  }
}