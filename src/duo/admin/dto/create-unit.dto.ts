import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({ description: 'Legacy unit ID (e.g., "unit-1")', example: 'unit-1' })
  @IsString()
  unitId: string;

  @ApiProperty({ description: 'Unit title', example: 'Unit 1: Greetings' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Display order', example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ description: 'Published status', example: false, required: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

