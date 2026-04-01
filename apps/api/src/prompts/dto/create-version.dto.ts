import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class VariableDto {
  @ApiProperty({ example: 'nombre' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['string', 'number', 'enum', 'json'] })
  @IsString()
  type: 'string' | 'number' | 'enum' | 'json';

  @ApiProperty({ example: 'Juan', required: false })
  @IsString()
  @IsOptional()
  defaultValue?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  options?: string[];
}

class MessageDto {
  @ApiProperty({ enum: ['system', 'user', 'assistant'] })
  @IsString()
  role: 'system' | 'user' | 'assistant';

  @ApiProperty({ example: 'Eres un asistente útil' })
  @IsString()
  content: string;
}

export class CreateVersionDto {
  @ApiProperty({ example: 'Eres un {{role}}. Responde sobre {{tema}}.' })
  @IsString()
  content: string;

  @ApiProperty({ type: [VariableDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariableDto)
  @IsOptional()
  variables?: VariableDto[];

  @ApiProperty({ type: [MessageDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  @IsOptional()
  messages?: MessageDto[];

  @ApiProperty({ example: 'Mejorar tono formal', required: false })
  @IsString()
  @IsOptional()
  commitMessage?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  parentVersionId?: string;

  @ApiProperty({ example: 'producción', required: false })
  @IsString()
  @IsOptional()
  tag?: string;
}
