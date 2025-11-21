import { IsInt } from 'class-validator';

export class SubmitAnswerDto {
  @IsInt()
  exerciseId: number;

  @IsInt()
  answerIndex: number;
}
