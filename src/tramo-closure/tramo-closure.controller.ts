// src/tramo-closure/tramo-closure.controller.ts

import {
  Controller, Get, Post, Body,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TramoClosureService } from './tramo-closure.service';
import { EvaluateClosureDto } from './dto/evaluate-closure.dto';
import { CloseTramoDto } from './dto/close-tramo.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Tramo Closure')
@ApiBearerAuth()
@Controller('tramo-closure')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TramoClosureController {
  constructor(private readonly service: TramoClosureService) {}

  @Post('evaluate')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN, UserRole.EVALUATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evaluar si un tramo está listo para cerrarse',
    description: `Verifica cuántas de las ${7} evidencias requeridas están aprobadas para el tramo indicado.
    
Devuelve:
- \`approvedEvidences\`: cuántas evidencias aprobadas tiene el proyecto en ese tramo
- \`requiredEvidences\`: cuántas se necesitan (7)
- \`isComplete\`: si se alcanzó el umbral
- \`canClose\`: si además el tramo es el actual del proyecto
- \`missingEvidences\`: cuántas faltan`,
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        projectId: 'proj-uuid-0001',
        tramoId: 'tramo-uuid-0001',
        tramoCode: 'T1',
        approvedEvidences: 7,
        requiredEvidences: 7,
        isComplete: true,
        missingEvidences: 0,
        canClose: true,
      },
    },
  })
  evaluateCompletion(@Body() dto: EvaluateClosureDto) {
    return this.service.evaluateCompletion(dto);
  }

  @Post('close')
  @Roles(UserRole.ADMIN, UserRole.EVALUATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar un tramo y avanzar al siguiente',
    description: `Ejecuta los tres efectos estructurales del cierre de tramo:

1. **Recalcula el Índice Colibrí** con snapshot consolidado
2. **Evoluciona visualmente el NFT** del proyecto (si tiene NFT)
3. **Habilita el siguiente tramo** actualizando \`currentTramoId\` del proyecto

Falla si las 7 evidencias no están aprobadas o si el tramo no es el actual del proyecto.`,
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        message: 'Tramo T1 cerrado exitosamente. El proyecto avanzó a T2.',
        projectId: 'proj-uuid-0001',
        closedTramoId: 'tramo-uuid-0001',
        nextTramoId: 'tramo-uuid-0002',
        icPublic: 78.5,
        nftEvolved: true,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El tramo no puede cerrarse porque faltan evidencias aprobadas.',
  })
  closeTramo(@Body() dto: CloseTramoDto) {
    return this.service.closeTramo(dto);
  }
}