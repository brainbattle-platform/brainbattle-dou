import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerSessionDto {
  @ApiProperty({ description: 'Question ID', example: 'ex-1-listening' })
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'User answer', example: 'táo' })
  @IsString()
  answer: string;

  @ApiProperty({ description: 'Time taken in milliseconds', example: 4200, required: false })
  @IsOptional()
  @IsNumber()
  timeMs?: number;
}

