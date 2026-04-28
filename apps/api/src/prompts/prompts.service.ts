import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ChatVersion,
  Prompt,
  PromptVersion,
  Project,
  User,
} from '../common/entities';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { CreateChatVersionDto } from './dto/create-chat-version.dto';

@Injectable()
export class PromptsService {
  constructor(
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    @InjectRepository(PromptVersion)
    private readonly versionRepository: Repository<PromptVersion>,
    @InjectRepository(ChatVersion)
    private readonly chatVersionRepository: Repository<ChatVersion>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async findAllByProject(projectId: string, userId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    if (project.userId !== userId)
      throw new ForbiddenException('No tienes acceso a este proyecto');

    const prompts = await this.promptRepository.find({
      where: { projectId },
      order: { updatedAt: 'DESC' },
      relations: ['versions'],
    });

    return prompts.map((prompt) => this.toPromptResponse(prompt));
  }

  async findOne(id: string, userId: string) {
    const prompt = await this.promptRepository.findOne({
      where: { id },
      relations: [
        'project',
        'versions',
        'versions.author',
        'chatVersions',
        'chatVersions.author',
      ],
    });
    if (!prompt) throw new NotFoundException('Prompt no encontrado');
    if (prompt.project.userId !== userId)
      throw new ForbiddenException('No tienes acceso a este prompt');

    return this.toPromptResponse(prompt);
  }

  private async findPromptEntity(id: string, userId: string) {
    const prompt = await this.promptRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!prompt) throw new NotFoundException('Prompt no encontrado');
    if (prompt.project.userId !== userId)
      throw new ForbiddenException('No tienes acceso a este prompt');

    return prompt;
  }

  async create(dto: CreatePromptDto, userId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: dto.projectId },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    if (project.userId !== userId)
      throw new ForbiddenException('No tienes acceso a este proyecto');

