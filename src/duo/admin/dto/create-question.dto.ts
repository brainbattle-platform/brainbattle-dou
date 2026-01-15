import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsBoolean, IsIn, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuestionOptionDto {
  @ApiProperty({ description: 'Option text', example: 'Option A' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Is this the correct answer?', example: true })
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({ description: 'Display order', example: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateQuestionDto {
  @ApiProperty({ description: 'Legacy question ID', example: 'q-listening-01' })
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'Lesson ID this question belongs to', example: 'lesson-1-1' })
  @IsString()
  lessonId: string;

  @ApiProperty({ description: 'Question mode', enum: ['listening', 'speaking', 'reading', 'writing'], example: 'listening' })
  @IsString()
  @IsIn(['listening', 'speaking', 'reading', 'writing'])
  mode: string;

  @ApiProperty({ description: 'Question type', enum: ['mcq', 'fill_in', 'match'], example: 'mcq', required: false })
  @IsOptional()
  @IsString()
  @IsIn(['mcq', 'fill_in', 'match'])
  type?: string;

  @ApiProperty({ description: 'Question prompt', example: 'Listen and select the correct meaning of "apple"' })
  @IsString()
  prompt: string;

  @ApiProperty({ description: 'Correct answer', example: 'táo' })
  @IsString()
  correctAnswer: string;

  @ApiProperty({ description: 'Explanation', example: 'The correct answer is "táo".', required: false })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ description: 'Hint', example: 'Think about the listening context.', required: false })
  @IsOptional()
  @IsString()
  hint?: string;

  @ApiProperty({ description: 'Display order', example: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ description: 'Published status', example: false, required: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiProperty({ description: 'Question options (for MCQ)', type: [CreateQuestionOptionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}

