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
