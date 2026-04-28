import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ChatTemplate, PromptTemplate } from '../common/entities';
import {
  ChatTemplateBodyDto,
  PromptTemplateBodyDto,
} from './dto/template-common.dto';

const SYSTEM_PROMPT_TEMPLATES: PromptTemplateBodyDto[] = [
  {
    name: 'Chain of Thought',
    description:
      'Estructura de razonamiento paso a paso para problemas complejos.',
    content:
      'You are a helpful assistant. Think step by step.\n\nProblem: {{problem}}\n\n1. Analyze the core question.\n2. Break it into sub-problems.\n3. Solve each sub-problem.\n4. Synthesize the final answer.',
    variables: [{ name: 'problem', type: 'string', defaultValue: '' }],
    metadata: { seedKey: 'system.prompt.chain_of_thought' },
  },
  {
    name: 'Few-Shot Processor',
    description: 'Plantilla para transformar entradas usando ejemplos.',
    content:
      'Given the following examples, process the new input accordingly.\n\nExample 1:\nInput: {{example_input}}\nOutput: {{example_output}}\n\nNow process:\nInput: {{input}}\nOutput:',
    variables: [
      { name: 'example_input', type: 'string', defaultValue: '' },
      { name: 'example_output', type: 'string', defaultValue: '' },
      { name: 'input', type: 'string', defaultValue: '' },
    ],
    metadata: { seedKey: 'system.prompt.few_shot' },
  },
  {
    name: 'Extractor JSON',
    description: 'Extrae campos estructurados desde texto libre.',
    content:
      'Extract the following fields from the text below:\n\nFields:\n{{fields}}\n\nText:\n"""\n{{text}}\n"""\n\nReturn only a valid JSON object.',
    variables: [
      { name: 'fields', type: 'string', defaultValue: '' },
      { name: 'text', type: 'string', defaultValue: '' },
    ],
    metadata: { seedKey: 'system.prompt.extractor_json' },
  },
];

const SYSTEM_CHAT_TEMPLATES: ChatTemplateBodyDto[] = [
  {
    name: 'Customer Support',
    description: 'Chat de soporte con tono claro y resolutivo.',
    systemMessage:
      'You are a customer support agent for {{product}}. Be concise, empathetic, and ask for missing details only when needed.',
    userMessage: 'Customer issue:\n{{issue}}',
    assistantMessage:
      'I can help with that. First, I will restate the issue and propose the next step.',
    variables: [
      { name: 'product', type: 'string', defaultValue: '' },
      { name: 'issue', type: 'string', defaultValue: '' },
    ],
    parameters: { temperature: 0.4, maxTokens: 900, topP: 1 },
    metadata: { seedKey: 'system.chat.customer_support' },
  },
  {
    name: 'Code Review',
    description: 'Chat para revisar cambios de codigo con foco en riesgos.',
    systemMessage:
      'You are a senior software reviewer. Prioritize bugs, regressions, security issues, and missing tests.',
    userMessage: 'Review this change:\n{{diff}}',
    assistantMessage:
      'I will review the diff by severity and cite concrete files or lines when possible.',
    variables: [{ name: 'diff', type: 'string', defaultValue: '' }],
    parameters: { temperature: 0.2, maxTokens: 1200, topP: 1 },
    metadata: { seedKey: 'system.chat.code_review' },
  },
];

@Injectable()
export class TemplatesService implements OnModuleInit {
  constructor(
    @InjectRepository(PromptTemplate)
    private readonly promptTemplateRepository: Repository<PromptTemplate>,
    @InjectRepository(ChatTemplate)
    private readonly chatTemplateRepository: Repository<ChatTemplate>,
  ) {}

  async onModuleInit() {
    await this.seedSystemTemplates();
  }

  async listPromptTemplates(userId: string) {
    const templates = await this.promptTemplateRepository.find({
      where: [{ isSystem: true, userId: IsNull() }, { userId }],
      order: { isSystem: 'DESC', updatedAt: 'DESC' },
    });

    return templates.map((template) => this.toPromptTemplateResponse(template));
  }

  async listChatTemplates(userId: string) {
    const templates = await this.chatTemplateRepository.find({
      where: [{ isSystem: true, userId: IsNull() }, { userId }],
      order: { isSystem: 'DESC', updatedAt: 'DESC' },
    });

    return templates.map((template) => this.toChatTemplateResponse(template));
  }

