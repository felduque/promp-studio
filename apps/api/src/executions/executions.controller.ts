import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ExecutionsService } from './executions.service';
import { ExecutePromptDto, BatchExecuteDto, PreviewExecuteDto } from './dto/execute-prompt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Executions')
@Controller('executions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExecutionsController {
  constructor(private readonly executionsService: ExecutionsService) {}

  @Post()
  @ApiOperation({ summary: 'Ejecutar un prompt contra un modelo' })
  execute(
    @Body() dto: ExecutePromptDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.executionsService.execute(dto, user.id);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Ejecutar prompt contra múltiples modelos' })
  executeBatch(
    @Body() dto: BatchExecuteDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.executionsService.executeBatch(dto.executions, user.id);
  }

  @Get('version/:versionId')
  @ApiOperation({ summary: 'Obtener ejecuciones de una versión' })
  findByVersion(@Param('versionId') versionId: string) {
    return this.executionsService.findByVersion(versionId);
  }

  @Get('models')
  @ApiOperation({ summary: 'Obtener modelos disponibles según API keys del usuario' })
  getModels(@CurrentUser() user: { id: string }) {
    return this.executionsService.getModelsForUser(user.id);
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Obtener catálogo completo de modelos soportados' })
  async getCatalog() {
    return this.executionsService.getCatalog();
  }

  @Post('sync-models')
  @ApiOperation({ summary: 'Sincronizar modelos desde proveedores (OpenRouter, etc.)' })
  async syncModels(@CurrentUser() user: { id: string }) {
    const result = await this.executionsService.syncModels();
    return {
      success: true,
      synced: result,
    };
  }

  @Post('preview')
  @ApiOperation({ summary: 'Ejecutar prompt sin guardar (preview)' })
  previewExecute(
    @Body() dto: PreviewExecuteDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.executionsService.executePreview(dto, user.id);
  }
}
