import { DataSource } from 'typeorm';
import {
    MicroActionDefinition,
    MicroActionType,
    EvidenceType,
} from 'src/micro-action-definitions/entities/micro-action-definition.entity';
import { Pac } from 'src/pacs/entities/pac.entity';

export async function seedMicroActions(dataSource: DataSource, pacs: Pac[]) {
    const repo = dataSource.getRepository(MicroActionDefinition);
    const [pac1, pac2, pac3, pac4, pac5] = pacs;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);

    const microActions = repo.create([
        // PAC_1_1_1
        {
            pacId: pac1.id,
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
            pacId: pac1.id,
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
        // PAC_1_1_2
        {
            pacId: pac2.id,
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
        // PAC_1_2_1
        {
            pacId: pac3.id,
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
        // PAC_2_1_1
        {
            pacId: pac4.id,
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
            pacId: pac4.id,
            code: 'MAD_2_1_1_2',
            instruction: 'Validar arquitectura propuesta con un mentor técnico',
            sortOrder: 2,
            executionWindowDays: 4,
            microActionType: MicroActionType.VALIDATION,
            isRequired: false,
            isReusable: false,
            evidenceRequired: true,
            expectedEvidenceType: EvidenceType.LINK,
            validTo: pastDate, // expirada — para testear filtro onlyActive
        },
        // PAC_2_2_1 (categoría inactiva)
        {
            pacId: pac5.id,
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

    const saved = await repo.save(microActions);
    console.log('✅ MicroActions creadas:', saved.length);
    return saved;
}