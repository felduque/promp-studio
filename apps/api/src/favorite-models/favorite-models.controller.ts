import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FavoriteModelsService } from './favorite-models.service';

@ApiTags('Favorite Models')
@Controller('favorite-models')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoriteModelsController {
  constructor(private readonly service: FavoriteModelsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar modelos favoritos del usuario' })
  findAll(@CurrentUser() user: { id: string }) {
    return this.service.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Agregar modelo a favoritos' })
  add(
    @CurrentUser() user: { id: string },
    @Body() body: { modelExternalId: string; provider?: string },
  ) {
    return this.service.add(user.id, body.modelExternalId, body.provider);
  }

  @Delete(':modelExternalId')
  @ApiOperation({ summary: 'Quitar modelo de favoritos' })
  remove(
    @CurrentUser() user: { id: string },
    @Param('modelExternalId') modelExternalId: string,
  ) {
    return this.service.remove(user.id, modelExternalId);
  }
}
