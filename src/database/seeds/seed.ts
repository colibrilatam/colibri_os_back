import { AuthProvider, User, UserRole, UserStatus } from 'src/users/entities/user.entity';
import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcrypt';
import { Project, ProjectStatus } from 'src/projects/entities/project.entity';
import { NftProject } from 'src/nfts/entities/nft-project.entity';
import { ActorNftType, NftActor } from 'src/nfts/entities/nft-actor.entity';
import { ProjectMember, RoleInTeam } from 'src/project-members/entities/project-member.entity';
import { NftEventType, NftOwnershipEvent } from 'src/nfts/entities/nft-ownership-event.entity';
import { Tramo } from 'src/tramos/entities/tramo.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Pac } from 'src/pacs/entities/pac.entity';
import {
    MicroActionDefinition,
    MicroActionType,
    EvidenceType,
} from 'src/micro-action-definitions/entities/micro-action-definition.entity';
import { LearningResource, ResourceType } from 'src/learning-resource/entities/learning-resource.entity';

export default async function seed() {
    await AppDataSource.initialize();
    console.log('📦 Conectado a la DB');

    try {
        const userRepository = AppDataSource.getRepository(User);
        const projectRepository = AppDataSource.getRepository(Project);
        const nftProjectRepository = AppDataSource.getRepository(NftProject);
        const nftActorRepository = AppDataSource.getRepository(NftActor);
        const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
        const nftOwnershipRepository = AppDataSource.getRepository(NftOwnershipEvent);
        const tramoRepository = AppDataSource.getRepository(Tramo);
        const categoryRepository = AppDataSource.getRepository(Category);
        const pacRepository = AppDataSource.getRepository(Pac);
        const microActionRepository = AppDataSource.getRepository(MicroActionDefinition);
        const learningResourceRepository = AppDataSource.getRepository(LearningResource);

        await AppDataSource.query(`
                TRUNCATE TABLE
                "learning_resources",
                "micro_action_definitions",
                 "pacs",
                 "categories",
                 "tramos",
                 "nft_ownership_events",
                 "project_members",
                 "nft_actors",
                 "mecenas_nft_portfolios",
                 "nft_projects",
                 "projects",
                 "users"
                RESTART IDENTITY CASCADE;
        `);

        const users = userRepository.create([
            {
                email: 'entrepreneur@colibri.com',
                password: await bcrypt.hash('Test@1234', 10),
                fullName: 'Lucas Emprendedor',
                role: UserRole.ENTREPRENEUR,
                status: UserStatus.ACTIVE,
                provider: AuthProvider.LOCAL,
            },
            {
                email: 'mecenas@colibri.com',
                password: await bcrypt.hash('Test@1234', 10),
                fullName: 'Sofia Mecenas',
                role: UserRole.MECENAS_SEMILLA,
                status: UserStatus.ACTIVE,
                provider: AuthProvider.LOCAL,
            },
            {
                email: 'mentor@colibri.com',
                password: await bcrypt.hash('Test@1234', 10),
                fullName: 'Carlos Mentor',
                role: UserRole.MENTOR,
                status: UserStatus.ACTIVE,
                provider: AuthProvider.LOCAL,
            },
        ]);

        const savedUsers = await userRepository.save(users);
        console.log('✅ Usuarios creados:', savedUsers.length);

        const projects = projectRepository.create([
            {
                ownerUserId: savedUsers[0].id,
                projectName: 'EcoTech',
                status: ProjectStatus.ACTIVE,
                country: 'Argentina',
                industry: 'Tecnología',
                tagline: 'Tecnología para un mundo mejor',
                shortDescription: 'Startup de tecnología sostenible',
            },
            {
                ownerUserId: savedUsers[0].id,
                projectName: 'AgroIA',
                status: ProjectStatus.ACTIVE,
                country: 'Argentina',
                industry: 'Agricultura',
                tagline: 'IA para el campo',
                shortDescription: 'Inteligencia artificial aplicada al agro',
            },
        ]);

        const savedProjects = await projectRepository.save(projects);
        console.log('✅ Proyectos creados:', savedProjects.length);

        const nftProjects = nftProjectRepository.create([
            {
                projectId: savedProjects[0].id,
                chainId: 137,
                contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                tokenId: '1',
                nftHash: 'hash_ecotech_001',
                metadataUri: 'https://api.colibri.os/nfts/metadata/1',
                currentHolderUserId: savedUsers[0].id,
            },
            {
                projectId: savedProjects[1].id,
                chainId: 137,
                contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                tokenId: '2',
                nftHash: 'hash_agroia_002',
                metadataUri: 'https://api.colibri.os/nfts/metadata/2',
                currentHolderUserId: savedUsers[1].id,
            },
        ]);

        const savedNftProjects = await nftProjectRepository.save(nftProjects);
        console.log('✅ NFT Projects creados:', savedNftProjects.length);

        const nftActors = nftActorRepository.create([
            {
                userId: savedUsers[2].id,
                actorNftType: ActorNftType.MENTOR,
                chainId: 137,
                contractAddress: '0xB1c97002c7329b36c1d19D4a2e9Eb0cE3606eB49',
                tokenId: '1',
                nftHash: 'hash_mentor_001',
                metadataUri: 'https://api.colibri.os/nfts/actors/1',
            },
            {
                userId: savedUsers[1].id,
                actorNftType: ActorNftType.MECENAS,
                chainId: 137,
                contractAddress: '0xB1c97002c7329b36c1d19D4a2e9Eb0cE3606eB49',
                tokenId: '2',
                nftHash: 'hash_mecenas_002',
                metadataUri: 'https://api.colibri.os/nfts/actors/2',
            },
        ]);

        const savedNftActors = await nftActorRepository.save(nftActors);
        console.log('✅ NFT Actors creados:', savedNftActors.length);

        const projectMembers = projectMemberRepository.create([
            {
                projectId: savedProjects[0].id,
                userId: savedUsers[0].id,
                roleInTeam: RoleInTeam.FOUNDER,
                isActive: true,
                isFounder: true,
                isPrimaryOperator: true,
                participationWeight: 0.8,
                joinedAt: new Date(),
            },
            {
                projectId: savedProjects[0].id,
                userId: savedUsers[2].id,
                roleInTeam: RoleInTeam.DEVELOPER,
                isActive: true,
                isFounder: false,
                isPrimaryOperator: false,
                participationWeight: 0.2,
                joinedAt: new Date(),
            },
        ]);

        await projectMemberRepository.save(projectMembers);
        console.log('✅ Project Members creados:', projectMembers.length);

        const ownershipEvents = nftOwnershipRepository.create([
            {
                nftProjectId: savedNftProjects[0].id,
                fromUserId: savedUsers[0].id,
                toUserId: savedUsers[1].id,
                eventType: NftEventType.TRANSFER,
                txHash: '0xabc123',
                occurredAt: new Date(),
                recordedAt: new Date(),
            },
        ]);

        await nftOwnershipRepository.save(ownershipEvents);
        console.log('✅ NFT Ownership Events creados:', ownershipEvents.length);

        const tramos = tramoRepository.create([
            {
                code: 'TRAMO_1',
                name: 'Validación de Idea',
                description: 'Fase inicial donde se valida el problema y la solución',
                sortOrder: 1,
                executionWindowDays: 30,
                isActive: true,
            },
            {
                code: 'TRAMO_2',
                name: 'Construcción MVP',
                description: 'Construcción del producto mínimo viable',
                sortOrder: 2,
                executionWindowDays: 60,
                isActive: true,
            },
        ]);
        const savedTramos = await tramoRepository.save(tramos);
        console.log('✅ Tramos creados:', savedTramos.length);

        const categories = categoryRepository.create([
            {
                tramoId: savedTramos[0].id,
                code: 'CAT_1_1',
                name: 'Descubrimiento del problema',
                description: 'Identificación y validación del problema principal',
                sortOrder: 1,
                executionWindowDays: 10,
                isActive: true,
            },
            {
                tramoId: savedTramos[0].id,
                code: 'CAT_1_2',
                name: 'Propuesta de valor',
                description: 'Definición de propuesta de valor inicial',
                sortOrder: 2,
                executionWindowDays: 20,
                isActive: true,
            },
            {
                tramoId: savedTramos[1].id,
                code: 'CAT_2_1',
                name: 'Diseño del MVP',
                description: 'Diseño funcional y técnico del MVP',
                sortOrder: 1,
                executionWindowDays: 20,
                isActive: true,
            },
            {
                tramoId: savedTramos[1].id,
                code: 'CAT_2_2',
                name: 'Validación técnica',
                description: 'Pruebas técnicas y validación de arquitectura',
                sortOrder: 2,
                executionWindowDays: 15,
                isActive: false,
            },
        ]);
        const savedCategories = await categoryRepository.save(categories);
        console.log('✅ Categories creadas:', savedCategories.length);

        const pacs = pacRepository.create([

            {
                categoryId: savedCategories[0].id,
                code: 'PAC_1_1_1',
                title: 'Identificar problema del usuario',
                objectiveLine: 'Detectar necesidades reales del usuario',
                sortOrder: 1,
                executionWindowDays: 5,
                isActive: true,
            },
            {
                categoryId: savedCategories[0].id,
                code: 'PAC_1_1_2',
                title: 'Validar hipótesis del problema',
                objectiveLine: 'Validar si el problema es relevante',
                sortOrder: 2,
                executionWindowDays: 5,
                isActive: true,
            },

            {
                categoryId: savedCategories[1].id,
                code: 'PAC_1_2_1',
                title: 'Definir propuesta de valor',
                objectiveLine: 'Crear propuesta clara y diferenciadora',
                sortOrder: 1,
                executionWindowDays: 10,
                isActive: true,
            },

            {
                categoryId: savedCategories[2].id,
                code: 'PAC_2_1_1',
                title: 'Diseñar arquitectura MVP',
                objectiveLine: 'Definir estructura técnica del producto',
                sortOrder: 1,
                executionWindowDays: 15,
                isActive: true,
            },

            {
                categoryId: savedCategories[3].id,
                code: 'PAC_2_2_1',
                title: 'Testear escalabilidad',
                objectiveLine: 'Evaluar capacidad de crecimiento del sistema',
                sortOrder: 1,
                executionWindowDays: 10,
                isActive: true,
            },
        ]);

        const savedPacs = await pacRepository.save(pacs);
        console.log('✅ PACs creados:', savedPacs.length);

        const now = new Date();
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + 30);

        const pastDate = new Date(now);
        pastDate.setDate(pastDate.getDate() - 30);

        const microActions = microActionRepository.create([
            {
                pacId: savedPacs[0].id,
                code: 'MAD_1_1_1_1',
                instruction: 'Realizar 5 entrevistas con usuarios potenciales',
                sortOrder: 1,
                executionWindowDays: 5,
                microActionType: MicroActionType.INTERVIEW,
                isRequired: true,
                isReusable: false,
                evidenceRequired: true,
                expectedEvidenceType: EvidenceType.TEXT,
                validTo: null,
            },
            {
                pacId: savedPacs[0].id,
                code: 'MAD_1_1_1_2',
                instruction: 'Documentar patrones comunes encontrados en entrevistas',
                sortOrder: 2,
                executionWindowDays: 3,
                microActionType: MicroActionType.DOCUMENTATION,
                isRequired: true,
                isReusable: true,
                evidenceRequired: true,
                expectedEvidenceType: EvidenceType.FILE,
                validTo: futureDate,
            },

            {
                pacId: savedPacs[1].id,
                code: 'MAD_1_1_2_1',
                instruction: 'Definir hipótesis principal del problema',
                sortOrder: 1,
                executionWindowDays: 2,
                microActionType: MicroActionType.RESEARCH,
                isRequired: true,
                isReusable: false,
                evidenceRequired: true,
                expectedEvidenceType: EvidenceType.TEXT,
                validTo: null,
            },

            {
                pacId: savedPacs[2].id,
                code: 'MAD_1_2_1_1',
                instruction: 'Escribir propuesta de valor inicial en una sola frase',
                sortOrder: 1,
                executionWindowDays: 2,
                microActionType: MicroActionType.DOCUMENTATION,
                isRequired: true,
                isReusable: true,
                evidenceRequired: true,
                expectedEvidenceType: EvidenceType.TEXT,
                validTo: null,
            },

            {
                pacId: savedPacs[3].id,
                code: 'MAD_2_1_1_1',
                instruction: 'Diseñar wireframe base del MVP',
                sortOrder: 1,
                executionWindowDays: 7,
                microActionType: MicroActionType.PROTOTYPE,
                isRequired: true,
                isReusable: false,
                evidenceRequired: true,
                expectedEvidenceType: EvidenceType.IMAGE,
                validTo: futureDate,
            },
            {
                pacId: savedPacs[3].id,
                code: 'MAD_2_1_1_2',
                instruction: 'Validar arquitectura propuesta con un mentor técnico',
                sortOrder: 2,
                executionWindowDays: 4,
                microActionType: MicroActionType.VALIDATION,
                isRequired: false,
                isReusable: false,
                evidenceRequired: true,
                expectedEvidenceType: EvidenceType.LINK,
                validTo: pastDate,
            },

            {
                pacId: savedPacs[4].id,
                code: 'MAD_2_2_1_1',
                instruction: 'Definir criterios de escalabilidad esperados',
                sortOrder: 1,
                executionWindowDays: 3,
                microActionType: MicroActionType.OTHER,
                isRequired: false,
                isReusable: false,
                evidenceRequired: false,
                expectedEvidenceType: null,
                validTo: null,
            },
        ] as Partial<MicroActionDefinition>[]);
        const savedMicroActions = await microActionRepository.save(microActions);
        console.log('✅ MicroActions creadas:', savedMicroActions.length);

        const learningResources = learningResourceRepository.create([
            {
                pacId: savedPacs[0].id,
                title: 'Guía para entrevistas de usuario',
                resourceType: ResourceType.DOCUMENT,
                url: 'https://example.com/interview-guide',
                description: 'Plantilla para realizar entrevistas efectivas',
                sortOrder: 1,
                isRequired: true,
                isActive: true,
                microActionDefinitionId: null,
            },
            {
                pacId: savedPacs[2].id,
                title: 'Ejemplos de propuesta de valor',
                resourceType: ResourceType.ARTICLE,
                url: 'https://example.com/value-proposition',
                description: 'Casos reales de propuestas de valor exitosas',
                sortOrder: 1,
                isRequired: false,
                isActive: true,
                microActionDefinitionId: null,
            },

            {
                pacId: savedPacs[0].id,
                microActionDefinitionId: savedMicroActions[0].id,
                title: 'Checklist de entrevistas',
                resourceType: ResourceType.TEMPLATE,
                url: 'https://example.com/checklist',
                description: 'Checklist para validar entrevistas',
                sortOrder: 1,
                isRequired: true,
                isActive: true,
            },
            {
                pacId: savedPacs[3].id,
                microActionDefinitionId: savedMicroActions[4].id,
                title: 'Ejemplo de wireframe',
                resourceType: ResourceType.VIDEO,
                url: 'https://example.com/wireframe.png',
                description: 'Referencia visual de wireframe',
                sortOrder: 1,
                isRequired: false,
                isActive: true,
            },

            {
                pacId: savedPacs[0].id,
                title: 'Recurso obsoleto',
                resourceType: 'document',
                url: 'https://example.com/old',
                description: 'Recurso viejo',
                sortOrder: 2,
                isRequired: false,
                isActive: false,
                microActionDefinitionId: null,
            },
        ] as Partial<LearningResource>[]);

        const savedResources = await learningResourceRepository.save(learningResources);
        console.log('✅ LearningResources creados:', savedResources.length);

        console.log('✅ Seed completado');
    } catch (error) {
        console.error('❌ Error en seed:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

seed();