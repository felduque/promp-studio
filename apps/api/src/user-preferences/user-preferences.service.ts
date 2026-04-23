import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference } from '../common/entities';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserPreference)
    private readonly preferencesRepository: Repository<UserPreference>,
  ) {}

  async getPreferences(userId: string): Promise<UserPreference> {
    let prefs = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!prefs) {
      prefs = this.preferencesRepository.create({ userId });
      prefs = await this.preferencesRepository.save(prefs);
    }

    return prefs;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<UserPreference> {
    let prefs = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!prefs) {
      prefs = this.preferencesRepository.create({ userId });
    }

    if (dto.defaultTemperature !== undefined) prefs.defaultTemperature = dto.defaultTemperature;
    if (dto.defaultMaxTokens !== undefined) prefs.defaultMaxTokens = dto.defaultMaxTokens;
    if (dto.defaultTopP !== undefined) prefs.defaultTopP = dto.defaultTopP;
    if (dto.theme !== undefined) prefs.theme = dto.theme;
    if (dto.editorFontSize !== undefined) prefs.editorFontSize = dto.editorFontSize;

    return this.preferencesRepository.save(prefs);
  }
}
