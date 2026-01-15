# Listening Audio Asset Implementation

## Summary

Implemented MinIO-based audio asset storage with CRUD APIs and B1-level listening content seeding for `brainbattle-dou` backend.

## Part A - MinIO Storage Integration ✅

### StorageModule (`src/storage/`)

- **StorageService**: Wraps AWS S3 SDK for MinIO
  - Auto-creates bucket on module init
  - `uploadBuffer(key, buffer, contentType)`: Upload to MinIO
  - `getObjectStream(key)`: Stream from MinIO
  - `removeObject(key)`: Delete from MinIO
  - `getPublicUrl(key, audioAssetId)`: Generate public URL

### Prisma Schema Updates

**AudioAsset Model:**
```prisma
model AudioAsset {
  id           String     @id @default(cuid())
  key          String     @unique // MinIO object key
  bucket       String     @default("bb-learning")
  originalName String
  contentType  String
  size         Int
  durationSec  Float?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  questions    Question[]
}
```

**Question Model Updates:**
- Added `audioAssetId String?` field
- Added relation to `AudioAsset`
- Updated `type` default to `"MCQ"` (uppercase)

## Part B - Audio Assets CRUD APIs ✅

### Endpoints (`/api/learning/assets/audio`)

1. **POST /api/learning/assets/audio**
   - Upload audio file (multipart/form-data, field: "file")
   - Validates: `audio/*` MIME type, max 15MB
   - Uploads to MinIO, creates AudioAsset record
   - Returns: `{ id, url, originalName, contentType, size, createdAt }`

2. **GET /api/learning/assets/audio**
   - List with pagination: `?page=1&limit=20&search=`
   - Returns: `{ items: [...], total, page, limit }`

3. **GET /api/learning/assets/audio/:id**
   - Get metadata: `{ id, url, originalName, contentType, size, durationSec, createdAt, updatedAt }`

4. **GET /api/learning/assets/audio/:id/file**
   - Stream audio file from MinIO
   - Sets correct Content-Type and Accept-Ranges headers

5. **DELETE /api/learning/assets/audio/:id**
   - Deletes from MinIO and database
   - Returns: `{ ok: true }`

## Part C - Normalized Question Payload ✅

### Question Mapper Utility

Both `/api/learning/lessons/:lessonId/start` and `/api/learning/quiz/:attemptId/next` return identical normalized schema:

**MCQ (reading mode):**
```json
{
  "id": "q-reading-b1-01",
  "prompt": "What does 'táo' mean in English?",
  "type": "MCQ",
  "options": ["Apple", "Orange", "Banana", "Grape"],
  "explanation": "'Táo' is Vietnamese for 'apple'",
  "hint": "Think about fruits"
}
```

**LISTEN_AND_SELECT (listening mode):**
```json
{
  "id": "q-listening-b1-01",
  "prompt": "Where is Anna?",
  "type": "LISTEN_AND_SELECT",
  "options": ["In the classroom", "In the bathroom", "In the library", "In the kitchen"],
  "audioUrl": "http://localhost:3001/api/learning/assets/audio/{audioAssetId}/file",
  "explanation": "The audio says 'I am in the bathroom'",
  "hint": "Listen for the location mentioned"
}
```

**TYPE_ANSWER (writing mode):**
```json
{
  "id": "q-writing-b1-01",
  "prompt": "How do you say 'apple' in Vietnamese?",
  "type": "TYPE_ANSWER",
  "placeholder": "Type your answer here",
  "caseSensitive": false,
  "explanation": "The Vietnamese word for apple is 'táo'",
  "hint": "Think about fruits"
}
```

### Answer Checking

- **MCQ & LISTEN_AND_SELECT**: Exact case-sensitive string match
- **TYPE_ANSWER**: 
  - If `caseSensitive=false`: trim + lowercase comparison
  - If `caseSensitive=true`: trim only (case-sensitive)

## Part D - B1 Listening Content Seed ✅

### Seed Script (`prisma/seed-listening-content.ts`)

**Features:**
- Downloads 4 VOA audio clips from Wikimedia Commons
- Uploads to MinIO with unique keys
- Creates AudioAsset records
- Creates 6 listening questions (LISTEN_AND_SELECT) with audio
- Creates 4 additional questions (2 MCQ reading, 2 TYPE_ANSWER writing)

**Listening Questions:**
1. "Where is Anna?" - bathroom location
2. "What does Anna need?" - pen request
3. "What technology is mentioned?" - computer vision/self-driving
4. "What does a neural network simulate?" - human brain
5-6. Variants for lesson variety

