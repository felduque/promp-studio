import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Execution, PromptVersion, ProviderModel, ProviderType } from '../common/entities';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { ExecutePromptDto, PreviewExecuteDto } from './dto/execute-prompt.dto';
import { ModelOrchestratorService } from '../model-orchestrator/model-orchestrator.service';
import { ModelSyncService } from '../model-orchestrator/model-sync.service';

export interface CatalogModel {
  id: string;
  label: string;
  provider: string;
  pricing: { input: number; output: number };
  maxTokens: number;
  isFree: boolean;
}

export interface ProviderModels {
  provider: string;
  label: string;
  models: CatalogModel[];
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google (Gemini)',
  groq: 'Groq',
  openrouter: 'OpenRouter',
  mistral: 'Mistral',
};

@Injectable()
export class ExecutionsService {
  constructor(
    @InjectRepository(Execution)
    private readonly executionRepository: Repository<Execution>,
    @InjectRepository(PromptVersion)
    private readonly versionRepository: Repository<PromptVersion>,
    @InjectRepository(ProviderModel)
    private readonly providerModelRepository: Repository<ProviderModel>,
    private readonly apiKeysService: ApiKeysService,
    private readonly httpService: HttpService,
    private readonly modelOrchestrator: ModelOrchestratorService,
    private readonly modelSyncService: ModelSyncService,
  ) {}

  async getModelsForUser(userId: string): Promise<ProviderModels[]> {
    const userProviders = await this.apiKeysService.getUserProviders(userId);
    const result: ProviderModels[] = [];

    for (const provider of userProviders) {
      const models = await this.getProviderModels(provider as ProviderType);
      
      if (models.length > 0) {
        result.push({
          provider,
          label: PROVIDER_LABELS[provider] ?? provider,
          models,
        });
      }
    }

    return result;
  }

  private async getProviderModels(provider: ProviderType): Promise<CatalogModel[]> {
    // Get models from database (synced from providers)
    const dbModels = await this.providerModelRepository.find({
      where: { provider, isActive: true },
      order: { isFree: 'DESC', name: 'ASC' },
    });

    if (dbModels.length > 0) {
      return dbModels.map((m) => ({
        id: m.externalId,
        label: m.name,
        provider: m.provider,
        pricing: m.pricing,
        maxTokens: m.capabilities?.maxTokens || 4096,
        isFree: m.isFree,
      }));
    }

    // Fallback: try to sync OpenRouter models on-the-fly
    if (provider === 'openrouter') {
      try {
        await this.modelSyncService.syncAllProviders();
        const syncedModels = await this.providerModelRepository.find({
          where: { provider: 'openrouter', isActive: true },
          order: { isFree: 'DESC', name: 'ASC' },
        });
        return syncedModels.map((m) => ({
          id: m.externalId,
          label: m.name,
          provider: m.provider,
          pricing: m.pricing,
          maxTokens: m.capabilities?.maxTokens || 4096,
          isFree: m.isFree,
        }));
      } catch {
        return [];
      }
    }

    return [];
  }

