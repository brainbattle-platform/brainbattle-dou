import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ description: 'Legacy lesson ID (e.g., "lesson-1-1")', example: 'lesson-1-1' })
  @IsString()
  lessonId: string;

  @ApiProperty({ description: 'Unit ID this lesson belongs to', example: 'unit-1' })
  @IsString()
  unitId: string;

  @ApiProperty({ description: 'Lesson title', example: 'Lesson 1' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Lesson subtitle', example: 'Practice Greetings', required: false })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({ description: 'Display order within unit', example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ description: 'Estimated minutes to complete', example: 3, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @ApiProperty({ description: 'Published status', example: false, required: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

