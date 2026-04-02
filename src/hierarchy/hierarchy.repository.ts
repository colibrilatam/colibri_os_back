import { Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tramo } from 'src/tramos/entities/tramo.entity';
import { Repository } from 'typeorm';
import { IQueryHierarchy } from './interface/queryHierarchy.interface';

@Injectable()
export class HierarchyRepository {
    constructor(
        @InjectRepository(Tramo)
        private readonly tramoRepo: Repository<Tramo>,
    ) { }

    async findFullHierarchy(query: IQueryHierarchy): Promise<Tramo[]> {
        const {
            tramoId,
            onlyActive = true,
            includeResources = true,
        } = query;

        const queryBuilder = this.tramoRepo
            .createQueryBuilder('tramo')
            .leftJoinAndSelect(
                'tramo.categories',
                'category',
                onlyActive ? 'category.isActive = :active' : '1=1',
                { active: true },
            )
            .leftJoinAndSelect(
                'category.pacs',
                'pac',
                onlyActive ? 'pac.isActive = :active' : '1=1',
                { active: true },
            )
            .leftJoinAndSelect(
                'pac.microActionDefinitions',
                'mad',
                onlyActive
                    ? '(mad.validTo IS NULL OR mad.validTo > NOW())'
                    : '1=1',
            );

        if (includeResources) {
            queryBuilder.leftJoinAndSelect(
                'pac.learningResources',
                'pacLr',
                onlyActive
                    ? 'pacLr.isActive = :active AND pacLr.microActionDefinitionId IS NULL'
                    : 'pacLr.microActionDefinitionId IS NULL',
                { active: true },
            );

            queryBuilder.leftJoinAndSelect(
                'mad.learningResources',
                'madLr',
                onlyActive ? 'madLr.isActive = :active' : '1=1',
                { active: true },
            );
        }

        if (tramoId) {
            queryBuilder.where('tramo.id = :tramoId', { tramoId });

            if (onlyActive) {
                queryBuilder.andWhere('tramo.isActive = :active', { active: true });
            }
        } else if (onlyActive) {
            queryBuilder.where('tramo.isActive = :active', { active: true });
        }

        queryBuilder.orderBy('tramo.sortOrder', 'ASC')
            .addOrderBy('category.sortOrder', 'ASC')
            .addOrderBy('pac.sortOrder', 'ASC')
            .addOrderBy('mad.sortOrder', 'ASC');

        if (includeResources) {
            queryBuilder.addOrderBy('pacLr.sortOrder', 'ASC')
                .addOrderBy('madLr.sortOrder', 'ASC');
        }

        return queryBuilder.getMany();
    }

    async findShallowHierarchy(onlyActive = true): Promise<Tramo[]> {
        const queryBuilder = this.tramoRepo
            .createQueryBuilder('tramo')
            .leftJoinAndSelect(
                'tramo.categories',
                'category',
                onlyActive ? 'category.isActive = :active' : '1=1',
                { active: true },
            )
            .leftJoinAndSelect(
                'category.pacs',
                'pac',
                onlyActive ? 'pac.isActive = :active' : '1=1',
                { active: true },
            )
            .orderBy('tramo.sortOrder', 'ASC')
            .addOrderBy('category.sortOrder', 'ASC')
            .addOrderBy('pac.sortOrder', 'ASC');

        if (onlyActive) {
            queryBuilder.where('tramo.isActive = :active', { active: true });
        }
        return queryBuilder.getMany();
    }
}