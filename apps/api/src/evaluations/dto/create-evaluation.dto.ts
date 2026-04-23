import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEvaluationDto {
  @ApiProperty({ example: 'uuid-execution' })
  @IsString()
  executionId: string;

  @ApiProperty({ example: 4, required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  thumbsUp?: boolean;

  @ApiProperty({ example: 'Buena respuesta, precisa y concisa', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
