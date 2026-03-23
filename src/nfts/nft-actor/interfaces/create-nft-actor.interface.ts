import { ActorNftType } from "../../entities/nft-actor.entity";

export interface ICreateNftActor {
    userId: string;
    actorNftType: ActorNftType
    chainId: number;
    contractAddress: string;
    tokenId: string;
    nftHash?: string;
    metadataUri?: string;
}