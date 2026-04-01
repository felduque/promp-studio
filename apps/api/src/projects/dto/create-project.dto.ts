import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'Mi proyecto de prompts' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'Prompts para chatbot de soporte', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
