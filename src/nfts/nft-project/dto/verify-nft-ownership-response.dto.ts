import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NftOwnershipVerificationStatus } from '../../entities/nft-ownership-verification.entity';

/**
 * WEB3-003: resultado de verificar la propiedad on-chain del NFT.
 *
 * `status` siempre está presente en las respuestas 200:
 * - `verified`  → la wallet verificada es la propietaria (owned=true).
 * - `not_owner` → la verificación se ejecutó y la wallet no posee el NFT.
 * - `invalid`   → config válida pero la realidad on-chain no cuadra
 *                 (red distinta, sin contrato, token inexistente, revert).
 *
 * Los errores de configuración responden 409 y los fallos de
 * infraestructura RPC responden 503 (`unavailable`, nunca "correcto").
 */
export class VerifyNftOwnershipResponseDto {
  @ApiProperty({ description: 'ID del NFT de proyecto verificado' })
  nftProjectId: string;

  @ApiProperty({ description: 'true solo cuando la wallet posee el NFT' })
  owned: boolean;

  @ApiProperty({
    description: 'Resultado de la verificación',
    enum: NftOwnershipVerificationStatus,
  })
  status: NftOwnershipVerificationStatus;

  @ApiProperty({ description: 'Chain ID contra el que se verificó' })
  chainId: number;

  @ApiProperty({ description: 'Contrato contra el que se verificó' })
  contractAddress: string;

  @ApiProperty({ description: 'Token ID verificado (uint256 como string)' })
  tokenId: string;

  @ApiProperty({ description: 'Wallet verificada (lowercase)' })
  walletAddress: string;

  @ApiPropertyOptional({
    description: 'Propietario on-chain devuelto por ownerOf (lowercase)',
    nullable: true,
  })
  ownerAddress: string | null;

  @ApiPropertyOptional({
    description: 'Bloque pinneado de la lectura (string para bigint)',
    nullable: true,
  })
  blockNumber: string | null;

  @ApiPropertyOptional({ description: 'Hash del bloque', nullable: true })
  blockHash: string | null;

  @ApiPropertyOptional({
    description: 'Timestamp del bloque',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  blockTimestamp: Date | null;

  @ApiProperty({ description: 'Momento de la verificación' })
  checkedAt: Date;

  @ApiPropertyOptional({
    description: 'Motivo del resultado negativo o no disponible',
    nullable: true,
  })
  validationError: string | null;
}
