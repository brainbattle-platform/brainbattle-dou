# Admin CRUD API Testing Guide

This guide provides Swagger examples for testing the Admin CRUD APIs for Learning content.

## Prerequisites

1. **Database Migration:**
   ```bash
   cd brainbattle-dou
   npx prisma generate
   npx prisma migrate dev --name add_content_models
   ```

2. **Seed Initial Content (Optional):**
   ```bash
   npx ts-node prisma/seed-admin-content.ts
   ```

3. **Start Service:**
   ```bash
   npm run start:dev
   ```

4. **Access Swagger UI:**
   ```
   http://localhost:3001/api/docs
   ```

## Required Headers

### User APIs (`/api/learning/*`)
- **Header:** `x-user-id`
- **Value:** `user_1` (or any user ID like `user_2`)
- **Default:** If missing, defaults to `user_1`

### Admin APIs (`/api/admin/learning/*`)
- **Header:** `x-admin-key`
- **Value:** `dev-admin`
- **Required:** Yes - returns 403 if missing or invalid

---

## Unit CRUD Examples

### 1. Create Unit

**Endpoint:** `POST /api/admin/learning/units`

**Headers:**
```
x-admin-key: dev-admin
Content-Type: application/json
```

**Body:**
```json
{
  "unitId": "unit-1",
  "title": "Unit 1: Greetings",
  "order": 1,
  "published": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "unitId": "unit-1",
    "title": "Unit 1: Greetings",
    "order": 1,
    "published": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get All Units

**Endpoint:** `GET /api/admin/learning/units`

**Headers:**
```
x-admin-key: dev-admin
```

**Query Parameters (Optional):**
- `publishedOnly=true` - Filter by published status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "unitId": "unit-1",
      "title": "Unit 1: Greetings",
      "order": 1,
      "published": true,
      "lessons": []
    }
  ]
}
```

### 3. Get Unit by ID

**Endpoint:** `GET /api/admin/learning/units/:id`

**Headers:**
```
x-admin-key: dev-admin
```

**Response:** Same as create response

### 4. Update Unit

**Endpoint:** `PUT /api/admin/learning/units/:id`

**Headers:**
```
x-admin-key: dev-admin
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Unit 1: Greetings and Introductions",
  "published": false
}
```

### 5. Delete Unit

**Endpoint:** `DELETE /api/admin/learning/units/:id`

**Headers:**
```
x-admin-key: dev-admin
```

**Note:** Fails with 400 if unit has lessons. Delete lessons first.

### 6. Publish/Unpublish Unit

**Endpoints:**
- `POST /api/admin/learning/units/:id/publish`
- `POST /api/admin/learning/units/:id/unpublish`

**Headers:**
```
x-admin-key: dev-admin
```

### 7. Update Unit Order

**Endpoint:** `PUT /api/admin/learning/units/:id/order`

**Headers:**
```
x-admin-key: dev-admin
Content-Type: application/json
```

**Body:**
```json
{
  "order": 2
}
```

---

## Lesson CRUD Examples

### 1. Create Lesson

**Endpoint:** `POST /api/admin/learning/lessons`

**Headers:**
```
x-admin-key: dev-admin
Content-Type: application/json
```

