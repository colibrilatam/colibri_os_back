import { DataSource } from 'typeorm';
import { Project, ProjectStatus, TrajectoryStatus } from 'src/projects/entities/project.entity';
import { ProjectPac, ProjectPacStatus } from 'src/projects/entities/project.pac.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Tramo } from 'src/tramos/entities/tramo.entity';
import { Pac } from 'src/pacs/entities/pac.entity';

const LOGOS = {
  aulapuente: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776794391/1_AulaPuente_Edtech_Venezuela_a3lya8.jpg',
  nexocaja: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776794385/2_NexoCaja_Fintech_Argentina_l1nqog.jpg',
  saludnexo: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776794379/3_SaludNexo_Healthtech_Panama_t18hjp.jpg',
  rutanomina: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776794274/4_RutaNomina_Saas_Colombia_vokvzd.jpg',
  trayectoclaro: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776794269/5_TrayectoClaro_Edtech_Chile_opy2ld.jpg',
  flujoclave: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776793995/6_FlujoClave_Fintech_Colombia_uhepfb.jpg',
  riegopulso: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776793901/7_RiegoPulso_Agrotech_Bolivia_l7iwf9.jpg',
  turnobase: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776793664/8_TurnoBase_Hrtech_Chile_gubmbg.jpg',
};

const NFT_IMAGES = {
  aulapuente: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776794482/proj_aulapuente_ve_nft_t1_pdyydg.jpg',
  nexocaja: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776794499/proj_nexocaja_ar_nft_t1_evaucn.jpg',
  saludnexo: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776794508/proj_saludnexo_pa_nft_t2_gmnnga.jpg',
  rutanomina: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776794520/4_proj_rutanomina_co_nft_t2_m7usju.jpg',
  trayectoclaro: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776794539/5_proj_trayectoclaro_cl_nft_t3_addy8w.jpg',
  flujoclave: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776794555/6_proj_flujoclave_co_nft_t3_rlbafx.jpg',
  riegopulso: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776794574/proj_riegopulso_bo_nft_t4_id265s.jpg',
  turnobase: 'https://res.cloudinary.com/doplwvnnj/image/upload/v1776794581/proj_turnobase_cl_nft_t4_fqtwth.jpg',

};

// ─── Datos de proyectos ───────────────────────────────────────────────────────

interface ProjectSeedData {
  slug: string;
  projectName: string;
  status: ProjectStatus;
  trajectoryStatus: TrajectoryStatus;
  country: string;
  industry: string;
  tagline: string;
  shortDescription: string;
  tramoCode: string; // T1 | T2 | T3 | T4
}

