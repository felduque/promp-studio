import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ChatVersion,
  Prompt,
  PromptVersion,
  Project,
} from '../common/entities';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prompt, PromptVersion, ChatVersion, Project]),
  ],
  controllers: [PromptsController],
  providers: [PromptsService],
  exports: [PromptsService],
})
export class PromptsModule {}
