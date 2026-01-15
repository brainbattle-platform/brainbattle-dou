# Database Write Verification Guide

This guide shows how to verify that each write endpoint under `/api/learning/*` actually persists data to PostgreSQL.

## Prerequisites

1. PostgreSQL running (via docker-compose)
2. Prisma migrations applied
3. Access to `psql` or a PostgreSQL client

## Database Connection

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d brainbattle_duo

# Or via docker-compose
docker-compose exec postgres psql -U postgres -d brainbattle_duo
```

## Write Endpoints and Their Database Tables

### 1. POST `/api/learning/lessons/:lessonId/start`

**Creates:** `LessonSession` record in `lesson_sessions` table

**Verification Query:**
```sql
-- Check latest lesson sessions
SELECT 
  id as session_id,
  "userId",
  "lessonId",
  mode,
  "startedAt",
  "finishedAt",
  "correctCount",
  "totalCount",
  "xpEarned"
FROM lesson_sessions
WHERE "userId" = 1
ORDER BY "startedAt" DESC
LIMIT 5;
```

**Expected Result:** A new row with `finishedAt = NULL` and `startedAt` set to current timestamp.

---

### 2. POST `/api/learning/quiz/start`

**Creates:** `QuizAttempt` record in `quiz_attempts` table

**Verification Query:**
```sql
-- Check latest quiz attempts
SELECT 
  id as attempt_id,
  "userId",
  "lessonId",
  mode,
  "unitId",
  "questionIds",
  "startedAt",
  "finishedAt",
  "correctCount",
  "totalQuestions",
  "xpEarned"
FROM quiz_attempts
WHERE "userId" = 1
ORDER BY "startedAt" DESC
LIMIT 5;
```

**Expected Result:** A new row with `finishedAt = NULL`, `startedAt` set to current timestamp, and `questionIds` array populated.

---

### 3. POST `/api/learning/quiz/:attemptId/answer`

**Creates/Updates:**
- `QuestionAttempt` record in `question_attempts` table
- Updates `QuizAttempt.correctCount` if answer is correct
- Updates `UserHearts.current` if answer is wrong (decrements)

**Verification Queries:**

```sql
-- Check question attempts for a specific quiz attempt
SELECT 
  id,
  "attemptId",
  "userId",
  "questionId",
  "selectedOptionId",
  "answerText",
  "answerJson",
  "isCorrect",
  "answeredAt",
  "timeMs"
FROM question_attempts
WHERE "attemptId" = '<attemptId>'
ORDER BY "answeredAt" ASC;
```

```sql
-- Check updated quiz attempt (correctCount should increment)
SELECT 
  id,
  "correctCount",
  "totalQuestions"
FROM quiz_attempts
WHERE id = '<attemptId>';
```

```sql
-- Check updated hearts (should decrement if wrong answer)
SELECT 
  "userId",
  current,
  max,
  "lastRefillAt"
FROM user_hearts
WHERE "userId" = 1;
```

**Expected Results:**
- New row in `question_attempts` with `isCorrect` flag
- `quiz_attempts.correctCount` incremented if correct
- `user_hearts.current` decremented if wrong (if hearts > 0)

---

### 4. POST `/api/learning/quiz/:attemptId/finish`

**Updates:**
- `QuizAttempt.finishedAt` (sets to current timestamp)
- `QuizAttempt.correctCount`, `totalQuestions`, `xpEarned` (final values)
- `UserProgress.xpTotal` (increments by `xpEarned`)
- `PlanetModeProgress` (updates best score and completion status)

**Verification Queries:**

```sql
-- Check finished quiz attempt
SELECT 
  id,
  "finishedAt",
  "correctCount",
  "totalQuestions",
  "xpEarned"
FROM quiz_attempts
WHERE id = '<attemptId>';
```

```sql
-- Check updated user progress (XP should increase)
SELECT 
  "userId",
  "xpTotal",
  streak,
  "lastActiveDate"
FROM user_progress
WHERE "userId" = 1;
```

```sql
-- Check planet mode progress (best score updated)
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
  AND "lessonId" = '<lessonId>'
  AND mode = '<mode>';
```

**Expected Results:**
- `quiz_attempts.finishedAt` set to current timestamp
- `user_progress.xpTotal` increased by `xpEarned`
- `planet_mode_progress.bestScore` updated if new score is higher
- `planet_mode_progress.state` set to 'completed' if all questions correct
- `planet_mode_progress.lastAttemptAt` updated

---

### 5. POST `/api/learning/hearts/consume`

**Updates:** `UserHearts.current` (decrements by 1)

**Verification Query:**
```sql
-- Check hearts before and after
SELECT 
  "userId",
  current,
  max,
  "lastRefillAt"
