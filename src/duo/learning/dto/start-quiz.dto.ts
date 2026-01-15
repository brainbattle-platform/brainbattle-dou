import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartQuizDto {
  @ApiProperty({ description: 'Lesson ID to start quiz for' })
  @IsString()
  lessonId: string;

  @ApiProperty({ description: 'Mode: listening, speaking, reading, writing', required: false })
  @IsOptional()
  @IsString()
  mode?: string;
}

