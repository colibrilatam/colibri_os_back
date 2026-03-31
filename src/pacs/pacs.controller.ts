// src/pacs/pacs.controller.ts
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
import { PacsService } from './pacs.service';
import { CreatePacDto } from './dto/create-pac.dto';
import { UpdatePacDto } from './dto/update-pac.dto';

@Controller('pacs')
export class PacsController {
  constructor(private readonly pacsService: PacsService) {}

  @Post()
  create(@Body() dto: CreatePacDto) {
    return this.pacsService.create(dto);
  }

  @Get()
  findAll(@Query('categoryId') categoryId?: string) {
    if (categoryId) {
      return this.pacsService.findByCategory(categoryId);
    }
    return this.pacsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pacsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePacDto,
  ) {
    return this.pacsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pacsService.remove(id);
  }
}