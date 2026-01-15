import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListAudioQueryDto {
  @ApiProperty({ description: 'Page number', example: 1, required: false, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', example: 20, required: false, default: 20, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiProperty({ description: 'Search by filename', example: 'lesson', required: false })
  @IsString()
  @IsOptional()
  search?: string;
}

