import { DataSource } from 'typeorm';
import { NftProject } from 'src/nfts/entities/nft-project.entity';
import { ActorNftType, NftActor } from 'src/nfts/entities/nft-actor.entity';
import { NftEventType, NftOwnershipEvent } from 'src/nfts/entities/nft-ownership-event.entity';
import { User } from 'src/users/entities/user.entity';
import { Project } from 'src/projects/entities/project.entity';

export async function seedNfts(dataSource: DataSource, users: User[], projects: Project[]) {
    const [mecenas, mentor] = users;
    const [ecotech, agroia] = projects;

    const nftProjectRepo = dataSource.getRepository(NftProject);
    const nftProjects = nftProjectRepo.create([
        {
            projectId: ecotech.id,
            chainId: 137,
            contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            tokenId: '1',
            nftHash: 'hash_ecotech_001',
            metadataUri: 'https://api.colibri.os/nfts/metadata/1',
            currentHolderUserId: null, // ← elegible para mecenas
        },
        {
            projectId: agroia.id,
            chainId: 137,
            contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            tokenId: '2',
            nftHash: 'hash_agroia_002',
            metadataUri: 'https://api.colibri.os/nfts/metadata/2',
            currentHolderUserId: null, // ← elegible para mecenas
        },
    ]);
    const savedNftProjects = await nftProjectRepo.save(nftProjects);
    console.log('✅ NFT Projects creados:', savedNftProjects.length);

    // NftActors — estos sí tienen holder porque son credenciales de actores
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

    // Ownership events — solo registramos el mint inicial, sin transfers
    const ownershipRepo = dataSource.getRepository(NftOwnershipEvent);
    const events = ownershipRepo.create([
        {
            nftProjectId: savedNftProjects[0].id,
            fromUserId: null, // mint inicial, no hay from
            toUserId: null,   // sin holder aún
            eventType: NftEventType.MINT,
            occurredAt: new Date(),
            recordedAt: new Date(),
        },
        {
            nftProjectId: savedNftProjects[1].id,
            fromUserId: null,
            toUserId: null,
            eventType: NftEventType.MINT,
            occurredAt: new Date(),
            recordedAt: new Date(),
        },
    ]);
    await ownershipRepo.save(events);
    console.log('✅ NFT Ownership Events creados:', events.length);
}