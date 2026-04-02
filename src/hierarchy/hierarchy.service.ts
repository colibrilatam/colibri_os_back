import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { HierarchyRepository } from './hierarchy.repository';
import { IQueryHierarchy } from './interface/queryHierarchy.interface';
import { Tramo } from 'src/tramos/entities/tramo.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Pac } from 'src/pacs/entities/pac.entity';
import { MicroActionDefinition } from 'src/micro-action-definitions/entities/micro-action-definition.entity';
import { LearningResource } from 'src/learning-resource/entities/learning-resource.entity';

@Injectable()
export class HierarchyService {
  constructor(private readonly hierarchyRepository: HierarchyRepository) {}
 
  async getFullHierarchy(query: IQueryHierarchy) {
    try {
      const tramos = await this.hierarchyRepository.findFullHierarchy(query);
 
      if (query.tramoId && tramos.length === 0) {
        throw new NotFoundException(
          `Tramo with id "${query.tramoId}" not found or is inactive`,
        );
      }
 
      const mapped = tramos.map((t) =>
        this.mapTramo(t, query.includeResources ?? true),
      );
 
      return {
        totalTramos: mapped.length,
        tramos: mapped,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'An unexpected error occurred while building the hierarchy',
      );
    }
  }
 
  async getShallowHierarchy(onlyActive = true) {
    try {
      const tramos = await this.hierarchyRepository.findShallowHierarchy(onlyActive);
 
      const mapped = tramos.map((t) => this.mapTramo(t, false));
 
      return {
        totalTramos: mapped.length,
        tramos: mapped,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'An unexpected error occurred while building the shallow hierarchy',
      );
    }
  }
 
  private mapTramo(tramo: Tramo, includeResources: boolean){
    return {
      id: tramo.id,
      code: tramo.code,
      name: tramo.name,
      description: tramo.description ?? null,
      sortOrder: tramo.sortOrder,
      executionWindowDays: tramo.executionWindowDays ?? null,
      uncertaintyType: tramo.uncertaintyType ?? null,
      primaryRiskType: tramo.primaryRiskType ?? null,
      icFloor: tramo.icFloor ?? null,
      categories: (tramo.categories ?? []).map((c) =>
        this.mapCategory(c, includeResources),
      ),
    };
  }
 
  private mapCategory(category: Category, includeResources: boolean){
    return {
      id: category.id,
      code: category.code,
      name: category.name,
      description: category.description ?? null,
      sortOrder: category.sortOrder,
      executionWindowDays: category.executionWindowDays ?? null,
      uncertaintyType: category.uncertaintyType ?? null,
      primaryRiskType: category.primaryRiskType ?? null,
      pacs: (category.pacs ?? []).map((p) => this.mapPac(p, includeResources)),
    };
  }
 
  private mapPac(pac: Pac, includeResources: boolean) {
    return {
      id: pac.id,
      code: pac.code,
      title: pac.title,
      objectiveLine: pac.objectiveLine ?? null,
      sortOrder: pac.sortOrder,
      executionWindowDays: pac.executionWindowDays ?? null,
      minimumCompletionThreshold: pac.minimumCompletionThreshold ?? null,
      icWeight: pac.icWeight ?? null,
      microActions: (pac.microActionDefinitions?? []).map((ma) =>
        this.mapMicroAction(ma, includeResources),
      ),
      learningResources: includeResources
        ? (pac.learningResources ?? [])
            .filter((lr) => lr.microActionDefinitionId === null)
            .map((lr) => this.mapLearningResource(lr))
        : [],
    };
  }
 
  private mapMicroAction(
    mad: MicroActionDefinition,
    includeResources: boolean,
  ) {
    return {
      id: mad.id,
      code: mad.code,
      instruction: mad.instruction,
      sortOrder: mad.sortOrder,
      microActionType: mad.microActionType,
      isRequired: mad.isRequired,
      evidenceRequired: mad.evidenceRequired,
      expectedEvidenceType: mad.expectedEvidenceType ?? null,
      learningResources: includeResources
        ? (mad.learningResources ?? []).map((lr) => this.mapLearningResource(lr))
        : [],
    };
  }
 
  private mapLearningResource(lr: LearningResource){
    return {
      id: lr.id,
      title: lr.title,
      resourceType: lr.resourceType,
      url: lr.url,
      description: lr.description ?? null,
      sortOrder: lr.sortOrder,
      isRequired: lr.isRequired,
      isActive: lr.isActive,
      microActionDefinitionId: lr.microActionDefinitionId ?? null,
    };
  }
}