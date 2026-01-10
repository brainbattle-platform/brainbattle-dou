import { Injectable } from '@nestjs/common';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { SubmitAnswerSessionDto } from './dto/submit-answer-session.dto';
import { ExerciseService } from '../exercise/exercise.service';
import { InMemoryStateService } from '../progress/in-memory-state.service';
import { HeartsService } from '../progress/hearts.service';

@Injectable()
export class AnswerService {
  constructor(
    private readonly exerciseService: ExerciseService,
    private readonly stateService: InMemoryStateService,
    private readonly heartsService: HeartsService,
  ) {}

  submitAnswer(lessonId: string, dto: SubmitAnswerDto) {
    const session = this.stateService.getSession(dto.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.lessonId !== lessonId) {
      throw new Error('Lesson ID mismatch');
    }

    if (session.finishedAt) {
      throw new Error('Session already finished');
    }

    // Check if question already answered (ignore duplicate - return current state)
    if (session.answeredQuestionIds.has(dto.exerciseId)) {
      // Return current progress without double counting
      const exercise = this.exerciseService.getExercise(lessonId, dto.exerciseId);
      if (!exercise) {
        throw new Error('Exercise not found');
      }
      // Check if the answer is correct (for display purposes, but don't update counters)
      const isCorrect = this.exerciseService.checkAnswer(lessonId, dto.exerciseId, dto.answer);
      // Return current state (already answered, so counters unchanged)
      return {
        sessionId: session.sessionId,
        lessonId: session.lessonId,
        exerciseId: dto.exerciseId,
        mode: exercise.mode,
        isCorrect,
        xpEarned: 0, // No XP earned on duplicate submission
        correctAnswer: exercise.correctAnswer,
        progress: {
          answeredCount: session.answeredCount,
          correctCount: session.correctCount,
          totalCount: session.totalQuestions,
        },
      };
    }

    // Check answer correctness
    const exercise = this.exerciseService.getExercise(lessonId, dto.exerciseId);
    if (!exercise) {
      throw new Error('Exercise not found');
    }

    const isCorrect = this.exerciseService.checkAnswer(lessonId, dto.exerciseId, dto.answer);
    const xpEarned = isCorrect ? 10 : 0;

    // Submit to session
    const updatedSession = this.stateService.submitAnswer(dto.sessionId, dto.exerciseId, isCorrect);

    return {
      sessionId: updatedSession!.sessionId,
      lessonId: updatedSession!.lessonId,
      exerciseId: dto.exerciseId,
      mode: exercise.mode,
      isCorrect,
      xpEarned,
      correctAnswer: exercise.correctAnswer,
      progress: {
        answeredCount: updatedSession!.answeredCount,
        correctCount: updatedSession!.correctCount,
        totalCount: updatedSession!.totalQuestions,
      },
    };
  }

  submitAnswerBySession(sessionId: string, dto: SubmitAnswerSessionDto) {
    const session = this.stateService.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.finishedAt) {
      throw new Error('Session already finished');
    }

    // Check if out of hearts before processing
    const isOutOfHearts = this.heartsService.isOutOfHearts(session.userId);

    // Check if question already answered (ignore duplicate)
    if (session.answeredQuestionIds.has(dto.questionId)) {
      const exercise = this.exerciseService.getExercise(session.lessonId, dto.questionId);
      if (!exercise) {
        throw new Error('Exercise not found');
      }
      const isCorrect = this.exerciseService.checkAnswer(session.lessonId, dto.questionId, dto.answer);
      const hearts = this.heartsService.getHearts(session.userId);
      const progress = {
        answered: session.answeredCount,
        total: session.totalQuestions,
        percent: session.totalQuestions > 0 ? session.answeredCount / session.totalQuestions : 0,
      };

      return {
        result: {
          isCorrect,
          correctAnswer: exercise.correctAnswer,
          xpEarned: 0,
          explanation: this.generateExplanation(exercise, isCorrect),
        },
        hearts: {
          current: hearts.current,
          max: hearts.max,
        },
        progress,
        next: { hasNext: false },
        ...(isOutOfHearts && { outOfHearts: true }),
      };
    }

    // Check answer correctness
    const exercise = this.exerciseService.getExercise(session.lessonId, dto.questionId);
    if (!exercise) {
      throw new Error('Exercise not found');
    }

    const isCorrect = this.exerciseService.checkAnswer(session.lessonId, dto.questionId, dto.answer);
    const xpEarned = isCorrect ? 10 : 0;

    // Decrement hearts if wrong (unless already at 0)
    if (!isCorrect && !isOutOfHearts) {
      this.heartsService.decrementOnWrong(session.userId);
    }

    // Submit to session
    const updatedSession = this.stateService.submitAnswer(sessionId, dto.questionId, isCorrect);

    // Check if still out of hearts after wrong answer
    const nowOutOfHearts = this.heartsService.isOutOfHearts(session.userId);
    const hearts = this.heartsService.getHeartsWithRegen(session.userId);

    // Calculate progress
    const progress = {
      answered: updatedSession!.answeredCount,
      total: updatedSession!.totalQuestions,
      percent: updatedSession!.totalQuestions > 0
        ? updatedSession!.answeredCount / updatedSession!.totalQuestions
        : 0,
    };

    // Get next question if available
    const nextQuestion = this.getNextQuestion(updatedSession!);

    const response: any = {
      result: {
        isCorrect,
        correctAnswer: exercise.correctAnswer,
        xpEarned,
        explanation: this.generateExplanation(exercise, isCorrect),
      },
      hearts: {
        current: hearts.current,
        max: hearts.max,
        ...(nowOutOfHearts && hearts.regen.nextHeartInSeconds !== undefined && {
          regen: {
            nextHeartInSeconds: hearts.regen.nextHeartInSeconds,
          },
        }),
      },
      progress,
      next: nextQuestion,
    };

    if (nowOutOfHearts) {
      response.outOfHearts = true;
      response.actions = {
        wait: true,
        practiceToEarnHearts: {
          endpoint: '/api/duo/practice/quick?reward=hearts',
        },
      };
    }

    return response;
  }

  private getNextQuestion(session: any): { hasNext: boolean; question?: any } {
    const allAnswered = session.answeredCount >= session.totalQuestions;
    if (allAnswered) {
      return { hasNext: false };
    }

    // Find next unanswered question
    const nextQuestionId = session.questionIds.find((qId: string) => !session.answeredQuestionIds.has(qId));
    if (!nextQuestionId) {
      return { hasNext: false };
    }

    const exercise = this.exerciseService.getExercise(session.lessonId, nextQuestionId);
    if (!exercise) {
      return { hasNext: false };
    }

    const index = session.questionIds.indexOf(nextQuestionId) + 1; // 1-based index

    return {
      hasNext: true,
      question: {
        index,
        questionId: exercise.exerciseId,
        type: exercise.type,
        prompt: exercise.prompt,
        choices: exercise.choices,
        hintAvailable: !!exercise.hint,
      },
    };
  }

  private generateExplanation(exercise: any, isCorrect: boolean): string {
    // Use hint if available, otherwise generate simple explanation
    if (exercise.hint) {
      return exercise.hint;
    }
    if (isCorrect) {
      return `Correct! The answer is "${exercise.correctAnswer}".`;
    }
    return `The correct answer is "${exercise.correctAnswer}".`;
  }
}
