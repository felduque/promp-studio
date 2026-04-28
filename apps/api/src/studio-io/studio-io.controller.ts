import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImportStudioDto } from './dto/import-studio.dto';
import { StudioIoService } from './studio-io.service';

@ApiTags('Studio IO')
@Controller('studio-io')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudioIoController {
  constructor(private readonly studioIoService: StudioIoService) {}

  @Get('prompts/:id/export')
  @ApiOperation({ summary: 'Exportar prompt en formato Prompt Studio' })
  exportPrompt(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.studioIoService.exportPrompt(id, user.id);
  }

  @Post('import')
  @ApiOperation({ summary: 'Importar formato Prompt Studio' })
  import(@Body() dto: ImportStudioDto, @CurrentUser() user: { id: string }) {
    return this.studioIoService.import(dto, user.id);
  }
}
