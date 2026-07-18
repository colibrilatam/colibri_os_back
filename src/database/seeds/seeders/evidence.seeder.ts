import { DataSource } from 'typeorm';
import { Evidence, EvidenceStatus, ValidationStatus, PrivacyLevel } from 'src/evidence/entities/evidence.entity';
import { EvidenceVersion } from 'src/evidence/entities/evidence-version.entity';
import { MicroActionInstance, MicroActionInstanceStatus } from 'src/micro-action-instance/entities/micro-action-instance.entity';
import { MicroActionDefinition } from 'src/micro-action-definitions/entities/micro-action-definition.entity';
import { Project } from 'src/projects/entities/project.entity';
import { User, UserRole } from 'src/users/entities/user.entity';

// Estructura:
//   T1 (7 PACs) → 7 evidencias completas
//   T2 (7 PACs) → 7 evidencias completas
//   T3 (7 PACs) → 6 evidencias completas + 1 pendiente
//   Total: 20 completas + 1 pendiente = 21 evidencias
//
// Regla: 1 evidencia por PAC → vinculada a la instancia de la MAD con sortOrder=1

const now = new Date();
const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d;
};

export async function seedEvidences(
    dataSource: DataSource,
    users: User[],
    projects: Project[],
    microActionDefs: MicroActionDefinition[],
    microActionInstances: MicroActionInstance[],
) {
    const evidenceRepo = dataSource.getRepository(Evidence);
    const versionRepo = dataSource.getRepository(EvidenceVersion);

    const flujoClave = projects.find((p) => p.projectName === 'FlujoClave');
    if (!flujoClave) throw new Error('❌ Proyecto FlujoClave no encontrado');

    const entrepreneurs = users.filter((u) => u.role === UserRole.ENTREPRENEUR);
    const actor = entrepreneurs[1];
    if (!actor) throw new Error('❌ Actor no encontrado');

    // ── Obtener las MADs principales (sortOrder=1) de T1, T2 y T3 ─────────────
    // Código: MAD_{tramoIndex}_{catIndex}_{sortOrder}
    const mainMads = microActionDefs.filter((mad) => {
        const parts = mad.code.split('_');
        if (parts.length !== 4) return false;
        const tramoIndex = parseInt(parts[1], 10);
        const sortOrder = parseInt(parts[3], 10);
        return [1, 2, 3].includes(tramoIndex) && sortOrder === 1;
    });

    // Ordenar por tramo y categoría para consistencia
    mainMads.sort((a, b) => {
        const [, aT, aC] = a.code.split('_').map(Number);
        const [, bT, bC] = b.code.split('_').map(Number);
        return aT !== bT ? aT - bT : aC - bC;
    });

    const instanceByMadId = new Map<string, MicroActionInstance>();
    for (const instance of microActionInstances) {
        if (instance.projectId !== flujoClave.id) continue;
        instanceByMadId.set(instance.microActionDefinitionId, instance);
    }

    const savedEvidences: Evidence[] = [];

    for (const mad of mainMads) {
        const parts = mad.code.split('_').map(Number);
        const tramoIndex = parts[1]; // 1, 2 o 3
        const catIndex = parts[2];   // 1..7

        const instance = instanceByMadId.get(mad.id);
        if (!instance) {
            console.warn(`⚠️ Sin instancia para MAD ${mad.code}, se omite`);
            continue;
        }

        const isPending = tramoIndex === 3 && catIndex === 7;

        const savedEvidence = await evidenceRepo.save({
            microActionInstanceId: instance.id,
            authorUserId: actor.id,
            projectId: flujoClave.id,
            evidenceType: mad.expectedEvidenceType,
            status: isPending ? EvidenceStatus.DRAFT : EvidenceStatus.APPROVED,
            validationStatus: isPending ? ValidationStatus.PENDING : ValidationStatus.VALIDATED,
            isValidForIc: !isPending,
            privacyLevel: PrivacyLevel.PRIVATE,
            publicSignalEnabled: !isPending,
            description: isPending
                ? `Evidencia pendiente para ${mad.instruction_es}`
                : `Evidencia completada para ${mad.instruction_es}`,
            canonicalUri: isPending
                ? undefined
                : `https://storage.colibri.app/evidences/flujoclave/t${tramoIndex}_c${catIndex}_v1`,
            submittedAt: isPending ? undefined : daysAgo(tramoIndex === 1 ? 95 : tramoIndex === 2 ? 65 : 12),
            approvedAt: isPending ? undefined : daysAgo(tramoIndex === 1 ? 93 : tramoIndex === 2 ? 63 : 10),
        } as Evidence);
        savedEvidences.push(savedEvidence);

        // ── Crear EvidenceVersion solo para evidencias completas ─────────────────
        if (!isPending) {
            const version = versionRepo.create({
                evidenceId: savedEvidence.id,
                versionNumber: 1,
                storageUri: savedEvidence.canonicalUri,
                contentHash: `hash_flujoclave_t${tramoIndex}_c${catIndex}_v1`,
                changeSummary: 'Versión inicial',
                isMaterialChange: false,
                supersedesVersionNumber: null,
                createdByUserId: actor.id,
            });

            await versionRepo.save(version);
        }
    }

    const completas = savedEvidences.filter((e) => e.status === EvidenceStatus.APPROVED).length;
    const pendientes = savedEvidences.filter((e) => e.status === EvidenceStatus.DRAFT).length;

    console.log(`✅ Evidencias creadas: ${savedEvidences.length} (${completas} completas, ${pendientes} pendiente)`);
    return savedEvidences;
}
