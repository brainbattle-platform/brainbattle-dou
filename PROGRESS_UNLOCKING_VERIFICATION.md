# Progress & Unlocking System Verification Guide

This guide verifies that the per-lesson progress and unlocking system works correctly.

## Prerequisites

1. **Database Migration:**
   ```bash
   cd brainbattle-dou
   npx prisma generate
   npx prisma migrate dev --name add_progress_unlocking
   ```

2. **Start Service:**
   ```bash
   npm run start:dev
   ```

3. **Access Swagger UI:**
   ```
   http://localhost:3001/api/docs
   ```

## Required Headers

All user endpoints require:
- **Header:** `x-user-id`
- **Value:** `user_1` (or any user ID like `user_2`)
- **Default:** If missing, defaults to `user_1`

---

## System Overview

### Progress Model

**Table:** `planet_mode_progress`

**Fields:**
- `userId` (Int, PK)
- `lessonId` (String, PK) - Business key (e.g., "lesson-1-1")
- `mode` (String, PK) - "listening" | "speaking" | "reading" | "writing"
- `state` (String) - "available" | "locked" | "completed"
- `bestScore` (Float) - Best accuracy achieved (0.0 - 1.0)
- `completedAt` (DateTime?) - When mode was first completed
- `lastAttemptAt` (DateTime?) - Last attempt timestamp

**Unique Constraint:** `(userId, lessonId, mode)`

### Unlocking Logic

1. **First lesson in each unit:** Always `AVAILABLE`
2. **Subsequent lessons:** `LOCKED` until previous lesson is 100% complete (all 4 modes completed)
3. **Mode completion:** Accuracy >= 0.7 (70%) marks mode as `COMPLETED`
4. **Lesson completion:** All 4 modes completed (4/4) = 100% progress
5. **Auto-unlock:** When a lesson reaches 100%, the next lesson in the same unit is automatically unlocked

---

## Swagger Test Steps

### Step 1: Create Lesson with Questions for All 4 Modes

**Note:** This assumes you have admin access. If using seed data, skip to Step 2.

**1.1 Create Unit (if needed):**
```
POST /api/admin/learning/units
Headers: x-admin-key: dev-admin
Body:
{
  "unitId": "unit-1",
  "title": "Unit 1: Greetings",
  "order": 1,
  "published": true
}
```

**1.2 Create Lesson:**
```
POST /api/admin/learning/lessons
Headers: x-admin-key: dev-admin
Body:
{
  "lessonId": "lesson-1-1",
  "unitId": "unit-1",
  "title": "Lesson 1",
  "order": 1,
  "published": true
}
```

**1.3 Create Questions for Each Mode:**

**Listening:**
```
POST /api/admin/learning/questions
Headers: x-admin-key: dev-admin
Body:
{
  "questionId": "q-listening-01",
  "lessonId": "lesson-1-1",
  "mode": "listening",
  "prompt": "Listen and select the correct meaning of \"apple\"",
  "correctAnswer": "táo",
  "options": [
    { "text": "táo", "isCorrect": true, "order": 0 },
    { "text": "cam", "isCorrect": false, "order": 1 },
    { "text": "chuối", "isCorrect": false, "order": 2 },
    { "text": "nho", "isCorrect": false, "order": 3 }
  ],
  "published": true
}
```

**Repeat for:**
- Speaking: `q-speaking-01` with mode `"speaking"`
- Reading: `q-reading-01` with mode `"reading"`
- Writing: `q-writing-01` with mode `"writing"`

**Create 5 questions per mode** (total 20 questions for the lesson).

---

### Step 2: Verify Initial Map State

**Endpoint:** `GET /api/learning/map`

**Headers:**
```
x-user-id: user_1
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "unitId": "unit-1",
    "unitTitle": "Unit 1: Greetings",
    "skills": [
      {
        "skillId": "lesson-1-1",
        "title": "Lesson 1",
        "state": "CURRENT",
        "position": 0,
        "progressPercent": 0
      },
      {
        "skillId": "lesson-1-2",
        "title": "Lesson 2",
        "state": "LOCKED",
        "position": 1,
        "progressPercent": 0
      }
    ]
  }
}
```

**Verify:**
- First lesson has `state: "CURRENT"` and `progressPercent: 0`
- Subsequent lessons have `state: "LOCKED"`

---

### Step 3: Verify Modes for First Lesson

**Endpoint:** `GET /api/learning/skills/lesson-1-1/modes`

