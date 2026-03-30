import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
    Logger,
    UseGuards,
} from '@nestjs/common';
import { LearningResourceService } from './learning-resource.service';
import { CreateLearningResourceDto } from './dto/create-learning-resource.dto';
import { QueryLearningResourceDto } from './dto/query.learning-resource.dto';
import { UpdateLearningResourceDto } from './dto/update-learning-resource.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';


@Controller('learning-resources')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LearningResourceController {
    constructor(
        private readonly learningResourceService: LearningResourceService,
    ) { }

    @ApiOperation({ summary: 'Crea un nuevo recurso de aprendizaje' })
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateLearningResourceDto) {
        return await this.learningResourceService.create(dto);
    }

    @ApiOperation({ summary: 'Obtiene una lista paginada de recursos de aprendizaje con filtros opcionales' })
    @Get()
    async findAll(@Query() query: QueryLearningResourceDto) {
        return this.learningResourceService.findAll(query);
    }

    @ApiOperation({ summary: 'Obtiene un recurso de aprendizaje por su ID' })
    @Get(':id')
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
    ) {
        return await this.learningResourceService.findById(id);
    }

    @ApiOperation({ summary: 'Actualiza un recurso de aprendizaje por su ID' })
    @Patch(':id')
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateLearningResourceDto,
    ) {
        return await this.learningResourceService.update(id, dto);
    }

    @ApiOperation({ summary: 'Desactiva un recurso de aprendizaje por su ID (soft delete)' })
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async remove(
        @Param('id', new ParseUUIDPipe()) id: string,
    ) {
        return this.learningResourceService.softDelete(id);
    }

    @ApiOperation({ summary: 'Elimina permanentemente un recurso de aprendizaje por su ID (hard delete)' })
    @Delete(':id/hard')
    @HttpCode(HttpStatus.OK)
    async hardRemove(
        @Param('id', new ParseUUIDPipe()) id: string,
    ) {
        return this.learningResourceService.hardDelete(id);
    }
}