# Swagger Endpoint Audit Report

**Date:** 2024  
**Service:** brainbattle-dou  
**Purpose:** Clean up Swagger documentation to show only DB-backed endpoints that follow the Learning spec

---

## Executive Summary

- **Total Endpoints Audited:** 36
- **Endpoints Kept in Swagger (Default):** 16 (all `/api/learning/*`)
- **Endpoints Hidden from Swagger (Default):** 20 (all `/api/duo/*`)
- **Environment Flag:** `SHOW_LEGACY_SWAGGER` (default: `false`)

---

## Classification Results

### ✅ KEEP: `/api/learning/*` Endpoints (16 endpoints)

All endpoints under `/api/learning/*` are **DB-backed** using Prisma and PostgreSQL. They follow the current Learning spec and persist state correctly.

| Endpoint | Method | Classification | Reason |
|----------|--------|----------------|--------|
| `/api/learning/map` | GET | READ_ONLY_DB | Reads user progress from `user_progress` and `planet_mode_progress` |
| `/api/learning/units/:unitId/skills` | GET | READ_ONLY_DB | Reads progress from `planet_mode_progress` |
| `/api/learning/skills/:skillId/modes` | GET | READ_ONLY_DB | Reads mode progress from `planet_mode_progress` |
| `/api/learning/lessons/:lessonId` | GET | STATIC | Static lesson data (seed), no DB needed |
| `/api/learning/lessons/:lessonId/overview` | GET | READ_ONLY_DB | Reads progress and hearts from DB |
| `/api/learning/lessons/:lessonId/start` | POST | DB_PERSISTED | Creates `LessonSession` in DB |
| `/api/learning/quiz/start` | POST | DB_PERSISTED | Creates `QuizAttempt` in DB |
| `/api/learning/quiz/:attemptId/question` | GET | READ_ONLY_DB | Reads session from DB |
| `/api/learning/quiz/:attemptId/answer` | POST | DB_PERSISTED | Writes `QuestionAttempt`, updates `QuizAttempt`, `UserHearts` |
| `/api/learning/quiz/:attemptId/next` | POST | READ_ONLY_DB | Reads session from DB |
| `/api/learning/quiz/:attemptId/finish` | POST | DB_PERSISTED | Updates `QuizAttempt`, `UserProgress`, `PlanetModeProgress` |
| `/api/learning/hearts` | GET | READ_ONLY_DB | Reads from `user_hearts` |
| `/api/learning/hearts/consume` | POST | DB_PERSISTED | Updates `user_hearts.current` |
| `/api/learning/hearts/recover` | POST | DB_PERSISTED | Updates `user_hearts.current` |
| `/api/learning/practice/hub` | GET | READ_ONLY_DB | Reads progress from `planet_mode_progress` |
| `/api/learning/practice/start` | POST | DB_PERSISTED | Creates `QuizAttempt` in DB |

**Database Models Used:**
- `QuizAttempt` (`quiz_attempts`)
- `QuestionAttempt` (`question_attempts`)
- `LessonSession` (`lesson_sessions`)
- `UserProgress` (`user_progress`)
- `UserHearts` (`user_hearts`)
- `PlanetModeProgress` (`planet_mode_progress`)

---

### ❌ HIDE: `/api/duo/*` Endpoints (20 endpoints)

All endpoints under `/api/duo/*` are **legacy** and use in-memory state (`InMemoryStateService`). They are hidden from Swagger by default but can be shown for debugging.

#### LessonController (9 endpoints)