**Body:**
```json
{
  "lessonId": "lesson-1-1",
  "unitId": "unit-1",
  "title": "Lesson 1",
  "subtitle": "Practice Greetings",
  "order": 1,
  "estimatedMinutes": 3,
  "published": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "lessonId": "lesson-1-1",
    "unitId": "unit-1",
    "title": "Lesson 1",
    "subtitle": "Practice Greetings",
    "order": 1,
    "estimatedMinutes": 3,
    "published": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get All Lessons

**Endpoint:** `GET /api/admin/learning/lessons`

**Headers:**
```
x-admin-key: dev-admin
```

**Query Parameters (Optional):**
- `unitId=unit-1` - Filter by unit
- `publishedOnly=true` - Filter by published status

### 3. Get Lesson by ID

**Endpoint:** `GET /api/admin/learning/lessons/:id`

**Headers:**
```
x-admin-key: dev-admin
```

**Response:** Includes `unit` and `questions` relations

### 4. Update Lesson

**Endpoint:** `PUT /api/admin/learning/lessons/:id`

**Headers:**
```
x-admin-key: dev-admin
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Lesson 1: Basic Greetings",
  "estimatedMinutes": 5
}
```

### 5. Delete Lesson

**Endpoint:** `DELETE /api/admin/learning/lessons/:id`

**Headers:**
```
x-admin-key: dev-admin
```

**Note:** Fails with 400 if lesson has questions. Delete questions first.

### 6. Publish/Unpublish Lesson

**Endpoints:**
- `POST /api/admin/learning/lessons/:id/publish`
- `POST /api/admin/learning/lessons/:id/unpublish`

### 7. Update Lesson Order

**Endpoint:** `PUT /api/admin/learning/lessons/:id/order`

**Body:**
```json
{
  "order": 2
}
```

---

## Question CRUD Examples

### 1. Create Question

**Endpoint:** `POST /api/admin/learning/questions`

**Headers:**
```
x-admin-key: dev-admin
Content-Type: application/json
```

**Body:**
```json
{
  "questionId": "q-listening-01",
  "lessonId": "lesson-1-1",
  "mode": "listening",
  "type": "mcq",
  "prompt": "Listen and select the correct meaning of \"apple\"",
  "correctAnswer": "táo",
  "explanation": "The correct answer is \"táo\".",
  "hint": "Think about the listening context.",
  "order": 0,
  "published": true,
  "options": [
    {
      "text": "táo",
      "isCorrect": true,
      "order": 0
    },
    {
      "text": "cam",
      "isCorrect": false,
      "order": 1
    },
    {
      "text": "chuối",
      "isCorrect": false,
      "order": 2
    },
    {
      "text": "nho",
      "isCorrect": false,
      "order": 3
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "questionId": "q-listening-01",
    "lessonId": "lesson-1-1",
    "mode": "listening",
    "type": "mcq",
    "prompt": "Listen and select the correct meaning of \"apple\"",
    "correctAnswer": "táo",
    "explanation": "The correct answer is \"táo\".",
    "hint": "Think about the listening context.",
    "order": 0,
    "published": true,
    "options": [
      {
        "id": "clx...",
        "text": "táo",
        "isCorrect": true,
        "order": 0
      }
    ]
  }
}
```

### 2. Get All Questions

**Endpoint:** `GET /api/admin/learning/questions`

**Headers:**
```
x-admin-key: dev-admin
```

**Query Parameters (Optional):**
- `lessonId=lesson-1-1` - Filter by lesson
- `mode=listening` - Filter by mode
- `publishedOnly=true` - Filter by published status

### 3. Get Question by ID

**Endpoint:** `GET /api/admin/learning/questions/:id`

**Headers:**
```
x-admin-key: dev-admin
```

**Response:** Includes `lesson` and `options` relations

### 4. Update Question

**Endpoint:** `PUT /api/admin/learning/questions/:id`

**Headers:**
```
x-admin-key: dev-admin
Content-Type: application/json
```

**Body:**
```json
{
  "prompt": "Listen and select the correct meaning of \"apple\" (updated)",
  "options": [
    {
      "text": "táo",
      "isCorrect": true,
      "order": 0
    },
    {
      "text": "cam",
      "isCorrect": false,
      "order": 1
    }
  ]
}
```

**Note:** Updating `options` replaces all existing options.

### 5. Delete Question

**Endpoint:** `DELETE /api/admin/learning/questions/:id`

**Headers:**
```
x-admin-key: dev-admin
```

**Note:** Options are cascade deleted automatically.

### 6. Publish/Unpublish Question

**Endpoints:**
- `POST /api/admin/learning/questions/:id/publish`
- `POST /api/admin/learning/questions/:id/unpublish`

### 7. Update Question Order

**Endpoint:** `PUT /api/admin/learning/questions/:id/order`

**Body:**
```json
{
  "order": 1
}
```

---

## User API Examples (for comparison)

### Get Learning Map

**Endpoint:** `GET /api/learning/map`

**Headers:**
```
x-user-id: user_1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unitId": "unit-1",
    "unitTitle": "Unit 1: Greetings",
    "skills": [...]
  }
}
```

---

## Error Responses

### 403 Forbidden (Missing/Invalid Admin Key)

**Request:**
```
GET /api/admin/learning/units
(no x-admin-key header)
```

**Response:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or missing admin key. Header \"x-admin-key\" must equal \"dev-admin\"."
  }
}
```

### 400 Bad Request (Referential Integrity)

**Request:**
```
DELETE /api/admin/learning/units/:id
(unit has lessons)
```

**Response:**
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Cannot delete unit \"unit-1\" because it has 3 lesson(s). Delete lessons first or use cascade delete."
  }
}
```

### 404 Not Found

**Request:**
```
GET /api/admin/learning/units/non-existent-id
```

**Response:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Unit with id \"non-existent-id\" not found"
  }
}
```

---

## Complete Workflow Example

1. **Create Unit:**
   ```bash
   POST /api/admin/learning/units
   {
     "unitId": "unit-1",
     "title": "Unit 1: Greetings",
     "order": 1,
     "published": true
   }
   ```

2. **Create Lesson:**
   ```bash
   POST /api/admin/learning/lessons
   {
     "lessonId": "lesson-1-1",
     "unitId": "unit-1",
     "title": "Lesson 1",
     "order": 1,
     "published": true
   }
   ```

3. **Create Question:**
   ```bash
   POST /api/admin/learning/questions
   {
     "questionId": "q-listening-01",
     "lessonId": "lesson-1-1",
     "mode": "listening",
     "prompt": "Listen and select...",
     "correctAnswer": "táo",
     "options": [...]
   }
   ```

4. **Verify with User API:**
   ```bash
   GET /api/learning/map
   (x-user-id: user_1)
   ```

---

## Testing Checklist

- [ ] Create unit with admin key
- [ ] Create unit without admin key (should fail with 403)
- [ ] Get all units
- [ ] Update unit
- [ ] Delete unit with lessons (should fail with 400)
- [ ] Delete lessons first, then delete unit
- [ ] Create lesson
- [ ] Create question with options
- [ ] Update question options (should replace all)
- [ ] Publish/unpublish entities
- [ ] Update order
- [ ] Verify user APIs still work with `x-user-id` header

