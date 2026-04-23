import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssertionDto } from './create-test-case.dto';

export class UpdateTestCaseDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  expectedOutput?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  assertions?: AssertionDto[];
}
