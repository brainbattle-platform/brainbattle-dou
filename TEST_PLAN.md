# Test Plan: User-Personalized Learning Flow

## Prerequisites

1. Start the service:
   ```bash
   cd brainbattle-dou
   npm run start:dev
   ```

2. Service should be running at `http://localhost:3001`

## Test Scenarios

### 1. Get Learning Map (User-Specific Progress)

```bash
# User 1
curl -X GET "http://localhost:3001/api/learning/map" \
  -H "x-user-id: 1" \
  -H "Content-Type: application/json"

# Expected: Returns map with progress states for user 1
# Response includes: unitId, unitTitle, skills array with state (LOCKED/AVAILABLE/COMPLETED/CURRENT) and progressPercent
```

### 2. Get Lesson Modes (User-Specific Mode States)

```bash
# User 1 - Get modes for lesson-1-1
curl -X GET "http://localhost:3001/api/learning/lessons/lesson-1-1/modes" \
  -H "x-user-id: 1" \
  -H "Content-Type: application/json"

# Expected: Returns array of 4 modes (listening, speaking, reading, writing)
# Each mode includes: mode, state, bestScore, completedAt, lastAttemptAt
```

### 3. Start Lesson (Creates Attempt for User)

```bash
# User 1 - Start listening mode
curl -X POST "http://localhost:3001/api/learning/lessons/lesson-1-1/start" \
  -H "x-user-id: 1" \
  -H "Content-Type: application/json" \
  -d '{"mode": "listening"}'

# Expected: Creates quiz attempt for user 1, returns sessionId, lessonId, mode, question
# Note: If user already has an unfinished attempt, it may resume that instead
```

### 4. Start Quiz (Creates Attempt for User)

```bash
# User 1 - Start quiz
curl -X POST "http://localhost:3001/api/learning/quiz/start" \
  -H "x-user-id: 1" \
  -H "Content-Type: application/json" \
  -d '{"lessonId": "lesson-1-1", "mode": "reading"}'

# Expected: Creates quiz attempt for user 1, returns attemptId, first question
# Save the attemptId from response for next steps
```

### 5. Get Next Question (Validates Ownership)

```bash
# User 1 - Get next question (replace {attemptId} with actual ID from step 4)
curl -X GET "http://localhost:3001/api/learning/quiz/{attemptId}/question" \
  -H "x-user-id: 1" \
  -H "Content-Type: application/json"

# Expected: Returns next unanswered question for this attempt

# User 2 - Try to access User 1's attempt (should fail)
curl -X GET "http://localhost:3001/api/learning/quiz/{attemptId}/question" \
  -H "x-user-id: 2" \
  -H "Content-Type: application/json"

# Expected: 404 "Quiz attempt not found or access denied"
```

### 6. Submit Answer (Validates Ownership)

```bash
# User 1 - Submit answer (replace {attemptId} with actual ID)
curl -X POST "http://localhost:3001/api/learning/quiz/{attemptId}/answer" \
  -H "x-user-id: 1" \
  -H "Content-Type: application/json" \
  -d '{"answer": "In the bathroom"}'

# Expected: Returns isCorrect, correctAnswer, explanation, heartsRemaining

# User 2 - Try to submit to User 1's attempt (should fail)
curl -X POST "http://localhost:3001/api/learning/quiz/{attemptId}/answer" \
  -H "x-user-id: 2" \
  -H "Content-Type: application/json" \
  -d '{"answer": "test"}'

# Expected: 404 "Quiz attempt not found or access denied"
```

### 7. Move to Next Question (Validates Ownership)

```bash
# User 1 - Get next question
curl -X POST "http://localhost:3001/api/learning/quiz/{attemptId}/next" \
  -H "x-user-id: 1" \
  -H "Content-Type: application/json"

# Expected: Returns next question

# User 2 - Try to access (should fail)
curl -X POST "http://localhost:3001/api/learning/quiz/{attemptId}/next" \
  -H "x-user-id: 2" \
  -H "Content-Type: application/json"

# Expected: 404 "Quiz attempt not found or access denied"
```

### 8. Finish Quiz (Validates Ownership & Finalizes Progress)

```bash
# User 1 - Finish quiz (after answering all questions)
curl -X POST "http://localhost:3001/api/learning/quiz/{attemptId}/finish" \
  -H "x-user-id: 1" \
  -H "Content-Type: application/json"

# Expected: Returns result with correctCount, totalQuestions, accuracy, xpEarned
# Also updates PlanetModeProgress for user 1

# User 2 - Try to finish User 1's quiz (should fail)
curl -X POST "http://localhost:3001/api/learning/quiz/{attemptId}/finish" \
  -H "x-user-id: 2" \
  -H "Content-Type: application/json"

# Expected: 404 "Quiz attempt not found or access denied"
```

### 9. Verify User Isolation

```bash
# User 1 - Check their progress
curl -X GET "http://localhost:3001/api/learning/lessons/lesson-1-1/modes" \
  -H "x-user-id: 1"

# User 2 - Check their progress (should be different/empty)
curl -X GET "http://localhost:3001/api/learning/lessons/lesson-1-1/modes" \
  -H "x-user-id: 2"

# Expected: Each user sees their own progress (bestScore, state, completedAt)
```

### 10. Missing Header (Should Fail)

```bash
# Request without x-user-id header
curl -X GET "http://localhost:3001/api/learning/map" \
  -H "Content-Type: application/json"

# Expected: 400 { "message": "x-user-id required" }
```

## Expected Behavior Summary

1. **User Isolation**: Each user (userId) sees only their own progress and attempts
2. **Ownership Validation**: All attempt operations (next, answer, finish) validate userId matches
3. **Progress Tracking**: Mode states (bestScore, state, completedAt) are user-specific
4. **Map Personalization**: Learning map shows user-specific states (LOCKED/AVAILABLE/COMPLETED/CURRENT)
5. **No Hardcoded Users**: All methods use userId from header, no defaults

## Notes

- Replace `{attemptId}` with actual attempt IDs from responses
- User IDs can be any number (1, 2, 3, etc.) or string format ("1", "user_1", "user-1")
- All learning routes require `x-user-id` header
- Hearts logic remains unchanged (user-specific via userId)

