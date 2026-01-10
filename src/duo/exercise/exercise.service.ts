import { Injectable } from '@nestjs/common';
import { Question, Mode } from '../data/questionPool.seed';
import { pickQuestionsForLessonMode } from '../data/questionPicker.util';

export interface Exercise {
  exerciseId: string;
  mode: 'listening' | 'speaking' | 'reading' | 'writing';
  type: 'mcq' | 'fill_in';
  prompt: string;
  choices?: string[];
  correctAnswer: string;
  hint?: string;
  explanation?: string;
}

@Injectable()
export class ExerciseService {
  /**
   * Get all 4 exercises (one per mode) for a lesson
   * For backward compatibility - returns one exercise per mode from the pool
   * Note: Actual lesson sessions use getQuestionsForLessonMode which returns 5 per mode
   */
  getExercisesForLesson(lessonId: string): Exercise[] {
    const modalities: Mode[] = ['listening', 'speaking', 'reading', 'writing'];
    
    // For each mode, pick 1 question (for compatibility with old endpoints)
    return modalities.map((mode) => {
      const questions = pickQuestionsForLessonMode(lessonId, mode, 1);
      if (questions.length === 0) {
        throw new Error(`No questions found for lesson ${lessonId}, mode ${mode}`);
      }
      const q = questions[0];
      return this.questionToExercise(q);
    });
  }

  /**
   * Get questions for a specific lesson and mode using deterministic picker
   * Returns exactly `count` questions (default 5 as per spec)
   */
  getQuestionsForLessonMode(lessonId: string, mode: Mode, count: number = 5): Exercise[] {
    const questions = pickQuestionsForLessonMode(lessonId, mode, count);
    return questions.map((q) => this.questionToExercise(q));
  }

  /**
   * Get a single exercise by lessonId and exerciseId (questionId)
   * Searches across all modes for the lesson using deterministic picker
   */
  getExercise(lessonId: string, exerciseId: string): Exercise | undefined {
    const modes: Mode[] = ['listening', 'speaking', 'reading', 'writing'];
    
    // Try each mode to find the question
    for (const mode of modes) {
      try {
        const questions = pickQuestionsForLessonMode(lessonId, mode, 5);
        const exercise = questions.find((q) => q.questionId === exerciseId);
        if (exercise) {
          return this.questionToExercise(exercise);
        }
      } catch {
        // Continue to next mode
      }
    }
    
    return undefined;
  }

  /**
   * Get exercise by questionId directly from pool
   * (Fallback for direct question ID lookup without lesson context)
   */
  getExerciseById(questionId: string): Exercise | undefined {
    const { QUESTION_POOL_SEED } = require('../data/questionPool.seed');
    const question = QUESTION_POOL_SEED.find((q: Question) => q.questionId === questionId);
    if (!question) {
      return undefined;
    }
    return this.questionToExercise(question);
  }

  checkAnswer(lessonId: string, exerciseId: string, answer: string): boolean {
    // Try to find exercise in lesson first (using deterministic picker)
    let exercise = this.getExercise(lessonId, exerciseId);
    
    // Fallback: search in question pool directly (for session-based lookups)
    if (!exercise) {
      exercise = this.getExerciseById(exerciseId);
    }
    
    if (!exercise) {
      return false;
    }
    return exercise.correctAnswer.toLowerCase() === answer.toLowerCase();
  }

  /**
   * Convert Question from pool to Exercise format (for backward compatibility)
   */
  private questionToExercise(question: Question): Exercise {
    return {
      exerciseId: question.questionId,
      mode: question.mode,
      type: question.type,
      prompt: question.prompt,
      choices: question.choices,
      correctAnswer: question.correctAnswer,
      hint: question.hint,
      explanation: question.explanation,
    };
  }
}
