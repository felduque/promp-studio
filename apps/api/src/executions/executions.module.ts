import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ChatVersion,
  Execution,
  PromptVersion,
  ProviderModel,
  ExecutionGroup,
} from '../common/entities';
import { ExecutionsController } from './executions.controller';
import { ExecutionsService } from './executions.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ModelOrchestratorModule } from '../model-orchestrator/model-orchestrator.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Execution,
      PromptVersion,
      ChatVersion,
      ProviderModel,
      ExecutionGroup,
    ]),
    ApiKeysModule,
    ModelOrchestratorModule,
  ],
  controllers: [ExecutionsController],
  providers: [ExecutionsService],
  exports: [ExecutionsService],
})
export class ExecutionsModule {}
