import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePromptDto {
  @ApiProperty({ example: 'Generador de emails' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'uuid-del-proyecto' })
  @IsString()
  projectId: string;
}
