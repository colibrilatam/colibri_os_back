import { DataSource } from 'typeorm';
import { LearningResource, ResourceType } from 'src/learning-resource/entities/learning-resource.entity';
import { Pac } from 'src/pacs/entities/pac.entity';
import { MicroActionDefinition } from 'src/micro-action-definitions/entities/micro-action-definition.entity';

export async function seedLearningResources(
    dataSource: DataSource,
    pacs: Pac[],
    microActions: MicroActionDefinition[],
) {
    const repo = dataSource.getRepository(LearningResource);
    const [pac1, , pac3, pac4] = pacs;
    const [mad1, , , , mad5] = microActions;

    const resources = repo.create([
        // Recursos a nivel PAC (sin micro acción asociada)
        {
            pacId: pac1.id,
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
            pacId: pac3.id,
            title: 'Ejemplos de propuesta de valor',
            resourceType: ResourceType.ARTICLE,
            url: 'https://example.com/value-proposition',
            description: 'Casos reales de propuestas de valor exitosas',
            sortOrder: 1,
            isRequired: false,
            isActive: true,
            microActionDefinitionId: null,
        },
        // Recursos vinculados a micro acciones específicas
        {
            pacId: pac1.id,
            microActionDefinitionId: mad1.id,
            title: 'Checklist de entrevistas',
            resourceType: ResourceType.TEMPLATE,
            url: 'https://example.com/checklist',
            description: 'Checklist para validar entrevistas',
            sortOrder: 1,
            isRequired: true,
            isActive: true,
        },
        {
            pacId: pac4.id,
            microActionDefinitionId: mad5.id,
            title: 'Ejemplo de wireframe',
            resourceType: ResourceType.VIDEO,
            url: 'https://example.com/wireframe.png',
            description: 'Referencia visual de wireframe',
            sortOrder: 1,
            isRequired: false,
            isActive: true,
        },
        // Recurso inactivo — para testear filtro onlyActive
        {
            pacId: pac1.id,
            title: 'Recurso obsoleto',
            resourceType: ResourceType.DOCUMENT,
            url: 'https://example.com/old',
            description: 'Recurso viejo fuera de uso',
            sortOrder: 2,
            isRequired: false,
            isActive: false,
            microActionDefinitionId: null,
        },
    ] as Partial<LearningResource>[]);

    const saved = await repo.save(resources);
    console.log('✅ LearningResources creados:', saved.length);
    return saved;
}