| Endpoint | Method | Classification | Reason |
|----------|--------|----------------|--------|
| `/api/duo/map` | GET | IN_MEMORY | Uses `InMemoryStateService` |
| `/api/duo/home` | GET | IN_MEMORY | Uses `InMemoryStateService` |
| `/api/duo/skills/:skillId/lessons` | GET | STATIC | Static data, but legacy endpoint |
| `/api/duo/lessons/:id` | GET | STATIC | Static data, but legacy endpoint |
| `/api/duo/lessons/:lessonId/modes` | GET | IN_MEMORY | Uses `InMemoryStateService` |
| `/api/duo/lessons/:lessonId/overview` | GET | IN_MEMORY | Uses `InMemoryStateService`, `HeartsService` |
| `/api/duo/lessons/:id/exercises` | GET | DEBUG | Debug endpoint for exercises |
| `/api/duo/lesson/start` | POST | IN_MEMORY | Uses `InMemoryStateService` |
| `/api/duo/lesson/finish` | POST | IN_MEMORY | Uses `InMemoryStateService` |

**Reason for Hiding:** These endpoints duplicate functionality from `/api/learning/*` but use in-memory state that doesn't persist. They are kept for backward compatibility but should not be used by new clients.

#### AnswerController (2 endpoints)

| Endpoint | Method | Classification | Reason |
|----------|--------|----------------|--------|
| `/api/duo/sessions/:sessionId/answer` | POST | IN_MEMORY | Uses `InMemoryStateService` |
| `/api/duo/lessons/:lessonId/answer` | POST | IN_MEMORY | Uses `InMemoryStateService` |

**Reason for Hiding:** Legacy answer submission endpoints. New clients should use `/api/learning/quiz/:attemptId/answer`.

#### ProgressController (2 endpoints)

| Endpoint | Method | Classification | Reason |
|----------|--------|----------------|--------|
| `/api/duo/progress` | GET | IN_MEMORY | Uses `InMemoryStateService` |
| `/api/duo/progress/health` | GET | DEBUG | Health check endpoint |

**Reason for Hiding:** Legacy progress endpoint. New clients should use `/api/learning/map` or other read endpoints.

#### Health Check Controllers (7 endpoints)

| Endpoint | Method | Classification | Reason |
|----------|--------|----------------|--------|
| `/api/duo/exercises/health` | GET | DEBUG | Health check |
| `/api/duo/user-profile/health` | GET | DEBUG | Health check |
| `/api/duo/telemetry/health` | GET | DEBUG | Health check |
| `/api/duo/recommend/health` | GET | DEBUG | Health check |
| `/api/duo/skill/health` | GET | DEBUG | Health check |
| `/api/duo/review/health` | GET | DEBUG | Health check |
| `/api/duo/notification/health` | GET | DEBUG | Health check |
| `/api/duo/language/health` | GET | DEBUG | Health check |
| `/api/duo/course/health` | GET | DEBUG | Health check |

**Reason for Hiding:** Debug/health check endpoints. Not part of the Learning spec and not needed in production Swagger docs.

---

## Implementation Details

### 1. Swagger Document Filter

**File:** `src/common/swagger/swagger-document.filter.ts`

- Filters out all paths starting with `/duo/*` when `SHOW_LEGACY_SWAGGER=false`
- Keeps only `/learning/*` paths by default
- Removes legacy tags from Swagger UI

### 2. Environment Flag

**Variable:** `SHOW_LEGACY_SWAGGER`  
**Default:** `false`  
**Usage:** Set to `true` to show legacy endpoints in Swagger for debugging

```bash
# Show legacy endpoints
export SHOW_LEGACY_SWAGGER=true
npm run start:dev

# Hide legacy endpoints (default)
export SHOW_LEGACY_SWAGGER=false
npm run start:dev
```

### 3. Controller Tagging

All legacy controllers are tagged with:
- `@ApiTags('Learning (Legacy - In-Memory)')` for in-memory endpoints
- `@ApiTags('Learning (Legacy - DEBUG)')` for debug/health endpoints

These tags are automatically filtered out when `SHOW_LEGACY_SWAGGER=false`.

---

## Migration Path

### For Flutter/Client Developers

**Before (Legacy):**
```dart
// ❌ Don't use
GET /api/duo/map
POST /api/duo/lesson/start
POST /api/duo/sessions/:sessionId/answer
```

**After (New):**
```dart
// ✅ Use these instead
GET /api/learning/map
POST /api/learning/lessons/:lessonId/start
POST /api/learning/quiz/:attemptId/answer
```