    const prompt = this.promptRepository.create({
      name: dto.name,
      projectId: dto.projectId,
    });
    return this.toPromptResponse(await this.promptRepository.save(prompt));
  }

  async createVersion(promptId: string, dto: CreateVersionDto, userId: string) {
    const prompt = await this.findPromptEntity(promptId, userId);

    const lastVersion = await this.versionRepository.findOne({
      where: { promptId },
      order: { versionNumber: 'DESC' },
    });
    const nextVersion = (lastVersion?.versionNumber || 0) + 1;

    const version = this.versionRepository.create({
      promptId,
      versionNumber: nextVersion,
      content: dto.content,
      variables: dto.variables || [],
      messages: dto.messages || [],
      commitMessage: dto.commitMessage,
      parentVersionId: dto.parentVersionId,
      tag: dto.tag,
      authorId: userId,
    });
    const savedVersion = await this.versionRepository.save(version);

    await this.promptRepository.update(prompt.id, {
      currentVersionId: savedVersion.id,
    });

    return this.toPromptVersionResponse(savedVersion);
  }

  async getVersions(promptId: string, userId: string) {
    await this.findPromptEntity(promptId, userId);
    const versions = await this.versionRepository.find({
      where: { promptId },
      order: { versionNumber: 'DESC' },
      relations: ['author'],
    });
    return versions.map((version) => this.toPromptVersionResponse(version));
  }

  async getVersion(versionId: string, userId: string) {
    const version = await this.versionRepository.findOne({
      where: { id: versionId },
      relations: ['prompt', 'prompt.project', 'author'],
    });
    if (!version) throw new NotFoundException('Versión no encontrada');
    if (version.prompt.project.userId !== userId)
      throw new ForbiddenException('No tienes acceso');

    return this.toPromptVersionResponse(version);
  }

  async createChatVersion(
    promptId: string,
    dto: CreateChatVersionDto,
    userId: string,
  ) {
    const prompt = await this.findPromptEntity(promptId, userId);
    const messages = dto.messages || [];
    const hasStructuredContent = Boolean(
      dto.systemMessage?.trim() ||
      dto.userMessage?.trim() ||
      dto.assistantMessage?.trim(),
    );

    if (!hasStructuredContent && messages.length === 0) {
      throw new BadRequestException('El chat necesita al menos un mensaje');
    }

    const lastVersion = await this.chatVersionRepository.findOne({
      where: { promptId },
      order: { versionNumber: 'DESC' },
    });
    const nextVersion = (lastVersion?.versionNumber || 0) + 1;

    const version = this.chatVersionRepository.create({
      promptId,
      versionNumber: nextVersion,
      systemMessage: dto.systemMessage || null,
      userMessage: dto.userMessage || null,
      assistantMessage: dto.assistantMessage || null,
      messages,
      variables: dto.variables || [],
      parameters: dto.parameters || null,
      provider: dto.provider || null,
      model: dto.model || null,
      parentVersionId: dto.parentVersionId || null,
      commitMessage: dto.commitMessage || null,
      tag: dto.tag || null,
      metadata: dto.metadata || null,
      authorId: userId,
    });
    const savedVersion = await this.chatVersionRepository.save(version);

    await this.promptRepository.update(prompt.id, {
      currentChatVersionId: savedVersion.id,
    });

    return this.toChatVersionResponse(savedVersion);
  }

  async getChatVersions(promptId: string, userId: string) {
    await this.findPromptEntity(promptId, userId);
    const versions = await this.chatVersionRepository.find({
      where: { promptId },
      order: { versionNumber: 'DESC' },
      relations: ['author'],
    });
    return versions.map((version) => this.toChatVersionResponse(version));
  }

  async getChatVersion(versionId: string, userId: string) {
    const version = await this.chatVersionRepository.findOne({
      where: { id: versionId },
      relations: ['prompt', 'prompt.project', 'author'],
    });
    if (!version) throw new NotFoundException('Version de chat no encontrada');
    if (version.prompt.project.userId !== userId)
      throw new ForbiddenException('No tienes acceso');

    return this.toChatVersionResponse(version);
  }

  async updateDefaultModel(id: string, defaultModel: string, userId: string) {
    await this.findPromptEntity(id, userId);
    await this.promptRepository.update(id, { defaultModel });
    return { defaultModel };
  }

  async remove(id: string, userId: string) {
    const prompt = await this.findPromptEntity(id, userId);
    await this.promptRepository.remove(prompt);
    return { message: 'Prompt eliminado' };
  }

  private toPromptResponse(prompt: Prompt) {
    return {
      id: prompt.id,
      name: prompt.name,
      projectId: prompt.projectId,
      currentVersionId: prompt.currentVersionId,
      currentChatVersionId: prompt.currentChatVersionId,
      defaultModel: prompt.defaultModel,
      versions: (prompt.versions || [])
        .map((version) => this.toPromptVersionResponse(version))
        .sort((a, b) => b.versionNumber - a.versionNumber),
      chatVersions: (prompt.chatVersions || [])
        .map((version) => this.toChatVersionResponse(version))
        .sort((a, b) => b.versionNumber - a.versionNumber),
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    };
  }

  private toPromptVersionResponse(version: PromptVersion) {
    return {
      id: version.id,
      promptId: version.promptId,
      versionNumber: version.versionNumber,
      content: version.content,
      variables: version.variables || [],
      messages: version.messages || [],
      parentVersionId: version.parentVersionId,
      commitMessage: version.commitMessage,
      author: this.toAuthorResponse(version.author),
      authorId: version.authorId,
      tag: version.tag,
      createdAt: version.createdAt,
    };
  }

  private toChatVersionResponse(version: ChatVersion) {
    return {
      id: version.id,
      promptId: version.promptId,
      versionNumber: version.versionNumber,
      systemMessage: version.systemMessage,
      userMessage: version.userMessage,
      assistantMessage: version.assistantMessage,
      messages: version.messages || [],
      variables: version.variables || [],
      parameters: version.parameters,
      provider: version.provider,
      model: version.model,
      parentVersionId: version.parentVersionId,
      commitMessage: version.commitMessage,
      author: this.toAuthorResponse(version.author),
      authorId: version.authorId,
      tag: version.tag,
      metadata: version.metadata,
      createdAt: version.createdAt,
    };
  }

  private toAuthorResponse(author?: User | null) {
    if (!author) return null;
    return {
      id: author.id,
      name: author.name,
      avatar: author.avatar,
    };
  }
}
