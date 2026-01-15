import { Exercise } from '../../exercise/exercise.service';

export type QuestionType = 'MCQ' | 'LISTEN_AND_SELECT' | 'TYPE_ANSWER';

export interface NormalizedQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  // For MCQ and LISTEN_AND_SELECT
  options?: string[];
  audioUrl?: string; // For LISTEN_AND_SELECT
  // For TYPE_ANSWER
  placeholder?: string;
  caseSensitive?: boolean;
  // Common fields (not returned to client)
  correctOption?: string; // For MCQ and LISTEN_AND_SELECT
  answer?: string; // For TYPE_ANSWER
  explanation?: string;
  hint?: string;
}

/**
 * Map Exercise to normalized question format
 * Maps mode to question type:
 * - reading -> MCQ
 * - listening -> LISTEN_AND_SELECT (with audioUrl)
 * - writing -> TYPE_ANSWER
 */
export function normalizeQuestion(exercise: Exercise, audioUrl?: string): NormalizedQuestion {
  const base = {
    id: exercise.exerciseId,
    prompt: exercise.prompt,
    explanation: exercise.explanation,
    hint: exercise.hint,
  };

  // Map mode to question type
  if (exercise.mode === 'reading') {
    // Reading -> MCQ
    return {
      ...base,
      type: 'MCQ' as QuestionType,
      options: exercise.choices || [],
      correctOption: exercise.correctAnswer, // Not returned to client
    };
  } else if (exercise.mode === 'listening') {
    // Listening -> LISTEN_AND_SELECT
    return {
      ...base,
      type: 'LISTEN_AND_SELECT' as QuestionType,
      options: exercise.choices || [],
      audioUrl: audioUrl || undefined,
      correctOption: exercise.correctAnswer, // Not returned to client
    };
  } else if (exercise.mode === 'writing') {
    // Writing -> TYPE_ANSWER
    return {
      ...base,
      type: 'TYPE_ANSWER' as QuestionType,
      placeholder: 'Type your answer here',
      caseSensitive: false,
      answer: exercise.correctAnswer, // Not returned to client
    };
  } else {
    // Default: speaking or fallback -> MCQ
    return {
      ...base,
      type: 'MCQ' as QuestionType,
      options: exercise.choices || [],
      correctOption: exercise.correctAnswer,
    };
  }
}

/**
 * Remove server-only fields before sending to client
 */
export function sanitizeQuestionForClient(question: NormalizedQuestion): Omit<NormalizedQuestion, 'correctOption' | 'answer'> {
  const { correctOption, answer, ...sanitized } = question;
  return sanitized;
}

