import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation, Execution } from '../common/entities';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluationRepository: Repository<Evaluation>,
    @InjectRepository(Execution)
    private readonly executionRepository: Repository<Execution>,
  ) {}

  async createOrUpdate(dto: CreateEvaluationDto, userId: string) {
    const execution = await this.executionRepository.findOne({
      where: { id: dto.executionId },
    });
    if (!execution) throw new NotFoundException('Ejecución no encontrada');

    let evaluation = await this.evaluationRepository.findOne({
      where: { executionId: dto.executionId, userId },
    });

    if (evaluation) {
      if (dto.rating !== undefined) evaluation.rating = dto.rating;
      if (dto.thumbsUp !== undefined) evaluation.thumbsUp = dto.thumbsUp;
      if (dto.notes !== undefined) evaluation.notes = dto.notes;
      return this.evaluationRepository.save(evaluation);
    }

    evaluation = this.evaluationRepository.create({
      executionId: dto.executionId,
      userId,
      rating: dto.rating ?? null,
      thumbsUp: dto.thumbsUp ?? null,
      notes: dto.notes ?? null,
    });
    return this.evaluationRepository.save(evaluation);
  }

  async findByExecution(executionId: string) {
    return this.evaluationRepository.findOne({
      where: { executionId },
    });
  }

  async remove(id: string, userId: string) {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id, userId },
    });
    if (!evaluation) throw new NotFoundException('Evaluación no encontrada');
    await this.evaluationRepository.remove(evaluation);
    return { message: 'Evaluación eliminada' };
  }

  async getLeaderboard() {
    const results = await this.executionRepository
      .createQueryBuilder('e')
      .select('e.model', 'model')
      .addSelect('e.provider', 'provider')
      .addSelect('COUNT(e.id)', 'totalExecutions')
      .addSelect('AVG(e.latencyMs)', 'avgLatency')
      .addSelect('AVG(e.cost)', 'avgCost')
      .addSelect('AVG(ev.rating)', 'avgRating')
      .addSelect('SUM(CASE WHEN ev.thumbsUp = true THEN 1 ELSE 0 END)', 'thumbsUpCount')
      .addSelect('SUM(CASE WHEN ev.thumbsUp = false THEN 1 ELSE 0 END)', 'thumbsDownCount')
      .leftJoin(Evaluation, 'ev', 'ev.executionId = e.id')
      .groupBy('e.model')
      .addGroupBy('e.provider')
      .orderBy('avgRating', 'DESC', 'NULLS LAST')
      .getRawMany();

    return results.map((r) => ({
      model: r.model,
      provider: r.provider,
      totalExecutions: parseInt(r.totalExecutions, 10),
      avgLatency: parseFloat(r.avgLatency) || 0,
      avgCost: parseFloat(r.avgCost) || 0,
      avgRating: parseFloat(r.avgRating) || null,
      thumbsUpCount: parseInt(r.thumbsUpCount, 10) || 0,
      thumbsDownCount: parseInt(r.thumbsDownCount, 10) || 0,
    }));
  }
}
