import { DataSource } from 'typeorm';
import { GenderProjectMember, ProjectMember, RoleInTeam } from 'src/project-members/entities/project-member.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Project } from 'src/projects/entities/project.entity';

export async function seedProjectMembers(dataSource: DataSource, users: User[], projects: Project[]) {
    const repo = dataSource.getRepository(ProjectMember);

    const [entrepreneur, , mentor] = users;
    const [ecotech] = projects;

    const originalMembers = repo.create([
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

    await repo.save(originalMembers);

    const flujoClave = projects.find((p) => p.projectName === 'FlujoClave');
    if (!flujoClave) throw new Error('❌ Proyecto FlujoClave no encontrado');

    const entrepreneurs = users.filter((u) => u.role === UserRole.ENTREPRENEUR);
    const [lucas, ana, martin, sofia] = entrepreneurs;

    const flujoClaveMembers = repo.create([
        {
            projectId: flujoClave.id,
            userId: ana.id,
            roleInTeam: RoleInTeam.FOUNDER,
            gender: GenderProjectMember.FEMALE,
            isActive: true,
            isFounder: true,
            isPrimaryOperator: true,
            participationWeight: 0.40,
            joinedAt: new Date(),
        },
        {
            projectId: flujoClave.id,
            userId: sofia.id,
            roleInTeam: RoleInTeam.CMO,
            gender: GenderProjectMember.FEMALE,
            isActive: true,
            isFounder: false,
            isPrimaryOperator: false,
            participationWeight: 0.25,
            joinedAt: new Date(),
        },
        {
            projectId: flujoClave.id,
            userId: lucas.id,
            roleInTeam: RoleInTeam.CTO,
            gender: GenderProjectMember.MALE,
            isActive: true,
            isFounder: false,
            isPrimaryOperator: false,
            participationWeight: 0.20,
            joinedAt: new Date(),
        },
        {
            projectId: flujoClave.id,
            userId: martin.id,
            roleInTeam: RoleInTeam.DEVELOPER,
            gender: GenderProjectMember.MALE,
            isActive: true,
            isFounder: false,
            isPrimaryOperator: false,
            participationWeight: 0.15,
            joinedAt: new Date(),
        },
    ]);

    await repo.save(flujoClaveMembers);

    console.log('✅ Project Members creados:', originalMembers.length + flujoClaveMembers.length);
}