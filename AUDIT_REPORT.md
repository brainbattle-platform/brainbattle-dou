# BrainBattle Duo Backend Audit Report
## Figma Learning Flow vs Current Implementation

**Date:** 2026-01-10  
**Scope:** 6 core MVP endpoints (Unit → Planet → 4 modes flow)  
**Current Codebase:** `src/duo/` modules

---

## Executive Summary

- **3 endpoints partially exist** with route/payload mismatches (`/lesson/start`, `/lesson/finish`, answer endpoint)
- **3 endpoints completely missing** (`/map`, `/lessons/:lessonId/modes`, `/lessons/:lessonId/overview`)
- **Content model is aligned**: Units (skills) → Planets (lessons) → 4 modality exercises structure exists
- **Key gaps**: Hearts system, mode-specific sessions, planet progress tracking, UI placement data
- **Ready fields**: Mode field exists, exercises have correctAnswer, estimatedMinutes available
- **Estimated effort**: Medium (5-7 endpoints to add/modify, hearts system to implement)

---

## Endpoint Checklist

| Endpoint | Status | Current Route | Key Missing Fields | Notes |
|----------|--------|---------------|-------------------|-------|
| `GET /api/duo/map` | ❌ Missing | N/A (closest: `GET /api/duo/home`) | `units[]`, `planets[]`, `activeUnitId`, `planets[].state`, `planets[].progress.completedModes`, `planets[].ui.{orbitIndex,angle,size}` | `/home` returns user progress only, not map structure |
| `GET /api/duo/lessons/:lessonId/modes` | ❌ Missing | N/A (closest: `GET /api/duo/lessons/:id/exercises`) | `modes[]` array with `{mode, state, bestScore}`, `unitId` | `/exercises` returns full exercise data, not mode summary |
| `GET /api/duo/lessons/:lessonId/overview` | ❌ Missing | N/A (closest: `GET /api/duo/lessons/:id`) | `xpReward`, `questionCount`, `streakProtect`, `hearts.{current,max,regen}`, `mode` query param | `/lessons/:id` has `estimatedMinutes` but missing other fields |
| `POST /api/duo/lesson/start` | ⚠ Partially exists | `POST /api/duo/lesson/start` | `mode` in request, `mode` in response, `totalQuestions` (has `totalCount`), `hearts`, single `question` object (returns `exercises[]` instead) | Route exists but payload differs: returns all exercises vs per-question flow |
| `POST /api/duo/sessions/:sessionId/answer` | ⚠ Partially exists | `POST /api/duo/lessons/:lessonId/answer` | Route mismatch (uses `lessonId` not `sessionId`), `explanation`, `hearts`, `progress.percent`, `next.question` object, `outOfHearts` flag | Route structure differs; response missing explanation/hearts/next question |
| `POST /api/duo/lesson/finish` | ⚠ Partially exists | `POST /api/duo/lesson/finish` | `mode` in response, `planetProgress.completedModes` (has `skillProgress.mastery` instead) | Route matches; needs mode tracking and planet progress format |

---

## Content/Seed Alignment

### What Exists ✅

1. **Unit (Topic) Structure**: 
   - Location: `src/duo/lesson/lesson.service.ts:23-26`
   - `skills[]` array with `skillId`, `title`, `order` (maps to Units)
   - Current: 2 units (Basics, Greetings)

2. **Planet (Lesson) Structure**:
   - Location: `src/duo/lesson/lesson.service.ts:28-79`
   - `lessons[]` with `lessonId`, `skillId` (unitId), `title`, `description`, `order`, `estimatedMinutes`
   - Current: 6 planets (3 per unit)

3. **Mode Support**:
   - Location: `src/duo/exercise/exercise.service.ts:3-11`
   - Exercise interface includes `mode: 'listening' | 'speaking' | 'reading' | 'writing'`
   - Seed data has 4 exercises per planet (one per modality)
   - Total: 24 exercises (2 units × 3 planets × 4 modes)

4. **Exercise Data**:
   - `exerciseId`, `mode`, `type`, `prompt`, `choices[]`, `correctAnswer`, optional `hint`

### What Needs Change ⚠️

1. **Unit ID naming**: Current uses `skillId` (e.g., "skill-1"); spec expects `unitId`. Easy rename in responses.

2. **Mode State Tracking**: No tracking of mode completion state (`available`, `locked`, `completed`) or `bestScore` per mode. Needs new state storage.

3. **Planet Progress**: Currently tracks `skillProgress.mastery` (numeric); spec needs `completedModes` (count of completed modalities).

4. **Question vs Exercise terminology**: Current uses `exerciseId`, spec uses `questionId`. Need mapping/alias or rename.

5. **Session Mode**: Sessions don't store which mode is being practiced; `startLesson` accepts `lessonId` but not `mode` parameter.

---

## Recommended Minimal Changes (Ordered by Impact)

### High Priority (Blocks UI)

