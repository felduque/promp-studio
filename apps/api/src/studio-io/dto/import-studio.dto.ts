import { IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImportStudioDto {
  @ApiProperty({ example: 'uuid-del-proyecto', required: false })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ description: 'Prompt Studio export payload' })
  @IsObject()
  data: Record<string, unknown>;
}
