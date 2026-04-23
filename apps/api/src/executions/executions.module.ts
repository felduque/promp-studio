import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Execution, PromptVersion, ProviderModel, ExecutionGroup } from '../common/entities';
import { ExecutionsController } from './executions.controller';
import { ExecutionsService } from './executions.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ModelOrchestratorModule } from '../model-orchestrator/model-orchestrator.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Execution, PromptVersion, ProviderModel, ExecutionGroup]),
    HttpModule,
    ApiKeysModule,
    ModelOrchestratorModule,
  ],
  controllers: [ExecutionsController],
  providers: [ExecutionsService],
  exports: [ExecutionsService],
})
export class ExecutionsModule {}