**Headers:**
```
x-user-id: user_1
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "skillId": "lesson-1-1",
    "skillTitle": "Lesson 1",
    "modes": [
      {
        "mode": "listening",
        "state": "AVAILABLE",
        "bestScore": 0.0
      },
      {
        "mode": "speaking",
        "state": "AVAILABLE",
        "bestScore": 0.0
      },
      {
        "mode": "reading",
        "state": "AVAILABLE",
        "bestScore": 0.0
      },
      {
        "mode": "writing",
        "state": "AVAILABLE",
        "bestScore": 0.0
      }
    ]
  }
}
```

**Verify:**
- All 4 modes are `AVAILABLE` (first lesson)
- `bestScore` is `0.0` for all modes

---

### Step 4: Complete Listening Mode

**4.1 Start Quiz:**
```
POST /api/learning/quiz/start
Headers: x-user-id: user_1
Body:
{
  "lessonId": "lesson-1-1",
  "mode": "listening"
}
```

**Response contains `attemptId`** (e.g., `"clx123..."`)

**4.2 Answer All Questions:**
```
POST /api/learning/quiz/{attemptId}/answer
Headers: x-user-id: user_1
Body:
{
  "answer": "táo"
}
```

**Repeat for all 5 questions** (answer correctly to get >= 70% accuracy).

**4.3 Finish Quiz:**
```
POST /api/learning/quiz/{attemptId}/finish
Headers: x-user-id: user_1
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "attemptId": "clx123...",
    "lessonId": "lesson-1-1",
    "result": {
      "correctCount": 5,
      "totalQuestions": 5,
      "accuracy": 1.0,
      "xpEarned": 50
    }
  }
}
```

**Verify:**
- `accuracy >= 0.7` (should be 1.0 if all correct)
- Mode should be marked as `COMPLETED` in DB

---

### Step 5: Verify Progress After One Mode

**5.1 Check Map:**
```
GET /api/learning/map
Headers: x-user-id: user_1
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "skillId": "lesson-1-1",
        "progressPercent": 25  // 1/4 modes completed
      }
    ]
  }
}
```

**5.2 Check Modes:**
```
GET /api/learning/skills/lesson-1-1/modes
Headers: x-user-id: user_1
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "modes": [
      {
        "mode": "listening",
        "state": "COMPLETED",
        "bestScore": 1.0
      },
      {
        "mode": "speaking",
        "state": "AVAILABLE",
        "bestScore": 0.0
      }
      // ... other modes
    ]
  }
}
```

---

### Step 6: Complete All 4 Modes

**Repeat Step 4 for:**
- Speaking mode
- Reading mode
- Writing mode

**After completing all 4 modes:**

**6.1 Verify Map Shows 100%:**
```
GET /api/learning/map
Headers: x-user-id: user_1
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "skillId": "lesson-1-1",
        "state": "COMPLETED",
        "progressPercent": 100  // 4/4 modes completed
      },
      {
        "skillId": "lesson-1-2",
        "state": "AVAILABLE",  // Unlocked!
        "progressPercent": 0
      }
    ]
  }
}
```

**6.2 Verify Next Lesson Unlocked:**
```
GET /api/learning/skills/lesson-1-2/modes
Headers: x-user-id: user_1
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "skillId": "lesson-1-2",
    "modes": [
      {
        "mode": "listening",
        "state": "AVAILABLE",  // Unlocked!
        "bestScore": 0.0
      }
      // ... all modes AVAILABLE
    ]
  }
}
```

---

## Database Verification (psql)

### Check Mode Progress

```sql
-- View all progress for user_1 and lesson-1-1
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
  AND "lessonId" = 'lesson-1-1'
ORDER BY mode;
```

**Expected After Completing All 4 Modes:**
```
 userId |  lessonId  |    mode    |   state   | bestScore |      completedAt      |     lastAttemptAt
--------+------------+------------+-----------+-----------+-----------------------+-----------------------
      1 | lesson-1-1 | listening  | completed |       1.0 | 2024-01-01 12:00:00   | 2024-01-01 12:00:00
      1 | lesson-1-1 | speaking   | completed |       1.0 | 2024-01-01 12:05:00   | 2024-01-01 12:05:00
      1 | lesson-1-1 | reading    | completed |       1.0 | 2024-01-01 12:10:00   | 2024-01-01 12:10:00
      1 | lesson-1-1 | writing    | completed |       1.0 | 2024-01-01 12:15:00   | 2024-01-01 12:15:00
```

### Check Next Lesson Unlocked

```sql
-- Check if next lesson (lesson-1-2) is unlocked
SELECT 
  "userId",
  "lessonId",
  mode,
  state
FROM planet_mode_progress
WHERE "userId" = 1
  AND "lessonId" = 'lesson-1-2'
ORDER BY mode;
```