  async execute(dto: ExecutePromptDto, userId: string) {
    const version = await this.versionRepository.findOne({
      where: { id: dto.promptVersionId },
      relations: ['prompt', 'prompt.project'],
    });

    if (!version) throw new NotFoundException('Versión no encontrada');
    if (version.prompt.project.userId !== userId) {
      throw new BadRequestException('No tienes acceso a este prompt');
    }

    // Find the model in database
    let model = await this.providerModelRepository.findOne({
      where: { externalId: dto.model },
    });

    // If not found, try to find by ID pattern
    if (!model) {
      const allModels = await this.providerModelRepository.find({
        where: { isActive: true },
      });
      const foundModel = allModels.find((m) => m.externalId === dto.model || m.id === dto.model);
      if (foundModel) {
        model = foundModel;
      }
    }

    if (!model) {
      throw new BadRequestException(`Modelo ${dto.model} no encontrado o no disponible`);
    }

    const provider = model.provider;

    // Get user's API key for this provider
    const apiKey = await this.apiKeysService.getDecryptedKey(userId, provider);
    if (!apiKey) {
      throw new BadRequestException(
        `No tienes una API key configurada para ${PROVIDER_LABELS[provider] ?? provider}. Ve a Settings → API Keys.`,
      );
    }

    // Resolve variables in content
    let resolvedContent = version.content || '';
    if (dto.variables) {
      for (const [key, value] of Object.entries(dto.variables)) {
        resolvedContent = resolvedContent.replaceAll(`{{${key}}}`, value);
      }
    }

    // Debug: log para ver qué está pasando
    console.log('[DEBUG] version.content:', JSON.stringify(version.content));
    console.log('[DEBUG] resolvedContent:', JSON.stringify(resolvedContent));
    console.log('[DEBUG] version.messages:', JSON.stringify(version.messages));

    // Build messages
    const messages = version.messages?.length
      ? version.messages.map((m) => {
          let content = m.content;
          if (dto.variables) {
            for (const [key, value] of Object.entries(dto.variables)) {
              content = content.replaceAll(`{{${key}}}`, value);
            }
          }
          return { role: m.role, content };
        })
      : [{ role: 'user', content: resolvedContent }];

    // Filter out empty messages and ensure content is string
    let validMessages = messages
      .filter(m => m.content && m.content.trim().length > 0)
      .map(m => ({ role: m.role, content: m.content.trim() }));

    // If all messages were empty, fall back to resolvedContent
    if (validMessages.length === 0 && resolvedContent.trim().length > 0) {
      validMessages = [{ role: 'user', content: resolvedContent.trim() }];
    }

    if (validMessages.length === 0) {
      throw new BadRequestException('El prompt está vacío. Asegúrate de que el contenido no esté vacío y las variables tengan valores.');
    }

    // Execute via orchestrator
    try {
      const result = await this.modelOrchestrator.execute({
        model,
        apiKey,
        messages: validMessages,
        temperature: dto.temperature ?? 0.7,
        maxTokens: dto.maxTokens ?? 1024,
        topP: dto.topP ?? 1,
      });

      const cost = model
        ? (result.tokensIn / 1_000_000) * model.pricing.input +
          (result.tokensOut / 1_000_000) * model.pricing.output
        : 0;

      const execution = this.executionRepository.create({
        promptVersionId: dto.promptVersionId,
        provider,
        model: dto.model,
        input: { variables: dto.variables || {}, messages: validMessages },
        output: result.output,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        latencyMs: result.latencyMs,
        cost,
        parameters: {
          temperature: dto.temperature ?? 0.7,
          maxTokens: dto.maxTokens ?? 1024,
          topP: dto.topP ?? 1,
        },
      });

      return await this.executionRepository.save(execution);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error.message;
      
      // Provide helpful message for OpenRouter privacy error
      if (errorMessage.includes('guardrail') || errorMessage.includes('data policy')) {
        throw new BadRequestException(
          `Error de privacidad en OpenRouter: Debes configurar tus preferencias de privacidad en https://openrouter.ai/settings/privacy`,
        );
      }
      
      throw new BadRequestException(
        `Error ejecutando prompt: ${errorMessage}`,
      );
    }
  }

  async executeBatch(executions: ExecutePromptDto[], userId: string) {
    const results = await Promise.allSettled(
      executions.map((dto) => this.execute(dto, userId)),
    );

    return results.map((result, index) => ({
      model: executions[index].model,
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : undefined,
      error:
        result.status === 'rejected' ? result.reason?.message : undefined,
    }));
  }

  async findByVersion(promptVersionId: string) {
    return this.executionRepository.find({
      where: { promptVersionId },
      order: { createdAt: 'DESC' },
    });
  }

  // Admin: Sync models from providers
  async syncModels(): Promise<{ provider: string; count: number }[]> {
    return this.modelSyncService.syncAllProviders();
  }

