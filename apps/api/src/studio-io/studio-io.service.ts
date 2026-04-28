import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ChatTemplate,
  ChatVersion,
  Project,
  Prompt,
  PromptTemplate,
  PromptVersion,
} from '../common/entities';
import { TemplatesService } from '../templates/templates.service';
import {
  ChatTemplateBodyDto,
  PromptTemplateBodyDto,
} from '../templates/dto/template-common.dto';
import { ImportStudioDto } from './dto/import-studio.dto';

const FORMAT_NAME = 'prompt-studio';
const FORMAT_VERSION = 1;

type JsonRecord = Record<string, unknown>;

@Injectable()
export class StudioIoService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    @InjectRepository(PromptVersion)
    private readonly promptVersionRepository: Repository<PromptVersion>,
    @InjectRepository(ChatVersion)
    private readonly chatVersionRepository: Repository<ChatVersion>,
    @InjectRepository(PromptTemplate)
    private readonly promptTemplateRepository: Repository<PromptTemplate>,
    @InjectRepository(ChatTemplate)
    private readonly chatTemplateRepository: Repository<ChatTemplate>,
    private readonly templatesService: TemplatesService,
  ) {}

  async exportPrompt(promptId: string, userId: string) {
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId },
      relations: ['project', 'versions', 'chatVersions'],
    });
    if (!prompt) throw new NotFoundException('Prompt no encontrado');
    if (prompt.project.userId !== userId)
      throw new ForbiddenException('No tienes acceso a este prompt');

    const promptVersions = [...(prompt.versions || [])]
      .sort((a, b) => a.versionNumber - b.versionNumber)
      .map((version) => ({
        sourceId: version.id,
        versionNumber: version.versionNumber,
        content: version.content,
        variables: version.variables || [],
        messages: version.messages || [],
        parentSourceId: version.parentVersionId,
        commitMessage: version.commitMessage,
        tag: version.tag,
        createdAt: version.createdAt,
      }));

    const chatVersions = [...(prompt.chatVersions || [])]
      .sort((a, b) => a.versionNumber - b.versionNumber)
      .map((version) => ({
        sourceId: version.id,
        versionNumber: version.versionNumber,
        systemMessage: version.systemMessage,
        userMessage: version.userMessage,
        assistantMessage: version.assistantMessage,
        messages: version.messages || [],
        variables: version.variables || [],
        parameters: version.parameters,
        provider: version.provider,
        model: version.model,
        parentSourceId: version.parentVersionId,
        commitMessage: version.commitMessage,
        tag: version.tag,
        metadata: version.metadata,
        createdAt: version.createdAt,
      }));

    const [promptTemplates, chatTemplates] = await Promise.all([
      this.promptTemplateRepository.find({
        where: { userId, isSystem: false },
        order: { updatedAt: 'DESC' },
      }),
      this.chatTemplateRepository.find({
        where: { userId, isSystem: false },
        order: { updatedAt: 'DESC' },
      }),
    ]);

    return {
      format: FORMAT_NAME,
      formatVersion: FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      metadata: {
        app: 'Prompt Studio',
        includesSensitiveData: false,
      },
      prompt: {
        name: prompt.name,
        defaultModel: prompt.defaultModel,
        currentVersionSourceId: prompt.currentVersionId,
        currentChatVersionSourceId: prompt.currentChatVersionId,
      },
      promptVersions,
      chatVersions,
      templates: {
        prompt: promptTemplates.map((template) => ({
          name: template.name,
          description: template.description,
          content: template.content,
          variables: template.variables || [],
          messages: template.messages || [],
          metadata: template.metadata,
        })),
        chat: chatTemplates.map((template) => ({
          name: template.name,
          description: template.description,
          systemMessage: template.systemMessage,
          userMessage: template.userMessage,
          assistantMessage: template.assistantMessage,
          messages: template.messages || [],
          variables: template.variables || [],
          parameters: template.parameters,
          provider: template.provider,
          model: template.model,
          metadata: template.metadata,
        })),
      },
    };
  }

  async import(dto: ImportStudioDto, userId: string) {
    const payload = this.assertObject(
      dto.data,
      'El payload de importacion debe ser un objeto',
    );
    this.validateHeader(payload);

    const templates = this.optionalObject(payload.templates);
    const promptTemplates = templates
      ? this.optionalArray(templates.prompt)
      : [];
    const chatTemplates = templates ? this.optionalArray(templates.chat) : [];
    const promptPayload = this.optionalObject(payload.prompt);
    const promptVersions = this.optionalArray(payload.promptVersions);
    const chatVersions = this.optionalArray(payload.chatVersions);

    if (
      !promptPayload &&
      promptTemplates.length === 0 &&
      chatTemplates.length === 0
    ) {
      throw new BadRequestException(
        'El archivo no contiene prompt ni templates importables',
      );
    }

    let importedPrompt: Prompt | null = null;
    const promptVersionIdMap = new Map<string, string>();
    const chatVersionIdMap = new Map<string, string>();

    if (promptPayload) {
      if (!dto.projectId) {
        throw new BadRequestException(
          'projectId es requerido para importar un prompt',
        );
      }

      const project = await this.projectRepository.findOne({
        where: { id: dto.projectId },
      });
      if (!project) throw new NotFoundException('Proyecto no encontrado');
      if (project.userId !== userId)
        throw new ForbiddenException('No tienes acceso a este proyecto');

      importedPrompt = await this.promptRepository.save(
        this.promptRepository.create({
          name: this.asString(promptPayload.name, 'Prompt importado'),
          projectId: project.id,
          defaultModel: this.optionalString(promptPayload.defaultModel),
        }),
      );

      const sortedPromptVersions = promptVersions
        .map((value) => this.assertObject(value, 'Version de prompt invalida'))
        .sort(
          (a, b) =>
            this.asNumber(a.versionNumber, 0) -
            this.asNumber(b.versionNumber, 0),
        );

      for (const [index, version] of sortedPromptVersions.entries()) {
        const sourceId =
          this.optionalString(version.sourceId) ||
          `prompt-version-${index + 1}`;
        const parentSourceId = this.optionalString(version.parentSourceId);
        const entity = this.promptVersionRepository.create();
        entity.promptId = importedPrompt.id;
        entity.versionNumber = this.asNumber(version.versionNumber, index + 1);
        entity.content = this.asString(version.content, '');
        entity.variables = this.optionalArray(
          version.variables,
        ) as PromptVersion['variables'];
        entity.messages = this.optionalArray(
          version.messages,
        ) as PromptVersion['messages'];
        entity.parentVersionId = parentSourceId
          ? promptVersionIdMap.get(parentSourceId) || null
          : null;
        entity.commitMessage = this.optionalString(version.commitMessage);
        entity.tag = this.optionalString(version.tag);
        entity.authorId = userId;
        const saved = await this.promptVersionRepository.save(entity);
        promptVersionIdMap.set(sourceId, saved.id);
      }

      const sortedChatVersions = chatVersions
        .map((value) => this.assertObject(value, 'Version de chat invalida'))
        .sort(
          (a, b) =>
            this.asNumber(a.versionNumber, 0) -
            this.asNumber(b.versionNumber, 0),
        );

      for (const [index, version] of sortedChatVersions.entries()) {
        const sourceId =
          this.optionalString(version.sourceId) || `chat-version-${index + 1}`;
        const parentSourceId = this.optionalString(version.parentSourceId);
        const entity = this.chatVersionRepository.create();
        entity.promptId = importedPrompt.id;
        entity.versionNumber = this.asNumber(version.versionNumber, index + 1);
        entity.systemMessage = this.optionalString(version.systemMessage);
        entity.userMessage = this.optionalString(version.userMessage);
        entity.assistantMessage = this.optionalString(version.assistantMessage);
        entity.messages = this.optionalArray(
          version.messages,
        ) as ChatVersion['messages'];
        entity.variables = this.optionalArray(
          version.variables,
        ) as ChatVersion['variables'];
        entity.parameters = this.optionalObject(
          version.parameters,
        ) as ChatVersion['parameters'];
        entity.provider = this.optionalString(version.provider);
        entity.model = this.optionalString(version.model);
        entity.parentVersionId = parentSourceId
          ? chatVersionIdMap.get(parentSourceId) || null
          : null;
        entity.commitMessage = this.optionalString(version.commitMessage);
        entity.tag = this.optionalString(version.tag);
        entity.metadata = this.optionalObject(version.metadata);
        entity.authorId = userId;
        const saved = await this.chatVersionRepository.save(entity);
        chatVersionIdMap.set(sourceId, saved.id);
      }

      const currentVersionSourceId = this.optionalString(
        promptPayload.currentVersionSourceId,
      );
      const currentChatVersionSourceId = this.optionalString(
        promptPayload.currentChatVersionSourceId,
      );
      await this.promptRepository.update(importedPrompt.id, {
        currentVersionId:
          (currentVersionSourceId &&
            promptVersionIdMap.get(currentVersionSourceId)) ||
          [...promptVersionIdMap.values()].at(-1) ||
          null,
        currentChatVersionId:
          (currentChatVersionSourceId &&
            chatVersionIdMap.get(currentChatVersionSourceId)) ||
          [...chatVersionIdMap.values()].at(-1) ||
          null,
      });
    }

    let importedPromptTemplates = 0;
    for (const template of promptTemplates) {
      await this.templatesService.importPromptTemplate(
        this.toPromptTemplateDto(
          this.assertObject(template, 'Template de prompt invalido'),
        ),
        userId,
      );
      importedPromptTemplates += 1;
    }

    let importedChatTemplates = 0;
    for (const template of chatTemplates) {
      await this.templatesService.importChatTemplate(
        this.toChatTemplateDto(
          this.assertObject(template, 'Template de chat invalido'),
        ),
        userId,
      );
      importedChatTemplates += 1;
    }

    return {
      importedPromptId: importedPrompt?.id || null,
      promptVersions: promptVersionIdMap.size,
      chatVersions: chatVersionIdMap.size,
      promptTemplates: importedPromptTemplates,
      chatTemplates: importedChatTemplates,
    };
  }

  private validateHeader(payload: JsonRecord) {
    if (payload.format !== FORMAT_NAME) {
      throw new BadRequestException('Formato no compatible');
    }
    if (payload.formatVersion !== FORMAT_VERSION) {
      throw new BadRequestException(
        `Version de formato no soportada: ${String(payload.formatVersion)}`,
      );
    }
  }

  private toPromptTemplateDto(template: JsonRecord): PromptTemplateBodyDto {
    return {
      name: this.asString(template.name, 'Template importado'),
      description: this.optionalString(template.description) ?? undefined,
      content: this.asString(template.content, ''),
      variables: this.optionalArray(
        template.variables,
      ) as PromptTemplateBodyDto['variables'],
      messages: this.optionalArray(
        template.messages,
      ) as PromptTemplateBodyDto['messages'],
      metadata: this.optionalObject(template.metadata) ?? undefined,
    };
  }

  private toChatTemplateDto(template: JsonRecord): ChatTemplateBodyDto {
    return {
      name: this.asString(template.name, 'Chat importado'),
      description: this.optionalString(template.description) ?? undefined,
      systemMessage: this.optionalString(template.systemMessage) ?? undefined,
      userMessage: this.optionalString(template.userMessage) ?? undefined,
      assistantMessage:
        this.optionalString(template.assistantMessage) ?? undefined,
      messages: this.optionalArray(
        template.messages,
      ) as ChatTemplateBodyDto['messages'],
      variables: this.optionalArray(
        template.variables,
      ) as ChatTemplateBodyDto['variables'],
      parameters: (this.optionalObject(template.parameters) ??
        undefined) as ChatTemplateBodyDto['parameters'],
      provider: this.optionalString(template.provider) ?? undefined,
      model: this.optionalString(template.model) ?? undefined,
      metadata: this.optionalObject(template.metadata) ?? undefined,
    };
  }

  private assertObject(value: unknown, message: string): JsonRecord {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException(message);
    }
    return value as JsonRecord;
  }

  private optionalObject(value: unknown): JsonRecord | null {
    if (value === undefined || value === null) return null;
    return this.assertObject(value, 'Se esperaba un objeto');
  }

  private optionalArray(value: unknown): unknown[] {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) {
      throw new BadRequestException('Se esperaba un arreglo');
    }
    return value;
  }

  private optionalString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  private asString(value: unknown, fallback: string): string {
    return typeof value === 'string' ? value : fallback;
  }

  private asNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value)
      ? value
      : fallback;
  }
}
