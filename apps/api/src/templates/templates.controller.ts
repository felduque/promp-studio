import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ChatTemplateBodyDto,
  PromptTemplateBodyDto,
} from './dto/template-common.dto';
import { TemplatesService } from './templates.service';

@ApiTags('Templates')
@Controller('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get('prompt')
  @ApiOperation({
    summary: 'Listar templates de prompt del sistema y del usuario',
  })
  listPromptTemplates(@CurrentUser() user: { id: string }) {
    return this.templatesService.listPromptTemplates(user.id);
  }

  @Post('prompt')
  @ApiOperation({ summary: 'Guardar un template propio de prompt' })
  createPromptTemplate(
    @Body() dto: PromptTemplateBodyDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.templatesService.createPromptTemplate(dto, user.id);
  }

  @Get('chat')
  @ApiOperation({
    summary: 'Listar templates de chat del sistema y del usuario',
  })
  listChatTemplates(@CurrentUser() user: { id: string }) {
    return this.templatesService.listChatTemplates(user.id);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Guardar un template propio de chat' })
  createChatTemplate(
    @Body() dto: ChatTemplateBodyDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.templatesService.createChatTemplate(dto, user.id);
  }
}
