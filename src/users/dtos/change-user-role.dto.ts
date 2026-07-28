import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class ChangeUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.EVALUATOR })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Motivo auditable del cambio de rol',
    example: 'Designación formal como evaluador del piloto.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
