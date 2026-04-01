import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'openai' })
  @IsString()
  provider: string;

  @ApiProperty({ example: 'sk-...' })
  @IsString()
  key: string;

  @ApiProperty({ example: 'Mi key de producción', required: false })
  @IsString()
  @IsOptional()
  label?: string;
}
