import { DataSource } from 'typeorm';
import { Project } from 'src/projects/entities/project.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { MicroActionDefinition } from 'src/micro-action-definitions/entities/micro-action-definition.entity';
import {
  MicroActionInstance,
  MicroActionInstanceStatus,
} from 'src/micro-action-instance/entities/micro-action-instance.entity';

// FlujoClave está en T3. Tiene historial completo de T1 y T2.
// Instancias por tramo:
//   T1 (7 PACs × 3 MADs = 21 instancias) — todas completed
//   T2 (7 PACs × 3 MADs = 21 instancias) — todas completed
//   T3 (7 PACs × 3 MADs = 21 instancias) — PACs 1-6 completed, PAC 7 pending
//
// Regla de evidencia: 1 evidencia por PAC → solo la MAD sortOrder=1 de cada PAC
// lleva evidencia. Las otras 2 instancias del PAC quedan completed sin evidencia.

const now = new Date();
const daysAgo = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
};

export async function seedMicroActionInstances(
  dataSource: DataSource,
  users: User[],
  projects: Project[],
  microActionDefs: MicroActionDefinition[],
) {
  const instanceRepo = dataSource.getRepository(MicroActionInstance);

  // ── Encontrar FlujoClave ─────────────────────────────────────
  const flujoClave = projects.find((p) => p.projectName === 'FlujoClave');
  if (!flujoClave) throw new Error('❌ Proyecto FlujoClave no encontrado');

  const entrepreneurs = users.filter((u) => u.role === UserRole.ENTREPRENEUR);
  const actor = entrepreneurs[1]; // Ana Startup
  if (!actor) throw new Error('❌ Actor (Ana Startup) no encontrado');

  // ── Filtrar MADs de T1, T2 y T3 ───────────────────────────────────────────
  // Código: MAD_{tramoIndex}_{catIndex}_{sortOrder}
  const madsForTramo = (tramoIndex: number) =>
    microActionDefs.filter((mad) => {
      const parts = mad.code.split('_');
      return parts.length === 4 && parseInt(parts[1], 10) === tramoIndex;
    });

  const madsT1 = madsForTramo(1); // 21 MADs
  const madsT2 = madsForTramo(2); // 21 MADs
  const madsT3 = madsForTramo(3); // 21 MADs

  const instancesData: Partial<MicroActionInstance>[] = [];

  // ── Helper: construir instancia ────────────────────────────────────────────
  const buildInstance = (
    mad: MicroActionDefinition,
    status: MicroActionInstanceStatus,
    offsetDaysAgo: number,
  ): Partial<MicroActionInstance> => {
    const base: Partial<MicroActionInstance> = {
      actorUserId: actor.id,
      projectId: flujoClave.id,
      microActionDefinitionId: mad.id,
      status,
      executionWindowDaysSnapshot: mad.executionWindowDays ?? 2,
      attemptNumber: 1,
      reopenedCount: 0,
      isOnTime: true,
    };

    if (status === MicroActionInstanceStatus.COMPLETED) {
      base.startedAt = daysAgo(offsetDaysAgo + 3);
      base.completedAt = daysAgo(offsetDaysAgo);
    } else {
      base.startedAt = daysAgo(offsetDaysAgo);
    }

    return base;
  };

  // ── T1: todas completed (hace ~120-90 días) ────────────────────────────────
  for (const mad of madsT1) {
    instancesData.push(buildInstance(mad, MicroActionInstanceStatus.COMPLETED, 100));
  }

  // ── T2: todas completed (hace ~89-60 días) ────────────────────────────────
  for (const mad of madsT2) {
    instancesData.push(buildInstance(mad, MicroActionInstanceStatus.COMPLETED, 70));
  }

  // ── T3: PACs 1-6 completed, PAC 7 con pending ─────────────────────────────
  // Identificar a qué PAC pertenece cada MAD de T3:
  // Código MAD_3_{catIndex}_{sortOrder} → catIndex = sort del PAC dentro del tramo
  for (const mad of madsT3) {
    const parts = mad.code.split('_');
    const catIndex = parseInt(parts[2], 10);

    if (catIndex <= 6) {
      // PACs 1-6 de T3: completados (hace ~30-10 días)
      instancesData.push(buildInstance(mad, MicroActionInstanceStatus.COMPLETED, 15));
    } else {
      // PAC 7 de T3 (catIndex === 7): pending
      instancesData.push(buildInstance(mad, MicroActionInstanceStatus.PENDING, 0));
    }
  }

  const instances = instanceRepo.create(instancesData);
  const saved = await instanceRepo.save(instances);

  console.log('✅ MicroActionInstances creadas:', saved.length);
  return saved;
}
