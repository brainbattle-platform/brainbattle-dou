import { Injectable } from '@nestjs/common';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class AnswerService {
  // Demo in-memory answer key
  private answerKey: Record<number, number> = {
    1001: 0,
    1002: 1,
  };

  submitAnswer(userId: string, lessonId: number, dto: SubmitAnswerDto) {
    const correctIndex = this.answerKey[dto.exerciseId];
    const correct = correctIndex === dto.answerIndex;
    const xpGained = correct ? 10 : 0;

    // TODO: update user progress & XP here

    return {
      correct,
      correctIndex,
      xpGained,
      lessonCompleted: false,
    };
  }
}
