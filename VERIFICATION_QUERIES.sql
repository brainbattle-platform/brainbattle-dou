-- Verification Queries for Prisma Persistence
-- Run these queries in psql to verify data persistence

-- ============================================
-- 1. Quiz Attempts
-- ============================================

-- List all quiz attempts
SELECT 
  id as attempt_id,
  "userId",
  "lessonId",
  mode,
  "startedAt",
  "finishedAt",
  "correctCount",
  "totalQuestions",
  "xpEarned",
  array_length("questionIds", 1) as question_count
FROM quiz_attempts
ORDER BY "startedAt" DESC
LIMIT 10;

-- Get specific attempt by ID
SELECT * FROM quiz_attempts WHERE id = '<ATTEMPT_ID>';

-- Count attempts per user
SELECT "userId", COUNT(*) as attempt_count
FROM quiz_attempts
GROUP BY "userId";

-- ============================================
-- 2. Question Attempts (Answers)
-- ============================================

-- List all question attempts with answers
SELECT 
  qa.id,
  qa."attemptId",
  qa."userId",
  qa."questionId",
  qa."answerText",
  qa."answerJson",
  qa."isCorrect",
  qa."answeredAt",
  qa."timeMs"
FROM question_attempts qa
ORDER BY qa."answeredAt" DESC
LIMIT 20;

-- Get all answers for a specific attempt
SELECT 
  qa."questionId",
  qa."answerText",
  qa."answerJson",
  qa."isCorrect",
  qa."answeredAt"
FROM question_attempts qa
WHERE qa."attemptId" = '<ATTEMPT_ID>'
ORDER BY qa."answeredAt" ASC;

-- Count correct vs incorrect answers
SELECT 
  "isCorrect",
  COUNT(*) as count
FROM question_attempts
GROUP BY "isCorrect";

-- ============================================
-- 3. User Progress
-- ============================================

-- Check user progress
SELECT 
  "userId",
  "xpTotal",
  streak,
  "lastActiveDate"
FROM user_progress
WHERE "userId" = 1;

-- All users progress
SELECT * FROM user_progress;

-- ============================================
-- 4. User Hearts
-- ============================================

-- Check hearts status
SELECT 
  "userId",
  current,
  max,
  "lastRefillAt"
FROM user_hearts
WHERE "userId" = 1;

-- All users hearts
SELECT * FROM user_hearts;

-- ============================================
-- 5. Planet Mode Progress
-- ============================================

-- Check lesson progress by mode
SELECT 
  "userId",
  "lessonId",
  mode,
  state,
  "bestScore",
  "completedAt",
  "lastAttemptAt"
FROM planet_mode_progress
WHERE "userId" = 1
ORDER BY "lessonId", mode;

-- Count completed modes per lesson
SELECT 
  "lessonId",
  COUNT(*) FILTER (WHERE state = 'completed') as completed_modes,
  COUNT(*) as total_modes
FROM planet_mode_progress
WHERE "userId" = 1
GROUP BY "lessonId";

-- ============================================
-- 6. Unit Progress
-- ============================================

-- Check unit mastery
SELECT 
  "userId",
  "unitId",
  mastery
FROM unit_progress
WHERE "userId" = 1
ORDER BY "unitId";

-- ============================================
-- 7. Complete Attempt Details (Join)
-- ============================================

-- Get complete attempt with all answers
SELECT 
  qa.id as attempt_id,
  qa."userId",
  qa."lessonId",
  qa.mode,
  qa."startedAt",
  qa."finishedAt",
  qa."correctCount",
  qa."totalQuestions",
  qa."xpEarned",
  COUNT(qa2.id) as answers_submitted,
  COUNT(qa2.id) FILTER (WHERE qa2."isCorrect" = true) as correct_answers
FROM quiz_attempts qa
LEFT JOIN question_attempts qa2 ON qa.id = qa2."attemptId"
WHERE qa.id = '<ATTEMPT_ID>'
GROUP BY qa.id, qa."userId", qa."lessonId", qa.mode, qa."startedAt", 
         qa."finishedAt", qa."correctCount", qa."totalQuestions", qa."xpEarned";

-- ============================================
-- 8. Persistence Test Queries
-- ============================================

-- Verify attempt exists after restart
-- Run this before and after restarting services
SELECT 
  id,
  "startedAt",
  "finishedAt",
  "correctCount",
  "totalQuestions"
FROM quiz_attempts
WHERE id = '<ATTEMPT_ID>';

-- Verify answers exist after restart
SELECT 
  "questionId",
  "isCorrect",
  "answeredAt"
FROM question_attempts
WHERE "attemptId" = '<ATTEMPT_ID>'
ORDER BY "answeredAt" ASC;

-- ============================================
-- 9. Data Integrity Checks
-- ============================================

-- Check for orphaned question attempts (should be 0)
SELECT COUNT(*) as orphaned_attempts
FROM question_attempts qa
LEFT JOIN quiz_attempts qa2 ON qa."attemptId" = qa2.id
WHERE qa2.id IS NULL;

-- Check for duplicate answers in same attempt (should be 0)
SELECT 
  "attemptId",
  "questionId",
  COUNT(*) as duplicate_count
FROM question_attempts
GROUP BY "attemptId", "questionId"
HAVING COUNT(*) > 1;

-- Verify attempt stats match question attempts
SELECT 
  qa.id,
  qa."correctCount" as attempt_correct,
  COUNT(qa2.id) FILTER (WHERE qa2."isCorrect" = true) as actual_correct,
  qa."totalQuestions" as attempt_total,
  COUNT(qa2.id) as actual_answered
FROM quiz_attempts qa
LEFT JOIN question_attempts qa2 ON qa.id = qa2."attemptId"
GROUP BY qa.id, qa."correctCount", qa."totalQuestions"
HAVING qa."correctCount" != COUNT(qa2.id) FILTER (WHERE qa2."isCorrect" = true)
   OR qa."totalQuestions" != COUNT(qa2.id);

-- ============================================
-- 10. Cleanup (Use with caution!)
-- ============================================

-- Delete all test data (DANGER: This deletes all data!)
-- DELETE FROM question_attempts;
-- DELETE FROM quiz_attempts;
-- DELETE FROM planet_mode_progress;
-- DELETE FROM unit_progress;
-- DELETE FROM user_hearts;
-- DELETE FROM user_progress;

