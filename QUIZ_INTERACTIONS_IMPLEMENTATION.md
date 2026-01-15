# Quiz Interactions Implementation

## Summary

Implemented normalized quiz question payloads and audio file management for `brainbattle-dou` backend.

## Part A - Normalized Question Payload ✅

### Implementation

1. **Question Mapper Utility** (`src/duo/learning/utils/question-mapper.util.ts`)
   - Maps `Exercise` to normalized `NormalizedQuestion` format
   - Mode-to-type mapping:
     - `reading` → `MCQ`
     - `listening` → `LISTEN_AND_SELECT` (with `audioUrl`)
     - `writing` → `TYPE_ANSWER`
   - Sanitizes questions before sending to client (removes `correctOption` and `answer`)

2. **Updated Endpoints**
   - `POST /api/learning/lessons/:lessonId/start` - Returns normalized question
   - `POST /api/learning/quiz/:attemptId/next` - Returns normalized question
   - Both endpoints now return identical schema

### Question Schema

**MCQ (reading mode):**
```json
{
  "id": "q-reading-01",
  "prompt": "What does 'apple' mean?",
  "type": "MCQ",
  "options": ["Quả táo", "Quả cam", "Quả chuối", "Quả nho"],
  "explanation": "Apple means quả táo in Vietnamese",
  "hint": "Think about fruits"
}
```

**LISTEN_AND_SELECT (listening mode):**
```json
{
  "id": "q-listening-01",
  "prompt": "Listen and select the correct meaning",
  "type": "LISTEN_AND_SELECT",
  "options": ["Quả táo", "Quả cam", "Quả chuối", "Quả nho"],
  "audioUrl": "http://localhost:3000/api/files/audio/abc123.mp3",
  "explanation": "The audio said 'apple'",
  "hint": "Listen carefully"
}
```

**TYPE_ANSWER (writing mode):**
```json
{
  "id": "q-writing-01",
  "prompt": "How do you say 'apple' in Vietnamese?",
  "type": "TYPE_ANSWER",
  "placeholder": "Type your answer here",
  "caseSensitive": false,
  "explanation": "The answer is 'quả táo'",
  "hint": "Think about fruits"
}
```

## Part B - Answer Checking ✅

### Implementation

**Answer Checker Utility** (`src/duo/learning/utils/answer-checker.util.ts`)

- **MCQ & LISTEN_AND_SELECT**: Exact case-sensitive match
  ```typescript
  submittedAnswer === correctOption
  ```

- **TYPE_ANSWER**:
  - If `caseSensitive=false`: Compare trim + lowercase
    ```typescript
    submitted.trim().toLowerCase() === correct.trim().toLowerCase()
    ```
  - If `caseSensitive=true`: Compare trim only (case-sensitive)
    ```typescript
    submitted.trim() === correct.trim()
    ```

- Hearts logic preserved: Wrong answers decrement hearts, quiz finishes when hearts=0 or all questions answered

## Part C - Audio File CRUD ✅

### Implementation

**FilesModule** (`src/duo/files/`)

1. **POST /api/files/audio**
   - Upload audio file (multipart/form-data, field: "file")
   - Accepts: `audio/*` (mp3, wav, m4a)
   - Max size: 15MB
   - Stores in local disk: `uploads/audio/` (can be swapped to MinIO later)
   - Response: `{ id, filename, contentType, size, url, createdAt }`

2. **GET /api/files/audio**
   - List with pagination: `?page=1&limit=20&search=`
   - Response: `{ items: [...], total, page, limit }`

3. **GET /api/files/audio/:id**
   - Returns metadata or streams file
   - Response: `{ id, filename, url, contentType, size, createdAt, updatedAt }`

4. **PATCH /api/files/audio/:id**
   - Update metadata: `{ filename? }`
   - Response: Updated metadata

5. **DELETE /api/files/audio/:id**
   - Deletes file from storage and DB
   - Response: `{ ok: true }`

### Data Model

**Prisma Schema** (`prisma/schema.prisma`)

```prisma
model AudioAsset {
  id          String   @id @default(uuid())
  filename    String
  objectKey   String?  // For MinIO storage (future)
  localPath   String?  // For local disk storage
  url         String   // Public URL
  contentType String
  size        Int      // Size in bytes
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([filename])
  @@map("audio_assets")
}
```

