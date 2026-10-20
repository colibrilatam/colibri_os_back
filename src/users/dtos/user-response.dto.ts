import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthProvider, Gender, UserRole, UserStatus } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ enum: UserRole,  
    nullable: true,
    description:
      'Rol del usuario. Null mientras el usuario está en estado PENDING_PROFILE.', })
  role: UserRole;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ enum: AuthProvider })
  provider: AuthProvider;

  @ApiPropertyOptional({ type: String, nullable: true })
  linkedinId: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  googleId: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  cryptoWallet: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  credentialsWallet: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  adnHash: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  bio: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  avatar: string | null;

  @ApiPropertyOptional({ enum: Gender, nullable: true })
  gender: Gender | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}