// src/micro-action-definitions/micro-action-definitions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { MicroActionDefinitionsService } from './micro-action-definitions.service';
import { CreateMicroActionDefinitionDto } from './dto/create-micro-action-definition.dto';
import { UpdateMicroActionDefinitionDto } from './dto/update-micro-action-definition.dto';

@Controller('micro-action-definitions')
export class MicroActionDefinitionsController {
  constructor(
    private readonly madService: MicroActionDefinitionsService,
  ) {}

  @Post()
  create(@Body() dto: CreateMicroActionDefinitionDto) {
    return this.madService.create(dto);
  }

  @Get()
  findAll(@Query('pacId') pacId?: string) {
    if (pacId) {
      return this.madService.findByPac(pacId);
    }
    return this.madService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.madService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMicroActionDefinitionDto,
  ) {
    return this.madService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.madService.remove(id);
  }
}