import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ChatVersion,
  Project,
  Prompt,
  PromptTemplate,
  PromptVersion,
  ChatTemplate,
} from '../common/entities';
import { TemplatesModule } from '../templates/templates.module';
import { StudioIoController } from './studio-io.controller';
import { StudioIoService } from './studio-io.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Prompt,
      PromptVersion,
      ChatVersion,
      PromptTemplate,
      ChatTemplate,
    ]),
    TemplatesModule,
  ],
  controllers: [StudioIoController],
  providers: [StudioIoService],
})
export class StudioIoModule {}
