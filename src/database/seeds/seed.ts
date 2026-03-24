import { AuthProvider, User, UserRole, UserStatus } from 'src/users/entities/user.entity';
import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcrypt';
import { Project, ProjectStatus } from 'src/projects/entities/project.entity';
import { NftProject } from 'src/nfts/entities/nft-project.entity';
import { ActorNftType, NftActor } from 'src/nfts/entities/nft-actor.entity';
import { ProjectMember, RoleInTeam } from 'src/project-members/entities/project-member.entity';
import { NftEventType, NftOwnershipEvent } from 'src/nfts/entities/nft-ownership-event.entity';

export default async function seed() {
    await AppDataSource.initialize();
    console.log('📦 Conectado a la DB');

    try {
        const userRepository = AppDataSource.getRepository(User);
        const projectRepository = AppDataSource.getRepository(Project);
        const nftProjectRepository = AppDataSource.getRepository(NftProject);
        const nftActorRepository = AppDataSource.getRepository(NftActor);
        const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
        const nftOwnershipRepository = AppDataSource.getRepository(NftOwnershipEvent);

        await AppDataSource.query(`
          TRUNCATE TABLE
            "nft_ownership_events",
            "project_members",
            "nft_actors",
            "mecenas_nft_portfolios",
            "nft_projects",
            "projects",
            "users"
          RESTART IDENTITY CASCADE;
        `);

        const users = userRepository.create([
            {
                email: 'entrepreneur@colibri.com',
                password: await bcrypt.hash('Test@1234', 10),
                fullName: 'Lucas Emprendedor',
                role: UserRole.ENTREPRENEUR,
                status: UserStatus.ACTIVE,
                provider: AuthProvider.LOCAL,
            },
            {
                email: 'mecenas@colibri.com',
                password: await bcrypt.hash('Test@1234', 10),
                fullName: 'Sofia Mecenas',
                role: UserRole.MECENAS,
                status: UserStatus.ACTIVE,
                provider: AuthProvider.LOCAL,
            },
            {
                email: 'mentor@colibri.com',
                password: await bcrypt.hash('Test@1234', 10),
                fullName: 'Carlos Mentor',
                role: UserRole.MENTOR,
                status: UserStatus.ACTIVE,
                provider: AuthProvider.LOCAL,
            },
        ]);

        const savedUsers = await userRepository.save(users);
        console.log('✅ Usuarios creados:', savedUsers.length);

        const projects = projectRepository.create([
            {
                ownerUserId: savedUsers[0].id,
                projectName: 'EcoTech',
                status: ProjectStatus.ACTIVE,
                country: 'Argentina',
                industry: 'Tecnología',
                tagline: 'Tecnología para un mundo mejor',
                shortDescription: 'Startup de tecnología sostenible',
            },
            {
                ownerUserId: savedUsers[0].id,
                projectName: 'AgroIA',
                status: ProjectStatus.ACTIVE,
                country: 'Argentina',
                industry: 'Agricultura',
                tagline: 'IA para el campo',
                shortDescription: 'Inteligencia artificial aplicada al agro',
            },
        ]);

        const savedProjects = await projectRepository.save(projects);
        console.log('✅ Proyectos creados:', savedProjects.length);

        const nftProjects = nftProjectRepository.create([
            {
                projectId: savedProjects[0].id,
                chainId: 137,
                contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                tokenId: '1',
                nftHash: 'hash_ecotech_001',
                metadataUri: 'https://api.colibri.os/nfts/metadata/1',
                currentHolderUserId: savedUsers[0].id,
            },
            {
                projectId: savedProjects[1].id,
                chainId: 137,
                contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                tokenId: '2',
                nftHash: 'hash_agroia_002',
                metadataUri: 'https://api.colibri.os/nfts/metadata/2',
                currentHolderUserId: savedUsers[1].id,
            },
        ]);

        const savedNftProjects = await nftProjectRepository.save(nftProjects);
        console.log('✅ NFT Projects creados:', savedNftProjects.length);

        const nftActors = nftActorRepository.create([
            {
                userId: savedUsers[2].id,
                actorNftType: ActorNftType.MENTOR,
                chainId: 137,
                contractAddress: '0xB1c97002c7329b36c1d19D4a2e9Eb0cE3606eB49',
                tokenId: '1',
                nftHash: 'hash_mentor_001',
                metadataUri: 'https://api.colibri.os/nfts/actors/1',
            },
            {
                userId: savedUsers[1].id,
                actorNftType: ActorNftType.MECENAS,
                chainId: 137,
                contractAddress: '0xB1c97002c7329b36c1d19D4a2e9Eb0cE3606eB49',
                tokenId: '2',
                nftHash: 'hash_mecenas_002',
                metadataUri: 'https://api.colibri.os/nfts/actors/2',
            },
        ]);

        const savedNftActors = await nftActorRepository.save(nftActors);
        console.log('✅ NFT Actors creados:', savedNftActors.length);

        const projectMembers = projectMemberRepository.create([
            {
                projectId: savedProjects[0].id,
                userId: savedUsers[0].id,
                roleInTeam: RoleInTeam.FOUNDER,
                isActive: true,
                isFounder: true,
                isPrimaryOperator: true,
                participationWeight: 0.8,
                joinedAt: new Date(),
            },
            {
                projectId: savedProjects[0].id,
                userId: savedUsers[2].id,
                roleInTeam: RoleInTeam.DEVELOPER,
                isActive: true,
                isFounder: false,
                isPrimaryOperator: false,
                participationWeight: 0.2,
                joinedAt: new Date(),
            },
        ]);

        await projectMemberRepository.save(projectMembers);
        console.log('✅ Project Members creados:', projectMembers.length);

        const ownershipEvents = nftOwnershipRepository.create([
            {
                nftProjectId: savedNftProjects[0].id,
                fromUserId: savedUsers[0].id,
                toUserId: savedUsers[1].id,
                eventType: NftEventType.TRANSFER,
                txHash: '0xabc123',
                occurredAt: new Date(),
                recordedAt: new Date(),
            },
        ]);

        await nftOwnershipRepository.save(ownershipEvents);
        console.log('✅ NFT Ownership Events creados:', ownershipEvents.length);

        console.log('✅ Seed completado');
    } catch (error) {
        console.error('❌ Error en seed:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

seed();