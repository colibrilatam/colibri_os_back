import { NftEventType } from "src/nfts/entities/nft-ownership-event.entity";

export interface ICreateNftOwnershipEvent {
        nftProjectId: string;
        fromUserId?: string;
        toUserId?: string;
        eventType: NftEventType;
        txHash?: string;
        occurredAt: Date;
}