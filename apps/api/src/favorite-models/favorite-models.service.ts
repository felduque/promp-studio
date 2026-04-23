import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFavoriteModel } from '../common/entities';

@Injectable()
export class FavoriteModelsService {
  constructor(
    @InjectRepository(UserFavoriteModel)
    private readonly repo: Repository<UserFavoriteModel>,
  ) {}

  async findAll(userId: string): Promise<string[]> {
    const favs = await this.repo.find({ where: { userId } });
    return favs.map((f) => f.modelExternalId);
  }

  async add(userId: string, modelExternalId: string, provider?: string) {
    const existing = await this.repo.findOne({
      where: { userId, modelExternalId },
    });
    if (existing) return existing;

    const fav = this.repo.create({ userId, modelExternalId, provider });
    return this.repo.save(fav);
  }

  async remove(userId: string, modelExternalId: string) {
    await this.repo.delete({ userId, modelExternalId });
    return { success: true };
  }
}