FROM user_hearts
WHERE "userId" = 1;
```

**Expected Result:** `current` decremented by 1 (minimum 0).

---

### 6. POST `/api/learning/hearts/recover`

**Updates:** `UserHearts.current` (restores to max, or increments)

**Verification Query:**
```sql
-- Check hearts after recovery
SELECT 
  "userId",
  current,
  max,
  "lastRefillAt"
FROM user_hearts
WHERE "userId" = 1;
```

**Expected Result:** `current` restored to `max` (typically 5).

---

## Complete Test Flow

### Test: Start Quiz → Answer Questions → Finish Quiz

```bash
# 1. Start a quiz
curl -X POST http://localhost:3001/api/learning/quiz/start \
  -H "Content-Type: application/json" \
  -H "x-user-id: user_1" \
  -d '{"lessonId": "lesson-1", "mode": "listening"}'

# Response contains attemptId, e.g., "clx123..."

# 2. Submit an answer
curl -X POST http://localhost:3001/api/learning/quiz/clx123.../answer \
  -H "Content-Type: application/json" \
  -H "x-user-id: user_1" \
  -d '{"answer": "option_1"}'

# 3. Finish the quiz
curl -X POST http://localhost:3001/api/learning/quiz/clx123.../finish \
  -H "x-user-id: user_1"
```

**Verify in Database:**
```sql
-- Check quiz attempt
SELECT * FROM quiz_attempts WHERE id = 'clx123...';

-- Check question attempts
SELECT * FROM question_attempts WHERE "attemptId" = 'clx123...';

-- Check user progress (XP should increase)
SELECT * FROM user_progress WHERE "userId" = 1;

-- Check planet mode progress
SELECT * FROM planet_mode_progress 
WHERE "userId" = 1 
  AND "lessonId" = 'lesson-1' 
  AND mode = 'listening';
```

---

## Persistence Test: Restart Services

To verify data persists across service restarts:

1. **Create data:**
   ```bash
   # Start quiz and submit answers
   curl -X POST http://localhost:3001/api/learning/quiz/start ...
   curl -X POST http://localhost:3001/api/learning/quiz/<attemptId>/answer ...
   ```

2. **Verify data exists:**
   ```sql
   SELECT COUNT(*) FROM quiz_attempts WHERE "userId" = 1;
   SELECT COUNT(*) FROM question_attempts WHERE "userId" = 1;
   ```

3. **Restart services:**
   ```bash
   # Stop NestJS service
   # Restart NestJS service
   ```

4. **Verify data still exists:**
   ```sql
   SELECT COUNT(*) FROM quiz_attempts WHERE "userId" = 1;
   SELECT COUNT(*) FROM question_attempts WHERE "userId" = 1;
   ```

5. **Verify you can read the data:**
   ```bash
   curl http://localhost:3001/api/learning/quiz/<attemptId>/question \
     -H "x-user-id: user_1"
   ```

**Expected:** Data should persist and be readable after restart.

---

## Summary Table

| Endpoint | HTTP Method | Prisma Model | Table Name | Write Type |
|----------|-------------|--------------|------------|------------|
| `/api/learning/lessons/:lessonId/start` | POST | `LessonSession` | `lesson_sessions` | INSERT |
| `/api/learning/quiz/start` | POST | `QuizAttempt` | `quiz_attempts` | INSERT |
| `/api/learning/quiz/:attemptId/answer` | POST | `QuestionAttempt`, `QuizAttempt`, `UserHearts` | `question_attempts`, `quiz_attempts`, `user_hearts` | INSERT, UPDATE |
| `/api/learning/quiz/:attemptId/finish` | POST | `QuizAttempt`, `UserProgress`, `PlanetModeProgress` | `quiz_attempts`, `user_progress`, `planet_mode_progress` | UPDATE |
| `/api/learning/hearts/consume` | POST | `UserHearts` | `user_hearts` | UPDATE |
| `/api/learning/hearts/recover` | POST | `UserHearts` | `user_hearts` | UPDATE |

---

## Troubleshooting

### No data written?

1. Check Prisma connection:
   ```bash
   # In NestJS logs, look for Prisma connection errors
   ```

2. Check database connection string:
   ```bash
   echo $DATABASE_URL
   ```

3. Check migrations:
   ```bash
   cd brainbattle-dou
   npx prisma migrate status
   ```

### Data not persisting?

1. Check transaction commits (Prisma auto-commits by default)
2. Check for database errors in NestJS logs
3. Verify PostgreSQL is running:
   ```bash
   docker-compose ps postgres
   ```

### Wrong user data?

1. Verify `x-user-id` header is being sent:
   ```bash
   curl -v -H "x-user-id: user_1" ...
   ```

2. Check `UserContextService` is resolving userId correctly
3. Verify database queries filter by `userId`

