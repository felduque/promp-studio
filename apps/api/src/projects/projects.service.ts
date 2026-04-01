import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../common/entities';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async findAll(userId: string) {
    const projects = await this.projectRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      relations: ['prompts'],
    });

    return projects.map((project) => ({
      ...project,
      promptCount: project.prompts?.length || 0,
      prompts: undefined,
    }));
  }

  async findOne(id: string, userId: string) {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['prompts', 'prompts.versions'],
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }

    return project;
  }

  async create(dto: CreateProjectDto, userId: string) {
    const project = this.projectRepository.create({
      ...dto,
      userId,
    });
    return this.projectRepository.save(project);
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    const project = await this.findOne(id, userId);
    Object.assign(project, dto);
    return this.projectRepository.save(project);
  }

  async remove(id: string, userId: string) {
    const project = await this.findOne(id, userId);
    await this.projectRepository.remove(project);
    return { message: 'Proyecto eliminado' };
  }
}
