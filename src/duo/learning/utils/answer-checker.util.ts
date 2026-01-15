import { QuestionType, NormalizedQuestion } from './question-mapper.util';

/**
 * Check if submitted answer is correct based on question type
 */
export function checkAnswer(
  question: NormalizedQuestion,
  submittedAnswer: string,
): boolean {
  if (question.type === 'MCQ' || question.type === 'LISTEN_AND_SELECT') {
    // MCQ and LISTEN_AND_SELECT: exact case-sensitive match
    return submittedAnswer === question.correctOption;
  } else if (question.type === 'TYPE_ANSWER') {
    // TYPE_ANSWER: depends on caseSensitive flag
    const submitted = submittedAnswer.trim();
    const correct = question.answer?.trim() || '';
    
    if (question.caseSensitive) {
      // Case-sensitive: trim only
      return submitted === correct;
    } else {
      // Case-insensitive: trim + lowercase
      return submitted.toLowerCase() === correct.toLowerCase();
    }
  }
  
  return false;
}

