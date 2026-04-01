import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ProviderModel, ProviderType } from '../common/entities';

@Injectable()
export class ModelSyncService {
  constructor(
    @InjectRepository(ProviderModel)
    private readonly providerModelRepository: Repository<ProviderModel>,
    private readonly httpService: HttpService,
  ) {}

  async syncAllProviders(): Promise<{ provider: string; count: number }[]> {
    const results: { provider: string; count: number }[] = [];

    // Sync OpenRouter (most comprehensive)
    try {
      const count = await this.syncOpenRouter();
      results.push({ provider: 'openrouter', count });
    } catch (error) {
      console.error('Failed to sync OpenRouter:', error);
      results.push({ provider: 'openrouter', count: 0 });
    }

    // Add other providers here as needed
    // For now, we'll rely on static models for other providers
    // or manual configuration via admin endpoints

    return results;
  }

  private async syncOpenRouter(): Promise<number> {
    const response = await firstValueFrom(
      this.httpService.get('https://openrouter.ai/api/v1/models', {
        timeout: 30000,
      }),
    );

    const models = response.data?.data || [];
    let syncedCount = 0;

    for (const model of models) {
      // Check if model already exists
      const existing = await this.providerModelRepository.findOne({
        where: {
          provider: 'openrouter' as ProviderType,
          externalId: model.id,
        },
      });

      const isFree = model.pricing?.prompt === 0 && model.pricing?.completion === 0;
      const inputPrice = parseFloat(model.pricing?.prompt) || 0;
      const outputPrice = parseFloat(model.pricing?.completion) || 0;

      const modelData = {
        provider: 'openrouter' as ProviderType,
        externalId: model.id,
        name: model.name || model.id.split('/').pop(),
        description: model.description || null,
        capabilities: {
          maxTokens: model.context_length || 4096,
          contextWindow: model.context_length || 4096,
          supportsVision: model.architecture?.modality?.includes('vision') || false,
          supportsTools: false, // OpenRouter doesn't expose this directly
          supportsJson: true,
        },
        pricing: {
          input: inputPrice,
          output: outputPrice,
          currency: 'USD',
        },
        isActive: true,
        isFree,
        rawData: JSON.stringify(model),
      };

      if (existing) {
        // Update existing model
        Object.assign(existing, modelData);
        await this.providerModelRepository.save(existing);
      } else {
        // Create new model
        const newModel = this.providerModelRepository.create(modelData);
        await this.providerModelRepository.save(newModel);
        syncedCount++;
      }
    }

    return syncedCount;
  }

  async getActiveModels(): Promise<ProviderModel[]> {
    return this.providerModelRepository.find({
      where: { isActive: true },
      order: {
        provider: 'ASC',
        isFree: 'DESC',
        name: 'ASC',
      },
    });
  }

  async getModelsByProvider(provider: ProviderType): Promise<ProviderModel[]> {
    return this.providerModelRepository.find({
      where: { provider, isActive: true },
      order: {
        isFree: 'DESC',
        name: 'ASC',
      },
    });
  }
}
