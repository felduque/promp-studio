import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserPreferencesService } from './user-preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('User Preferences')
@Controller('preferences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserPreferencesController {
  constructor(private readonly preferencesService: UserPreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener preferencias del usuario' })
  getPreferences(@CurrentUser() user: { id: string }) {
    return this.preferencesService.getPreferences(user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Actualizar preferencias del usuario' })
  updatePreferences(
    @Body() dto: UpdatePreferencesDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.preferencesService.updatePreferences(user.id, dto);
  }
}
