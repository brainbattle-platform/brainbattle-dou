# Prisma Persistence Migration Guide

This document describes the migration from in-memory state to Prisma + PostgreSQL persistence for the Learning Service.

## Overview

All Learning Service endpoints now persist data to PostgreSQL via Prisma. The following data is now persisted:

- **Quiz Attempts**: Stable `attemptId` stored in `quiz_attempts` table
- **Question Attempts**: Each submitted answer stored in `question_attempts` table
- **User Progress**: Progress tracking in `user_progress` and `planet_mode_progress` tables
- **User Hearts**: Hearts state persisted in `user_hearts` table

## Prerequisites

1. Docker and Docker Compose installed
2. Node.js and npm installed
3. PostgreSQL client (psql) for verification (optional)

## Setup Steps

### 1. Start PostgreSQL

```bash
cd brainbattle-dou
docker-compose up -d postgres
```

This starts PostgreSQL with a persistent volume (`postgres_data`) that survives container restarts.

### 2. Set Environment Variable

Ensure `DATABASE_URL` is set in your `.env` file:

```env
DATABASE_URL="postgresql://brain:brain@localhost:5432/brainbattle?schema=public"
```

### 3. Run Prisma Migration

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_quiz_attempts_and_persistence
```

This will:
- Create migration files in `prisma/migrations/`
- Apply the migration to the database
- Generate the Prisma client with new models

### 4. Start the Application

```bash
npm run start:dev
```

## Verification

### 1. Test API Endpoints

#### Start a Quiz

```bash
curl -X POST http://localhost:3000/learning/quiz/start \
  -H "Content-Type: application/json" \
  -d '{"lessonId": "lesson-1", "mode": "listening"}'
```

Save the `attemptId` from the response.

#### Submit an Answer

```bash
curl -X POST http://localhost:3000/learning/quiz/{attemptId}/answer \
  -H "Content-Type: application/json" \
  -d '{"answer": "Xin chào"}'
```

Replace `{attemptId}` with the actual attempt ID from step 1.

#### Finish Quiz

```bash
curl -X POST http://localhost:3000/learning/quiz/{attemptId}/finish
```

### 2. Verify Data in Database

#### Connect to PostgreSQL

```bash
docker exec -it brainbattle-dou-postgres-1 psql -U brain -d brainbattle
```

Or using psql directly:

```bash
psql -h localhost -U brain -d brainbattle
```

Password: `brain`

#### Query Quiz Attempts

```sql
-- List all quiz attempts
SELECT id, "userId", "lessonId", mode, "startedAt", "finishedAt", 
       "correctCount", "totalQuestions", "xpEarned"
FROM quiz_attempts
ORDER BY "startedAt" DESC
LIMIT 10;
```

#### Query Question Attempts

```sql
-- List all question attempts with answers
SELECT qa.id, qa."attemptId", qa."userId", qa."questionId", 
       qa."answerText", qa."answerJson", qa."isCorrect", qa."answeredAt"
