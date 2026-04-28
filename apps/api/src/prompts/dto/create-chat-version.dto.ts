import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  ChatParametersDto,
  TemplateMessageDto,
  TemplateVariableDto,
} from '../../templates/dto/template-common.dto';

export class CreateChatVersionDto {
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

  @ApiProperty({ example: 'Ajustar mensajes de chat', required: false })
  @IsString()
  @IsOptional()
  commitMessage?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  parentVersionId?: string;

  @ApiProperty({ example: 'produccion', required: false })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
