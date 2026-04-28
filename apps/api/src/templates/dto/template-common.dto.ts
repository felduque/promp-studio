import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TemplateVariableDto {
  @ApiProperty({ example: 'topic' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ enum: ['string', 'number', 'enum', 'json'] })
  @IsString()
  @IsIn(['string', 'number', 'enum', 'json'])
  type: 'string' | 'number' | 'enum' | 'json';

  @ApiProperty({ example: 'IA', required: false })
  @IsString()
  @IsOptional()
  defaultValue?: string;

  @ApiProperty({ example: ['formal', 'casual'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];
}

export class TemplateMessageDto {
  @ApiProperty({ enum: ['system', 'user', 'assistant'] })
  @IsString()
  @IsIn(['system', 'user', 'assistant'])
  role: 'system' | 'user' | 'assistant';

  @ApiProperty({ example: 'Responde con precision.' })
  @IsString()
  content: string;
}

export class ChatParametersDto {
  @ApiProperty({ required: false })
  @IsOptional()
  temperature?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  maxTokens?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  topP?: number;
}

export class PromptTemplateBodyDto {
  @ApiProperty({ example: 'Analizador de texto' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Analiza el siguiente texto: {{text}}' })
  @IsString()
  content: string;

  @ApiProperty({ type: [TemplateVariableDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateVariableDto)
  @IsOptional()
  variables?: TemplateVariableDto[];

  @ApiProperty({ type: [TemplateMessageDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateMessageDto)
  @IsOptional()
  messages?: TemplateMessageDto[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class ChatTemplateBodyDto {
  @ApiProperty({ example: 'Soporte tecnico' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  systemMessage?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userMessage?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  assistantMessage?: string;

  @ApiProperty({ type: [TemplateMessageDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateMessageDto)
  @IsOptional()
  messages?: TemplateMessageDto[];

  @ApiProperty({ type: [TemplateVariableDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateVariableDto)
  @IsOptional()
  variables?: TemplateVariableDto[];

  @ApiProperty({ type: ChatParametersDto, required: false })
  @ValidateNested()
  @Type(() => ChatParametersDto)
  @IsOptional()
  parameters?: ChatParametersDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
