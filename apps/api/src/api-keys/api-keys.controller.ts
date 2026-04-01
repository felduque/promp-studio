import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('API Keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'Listar API keys del usuario' })
  findAll(@CurrentUser() user: { id: string }) {
    return this.apiKeysService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Agregar una API key' })
  create(
    @Body() dto: CreateApiKeyDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.apiKeysService.create(dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una API key' })
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.apiKeysService.remove(id, user.id);
  }
}
