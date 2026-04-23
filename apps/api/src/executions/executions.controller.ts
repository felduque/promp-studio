import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { ExecutionsService } from './executions.service';
import { ExecutePromptDto, BatchExecuteDto, PreviewExecuteDto, StreamExecuteDto } from './dto/execute-prompt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Executions')
@Controller('executions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExecutionsController {
  constructor(private readonly executionsService: ExecutionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ejecuciones con filtros y paginación' })
  findAll(
    @CurrentUser() user: { id: string },
    @Query('source') source?: 'prompt' | 'chat',
    @Query('model') model?: string,
    @Query('provider') provider?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.executionsService.findAll(user.id, {
      source,
      model,
      provider,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

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

  @Post('stream')
  @ApiOperation({ summary: 'Ejecutar contra múltiples modelos con SSE (resultados progresivos)' })
  async streamExecute(
    @Body() dto: StreamExecuteDto,
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let count = 0;
    try {
      for await (const result of this.executionsService.executeStream(dto, user.id)) {
        count++;
        res.write(`data: ${JSON.stringify(result)}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ type: 'done', total: count })}\n\n`);
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Get('version/:versionId')
  @ApiOperation({ summary: 'Obtener ejecuciones de una versión' })
  findByVersion(@Param('versionId') versionId: string) {
    return this.executionsService.findByVersion(versionId);
  }

  @Get('groups')
  @ApiOperation({ summary: 'Listar grupos de ejecución del usuario' })
  getGroups(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.executionsService.getGroups(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('groups/:groupId')
  @ApiOperation({ summary: 'Obtener detalle de un grupo de ejecución' })
  getGroup(
    @CurrentUser() user: { id: string },
    @Param('groupId') groupId: string,
  ) {
    return this.executionsService.getGroup(groupId, user.id);
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
