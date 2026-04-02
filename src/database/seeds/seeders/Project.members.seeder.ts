import { DataSource } from 'typeorm';
import { ProjectMember, RoleInTeam } from 'src/project-members/entities/project-member.entity';
import { User } from 'src/users/entities/user.entity';
import { Project } from 'src/projects/entities/project.entity';

export async function seedProjectMembers(dataSource: DataSource, users: User[], projects: Project[]) {
    const repo = dataSource.getRepository(ProjectMember);
    const [entrepreneur, , mentor] = users;
    const [ecotech] = projects;

    const members = repo.create([
        {
            projectId: ecotech.id,
            userId: entrepreneur.id,
            roleInTeam: RoleInTeam.FOUNDER,
            isActive: true,
            isFounder: true,
            isPrimaryOperator: true,
            participationWeight: 0.8,
            joinedAt: new Date(),
        },
        {
            projectId: ecotech.id,
            userId: mentor.id,
            roleInTeam: RoleInTeam.DEVELOPER,
            isActive: true,
            isFounder: false,
            isPrimaryOperator: false,
            participationWeight: 0.2,
            joinedAt: new Date(),
        },
    ]);

    await repo.save(members);
    console.log('✅ Project Members creados:', members.length);
}