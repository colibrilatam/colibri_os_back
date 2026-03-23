import { PortfolioRole } from "src/nfts/entities/mecenas-nft-portfolio.entity";

export interface ICreateMecenasNft {
    mecenasUserId: string;
    nftProjectId: string;
    targetProjectId?: string;
    portfolioRole: PortfolioRole
}