  // Preview execution without saving to database
  async executePreview(dto: PreviewExecuteDto, userId: string) {
    // Find the model in database
    let model = await this.providerModelRepository.findOne({
      where: { externalId: dto.model },
    });

    // If not found, try to find by ID pattern
    if (!model) {
      const allModels = await this.providerModelRepository.find({
        where: { isActive: true },
      });
      const foundModel = allModels.find((m) => m.externalId === dto.model || m.id === dto.model);
      if (foundModel) {
        model = foundModel;
      }
    }

    if (!model) {
      throw new BadRequestException(`Modelo ${dto.model} no encontrado o no disponible`);
    }

    const provider = model.provider;

    // Get user's API key for this provider
    const apiKey = await this.apiKeysService.getDecryptedKey(userId, provider);
    if (!apiKey) {
      throw new BadRequestException(
        `No tienes una API key configurada para ${PROVIDER_LABELS[provider] ?? provider}. Ve a Settings → API Keys.`,
      );
    }

    // Build messages from either content or messages array
    let messages: Array<{ role: string; content: string }> = [];
    
    if (dto.messages?.length) {
      // Chat mode: use messages array
      messages = dto.messages.map((m) => {
        let content = m.content;
        if (dto.variables) {
          for (const [key, value] of Object.entries(dto.variables)) {
            content = content.replaceAll(`{{${key}}}`, value);
          }
        }
        return { role: m.role, content };
      });
    } else if (dto.content) {
      // Template mode: use content as single user message
      let resolvedContent = dto.content;
      if (dto.variables) {
        for (const [key, value] of Object.entries(dto.variables)) {
          resolvedContent = resolvedContent.replaceAll(`{{${key}}}`, value);
        }
      }
      messages = [{ role: 'user', content: resolvedContent }];
    }

    // Filter out empty messages
    const validMessages = messages
      .filter(m => m.content && m.content.trim().length > 0)
      .map(m => ({ role: m.role, content: m.content.trim() }));

    if (validMessages.length === 0) {
      throw new BadRequestException('El prompt está vacío. Asegúrate de que el contenido no esté vacío y las variables tengan valores.');
    }

    // Execute via orchestrator (no persistence)
    try {
      const result = await this.modelOrchestrator.execute({
        model,
        apiKey,
        messages: validMessages,
        temperature: dto.temperature ?? 0.7,
        maxTokens: dto.maxTokens ?? 1024,
        topP: dto.topP ?? 1,
      });

      const cost = model
        ? (result.tokensIn / 1_000_000) * model.pricing.input +
          (result.tokensOut / 1_000_000) * model.pricing.output
        : 0;

      // Return preview result without saving
      return {
        output: result.output,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        latencyMs: result.latencyMs,
        cost,
        model: dto.model,
        provider,
        parameters: {
          temperature: dto.temperature ?? 0.7,
          maxTokens: dto.maxTokens ?? 1024,
          topP: dto.topP ?? 1,
        },
        messages: validMessages, // Include sent messages in response
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error.message;
      
      if (errorMessage.includes('guardrail') || errorMessage.includes('data policy')) {
        throw new BadRequestException(
          `Error de privacidad en OpenRouter: Debes configurar tus preferencias de privacidad en https://openrouter.ai/settings/privacy`,
        );
      }
      
      throw new BadRequestException(
        `Error ejecutando prompt: ${errorMessage}`,
      );
    }
  }

  // Get catalog for backward compatibility
  async getCatalog(): Promise<CatalogModel[]> {
    const allModels = await this.providerModelRepository.find({
      where: { isActive: true },
    });
    return allModels.map((m) => ({
      id: m.externalId,
      label: m.name,
      provider: m.provider,
      pricing: m.pricing,
      maxTokens: m.capabilities?.maxTokens || 4096,
      isFree: m.isFree,
    }));
  }
}
