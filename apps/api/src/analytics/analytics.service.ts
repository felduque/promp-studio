import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Execution, Evaluation } from '../common/entities';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Execution)
    private readonly executionRepository: Repository<Execution>,
    @InjectRepository(Evaluation)
    private readonly evaluationRepository: Repository<Evaluation>,
  ) {}

  async getOverview(userId: string) {
    const result = await this.executionRepository
      .createQueryBuilder('e')
      .select('COUNT(e.id)', 'totalExecutions')
      .addSelect('COALESCE(SUM(e.tokensIn + e.tokensOut), 0)', 'totalTokens')
      .addSelect('COALESCE(SUM(e.cost), 0)', 'totalCost')
      .addSelect('COALESCE(AVG(e.latencyMs), 0)', 'avgLatency')
      .addSelect('COUNT(DISTINCT e.model)', 'uniqueModels')
      .addSelect('COUNT(CASE WHEN e.source = \'prompt\' THEN 1 END)', 'promptExecutions')
      .addSelect('COUNT(CASE WHEN e.source = \'chat\' THEN 1 END)', 'chatExecutions')
      .where('e.userId = :userId', { userId })
      .getRawOne();

    return {
      totalExecutions: parseInt(result.totalExecutions, 10),
      totalTokens: parseInt(result.totalTokens, 10),
      totalCost: parseFloat(result.totalCost),
      avgLatency: parseFloat(result.avgLatency),
      uniqueModels: parseInt(result.uniqueModels, 10),
      promptExecutions: parseInt(result.promptExecutions, 10),
      chatExecutions: parseInt(result.chatExecutions, 10),
    };
  }

  async getByModel(userId: string) {
    const results = await this.executionRepository
      .createQueryBuilder('e')
      .select('e.model', 'model')
      .addSelect('e.provider', 'provider')
      .addSelect('e.source', 'source')
      .addSelect('COUNT(e.id)', 'count')
      .addSelect('COALESCE(SUM(e.tokensIn + e.tokensOut), 0)', 'totalTokens')
      .addSelect('COALESCE(SUM(e.cost), 0)', 'totalCost')
      .addSelect('COALESCE(AVG(e.latencyMs), 0)', 'avgLatency')
      .where('e.userId = :userId', { userId })
      .groupBy('e.model')
      .addGroupBy('e.provider')
      .addGroupBy('e.source')
      .orderBy('count', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      model: r.model,
      provider: r.provider,
      source: r.source,
      count: parseInt(r.count, 10),
      totalTokens: parseInt(r.totalTokens, 10),
      totalCost: parseFloat(r.totalCost),
      avgLatency: parseFloat(r.avgLatency),
    }));
  }

  async getByPrompt(userId: string) {
    const results = await this.executionRepository
      .createQueryBuilder('e')
      .innerJoin('e.promptVersion', 'pv')
      .innerJoin('pv.prompt', 'p')
      .select('p.id', 'promptId')
      .addSelect('p.name', 'promptName')
      .addSelect('e.source', 'source')
      .addSelect('COUNT(e.id)', 'count')
      .addSelect('COALESCE(SUM(e.cost), 0)', 'totalCost')
      .addSelect('COALESCE(AVG(e.latencyMs), 0)', 'avgLatency')
      .where('e.userId = :userId', { userId })
      .groupBy('p.id')
      .addGroupBy('p.name')
      .addGroupBy('e.source')
      .orderBy('count', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      promptId: r.promptId,
      promptName: r.promptName,
      source: r.source,
      count: parseInt(r.count, 10),
      totalCost: parseFloat(r.totalCost),
      avgLatency: parseFloat(r.avgLatency),
    }));
  }

  async getTimeline(userId: string, granularity: 'day' | 'week' | 'month' = 'day') {
    let dateTrunc: string;
    switch (granularity) {
      case 'week':
        dateTrunc = "date_trunc('week', e.\"createdAt\")";
        break;
      case 'month':
        dateTrunc = "date_trunc('month', e.\"createdAt\")";
        break;
      default:
        dateTrunc = "date_trunc('day', e.\"createdAt\")";
    }

    const results = await this.executionRepository
      .createQueryBuilder('e')
      .select(`${dateTrunc}`, 'date')
      .addSelect('e.source', 'source')
      .addSelect('COUNT(e.id)', 'count')
      .addSelect('COALESCE(SUM(e.tokensIn + e.tokensOut), 0)', 'tokens')
      .addSelect('COALESCE(SUM(e.cost), 0)', 'cost')
      .where('e.userId = :userId', { userId })
      .groupBy('date')
      .addGroupBy('e.source')
      .orderBy('date', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      date: r.date,
      source: r.source,
      count: parseInt(r.count, 10),
      tokens: parseInt(r.tokens, 10),
      cost: parseFloat(r.cost),
    }));
  }

  async getLeaderboard(userId: string, category: 'quality' | 'speed' | 'cost' = 'quality') {
    const qb = this.executionRepository
      .createQueryBuilder('e')
      .select('e.model', 'model')
      .addSelect('e.provider', 'provider')
      .addSelect('COUNT(e.id)', 'count')
      .addSelect('COALESCE(AVG(e.latencyMs), 0)', 'avgLatency')
      .addSelect('COALESCE(AVG(e.cost), 0)', 'avgCost')
      .leftJoin(Evaluation, 'ev', 'ev.executionId = e.id')
      .addSelect('AVG(ev.rating)', 'avgRating')
      .addSelect('SUM(CASE WHEN ev.thumbsUp = true THEN 1 ELSE 0 END)', 'thumbsUp')
      .where('e.userId = :userId', { userId })
      .groupBy('e.model')
      .addGroupBy('e.provider');

    switch (category) {
      case 'speed':
        qb.orderBy('"avgLatency"', 'ASC');
        break;
      case 'cost':
        qb.orderBy('"avgCost"', 'ASC');
        break;
      default:
        qb.orderBy('"avgRating"', 'DESC', 'NULLS LAST');
    }

    const results = await qb.getRawMany();

    return results.map((r) => ({
      model: r.model,
      provider: r.provider,
      count: parseInt(r.count, 10),
      avgLatency: parseFloat(r.avgLatency),
      avgCost: parseFloat(r.avgCost),
      avgRating: r.avgRating ? parseFloat(r.avgRating) : null,
      thumbsUp: parseInt(r.thumbsUp, 10) || 0,
    }));
  }
}
