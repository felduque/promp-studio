import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Evaluations')
@Controller('evaluations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear o actualizar evaluación' })
  createOrUpdate(
    @Body() dto: CreateEvaluationDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.evaluationsService.createOrUpdate(dto, user.id);
  }

  @Get(':executionId')
  @ApiOperation({ summary: 'Obtener evaluación de una ejecución' })
  findByExecution(@Param('executionId') executionId: string) {
    return this.evaluationsService.findByExecution(executionId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar evaluación' })
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.evaluationsService.remove(id, user.id);
  }

  @Get('leaderboard/overview')
  @ApiOperation({ summary: 'Leaderboard de modelos con evaluaciones' })
  getLeaderboard() {
    return this.evaluationsService.getLeaderboard();
  }
}
