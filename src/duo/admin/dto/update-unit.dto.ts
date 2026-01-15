import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';

export class UpdateUnitDto {
  @ApiProperty({ description: 'Unit title', example: 'Unit 1: Greetings', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Display order', example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ description: 'Published status', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