FROM question_attempts qa
ORDER BY qa."answeredAt" DESC
LIMIT 10;
```

#### Query User Progress

```sql
-- Check user progress
SELECT "userId", "xpTotal", streak, "lastActiveDate"
FROM user_progress
WHERE "userId" = 1;
```

#### Query Planet Mode Progress

```sql
-- Check lesson progress by mode
SELECT "userId", "lessonId", mode, state, "bestScore", "completedAt"
FROM planet_mode_progress
WHERE "userId" = 1
ORDER BY "lessonId", mode;
```

#### Query User Hearts

```sql
-- Check hearts status
SELECT "userId", current, max, "lastRefillAt"
FROM user_hearts
WHERE "userId" = 1;
```

### 3. Persistence Test

#### Test Steps

1. **Start a quiz and submit answers:**
   ```bash
   # Start quiz
   ATTEMPT_ID=$(curl -s -X POST http://localhost:3000/learning/quiz/start \
     -H "Content-Type: application/json" \
     -d '{"lessonId": "lesson-1", "mode": "listening"}' | jq -r '.data.attemptId')
   
   echo "Attempt ID: $ATTEMPT_ID"
   
   # Submit answer
   curl -X POST http://localhost:3000/learning/quiz/$ATTEMPT_ID/answer \
     -H "Content-Type: application/json" \
     -d '{"answer": "test answer"}'
   ```

2. **Verify data exists in DB:**
   ```sql
   SELECT * FROM quiz_attempts WHERE id = '<ATTEMPT_ID>';
   SELECT * FROM question_attempts WHERE "attemptId" = '<ATTEMPT_ID>';
   ```

3. **Restart services:**
   ```bash
   # Stop application
   # (Ctrl+C or kill process)
   
   # Restart PostgreSQL (optional, to test volume persistence)
   docker-compose restart postgres
   
   # Restart application
   npm run start:dev
   ```

4. **Verify data persists:**
   ```bash
   # Get quiz question (should work with same attemptId)
   curl http://localhost:3000/learning/quiz/$ATTEMPT_ID/question
   
   # Query DB again
   psql -h localhost -U brain -d brainbattle -c \
     "SELECT * FROM quiz_attempts WHERE id = '$ATTEMPT_ID';"
   ```

5. **Expected Result:**
   - Quiz attempt should still exist in database
   - Question attempts should still exist
   - API should return the same attempt data
   - All data survives service restarts

## Database Schema

### quiz_attempts

Stores quiz attempts with stable `attemptId`:

- `id` (String, Primary Key): Stable attempt ID (cuid)
- `userId` (Int): User ID (hardcoded to 1 for MVP)
- `lessonId` (String): Lesson being practiced
- `mode` (String): Modality (listening/speaking/reading/writing)
- `unitId` (String): Unit this attempt belongs to
- `questionIds` (String[]): Ordered list of question IDs
- `startedAt` (DateTime): When attempt started
- `finishedAt` (DateTime?): When attempt finished (null if in progress)
- `correctCount` (Int): Number of correct answers
- `totalQuestions` (Int): Total questions in attempt
- `xpEarned` (Int): XP earned from this attempt

### question_attempts

Stores each submitted answer:

- `id` (String, Primary Key): Unique attempt ID
- `attemptId` (String, Foreign Key): References `quiz_attempts.id`
- `userId` (Int): User ID
- `questionId` (String): Question ID
- `selectedOptionId` (String?): For MCQ: selected option
- `answerText` (String?): For text-based answers
- `answerJson` (Json?): For complex answers (match, etc.)
- `isCorrect` (Boolean): Whether answer was correct
- `answeredAt` (DateTime): When answer was submitted
- `timeMs` (Int?): Time taken in milliseconds

### user_progress

User's overall learning progress:

- `userId` (Int, Primary Key)
- `xpTotal` (Int): Total XP earned
- `streak` (Int): Current streak
- `lastActiveDate` (DateTime): Last active date

### user_hearts

User's hearts state:

- `userId` (Int, Primary Key)
- `current` (Int): Current hearts available
- `max` (Int): Maximum hearts
- `lastRefillAt` (DateTime): When hearts last regenerated

### planet_mode_progress

Progress per lesson × mode combination:

- `userId` (Int, Part of Composite Key)
- `lessonId` (String, Part of Composite Key)
- `mode` (String, Part of Composite Key)
- `state` (String): available | locked | completed
- `bestScore` (Float): Best accuracy (0.0 - 1.0)
- `completedAt` (DateTime?): When first completed
- `lastAttemptAt` (DateTime?): Last practice time

## Troubleshooting

### Migration Fails

If migration fails, check:

1. PostgreSQL is running: `docker-compose ps`
2. Database connection: `DATABASE_URL` in `.env`
3. Existing migrations: `ls prisma/migrations/`

### Data Not Persisting

1. Check Prisma client is generated: `npx prisma generate`
2. Verify database connection in logs
3. Check for errors in application logs
4. Verify tables exist: `\dt` in psql

### Attempt Not Found

If `attemptId` is not found after restart:

1. Check if attempt exists in DB: `SELECT * FROM quiz_attempts WHERE id = '<attemptId>';`
2. Verify PrismaStateService is being used (not InMemoryStateService)
3. Check application logs for errors

## Rollback

To rollback to in-memory state:

1. Update `ProgressModule` to use `InMemoryStateService` instead of `PrismaStateService`
2. Update service injections to use `InMemoryStateService` directly
3. Restart application

Note: This will lose all persisted data. Use only for development/testing.

## Next Steps

1. **Authentication**: Replace hardcoded `userId = 1` with real user authentication
2. **Hearts Recovery**: Implement practice-based heart recovery logic
3. **Mistake Tracking**: Implement mistake tracking for practice hub
4. **Spaced Repetition**: Implement spaced repetition algorithm
5. **Analytics**: Add analytics queries for user progress

---

**End of Migration Guide**

