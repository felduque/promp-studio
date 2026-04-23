import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Execution, PromptVersion, ProviderModel, ProviderType, ExecutionSource, ExecutionGroup } from '../common/entities';
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
    @InjectRepository(ExecutionGroup)
    private readonly groupRepository: Repository<ExecutionGroup>,
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
        userId,
        source: (dto.source || 'prompt') as ExecutionSource,
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

  /**
   * Validate that models exist in the catalog and are active.
   * Returns { valid, invalid } arrays.
   */
  async validateModels(modelIds: string[]): Promise<{ valid: string[]; invalid: string[] }> {
    const activeModels = await this.providerModelRepository.find({
      where: { isActive: true },
      select: ['externalId'],
    });
    const activeSet = new Set(activeModels.map((m) => m.externalId));
    const valid: string[] = [];
    const invalid: string[] = [];
    for (const id of modelIds) {
      if (activeSet.has(id)) valid.push(id);
      else invalid.push(id);
    }
    return { valid, invalid };
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

  /**
   * Stream execution: validates models, creates a group, runs N models in parallel,
   * yields each result as it arrives. Used with SSE on the controller side.
   */
  async *executeStream(
    dto: {
      models: string[];
      promptVersionId?: string;
      source?: 'prompt' | 'chat';
      content?: string;
      messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
      variables?: Record<string, string>;
      temperature?: number;
      maxTokens?: number;
    },
    userId: string,
  ): AsyncGenerator<{ model: string; status: string; data?: any; error?: string; groupId?: string; invalidModels?: string[] }> {
    const { models, ...params } = dto;

    // 1. Validate models exist in catalog
    const { valid, invalid } = await this.validateModels(models);

    if (invalid.length > 0) {
      yield { model: '', status: 'validation', invalidModels: invalid };
    }

    if (valid.length === 0) {
      yield { model: '', status: 'error', error: 'Ninguno de los modelos seleccionados está disponible.' };
      return;
    }

    // 2. Create execution group
    const group = this.groupRepository.create({
      userId,
      promptVersionId: params.promptVersionId || null,
      models: valid,
      parameters: {
        temperature: params.temperature,
        maxTokens: params.maxTokens,
      },
      input: {
        content: params.content,
        variables: params.variables,
        source: params.source,
      },
    });
    const savedGroup = await this.groupRepository.save(group);

    // 3. Execute each valid model
    const pending = valid.map((model) => {
      const isPreview = !params.promptVersionId;

      const promise = isPreview
        ? this.executePreview(
            {
              model,
              source: params.source,
              content: params.content,
              messages: params.messages,
              variables: params.variables,
              temperature: params.temperature,
              maxTokens: params.maxTokens,
            },
            userId,
          )
        : this.execute(
            {
              promptVersionId: params.promptVersionId!,
              model,
              source: params.source,
              variables: params.variables,
              temperature: params.temperature,
              maxTokens: params.maxTokens,
            },
            userId,
          );

      return promise
        .then(async (data) => {
          // Assign groupId to the execution
          if (data?.id) {
            await this.executionRepository.update(data.id, { groupId: savedGroup.id });
          }
          return { model, status: 'fulfilled' as const, data, groupId: savedGroup.id };
        })
        .catch((err) => ({
          model,
          status: 'rejected' as const,
          error: err?.response?.message || err?.message || 'Unknown error',
          groupId: savedGroup.id,
        }));
    });

    // 4. Yield results as they arrive using Promise.race
    const remaining = [...pending];
    while (remaining.length > 0) {
      const result = await Promise.race(
        remaining.map((p, i) => p.then((r) => ({ result: r, index: i }))),
      );
      yield result.result;
      remaining.splice(result.index, 1);
    }
  }

  /**
   * Get execution groups for a user with their executions
   */
  async getGroups(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.groupRepository.findAndCount({
      where: { userId },
      relations: ['executions', 'promptVersion', 'promptVersion.prompt', 'promptVersion.prompt.project'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /**
   * Get a single execution group with full execution details
   */
  async getGroup(groupId: string, userId: string) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId, userId },
      relations: ['executions', 'promptVersion', 'promptVersion.prompt', 'promptVersion.prompt.project'],
    });
    if (!group) throw new NotFoundException('Grupo de ejecución no encontrado');
    return group;
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

    // Execute via orchestrator and persist for history
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

      // Save to database for history (promptVersionId is null for preview)
      const execution = this.executionRepository.create({
        promptVersionId: null,
        userId,
        source: (dto.source || 'chat') as ExecutionSource,
        provider,
        model: dto.model,
        input: { content: dto.content, messages: validMessages, variables: dto.variables || {} },
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

      const saved = await this.executionRepository.save(execution);

      return {
        id: saved.id,
        output: result.output,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        latencyMs: result.latencyMs,
        cost,
        model: dto.model,
        provider,
        source: saved.source,
        parameters: {
          temperature: dto.temperature ?? 0.7,
          maxTokens: dto.maxTokens ?? 1024,
          topP: dto.topP ?? 1,
        },
        messages: validMessages,
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

  // List executions with filters and pagination
  async findAll(
    userId: string,
    filters: {
      source?: 'prompt' | 'chat';
      model?: string;
      provider?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);

    const qb = this.executionRepository
      .createQueryBuilder('e')
      .where('e.userId = :userId', { userId })
      .leftJoinAndSelect('e.promptVersion', 'pv')
      .leftJoin('pv.prompt', 'p')
      .addSelect(['p.id', 'p.name']);

    if (filters.source) {
      qb.andWhere('e.source = :source', { source: filters.source });
    }
    if (filters.model) {
      qb.andWhere('e.model = :model', { model: filters.model });
    }
    if (filters.provider) {
      qb.andWhere('e.provider = :provider', { provider: filters.provider });
    }

    const [items, total] = await qb
      .orderBy('e.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
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