1. **Add `/map` endpoint** (`src/duo/lesson/lesson.controller.ts`)
   - Transform `skills[]` and `lessons[]` into `units[]` and `planets[]` format
   - Add `planets[].state` logic (first planet = available, rest = locked for MVP)
   - Add `planets[].progress.completedModes` (currently always 0)
   - Add `planets[].ui` placement data (hardcode for MVP)
   - **Effort**: ~30 lines

2. **Add `/lessons/:lessonId/modes` endpoint** (`src/duo/lesson/lesson.controller.ts`)
   - Return 4 modes with `state` and `bestScore`
   - For MVP: all modes `available`, `bestScore: 0.0`
   - Include `unitId` (from `lesson.skillId`)
   - **Effort**: ~20 lines

3. **Add `/lessons/:lessonId/overview` endpoint** (`src/duo/lesson/lesson.controller.ts`)
   - Add `xpReward` calculation (e.g., 10 XP × questionCount)
   - Add `questionCount` (always 1 per mode for MVP, or hardcode 5)
   - Add `streakProtect.available` (always true for MVP)
   - Add `hearts` system (new service needed - see below)
   - Accept `mode` query param
   - **Effort**: ~40 lines

4. **Implement Hearts System** (New service: `src/duo/progress/hearts.service.ts`)
   - Track `current`, `max` (5), regeneration logic
   - Subtract on wrong answer
   - Add to `InMemoryStateService` or create separate service
   - **Effort**: ~50 lines

5. **Update `/lesson/start` to accept `mode`** (`src/duo/lesson/lesson.service.ts`, `dto/start-lesson.dto.ts`)
   - Add `mode` to `StartLessonDto`
   - Filter exercises by mode (only return exercises matching the mode)
   - Change response: return single `question` object instead of `exercises[]`
   - Add `hearts` to response
   - Change `totalCount` → `totalQuestions`
   - Store `mode` in session (update `LessonSession` interface)
   - **Effort**: ~40 lines

6. **Refactor answer endpoint route** (`src/duo/answer/answer.controller.ts`)
   - Change from `POST /lessons/:lessonId/answer` to `POST /sessions/:sessionId/answer`
   - Get `lessonId` and `mode` from session instead of path param
   - Update `SubmitAnswerDto` to use `questionId` instead of `exerciseId`
   - **Effort**: ~20 lines

7. **Update answer response format** (`src/duo/answer/answer.service.ts`)
   - Add `explanation` field (can use `hint` from exercise or generate simple text)
   - Add `hearts` object with current/max
   - Add `progress.percent` calculation
   - Add `next.question` object (next exercise in sequence) or `next.hasNext: false`
   - Add `outOfHearts` flag when hearts reach 0
   - **Effort**: ~60 lines

8. **Update `/lesson/finish` response** (`src/duo/lesson/lesson.service.ts`)
   - Add `mode` to response (from session)
   - Change `skillProgress` → `planetProgress` with `completedModes` structure
   - Track which modes are completed (increment when mode accuracy >= threshold)
   - **Effort**: ~30 lines

### Medium Priority (UI Polish)

9. **Add mode state tracking** (`src/duo/progress/in-memory-state.service.ts`)
   - Track `modeProgress: Record<string, {state: string, bestScore: number}>` per lesson
   - Update on lesson finish
   - **Effort**: ~40 lines

10. **Rename skillId → unitId in responses** (Multiple files)
    - Update all response DTOs/interfaces
    - Keep internal `skillId` naming if preferred, just map in responses
    - **Effort**: ~20 lines (find/replace)

### Low Priority (Nice to Have)

11. **Add questionId alias** (if keeping exerciseId internally)
    - Map `exerciseId` → `questionId` in responses for consistency
    - **Effort**: ~10 lines

12. **Add UI placement data generation** (`src/duo/lesson/lesson.service.ts`)
    - Calculate or hardcode `orbitIndex`, `angle`, `size` for planets
    - **Effort**: ~30 lines (can hardcode for MVP)

---

## File Reference Summary

### Files to Modify:
- `src/duo/lesson/lesson.controller.ts` - Add 3 endpoints, modify 1
- `src/duo/lesson/lesson.service.ts` - Add methods, update existing
- `src/duo/lesson/dto/start-lesson.dto.ts` - Add `mode` field
- `src/duo/answer/answer.controller.ts` - Change route signature
- `src/duo/answer/answer.service.ts` - Update response format
- `src/duo/answer/dto/submit-answer.dto.ts` - Change `exerciseId` → `questionId`
- `src/duo/progress/in-memory-state.service.ts` - Add hearts, mode tracking, session mode storage

### Files to Create:
- `src/duo/progress/hearts.service.ts` (optional, can integrate into InMemoryStateService)

### Files Already Good:
- `src/duo/exercise/exercise.service.ts` - Mode structure is correct
- `src/common/utils/response.util.ts` - Response wrapper is correct

---

## Estimated Total Effort

- **High Priority Changes**: ~280 lines of code
- **Medium Priority**: ~60 lines
- **Testing/Validation**: Similar effort
- **Total**: ~500-600 lines across 7-8 files

**Recommendation**: Focus on High Priority items first (6-7 changes) to unblock the UI. Hearts system and mode tracking can be simplified for MVP (always available, no regeneration, basic tracking).

