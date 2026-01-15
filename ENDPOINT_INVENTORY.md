# Endpoint Inventory & Classification Report

Generated: 2024

## Summary

This report classifies all endpoints under `/api/duo/*` and `/api/learning/*` based on their persistence mechanism and current status.

## Classification Legend

- **DB_PERSISTED**: Uses Prisma writes/reads for main data/state (PostgreSQL)
- **READ_ONLY_DB**: Reads from DB but no writes
- **IN_MEMORY**: Uses InMemoryStateService or any in-memory store
- **LEGACY/DEBUG**: Fallback, compatibility, or test endpoints

## Endpoint Inventory

### `/api/learning/*` Endpoints (LearningController)

| Endpoint | Method | Controller File | Service Used | Uses Prisma? | Writes DB? | Notes | Recommended Action |
|----------|--------|----------------|--------------|--------------|------------|-------|-------------------|
| `/api/learning/map` | GET | `learning.controller.ts` | `LearningService` → `PrismaStateService` | Y | N | Reads user progress from DB | **KEEP** |
| `/api/learning/units/:unitId/skills` | GET | `learning.controller.ts` | `LearningService` → `PrismaStateService` | Y | N | Reads progress from DB | **KEEP** |
| `/api/learning/skills/:skillId/modes` | GET | `learning.controller.ts` | `LearningService` → `PrismaStateService` | Y | N | Reads mode progress from DB | **KEEP** |
| `/api/learning/lessons/:lessonId` | GET | `learning.controller.ts` | `LearningService` → `LessonService` | N | N | Static lesson data (seed) | **KEEP** |
| `/api/learning/lessons/:lessonId/overview` | GET | `learning.controller.ts` | `LearningService` → `PrismaStateService`, `PrismaHeartsService` | Y | N | Reads progress and hearts from DB | **KEEP** |
| `/api/learning/lessons/:lessonId/start` | POST | `learning.controller.ts` | `LearningService` → `LessonService` → `PrismaStateService` | Y | Y | Creates session in DB (`LessonSession`) | **KEEP** |
| `/api/learning/quiz/start` | POST | `learning.controller.ts` | `LearningService` → `PrismaStateService`, `PrismaHeartsService` | Y | Y | Creates quiz attempt in DB (`QuizAttempt`) | **KEEP** |
| `/api/learning/quiz/:attemptId/question` | GET | `learning.controller.ts` | `LearningService` → `PrismaStateService` | Y | N | Reads session from DB | **KEEP** |
| `/api/learning/quiz/:attemptId/answer` | POST | `learning.controller.ts` | `LearningService` → `PrismaStateService`, `PrismaHeartsService` | Y | Y | Writes answer to DB (`QuestionAttempt`), updates hearts | **KEEP** |
| `/api/learning/quiz/:attemptId/next` | POST | `learning.controller.ts` | `LearningService` → `PrismaStateService` | Y | N | Reads session from DB | **KEEP** |
| `/api/learning/quiz/:attemptId/finish` | POST | `learning.controller.ts` | `LearningService` → `PrismaStateService` | Y | Y | Updates quiz attempt in DB (finishes session) | **KEEP** |
| `/api/learning/hearts` | GET | `learning.controller.ts` | `LearningService` → `PrismaHeartsService` | Y | N | Reads hearts from DB (`UserHearts`) | **KEEP** |
| `/api/learning/hearts/consume` | POST | `learning.controller.ts` | `LearningService` → `PrismaHeartsService` | Y | Y | Updates hearts in DB (`UserHearts`) | **KEEP** |
| `/api/learning/hearts/recover` | POST | `learning.controller.ts` | `LearningService` → `PrismaHeartsService` | Y | Y | Updates hearts in DB (`UserHearts`) | **KEEP** |
| `/api/learning/practice/hub` | GET | `learning.controller.ts` | `LearningService` → `PrismaStateService` | Y | N | Reads progress from DB | **KEEP** |
| `/api/learning/practice/start` | POST | `learning.controller.ts` | `LearningService` → `PrismaStateService` | Y | Y | Creates quiz attempt in DB | **KEEP** |

**Summary for `/api/learning/*`**: All 16 endpoints use Prisma and are DB-backed. ✅

---

### `/api/duo/*` Endpoints (Legacy Controllers)

#### LessonController (`/api/duo/*`)

| Endpoint | Method | Controller File | Service Used | Uses Prisma? | Writes DB? | Notes | Recommended Action |
|----------|--------|----------------|--------------|--------------|------------|-------|-------------------|
| `/api/duo/map` | GET | `lesson.controller.ts` | `LessonService`, `InMemoryStateService` | N | N | Uses in-memory state | **HIDE** |
| `/api/duo/home` | GET | `lesson.controller.ts` | `InMemoryStateService` | N | N | Uses in-memory progress | **HIDE** |
| `/api/duo/skills/:skillId/lessons` | GET | `lesson.controller.ts` | `LessonService` | N | N | Static lesson data | **HIDE** |
| `/api/duo/lessons/:id` | GET | `lesson.controller.ts` | `LessonService` | N | N | Static lesson data | **HIDE** |
| `/api/duo/lessons/:lessonId/modes` | GET | `lesson.controller.ts` | `InMemoryStateService` | N | N | Uses in-memory state | **HIDE** |
| `/api/duo/lessons/:lessonId/overview` | GET | `lesson.controller.ts` | `InMemoryStateService`, `HeartsService` | N | N | Uses in-memory state | **HIDE** |
| `/api/duo/lessons/:id/exercises` | GET | `lesson.controller.ts` | `ExerciseService` | N | N | Static exercise data (debug) | **HIDE** |
| `/api/duo/lesson/start` | POST | `lesson.controller.ts` | `LessonService`, `InMemoryStateService`, `HeartsService` | N | N | Uses in-memory state | **HIDE** |
| `/api/duo/lesson/finish` | POST | `lesson.controller.ts` | `LessonService` → `InMemoryStateService` | N | N | Uses in-memory state | **HIDE** |