  async createPromptTemplate(dto: PromptTemplateBodyDto, userId: string) {
    if (!dto.content.trim()) {
      throw new BadRequestException(
        'El contenido del template no puede estar vacio',
      );
    }

    const template = this.promptTemplateRepository.create({
      userId,
      isSystem: false,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      content: dto.content,
      variables: dto.variables || [],
      messages: dto.messages || [],
      metadata: dto.metadata || null,
    });

    return this.toPromptTemplateResponse(
      await this.promptTemplateRepository.save(template),
    );
  }

  async createChatTemplate(dto: ChatTemplateBodyDto, userId: string) {
    const messages = dto.messages || [];
    const hasStructuredContent = Boolean(
      dto.systemMessage?.trim() ||
      dto.userMessage?.trim() ||
      dto.assistantMessage?.trim(),
    );

    if (!hasStructuredContent && messages.length === 0) {
      throw new BadRequestException(
        'El template de chat necesita al menos un mensaje',
      );
    }

    const template = this.chatTemplateRepository.create({
      userId,
      isSystem: false,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      systemMessage: dto.systemMessage || null,
      userMessage: dto.userMessage || null,
      assistantMessage: dto.assistantMessage || null,
      messages,
      variables: dto.variables || [],
      parameters: dto.parameters || null,
      provider: dto.provider || null,
      model: dto.model || null,
      metadata: dto.metadata || null,
    });

    return this.toChatTemplateResponse(
      await this.chatTemplateRepository.save(template),
    );
  }

  async importPromptTemplate(dto: PromptTemplateBodyDto, userId: string) {
    return this.createPromptTemplate(dto, userId);
  }

  async importChatTemplate(dto: ChatTemplateBodyDto, userId: string) {
    return this.createChatTemplate(dto, userId);
  }

  private async seedSystemTemplates() {
    for (const template of SYSTEM_PROMPT_TEMPLATES) {
      await this.upsertSystemPromptTemplate(template);
    }
    for (const template of SYSTEM_CHAT_TEMPLATES) {
      await this.upsertSystemChatTemplate(template);
    }
  }

  private async upsertSystemPromptTemplate(dto: PromptTemplateBodyDto) {
    const seedKey =
      typeof dto.metadata?.seedKey === 'string'
        ? dto.metadata.seedKey
        : dto.name;
    const existing = await this.promptTemplateRepository
      .createQueryBuilder('template')
      .where('template.isSystem = true')
      .andWhere("template.metadata ->> 'seedKey' = :seedKey", { seedKey })
      .getOne();

    const template =
      existing ||
      this.promptTemplateRepository.create({ userId: null, isSystem: true });
    Object.assign(template, {
      name: dto.name,
      description: dto.description || null,
      content: dto.content,
      variables: dto.variables || [],
      messages: dto.messages || [],
      metadata: dto.metadata || { seedKey },
    });
    await this.promptTemplateRepository.save(template);
  }

  private async upsertSystemChatTemplate(dto: ChatTemplateBodyDto) {
    const seedKey =
      typeof dto.metadata?.seedKey === 'string'
        ? dto.metadata.seedKey
        : dto.name;
    const existing = await this.chatTemplateRepository
      .createQueryBuilder('template')
      .where('template.isSystem = true')
      .andWhere("template.metadata ->> 'seedKey' = :seedKey", { seedKey })
      .getOne();

    const template =
      existing ||
      this.chatTemplateRepository.create({ userId: null, isSystem: true });
    Object.assign(template, {
      name: dto.name,
      description: dto.description || null,
      systemMessage: dto.systemMessage || null,
      userMessage: dto.userMessage || null,
      assistantMessage: dto.assistantMessage || null,
      messages: dto.messages || [],
      variables: dto.variables || [],
      parameters: dto.parameters || null,
      provider: dto.provider || null,
      model: dto.model || null,
      metadata: dto.metadata || { seedKey },
    });
    await this.chatTemplateRepository.save(template);
  }

  private toPromptTemplateResponse(template: PromptTemplate) {
    return {
      id: template.id,
      type: 'prompt' as const,
      owner: template.isSystem ? ('system' as const) : ('user' as const),
      isSystem: template.isSystem,
      name: template.name,
      description: template.description,
      content: template.content,
      variables: template.variables || [],
      messages: template.messages || [],
      metadata: template.metadata,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private toChatTemplateResponse(template: ChatTemplate) {
    return {
      id: template.id,
      type: 'chat' as const,
      owner: template.isSystem ? ('system' as const) : ('user' as const),
      isSystem: template.isSystem,
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
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
