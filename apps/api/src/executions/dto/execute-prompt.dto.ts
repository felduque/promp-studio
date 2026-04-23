import {
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExecutePromptDto {
  @ApiProperty({ example: 'uuid-version' })
  @IsString()
  promptVersionId: string;

  @ApiProperty({ example: 'gpt-4o' })
  @IsString()
  model: string;

  @ApiProperty({ example: 'prompt', enum: ['prompt', 'chat'], required: false })
  @IsString()
  @IsOptional()
  source?: 'prompt' | 'chat';

  @ApiProperty({ example: { nombre: 'Juan', tema: 'IA' }, required: false })
  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;

  @ApiProperty({ example: 0.7, required: false })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({ example: 1024, required: false })
  @IsNumber()
  @IsOptional()
  maxTokens?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  topP?: number;
}

export class BatchExecuteDto {
  @ApiProperty({ type: [ExecutePromptDto] })
  @IsArray()
  executions: ExecutePromptDto[];
}

export interface PreviewMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class PreviewExecuteDto {
  @ApiProperty({ example: 'gpt-4o' })
  @IsString()
  model: string;

  @ApiProperty({ example: 'chat', enum: ['prompt', 'chat'], required: false })
  @IsString()
  @IsOptional()
  source?: 'prompt' | 'chat';

  @ApiProperty({ example: 'Contenido del prompt para modo template', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ example: [{ role: 'user', content: 'Hola' }], required: false })
  @IsArray()
  @IsOptional()
  messages?: PreviewMessage[];

  @ApiProperty({ example: { nombre: 'Juan', tema: 'IA' }, required: false })
  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;

  @ApiProperty({ example: 0.7, required: false })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({ example: 1024, required: false })
  @IsNumber()
  @IsOptional()
  maxTokens?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  topP?: number;
}

export class StreamExecuteDto {
  @ApiProperty({ example: ['gpt-4o', 'claude-3-sonnet'], description: 'Models to execute against' })
  @IsArray()
  @IsString({ each: true })
  models: string[];

  @ApiProperty({ example: 'uuid-version', required: false })
  @IsString()
  @IsOptional()
  promptVersionId?: string;

  @ApiProperty({ example: 'prompt', enum: ['prompt', 'chat'], required: false })
  @IsString()
  @IsOptional()
  source?: 'prompt' | 'chat';

  @ApiProperty({ example: 'Contenido del prompt', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  messages?: PreviewMessage[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;

  @ApiProperty({ example: 0.7, required: false })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({ example: 1024, required: false })
  @IsNumber()
  @IsOptional()
  maxTokens?: number;
}
