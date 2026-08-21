import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dtos/userUpdate.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './entities/user.entity';
import { ChangeUserRoleDto } from './dtos/change-user-role.dto';
import { ChangeUserStatusDto } from './dtos/change-user-status.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiBearerAuth()
  getProfile(@CurrentUser() user: JwtPayload): JwtPayload {
    return user;
  }

  @ApiOperation({ summary: 'Cambiar la contraseña del usuario autenticado' })
  @ApiBearerAuth()
  @Patch('me/password')
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiBearerAuth()
  @Get()
  async findAll(@CurrentUser('role') role: UserRole) {
    return this.usersService.findAllAuthorized({ role });
  }

  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiBearerAuth()
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.usersService.findOneAuthorized(id, { userId, role });
  }

  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiBearerAuth()
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, { userId, role }, updateUserDto);
  }

  @ApiOperation({ summary: 'Desactivar un usuario' })
  @ApiBearerAuth()
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.usersService.remove(id, { userId, role });
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cambiar el rol de un usuario y registrar la auditoría' })
  async changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminUserId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: ChangeUserRoleDto,
  ) {
    return this.usersService.changeRole(id, adminUserId, dto, { userId: adminUserId, role });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Suspender, desactivar o reactivar a un usuario (revoca su sesión)' })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminUserId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: ChangeUserStatusDto,
  ) {
    return this.usersService.changeStatus(id, dto, { userId: adminUserId, role });
  }
}