const PROJECT_DATA: ProjectSeedData[] = [
  // ── T1 — Fase Fundacional ─────────────────────────────────────────────────
  {
    slug: 'aulapuente',
    projectName: 'AulaPuente',
    status: ProjectStatus.ACTIVE,
    trajectoryStatus: TrajectoryStatus.ON_TRACK,
    country: 'Venezuela',
    industry: 'Edtech',
    tagline: 'Ordena seguimiento escolar cuando la continuidad pedagógica se fragmenta.',
    shortDescription:
      'Proyecto edtech en etapa fundacional que explora una solución simple para organizar actividades, seguimiento y alertas básicas de continuidad académica en educación media venezolana.',
    tramoCode: 'T1',
  },
  {
    slug: 'nexocaja',
    projectName: 'NexoCaja',
    status: ProjectStatus.ACTIVE,
    trajectoryStatus: TrajectoryStatus.ON_TRACK,
    country: 'Argentina',
    industry: 'Fintech',
    tagline: 'Ordena cobros cotidianos y anticipa baches de caja en comercios barriales.',
    shortDescription:
      'Proyecto fintech en etapa fundacional que explora una solución simple para registrar cobros, ventas fiadas y movimientos de caja en pequeños comercios argentinos.',
    tramoCode: 'T1',
  },

  // ── T2 — Validación Temprana ──────────────────────────────────────────────
  {
    slug: 'saludnexo',
    projectName: 'SaludNexo',
    status: ProjectStatus.ACTIVE,
    trajectoryStatus: TrajectoryStatus.ON_TRACK,
    country: 'Panamá',
    industry: 'Healthtech',
    tagline: 'Seguimiento ambulatorio simple para sostener la adherencia del paciente crónico.',
    shortDescription:
      'Plataforma ligera para clínicas y médicos en Panamá que organiza recordatorios, seguimiento postconsulta y alertas tempranas de continuidad terapéutica en pacientes con hipertensión y diabetes.',
    tramoCode: 'T2',
  },
  {
    slug: 'rutanomina',
    projectName: 'RutaNómina',
    status: ProjectStatus.ACTIVE,
    trajectoryStatus: TrajectoryStatus.AT_RISK,
    country: 'Colombia',
    industry: 'SaaS',
    tagline: 'Centraliza incidencias laborales y reduce fricción en el cierre de nómina.',
    shortDescription:
      'Proyecto SaaS en validación temprana que ofrece una herramienta liviana para registrar novedades de personal, consolidarlas y disminuir errores operativos en empresas colombianas de servicios.',
    tramoCode: 'T2',
  },

  // ── T3 — Prototipo Vivo ───────────────────────────────────────────────────
  {
    slug: 'trayectoclaro',
    projectName: 'TrayectoClaro',
    status: ProjectStatus.SUSPENDED,
    trajectoryStatus: TrajectoryStatus.STALLED,
    country: 'Chile',
    industry: 'Edtech',
    tagline: 'Hace visible la continuidad y el avance en trayectos híbridos.',
    shortDescription:
      'Proyecto edtech en etapa de prototipo vivo que ayuda a instituciones chilenas a seguir participación, continuidad y avance de estudiantes en experiencias híbridas de formación.',
    tramoCode: 'T3',
  },
  {
    slug: 'flujoclave',
    projectName: 'FlujoClave',
    status: ProjectStatus.ACTIVE,
    trajectoryStatus: TrajectoryStatus.STALLED,
    country: 'Colombia',
    industry: 'Fintech',
    tagline: 'Ordena conciliación, cobros y visibilidad de caja en operación real.',
    shortDescription:
      'Proyecto fintech en etapa de prototipo vivo que ayuda a comercios colombianos a consolidar cobros, conciliaciones y alertas de caja cuando operan con múltiples medios de pago.',
    tramoCode: 'T3',
  },

  // ── T4 — Tracción Temprana ────────────────────────────────────────────────
  {
    slug: 'riegopulso',
    projectName: 'RiegoPulso',
    status: ProjectStatus.CLOSED,
    trajectoryStatus: TrajectoryStatus.COMPLETED,
    country: 'Bolivia',
    industry: 'AgroTech',
    tagline: 'Hace visible el pulso hídrico y operativo de los cultivos en campo.',
    shortDescription:
      'Proyecto agrotech en tracción temprana que ayuda a productores y asociaciones bolivianas a registrar riego, alertas de campo y ejecución operativa para mejorar continuidad y decisiones de manejo.',
    tramoCode: 'T4',
  },
  {
    slug: 'turnobase',
    projectName: 'TurnoBase',
    status: ProjectStatus.ACTIVE,
    trajectoryStatus: TrajectoryStatus.ON_TRACK,
    country: 'Chile',
    industry: 'HR Tech',
    tagline: 'Ordena turnos, ausencias y cobertura operativa sin fricción manual.',
    shortDescription:
      'Proyecto HR Tech en tracción temprana que ayuda a empresas chilenas con operación por turnos a registrar cambios, ausencias y coberturas para mejorar continuidad operativa y trazabilidad interna.',
    tramoCode: 'T4',
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export async function seedProjects(
  dataSource: DataSource,
  users: User[],
  tramos: Tramo[],
  pacs: Pac[],
) {
  const projectRepo = dataSource.getRepository(Project);
  const projectPacRepo = dataSource.getRepository(ProjectPac);

  const entrepreneurs = users.filter((user) => user.role === UserRole.ENTREPRENEUR);

  // Índices rápidos para no iterar en cada loop
  const tramoByCode = new Map(tramos.map((t) => [t.code, t]));

  // Primer PAC activo de cada tramo (el de menor sortOrder dentro de su categoría)
  // Los PACs vienen ordenados por sortOrder desde el seeder de PACs.
  // Agrupamos por tramoCode usando el código del PAC (PAC_1_x_x → T1, PAC_2_x_x → T2…)
  const firstPacByTramo = new Map<string, Pac>();
  for (const pac of pacs) {
    // PAC_1_1_1 → tramoIndex = 1 → 'T1'
    const tramoIndex = pac.code.split('_')[1];
    const tramoCode = `T${tramoIndex}`;
    if (!firstPacByTramo.has(tramoCode)) {
      firstPacByTramo.set(tramoCode, pac);
    }
  }

  const savedProjects: Project[] = [];

  for (let i = 0; i < PROJECT_DATA.length; i++) {
    const data = PROJECT_DATA[i];
    const tramo = tramoByCode.get(data.tramoCode);
    const firstPac = firstPacByTramo.get(data.tramoCode);
    const owner = entrepreneurs[i % entrepreneurs.length];

    if (!tramo) throw new Error(`Tramo ${data.tramoCode} no encontrado en seed`);
    if (!firstPac) throw new Error(`No hay PAC activo para el tramo ${data.tramoCode}`);

    const project = projectRepo.create({
      projectName: data.projectName,
      projectImageUrl: LOGOS[data.slug],
      nftImageUrl: NFT_IMAGES[data.slug],
      status: data.status,
      trajectoryStatus: data.trajectoryStatus,
      country: data.country,
      industry: data.industry,
      tagline: data.tagline,
      shortDescription: data.shortDescription,
      ownerUserId: owner.id,
      currentTramoId: tramo.id,
      currentPacId: firstPac.id,
      openedAt: new Date(),
      lastActivityAt: new Date(),
    });

    const saved = await projectRepo.save(project);
    savedProjects.push(saved);

    // ProjectPac — el proyecto arranca con su primer PAC en in_progress
    const projectPac = projectPacRepo.create({
      projectId: saved.id,
      pacId: firstPac.id,
      status: ProjectPacStatus.IN_PROGRESS,
      progress: 0,
      startedAt: new Date(),
    });

    await projectPacRepo.save(projectPac);
  }

  console.log('✅ Proyectos creados:', savedProjects.length);
  console.log('✅ ProjectPacs creados:', savedProjects.length);
  return savedProjects;
}