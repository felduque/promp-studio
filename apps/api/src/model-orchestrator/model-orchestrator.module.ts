import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ProviderModel } from '../common/entities';
import { ModelOrchestratorService } from './model-orchestrator.service';
import { ModelSyncService } from './model-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProviderModel]),
    HttpModule,
  ],
  providers: [ModelOrchestratorService, ModelSyncService],
  exports: [ModelOrchestratorService, ModelSyncService],
})
export class ModelOrchestratorModule {}
