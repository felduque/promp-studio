import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiProperty({ example: 0.7, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  defaultTemperature?: number;

  @ApiProperty({ example: 1024, required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(128000)
  defaultMaxTokens?: number;

  @ApiProperty({ example: 1.0, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  defaultTopP?: number;

  @ApiProperty({ example: 'dark', required: false })
  @IsString()
  @IsOptional()
  @IsEnum(['light', 'dark', 'system'])
  theme?: 'light' | 'dark' | 'system';

  @ApiProperty({ example: 14, required: false })
  @IsNumber()
  @IsOptional()
  @Min(10)
  @Max(24)
  editorFontSize?: number;
}
