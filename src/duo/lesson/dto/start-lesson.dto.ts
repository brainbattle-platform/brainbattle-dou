import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartLessonDto {
  @ApiProperty({ description: 'Lesson ID (planet) to start', example: 'lesson-1' })
  @IsString()
  lessonId: string;

  @ApiProperty({
    description: 'Mode (modality) to practice',
    example: 'speaking',
    enum: ['listening', 'speaking', 'reading', 'writing'],
  })
  @IsString()
  mode: string;
}