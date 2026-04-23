import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssertionDto {
  @IsString()
  type: string; // contains | equals | validJSON | regex | notContains

  @IsString()
  value: string;
}

export class CreateTestCaseDto {
  @ApiProperty({ example: 'Test con variables de nombre' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'uuid-prompt' })
  @IsString()
  promptId: string;

  @ApiProperty({ example: { nombre: 'Juan', tema: 'IA' }, required: false })
  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;

  @ApiProperty({ example: 'La respuesta debe mencionar IA', required: false })
  @IsString()
  @IsOptional()
  expectedOutput?: string;

  @ApiProperty({
    example: [{ type: 'contains', value: 'IA' }],
    required: false,
  })
  @IsArray()
  @IsOptional()
  assertions?: AssertionDto[];
}
