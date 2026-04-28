import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { CreateChatVersionDto } from './dto/create-chat-version.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Prompts')
@Controller('prompts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar prompts de un proyecto' })
  findAll(
    @Query('projectId') projectId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.promptsService.findAllByProject(projectId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un prompt por ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.promptsService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un prompt' })
  create(@Body() dto: CreatePromptDto, @CurrentUser() user: { id: string }) {
    return this.promptsService.create(dto, user.id);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Crear nueva versión de un prompt' })
  createVersion(
    @Param('id') id: string,
    @Body() dto: CreateVersionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.promptsService.createVersion(id, dto, user.id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Obtener historial de versiones' })
  getVersions(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.promptsService.getVersions(id, user.id);
  }

  @Get('versions/:versionId')
  @ApiOperation({ summary: 'Obtener una versión específica' })
  getVersion(
    @Param('versionId') versionId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.promptsService.getVersion(versionId, user.id);
  }

  @Get('chat-versions/:versionId')
  @ApiOperation({ summary: 'Obtener una version especifica de chat' })
  getChatVersion(
    @Param('versionId') versionId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.promptsService.getChatVersion(versionId, user.id);
  }

  @Post(':id/chat-versions')
  @ApiOperation({ summary: 'Crear nueva version de chat' })
  createChatVersion(
    @Param('id') id: string,
    @Body() dto: CreateChatVersionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.promptsService.createChatVersion(id, dto, user.id);
  }

  @Get(':id/chat-versions')
  @ApiOperation({ summary: 'Obtener historial de versiones de chat' })
  getChatVersions(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.promptsService.getChatVersions(id, user.id);
  }

  @Patch(':id/default-model')
  @ApiOperation({ summary: 'Guardar modelo por defecto del prompt' })
  updateDefaultModel(
    @Param('id') id: string,
    @Body('defaultModel') defaultModel: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.promptsService.updateDefaultModel(id, defaultModel, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un prompt' })
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.promptsService.remove(id, user.id);
  }
}
