import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TestCase,
  TestRun,
  Prompt,
  PromptVersion,
  Execution,
  ProviderModel,
} from '../common/entities';
import { TestCasesController } from './test-cases.controller';
import { TestCasesService } from './test-cases.service';
import { ModelOrchestratorModule } from '../model-orchestrator/model-orchestrator.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TestCase,
      TestRun,
      Prompt,
      PromptVersion,
      Execution,
      ProviderModel,
    ]),
    ModelOrchestratorModule,
    ApiKeysModule,
  ],
  controllers: [TestCasesController],
  providers: [TestCasesService],
  exports: [TestCasesService],
})
export class TestCasesModule {}
