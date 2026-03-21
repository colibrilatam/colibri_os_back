import { Controller, Get, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dtos/userUpdate.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('profile')
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiBearerAuth()
  async getProfile(@Req() req: any){
    return await req.user;
  }

  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiBearerAuth()
  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiBearerAuth()
  @Get(':id')
 async findOne(@Param('id') id: string) {
    return await this.usersService.findOneById(id);
  }

  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiBearerAuth()
  @Patch(':id')
 async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Desactivar un usuario' })
  @ApiBearerAuth()
  @Delete(':id')
 async remove(@Param('id') id: string) {
    return await this.usersService.remove(id);
  }
}
