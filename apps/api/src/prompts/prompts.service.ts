import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prompt, PromptVersion, Project } from '../common/entities';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { CreateVersionDto } from './dto/create-version.dto';

@Injectable()
export class PromptsService {
  constructor(
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    @InjectRepository(PromptVersion)
    private readonly versionRepository: Repository<PromptVersion>,
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

    return this.promptRepository.find({
      where: { projectId },
      order: { updatedAt: 'DESC' },
      relations: ['versions'],
    });
  }

  async findOne(id: string, userId: string) {
    const prompt = await this.promptRepository.findOne({
      where: { id },
      relations: ['project', 'versions', 'versions.author'],
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
    return this.promptRepository.save(prompt);
  }

  async createVersion(
    promptId: string,
    dto: CreateVersionDto,
    userId: string,
  ) {
    const prompt = await this.findOne(promptId, userId);

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

    return savedVersion;
  }

  async getVersions(promptId: string, userId: string) {
    await this.findOne(promptId, userId);
    return this.versionRepository.find({
      where: { promptId },
      order: { versionNumber: 'DESC' },
      relations: ['author'],
    });
  }

  async getVersion(versionId: string, userId: string) {
    const version = await this.versionRepository.findOne({
      where: { id: versionId },
      relations: ['prompt', 'prompt.project', 'author'],
    });
    if (!version) throw new NotFoundException('Versión no encontrada');
    if (version.prompt.project.userId !== userId)
      throw new ForbiddenException('No tienes acceso');

    return version;
  }

  async updateDefaultModel(id: string, defaultModel: string, userId: string) {
    await this.findOne(id, userId);
    await this.promptRepository.update(id, { defaultModel });
    return { defaultModel };
  }

  async remove(id: string, userId: string) {
    const prompt = await this.findOne(id, userId);
    await this.promptRepository.remove(prompt);
    return { message: 'Prompt eliminado' };
  }
}
