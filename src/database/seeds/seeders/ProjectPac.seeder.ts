import { DataSource } from 'typeorm';
import { ProjectPac, ProjectPacStatus } from 'src/projects/entities/project.pac.entity';
import { Project } from 'src/projects/entities/project.entity';
import { Pac } from 'src/pacs/entities/pac.entity';

const daysAgo = (num: number) => {
  const dia = new Date();
  dia.setDate(dia.getDate() - num);
  return dia;
};

export async function seedProjectPacs(
  dataSource: DataSource,
  projects: Project[],
  pacs: Pac[],
) {
  const projectPacRepo = dataSource.getRepository(ProjectPac);

  const flujoClave = projects.find((p) => p.projectName === 'FlujoClave');
  if (!flujoClave) throw new Error('❌ Proyecto FlujoClave no encontrado');

  // ── Indexar PACs por código para lookup rápido ────────────────────────────
  const pacByCode = new Map(pacs.map((p) => [p.code, p]));

  // ── Obtener PACs de T1, T2 y T3 ordenados por catIndex ───────────────────
  const getPacsForTramo = (tramoIndex: number): Pac[] => {
    const result: Pac[] = [];
    for (let catIndex = 1; catIndex <= 7; catIndex++) {
      const code = `PAC_${tramoIndex}_${catIndex}_1`;
      const pac = pacByCode.get(code);
      if (!pac) throw new Error(`❌ PAC ${code} no encontrado`);
      result.push(pac);
    }
    return result;
  };

  const pacsT1 = getPacsForTramo(1);
  const pacsT2 = getPacsForTramo(2);
  const pacsT3 = getPacsForTramo(3);

  let createdCount = 0;
  let updatedCount = 0;

  for (const pac of pacsT1) {
    await projectPacRepo.save({
      projectId: flujoClave.id,
      pacId: pac.id,
      status: ProjectPacStatus.COMPLETED,
      progress: 100,
      startedAt: daysAgo(110),
      completedAt: daysAgo(95),
    } as ProjectPac);
    createdCount++;
  }

  for (const pac of pacsT2) {
    await projectPacRepo.save({
      projectId: flujoClave.id,
      pacId: pac.id,
      status: ProjectPacStatus.COMPLETED,
      progress: 100,
      startedAt: daysAgo(80),
      completedAt: daysAgo(65),
    } as ProjectPac);
    createdCount++;
  }

  const pac31 = pacsT3[0]; // PAC_3_1_1
  const existing = await projectPacRepo.findOne({
    where: { projectId: flujoClave.id, pacId: pac31.id },
  });

  if (existing) {
    existing.status = ProjectPacStatus.COMPLETED;
    existing.progress = 100;
    existing.startedAt = daysAgo(55);
    existing.completedAt = daysAgo(45);
    await projectPacRepo.save(existing);
    updatedCount++;
  } else {
    await projectPacRepo.save({
      projectId: flujoClave.id,
      pacId: pac31.id,
      status: ProjectPacStatus.COMPLETED,
      progress: 100,
      startedAt: daysAgo(55),
      completedAt: daysAgo(45),
    } as ProjectPac);
    createdCount++;
  }

  for (let i = 1; i <= 5; i++) {
    const pac = pacsT3[i];
    await projectPacRepo.save({
      projectId: flujoClave.id,
      pacId: pac.id,
      status: ProjectPacStatus.COMPLETED,
      progress: 100,
      startedAt: daysAgo(44 - i * 5),
      completedAt: daysAgo(35 - i * 5),
    } as ProjectPac);
    createdCount++;
  }

  // ── T3: PAC 7 → crear como in_progress (pendiente) ───────────────────────
  const pac37 = pacsT3[6]; // PAC_3_7_1
  await projectPacRepo.save({
      projectId: flujoClave.id,
      pacId: pac37.id,
      status: ProjectPacStatus.IN_PROGRESS,
      progress: 20,
      startedAt: daysAgo(5),
      completedAt: undefined,
  } as unknown as ProjectPac);
  createdCount++;

  console.log(`✅ ProjectPacs FlujoClave — creados: ${createdCount}, actualizados: ${updatedCount}`);
}