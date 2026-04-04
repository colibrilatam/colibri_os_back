
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignNftDto {
  @ApiProperty({
    description: 'ID del registro de portafolio (NFT disponible del mecenas)',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  portfolioId: string;

  @ApiProperty({
    description: 'ID del proyecto elegible receptor del NFT',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  projectId: string;
}