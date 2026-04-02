// src/curriculum/tramos.controller.ts
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
} from '@nestjs/common';
import { TramosService } from './tramos.service';
import { CreateTramoDto } from './dto/create-tramo.dto';
import { UpdateTramoDto } from './dto/update-tramo.dto';

@Controller('tramos')
export class TramosController {
  constructor(private readonly tramosService: TramosService) {}

  @Post()
  create(@Body() dto: CreateTramoDto) {
    return this.tramosService.create(dto);
  }

  @Get()
  findAll() {
    return this.tramosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tramosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTramoDto,
  ) {
    return this.tramosService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tramosService.remove(id);
  }
}