import { DataSource } from 'typeorm';
import { Project, ProjectStatus } from 'src/projects/entities/project.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Tramo } from 'src/tramos/entities/tramo.entity';

export async function seedProjects(
  dataSource: DataSource,
  users: User[],
  tramos: Tramo[],
) {
  const repo = dataSource.getRepository(Project);

  const entrepreneurs = users.filter((user) => user.role === UserRole.ENTREPRENEUR);
  const tramoInicial = tramos.filter((t) => t.sortOrder);

  const projectsData = [
    {
      projectName: 'EcoTech',
      status: ProjectStatus.ACTIVE,
      country: 'Argentina',
      industry: 'Tecnología',
      tagline: 'Tecnología para un mundo mejor',
      shortDescription: 'Startup de tecnología sostenible',
    },
    {
      projectName: 'AgroIA',
      status: ProjectStatus.ACTIVE,
      country: 'Argentina',
      industry: 'Agricultura',
      tagline: 'IA para el campo',
      shortDescription: 'Inteligencia artificial aplicada al agro',
    },
    {
      projectName: 'AulaPuente',
      status: ProjectStatus.ACTIVE,
      country: 'Venezuela',
      industry: 'Edtech',
      tagline:
        'Ordena seguimiento escolar cuando la continuidad pedagógica se fragmenta.',
      shortDescription:
        'Proyecto edtech en etapa fundacional que explora una solución simple para organizar actividades, seguimiento y alertas básicas de continuidad académica en educación media venezolana.',
    },
    {
      projectName: 'NexoCaja',
      status: ProjectStatus.ACTIVE,
      country: 'Argentina',
      industry: 'Fintech',
      tagline:
        'Ordena cobros cotidianos y anticipa baches de caja en comercios barriales.',
      shortDescription:
        'Proyecto fintech en etapa fundacional que explora una solución simple para registrar cobros, ventas fiadas y movimientos de caja en pequeños comercios argentinos.',
    },
    {
      projectName: 'SaludNexo',
      status: ProjectStatus.ACTIVE,
      country: 'Panamá',
      industry: 'Healthtech',
      tagline:
        'Seguimiento ambulatorio simple para sostener la adherencia del paciente crónico.',
      shortDescription:
        'Plataforma ligera para clínicas y médicos en Panamá que organiza recordatorios, seguimiento postconsulta y alertas tempranas de continuidad terapéutica en pacientes con hipertensión y diabetes.',
    },
    {
      projectName: 'RutaNómina',
      status: ProjectStatus.ACTIVE,
      country: 'Colombia',
      industry: 'SaaS',
      tagline:
        'Centraliza incidencias laborales y reduce fricción en el cierre de nómina.',
      shortDescription:
        'Proyecto SaaS en validación temprana que ofrece una herramienta liviana para registrar novedades de personal, consolidarlas y disminuir errores operativos en empresas colombianas de servicios.',
    },
    {
      projectName: 'TrayectoClaro',
      status: ProjectStatus.SUSPENDED,
      country: 'Chile',
      industry: 'Edtech',
      tagline:
        'Hace visible la continuidad y el avance en trayectos híbridos.',
      shortDescription:
        'Proyecto edtech en etapa de prototipo vivo que ayuda a instituciones chilenas a seguir participación, continuidad y avance de estudiantes en experiencias híbridas de formación.',
    },
    {
      projectName: 'FlujoClave',
      status: ProjectStatus.INACTIVE,
      country: 'Colombia',
      industry: 'Fintech',
      tagline:
        'Ordena conciliación, cobros y visibilidad de caja en operación real.',
      shortDescription:
        'Proyecto fintech en etapa de prototipo vivo que ayuda a comercios colombianos a consolidar cobros, conciliaciones y alertas de caja cuando operan con múltiples medios de pago.',
    },
    {
      projectName: 'RiegoPulso',
      status: ProjectStatus.CLOSED,
      country: 'Bolivia',
      industry: 'AgroTech',
      tagline:
        'Hace visible el pulso hídrico y operativo de los cultivos en campo.',
      shortDescription:
        'Proyecto agrotech en tracción temprana que ayuda a productores y asociaciones bolivianas a registrar riego, alertas de campo y ejecución operativa para mejorar continuidad y decisiones de manejo.',
    },
  ];

  const projects = repo.create(
    projectsData.map((project, index) => ({
      ...project,
      ownerUserId: entrepreneurs[index % entrepreneurs.length].id,
      currentTramoId: tramoInicial[index % entrepreneurs.length]?.id,
    })),
  );

  const saved = await repo.save(projects);
  console.log('✅ Proyectos creados:', saved.length);
  return saved;
}