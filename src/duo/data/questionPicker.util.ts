import { Question, Mode, QUESTION_POOL_SEED } from './questionPool.seed';

/**
 * Simple stable hash function for deterministic selection
 * Based on djb2 hash algorithm
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Deterministically picks exactly `count` questions from the pool for a given lesson and mode.
 * Uses stable hash of lessonId:mode to ensure same lesson+mode always returns same questions.
 * 
 * @param lessonId - The lesson (planet) ID
 * @param mode - The modality (listening, speaking, reading, writing)
 * @param count - Number of questions to return (default 5)
 * @returns Array of exactly `count` questions, never empty
 */
export function pickQuestionsForLessonMode(
  lessonId: string,
  mode: Mode,
  count: number = 5,
): Question[] {
  // Filter pool by mode
  const modeQuestions = QUESTION_POOL_SEED.filter((q) => q.mode === mode);
  
  if (modeQuestions.length === 0) {
    throw new Error(`No questions found for mode: ${mode}`);
  }

  // Generate stable hash from lessonId:mode
  const hashKey = `${lessonId}:${mode}`;
  const hash = hashString(hashKey);
  
  // Start index based on hash (modulo pool size)
  const startIndex = hash % modeQuestions.length;
  
  // Collect questions with wrap-around to ensure exactly `count` items
  const selected: Question[] = [];
  const seenIds = new Set<string>();
  
  let currentIndex = startIndex;
  let attempts = 0;
  const maxAttempts = modeQuestions.length * 2; // Prevent infinite loop
  
  while (selected.length < count && attempts < maxAttempts) {
    const question = modeQuestions[currentIndex];
    
    // Skip if already selected (to avoid duplicates)
    if (!seenIds.has(question.questionId)) {
      selected.push(question);
      seenIds.add(question.questionId);
    }
    
    // Move to next question with wrap-around
    currentIndex = (currentIndex + 1) % modeQuestions.length;
    attempts++;
  }
  
  // If we still don't have enough (edge case: very small pool with duplicates),
  // fill with questions from the pool in order
  if (selected.length < count) {
    for (const q of modeQuestions) {
      if (!seenIds.has(q.questionId)) {
        selected.push(q);
        seenIds.add(q.questionId);
        if (selected.length >= count) break;
      }
    }
  }
  
  // Final fallback: if still not enough, allow duplicates (should never happen with 25 questions)
  while (selected.length < count) {
    selected.push(modeQuestions[selected.length % modeQuestions.length]);
  }
  
  return selected.slice(0, count);
}