**Expected After Unlocking:**
```
 userId |  lessonId  |    mode    |   state
--------+------------+------------+-----------
      1 | lesson-1-2 | listening  | available
      1 | lesson-1-2 | speaking   | available
      1 | lesson-1-2 | reading    | available
      1 | lesson-1-2 | writing    | available
```

### Count Completed Modes Per Lesson

```sql
-- Count completed modes for each lesson
SELECT 
  "lessonId",
  COUNT(*) FILTER (WHERE state = 'completed') as completed_count,
  COUNT(*) as total_modes
FROM planet_mode_progress
WHERE "userId" = 1
GROUP BY "lessonId"
ORDER BY "lessonId";
```

---

## Complete Test Flow Summary

1. ✅ **Create lesson with questions** (admin API or use seed data)
2. ✅ **Verify initial state:** First lesson CURRENT, others LOCKED
3. ✅ **Complete listening mode:** Start → Answer → Finish (accuracy >= 0.7)
4. ✅ **Verify progress:** Map shows 25% (1/4 modes)
5. ✅ **Complete remaining 3 modes:** Speaking, Reading, Writing
6. ✅ **Verify 100% completion:** Map shows 100%, lesson state = COMPLETED
7. ✅ **Verify next lesson unlocked:** lesson-1-2 state = AVAILABLE
8. ✅ **Verify DB persistence:** Check `planet_mode_progress` table

---

## Edge Cases to Test

### 1. Accuracy < 70% (Not Passing)

**Test:** Answer incorrectly to get < 70% accuracy

**Expected:**
- Mode `state` remains `AVAILABLE` (not `COMPLETED`)
- `bestScore` is updated but < 0.7
- Lesson does not unlock next lesson
- Progress remains < 100%

### 2. Retry After Failure

**Test:** Complete mode with < 70%, then retry and get >= 70%

**Expected:**
- First attempt: `state = AVAILABLE`, `bestScore < 0.7`
- Second attempt: `state = COMPLETED`, `bestScore >= 0.7`, `completedAt` set

### 3. Multiple Users

**Test:** Complete lesson as `user_1`, check as `user_2`

**Expected:**
- `user_2` sees lesson as LOCKED (if previous lesson not completed)
- Progress is per-user (isolated)

### 4. Last Lesson in Unit

**Test:** Complete the last lesson in a unit

**Expected:**
- Lesson shows `COMPLETED` with 100%
- No next lesson to unlock (no error, just no unlock)

---

## Troubleshooting

### Progress Not Updating?

1. **Check quiz finish was called:**
   ```sql
   SELECT * FROM quiz_attempts 
   WHERE "userId" = 1 
   ORDER BY "startedAt" DESC 
   LIMIT 5;
   ```

2. **Check mode progress:**
   ```sql
   SELECT * FROM planet_mode_progress 
   WHERE "userId" = 1 
   AND "lessonId" = 'lesson-1-1';
   ```

3. **Verify accuracy >= 0.7:**
   - Mode only completes if accuracy >= 0.7
   - Check `correctCount / totalQuestions` in quiz_attempts

### Next Lesson Not Unlocking?

1. **Verify all 4 modes completed:**
   ```sql
   SELECT COUNT(*) FROM planet_mode_progress
   WHERE "userId" = 1
     AND "lessonId" = 'lesson-1-1'
     AND state = 'completed';
   ```
   Should return `4`.

2. **Check next lesson exists:**
   ```sql
   SELECT * FROM lessons
   WHERE "unitId" = 'unit-1'
     AND "order" = 2
     AND published = true;
   ```

3. **Check unlock was called:**
   - Review NestJS logs for unlock messages
   - Check `planet_mode_progress` for next lesson has `state = 'available'`

### Map Shows Wrong State?

1. **Verify previous lesson completion:**
   ```sql
   SELECT COUNT(*) FROM planet_mode_progress
   WHERE "userId" = 1
     AND "lessonId" = 'lesson-1-1'
     AND state = 'completed';
   ```

2. **Check lesson order:**
   - Ensure lessons have correct `order` values
   - First lesson should have `order = 1`

---

## Summary

✅ **Progress Tracking:**
- Each mode completion (accuracy >= 0.7) stored in `planet_mode_progress`
- Progress percent = (completed modes / 4) * 100

✅ **Unlocking Logic:**
- First lesson: Always `AVAILABLE`
- Subsequent lessons: `LOCKED` until previous lesson is 100% complete
- Auto-unlock: When lesson reaches 100%, next lesson unlocked automatically

✅ **Persistence:**
- All progress stored in PostgreSQL via Prisma
- No in-memory state
- Survives service restarts

✅ **Identity:**
- All endpoints use `x-user-id` header (defaults to `user_1`)
- Progress is per-user (isolated)