#### AnswerController (`/api/duo/*`)

| Endpoint | Method | Controller File | Service Used | Uses Prisma? | Writes DB? | Notes | Recommended Action |
|----------|--------|----------------|--------------|--------------|------------|-------|-------------------|
| `/api/duo/sessions/:sessionId/answer` | POST | `answer.controller.ts` | `AnswerService` → `InMemoryStateService`, `HeartsService` | N | N | Uses in-memory state (legacy) | **HIDE** |
| `/api/duo/lessons/:lessonId/answer` | POST | `answer.controller.ts` | `AnswerService` → `InMemoryStateService` | N | N | Uses in-memory state (legacy) | **HIDE** |

#### ProgressController (`/api/duo/progress/*`)

| Endpoint | Method | Controller File | Service Used | Uses Prisma? | Writes DB? | Notes | Recommended Action |
|----------|--------|----------------|--------------|--------------|------------|-------|-------------------|
| `/api/duo/progress` | GET | `progress.controller.ts` | `ProgressService` → `InMemoryStateService` | N | N | Uses in-memory progress | **HIDE** |
| `/api/duo/progress/health` | GET | `progress.controller.ts` | N/A | N | N | Health check | **HIDE** |

#### ExerciseController (`/api/duo/exercises/*`)

| Endpoint | Method | Controller File | Service Used | Uses Prisma? | Writes DB? | Notes | Recommended Action |
|----------|--------|----------------|--------------|--------------|------------|-------|-------------------|
| `/api/duo/exercises/health` | GET | `exercise.controller.ts` | N/A | N | N | Health check (debug) | **HIDE** |

#### Other Controllers (Health Checks Only)

| Endpoint | Method | Controller File | Service Used | Uses Prisma? | Writes DB? | Notes | Recommended Action |
|----------|--------|----------------|--------------|--------------|------------|-------|-------------------|
| `/api/duo/user-profile/health` | GET | `user-profile.controller.ts` | N/A | N | N | Health check (debug) | **HIDE** |
| `/api/duo/telemetry/health` | GET | `telemetry.controller.ts` | N/A | N | N | Health check (debug) | **HIDE** |
| `/api/duo/recommend/health` | GET | `recommend.controller.ts` | N/A | N | N | Health check (debug) | **HIDE** |
| `/api/duo/skill/health` | GET | `skill.controller.ts` | N/A | N | N | Health check (debug) | **HIDE** |
| `/api/duo/review/health` | GET | `review.controller.ts` | N/A | N | N | Health check (debug) | **HIDE** |
| `/api/duo/notification/health` | GET | `notification.controller.ts` | N/A | N | N | Health check (debug) | **HIDE** |
| `/api/duo/language/health` | GET | `language.controller.ts` | N/A | N | N | Health check (debug) | **HIDE** |
| `/api/duo/course/health` | GET | `course.controller.ts` | N/A | N | N | Health check (debug) | **HIDE** |

**Summary for `/api/duo/*`**: All 20 endpoints are IN_MEMORY or DEBUG. ❌

---

## Database Models Used by DB_PERSISTED Endpoints

### Prisma Models (PostgreSQL Tables)

1. **`QuizAttempt`** (`quiz_attempts` table)
   - Used by: `/api/learning/quiz/start`, `/api/learning/quiz/:attemptId/finish`
   - Fields: `id`, `userId`, `lessonId`, `mode`, `unitId`, `questionIds`, `startedAt`, `finishedAt`, `correctCount`, `totalQuestions`, `xpEarned`

2. **`QuestionAttempt`** (`question_attempts` table)
   - Used by: `/api/learning/quiz/:attemptId/answer`
   - Fields: `id`, `attemptId`, `userId`, `questionId`, `selectedOptionId`, `answerText`, `answerJson`, `isCorrect`, `answeredAt`, `timeMs`

3. **`LessonSession`** (`lesson_sessions` table)
   - Used by: `/api/learning/lessons/:lessonId/start`
   - Fields: `id`, `userId`, `unitId`, `lessonId`, `mode`, `startedAt`, `finishedAt`, `totalQuestions`, `questionIds`, `answeredCount`, `correctCount`, `xpEarnedTotal`

4. **`UserProgress`** (`user_progress` table)
   - Used by: All read endpoints (map, skills, modes, practice hub)
   - Fields: `userId`, `xpTotal`, `streak`, `lastActiveDate`, `skillMastery`

5. **`UserHearts`** (`user_hearts` table)
   - Used by: `/api/learning/hearts/*`
   - Fields: `userId`, `current`, `max`, `lastRefillAt`

6. **`PlanetModeProgress`** (via `UserProgress.skillMastery` or computed from `QuizAttempt`)
   - Used by: Progress tracking endpoints
   - Computed from: `QuizAttempt` records grouped by `lessonId` and `mode`

---

## Recommended Actions Summary

### KEEP (16 endpoints)
- All `/api/learning/*` endpoints (DB-backed, follow Learning spec)

### HIDE (20 endpoints)
- All `/api/duo/*` endpoints (legacy, in-memory, or debug)

---

## Next Steps

1. Hide all `/api/duo/*` endpoints from Swagger using `@ApiExcludeEndpoint()` or `@ApiExcludeController()`
2. Add `SHOW_LEGACY_SWAGGER` environment flag (default: `false`)
3. When `SHOW_LEGACY_SWAGGER=true`, show legacy endpoints for debugging
4. Verify all `/api/learning/*` endpoints write to PostgreSQL correctly

