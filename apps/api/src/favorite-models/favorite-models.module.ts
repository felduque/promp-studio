import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFavoriteModel } from '../common/entities';
import { FavoriteModelsController } from './favorite-models.controller';
import { FavoriteModelsService } from './favorite-models.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserFavoriteModel])],
  controllers: [FavoriteModelsController],
  providers: [FavoriteModelsService],
})
export class FavoriteModelsModule {}
