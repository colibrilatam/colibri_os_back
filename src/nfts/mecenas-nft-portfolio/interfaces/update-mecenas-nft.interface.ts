import { PortfolioRole } from "src/nfts/entities/mecenas-nft-portfolio.entity";

export interface IUpdateMecenasNft{
    targetProjectId?: string;
    portfolioRole?: PortfolioRole;
    releasedAt?: Date;
}