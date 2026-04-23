import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Resumen general de analytics' })
  getOverview(@CurrentUser() user: { id: string }) {
    return this.analyticsService.getOverview(user.id);
  }

  @Get('by-model')
  @ApiOperation({ summary: 'Stats agrupadas por modelo y source' })
  getByModel(@CurrentUser() user: { id: string }) {
    return this.analyticsService.getByModel(user.id);
  }

  @Get('by-prompt')
  @ApiOperation({ summary: 'Stats agrupadas por prompt y source' })
  getByPrompt(@CurrentUser() user: { id: string }) {
    return this.analyticsService.getByPrompt(user.id);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Timeline con granularidad' })
  getTimeline(
    @CurrentUser() user: { id: string },
    @Query('granularity') granularity?: 'day' | 'week' | 'month',
  ) {
    return this.analyticsService.getTimeline(user.id, granularity || 'day');
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Leaderboard por categoría' })
  getLeaderboard(
    @CurrentUser() user: { id: string },
    @Query('category') category?: 'quality' | 'speed' | 'cost',
  ) {
    return this.analyticsService.getLeaderboard(user.id, category || 'quality');
  }
}