### Storage Architecture

- **Current**: Local disk storage (`uploads/audio/`)
- **Future**: Can swap to MinIO by:
  1. Update `FilesService` to use MinIO client
  2. Set `objectKey` instead of `localPath`
  3. Update `url` to MinIO public URL

## Part D - Example Responses

### 1. MCQ Question (from start/next)

```json
{
  "success": true,
  "data": {
    "attemptId": "sess_abc123",
    "currentQuestionIndex": 1,
    "totalQuestions": 5,
    "heartsRemaining": 5,
    "question": {
      "id": "q-reading-01",
      "prompt": "What does 'apple' mean?",
      "type": "MCQ",
      "options": ["Quả táo", "Quả cam", "Quả chuối", "Quả nho"],
      "explanation": "Apple means quả táo in Vietnamese",
      "hint": "Think about fruits"
    }
  }
}
```

### 2. LISTEN_AND_SELECT Question (from start/next)

```json
{
  "success": true,
  "data": {
    "attemptId": "sess_abc123",
    "currentQuestionIndex": 1,
    "totalQuestions": 5,
    "heartsRemaining": 5,
    "question": {
      "id": "q-listening-01",
      "prompt": "Listen and select the correct meaning",
      "type": "LISTEN_AND_SELECT",
      "options": ["Quả táo", "Quả cam", "Quả chuối", "Quả nho"],
      "audioUrl": "http://localhost:3000/api/files/audio/abc123.mp3",
      "explanation": "The audio said 'apple'",
      "hint": "Listen carefully"
    }
  }
}
```

### 3. TYPE_ANSWER Question (from start/next)

```json
{
  "success": true,
  "data": {
    "attemptId": "sess_abc123",
    "currentQuestionIndex": 1,
    "totalQuestions": 5,
    "heartsRemaining": 5,
    "question": {
      "id": "q-writing-01",
      "prompt": "How do you say 'apple' in Vietnamese?",
      "type": "TYPE_ANSWER",
      "placeholder": "Type your answer here",
      "caseSensitive": false,
      "explanation": "The answer is 'quả táo'",
      "hint": "Think about fruits"
    }
  }
}
```

## Files Changed

### Created
- `src/duo/learning/utils/question-mapper.util.ts` - Question normalization
- `src/duo/learning/utils/answer-checker.util.ts` - Answer checking logic
- `src/duo/files/files.service.ts` - Audio file service
- `src/duo/files/files.controller.ts` - Audio file endpoints
- `src/duo/files/files.module.ts` - Files module
- `src/duo/files/dto/create-audio.dto.ts` - Upload DTO
- `src/duo/files/dto/update-audio.dto.ts` - Update DTO
- `src/duo/files/dto/list-audio-query.dto.ts` - List query DTO

### Modified
- `prisma/schema.prisma` - Added `AudioAsset` model, updated `Question` model
- `src/duo/learning/learning.service.ts` - Uses normalized questions
- `src/duo/lesson/lesson.service.ts` - Uses normalized questions
- `src/app.module.ts` - Added `FilesModule`

## Next Steps

1. **Run Prisma Migration**:
   ```bash
   cd brainbattle-dou
   npx prisma migrate dev --name add_audio_assets_and_question_types
   npx prisma generate
   ```

2. **Install Dependencies** (if needed):
   ```bash
   npm install @types/multer --save-dev
   ```

3. **Update Questions with Audio**:
   - Upload audio files via `POST /api/files/audio`
   - Update listening questions to reference `audioUrl` from `AudioAsset`

4. **Test Endpoints**:
   - Test question normalization in both `/lessons/:lessonId/start` and `/quiz/:attemptId/next`
   - Test answer checking for all three question types
   - Test audio file CRUD operations

## Notes

- Question types are **uppercase** (`MCQ`, `LISTEN_AND_SELECT`, `TYPE_ANSWER`)
- `correctOption` and `answer` are **never returned** to client
- Audio storage is **local disk** by default, can be swapped to MinIO
- Hearts logic is **preserved** exactly as before
- Both endpoints return **identical question schema**