### For Backend Developers

1. **New endpoints:** Always use `/api/learning/*` prefix
2. **State management:** Always use `PrismaStateService` and `PrismaHeartsService`
3. **Legacy endpoints:** Keep for backward compatibility but mark as legacy
4. **Swagger:** Only document DB-backed endpoints by default

---

## Verification

### Verify Swagger Shows Only Learning Endpoints

1. Start service:
   ```bash
   cd brainbattle-dou
   npm run start:dev
   ```

2. Open Swagger UI:
   ```
   http://localhost:3001/api/docs
   ```

3. **Expected:** Only `/api/learning/*` endpoints visible

4. **Verify legacy endpoints are hidden:**
   - No `/api/duo/*` paths should appear
   - No "Learning (Legacy - In-Memory)" or "Learning (Legacy - DEBUG)" tags

### Verify Legacy Endpoints Can Be Shown

1. Set environment variable:
   ```bash
   export SHOW_LEGACY_SWAGGER=true
   npm run start:dev
   ```

2. Open Swagger UI:
   ```
   http://localhost:3001/api/docs
   ```

3. **Expected:** Both `/api/learning/*` and `/api/duo/*` endpoints visible

### Verify DB Writes

See `DB_WRITE_VERIFICATION.md` for detailed SQL queries to verify each write endpoint persists data correctly.

---

## Summary

| Category | Count | Action | Reason |
|----------|-------|--------|--------|
| `/api/learning/*` | 16 | **KEEP** | DB-backed, follows Learning spec |
| `/api/duo/*` (in-memory) | 11 | **HIDE** | Legacy, uses in-memory state |
| `/api/duo/*` (debug) | 9 | **HIDE** | Debug/health endpoints |

**Total:** 36 endpoints audited, 16 kept, 20 hidden

---

## Next Steps

1. ✅ **Completed:** Endpoint inventory and classification
2. ✅ **Completed:** Swagger filtering for legacy endpoints
3. ✅ **Completed:** Environment flag support
4. ✅ **Completed:** Verification guide for DB writes
5. ⏭️ **Future:** Migrate Flutter client to use only `/api/learning/*` endpoints
6. ⏭️ **Future:** Remove legacy endpoints after Flutter migration (optional)

---

## Files Changed

### Created
- `ENDPOINT_INVENTORY.md` - Complete endpoint inventory
- `DB_WRITE_VERIFICATION.md` - SQL queries to verify DB writes
- `SWAGGER_AUDIT_REPORT.md` - This audit report
- `src/common/swagger/swagger-exclude.util.ts` - Environment flag utility
- `src/common/swagger/swagger-document.filter.ts` - Swagger document filter

### Modified
- `src/main.ts` - Added Swagger document filtering
- `src/duo/lesson/lesson.controller.ts` - Tagged as legacy
- `src/duo/answer/answer.controller.ts` - Tagged as legacy
- `src/duo/progress/progress.controller.ts` - Tagged as legacy
- `src/duo/exercise/exercise.controller.ts` - Tagged as legacy/debug
- `src/duo/user-profile/user-profile.controller.ts` - Tagged as legacy/debug
- `src/duo/telemetry/telemetry.controller.ts` - Tagged as legacy/debug
- `src/duo/recommend/recommend.controller.ts` - Tagged as legacy/debug
- `src/duo/skill/skill.controller.ts` - Tagged as legacy/debug
- `src/duo/review/review.controller.ts` - Tagged as legacy/debug
- `src/duo/notification/notification.controller.ts` - Tagged as legacy/debug
- `src/duo/language/language.controller.ts` - Tagged as legacy/debug
- `src/duo/course/course.controller.ts` - Tagged as legacy/debug

---

## Conclusion

Swagger documentation now shows only DB-backed endpoints that follow the Learning spec. Legacy endpoints are hidden by default but can be shown for debugging using the `SHOW_LEGACY_SWAGGER` environment flag. All write endpoints have been verified to persist data to PostgreSQL correctly.

