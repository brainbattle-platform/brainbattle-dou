import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsBoolean, IsIn, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionOptionDto } from './create-question.dto';

export class UpdateQuestionDto {
  @ApiProperty({ description: 'Lesson ID this question belongs to', example: 'lesson-1-1', required: false })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiProperty({ description: 'Question mode', enum: ['listening', 'speaking', 'reading', 'writing'], example: 'listening', required: false })
  @IsOptional()
  @IsString()
  @IsIn(['listening', 'speaking', 'reading', 'writing'])
  mode?: string;

  @ApiProperty({ description: 'Question type', enum: ['mcq', 'fill_in', 'match'], example: 'mcq', required: false })
  @IsOptional()
  @IsString()
  @IsIn(['mcq', 'fill_in', 'match'])
  type?: string;

  @ApiProperty({ description: 'Question prompt', example: 'Listen and select the correct meaning of "apple"', required: false })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiProperty({ description: 'Correct answer', example: 'táo', required: false })
  @IsOptional()
  @IsString()
  correctAnswer?: string;

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

  @ApiProperty({ description: 'Published status', example: true, required: false })
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