**Audio Sources:**
- `anna-bathroom.ogg` - "I am in the bathroom"
- `anna-pen.ogg` - "Do you have a pen?"
- `computer-vision.ogg` - Technology description
- `neural-network.ogg` - Neural network explanation

## Files Created/Modified

### Created
- `src/storage/storage.service.ts` - MinIO storage service
- `src/storage/storage.module.ts` - Storage module
- `src/duo/learning/assets/audio-assets.service.ts` - Audio assets service
- `src/duo/learning/assets/audio-assets.controller.ts` - Audio assets CRUD endpoints
- `src/duo/learning/assets/audio-assets.module.ts` - Audio assets module
- `src/duo/learning/utils/audio-lookup.util.ts` - Helper to fetch audioUrl for questions
- `prisma/seed-listening-content.ts` - B1 listening content seed script

### Modified
- `prisma/schema.prisma` - Added AudioAsset model, updated Question model
- `src/duo/learning/learning.service.ts` - Fetches audioUrl for listening questions
- `src/duo/lesson/lesson.service.ts` - Fetches audioUrl for listening questions
- `src/duo/learning/learning.module.ts` - Added PrismaModule and StorageModule
- `src/duo/lesson/lesson.module.ts` - Added PrismaModule and StorageModule
- `src/app.module.ts` - Added AudioAssetsModule and StorageModule
- `package.json` - Added `@nestjs/config` and `@aws-sdk/client-s3`, seed script

## Commands to Run

### 1. Install Dependencies
```bash
cd brainbattle-dou
npm install
```

### 2. Run Prisma Migration
```bash
npx prisma migrate dev --name add_audio_assets_and_question_audio_link
npx prisma generate
```

### 3. Seed Listening Content
```bash
# Ensure MinIO is running and environment variables are set
npm run seed:listening
```

### 4. Start Server
```bash
npm run start:dev
```

## Environment Variables

Add to `.env`:
```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minio-root
MINIO_SECRET_KEY=minio-root-secret
MINIO_BUCKET_NAME=bb-learning
MINIO_REGION=us-east-1
MINIO_PUBLIC_BASE_URL=  # Optional: if set, uses this for public URLs; otherwise uses streaming endpoint
```

## Example Responses

### 1. MCQ Question (Reading)
```json
{
  "success": true,
  "data": {
    "attemptId": "sess_abc123",
    "currentQuestionIndex": 1,
    "totalQuestions": 5,
    "heartsRemaining": 5,
    "question": {
      "id": "q-reading-b1-01",
      "prompt": "What does 'táo' mean in English?",
      "type": "MCQ",
      "options": ["Apple", "Orange", "Banana", "Grape"],
      "explanation": "'Táo' is Vietnamese for 'apple'",
      "hint": "Think about fruits"
    }
  }
}
```

### 2. LISTEN_AND_SELECT Question (Listening)
```json
{
  "success": true,
  "data": {
    "attemptId": "sess_abc123",
    "currentQuestionIndex": 1,
    "totalQuestions": 5,
    "heartsRemaining": 5,
    "question": {
      "id": "q-listening-b1-01",
      "prompt": "Where is Anna?",
      "type": "LISTEN_AND_SELECT",
      "options": ["In the classroom", "In the bathroom", "In the library", "In the kitchen"],
      "audioUrl": "http://localhost:3001/api/learning/assets/audio/clxyz123/file",
      "explanation": "The audio says 'I am in the bathroom'",
      "hint": "Listen for the location mentioned"
    }
  }
}
```

### 3. TYPE_ANSWER Question (Writing)
```json
{
  "success": true,
  "data": {
    "attemptId": "sess_abc123",
    "currentQuestionIndex": 1,
    "totalQuestions": 5,
    "heartsRemaining": 5,
    "question": {
      "id": "q-writing-b1-01",
      "prompt": "How do you say 'apple' in Vietnamese?",
      "type": "TYPE_ANSWER",
      "placeholder": "Type your answer here",
      "caseSensitive": false,
      "explanation": "The Vietnamese word for apple is 'táo'",
      "hint": "Think about fruits"
    }
  }
}
```

## Notes

- Audio files are stored in MinIO bucket `bb-learning`
- Public URLs use streaming endpoint `/api/learning/assets/audio/:id/file` if `MINIO_PUBLIC_BASE_URL` is not set
- Questions are linked to AudioAsset via `audioAssetId` field
- Both `startLesson` and `nextQuestion` endpoints return identical normalized question schema
- Hearts logic and existing flow are preserved
- Answer checking is consistent across all question types

