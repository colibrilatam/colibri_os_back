import { DataSource } from 'typeorm';
import { Project, ProjectStatus } from 'src/projects/entities/project.entity';
import { User } from 'src/users/entities/user.entity';

export async function seedProjects(dataSource: DataSource, users: User[]) {
    const repo = dataSource.getRepository(Project);
    const [entrepreneur] = users;

    const projects = repo.create([
        {
            ownerUserId: entrepreneur.id,
            projectName: 'EcoTech',
            status: ProjectStatus.ACTIVE,
            country: 'Argentina',
            industry: 'Tecnología',
            tagline: 'Tecnología para un mundo mejor',
            shortDescription: 'Startup de tecnología sostenible',
        },
        {
            ownerUserId: entrepreneur.id,
            projectName: 'AgroIA',
            status: ProjectStatus.ACTIVE,
            country: 'Argentina',
            industry: 'Agricultura',
            tagline: 'IA para el campo',
            shortDescription: 'Inteligencia artificial aplicada al agro',
        },
    ]);

    const saved = await repo.save(projects);
    console.log('✅ Proyectos creados:', saved.length);
    return saved;
}