import { DataSource } from 'typeorm';
import { NftProject } from 'src/nfts/entities/nft-project.entity';
import { ActorNftType, NftActor } from 'src/nfts/entities/nft-actor.entity';
import { NftEventType, NftOwnershipEvent } from 'src/nfts/entities/nft-ownership-event.entity';
import { User } from 'src/users/entities/user.entity';
import { Project } from 'src/projects/entities/project.entity';

export async function seedNfts(dataSource: DataSource, users: User[], projects: Project[]) {
    const [entrepreneur, mecenas, mentor] = users;
    const [ecotech, agroia] = projects;

    // NftProjects
    const nftProjectRepo = dataSource.getRepository(NftProject);
    const nftProjects = nftProjectRepo.create([
        {
            projectId: ecotech.id,
            chainId: 137,
            contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            tokenId: '1',
            nftHash: 'hash_ecotech_001',
            metadataUri: 'https://api.colibri.os/nfts/metadata/1',
            currentHolderUserId: entrepreneur.id,
        },
        {
            projectId: agroia.id,
            chainId: 137,
            contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            tokenId: '2',
            nftHash: 'hash_agroia_002',
            metadataUri: 'https://api.colibri.os/nfts/metadata/2',
            currentHolderUserId: mecenas.id,
        },
    ]);
    const savedNftProjects = await nftProjectRepo.save(nftProjects);
    console.log('✅ NFT Projects creados:', savedNftProjects.length);

    // NftActors
    const nftActorRepo = dataSource.getRepository(NftActor);
    const nftActors = nftActorRepo.create([
        {
            userId: mentor.id,
            actorNftType: ActorNftType.MENTOR,
            chainId: 137,
            contractAddress: '0xB1c97002c7329b36c1d19D4a2e9Eb0cE3606eB49',
            tokenId: '1',
            nftHash: 'hash_mentor_001',
            metadataUri: 'https://api.colibri.os/nfts/actors/1',
        },
        {
            userId: mecenas.id,
            actorNftType: ActorNftType.MECENAS,
            chainId: 137,
            contractAddress: '0xB1c97002c7329b36c1d19D4a2e9Eb0cE3606eB49',
            tokenId: '2',
            nftHash: 'hash_mecenas_002',
            metadataUri: 'https://api.colibri.os/nfts/actors/2',
        },
    ]);
    const savedNftActors = await nftActorRepo.save(nftActors);
    console.log('✅ NFT Actors creados:', savedNftActors.length);

    // NftOwnershipEvents
    const ownershipRepo = dataSource.getRepository(NftOwnershipEvent);
    const events = ownershipRepo.create([
        {
            nftProjectId: savedNftProjects[0].id,
            fromUserId: entrepreneur.id,
            toUserId: mecenas.id,
            eventType: NftEventType.TRANSFER,
            txHash: '0xabc123',
            occurredAt: new Date(),
            recordedAt: new Date(),
        },
    ]);
    await ownershipRepo.save(events);
    console.log('✅ NFT Ownership Events creados:', events.length);
}