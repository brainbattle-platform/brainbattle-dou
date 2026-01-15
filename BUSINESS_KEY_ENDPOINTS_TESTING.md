# Business Key Endpoints Testing Guide

This guide provides Swagger examples for testing the new business key endpoints alongside existing PK endpoints.

## Prerequisites

1. **Service Running:**
   ```bash
   cd brainbattle-dou
   npm run start:dev
   ```

2. **Access Swagger UI:**
   ```
   http://localhost:3001/api/docs
   ```

## Required Headers

All admin endpoints require:
- **Header:** `x-admin-key`
- **Value:** `dev-admin`

## Endpoint Comparison

### Units

| Operation | PK Endpoint | Business Key Endpoint |
|-----------|-------------|----------------------|
| GET | `/api/admin/learning/units/:id` | `/api/admin/learning/units/by-unitId/:unitId` |
| PUT | `/api/admin/learning/units/:id` | `/api/admin/learning/units/by-unitId/:unitId` |
| DELETE | `/api/admin/learning/units/:id` | `/api/admin/learning/units/by-unitId/:unitId` |

### Lessons

| Operation | PK Endpoint | Business Key Endpoint |
|-----------|-------------|----------------------|
| GET | `/api/admin/learning/lessons/:id` | `/api/admin/learning/lessons/by-lessonId/:lessonId` |
| PUT | `/api/admin/learning/lessons/:id` | `/api/admin/learning/lessons/by-lessonId/:lessonId` |
| DELETE | `/api/admin/learning/lessons/:id` | `/api/admin/learning/lessons/by-lessonId/:lessonId` |

### Questions

| Operation | PK Endpoint | Business Key Endpoint |
|-----------|-------------|----------------------|
| GET | `/api/admin/learning/questions/:id` | `/api/admin/learning/questions/by-questionId/:questionId` |
| PUT | `/api/admin/learning/questions/:id` | `/api/admin/learning/questions/by-questionId/:questionId` |
| DELETE | `/api/admin/learning/questions/:id` | `/api/admin/learning/questions/by-questionId/:questionId` |

---

## Testing Checklist

### ✅ 1. Create unit-21

**Endpoint:** `POST /api/admin/learning/units`

**Headers:**
```
x-admin-key: dev-admin
Content-Type: application/json
```

**Body:**
```json
{
  "unitId": "unit-21",
  "title": "Unit 21: Advanced Topics",
  "order": 21,
  "published": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "unitId": "unit-21",
    "title": "Unit 21: Advanced Topics",
    "order": 21,
    "published": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Note:** Save the `id` (Prisma PK) for later tests.

---

### ✅ 2. Update by unitId

**Endpoint:** `PUT /api/admin/learning/units/by-unitId/unit-21`

**Headers:**
```
x-admin-key: dev-admin
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Unit 21: Advanced Topics (Updated)",
  "order": 20
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "unitId": "unit-21",
    "title": "Unit 21: Advanced Topics (Updated)",
    "order": 20,
    "published": true,
    "updatedAt": "2024-01-01T00:00:01.000Z"
  }
}
```

**Note:** If `order: 20` conflicts with another unit, the system will auto-shift the conflicting unit to `order: 21`.

---

### ✅ 3. Fetch by unitId

**Endpoint:** `GET /api/admin/learning/units/by-unitId/unit-21`

**Headers:**
```
x-admin-key: dev-admin
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "unitId": "unit-21",
    "title": "Unit 21: Advanced Topics (Updated)",
    "order": 20,
    "published": true,
    "lessons": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:01.000Z"
  }
}
```

---

### ✅ 4. Reorder so unit-21 appears after unit-20

**Option A: Using Bulk Reorder (Recommended)**

**Endpoint:** `POST /api/admin/learning/units/reorder`

**Headers:**
```
x-admin-key: dev-admin
Content-Type: application/json
```

**Body:**
```json
{
  "items": [
    {
      "unitId": "unit-20",
      "order": 20
    },
    {
      "unitId": "unit-21",
      "order": 21
    }
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "unitId": "unit-20",
      "order": 20,
      ...
    },
    {
      "id": "clx...",
      "unitId": "unit-21",
      "order": 21,
      ...
    }
  ]
}
```

**Option B: Using Individual Update**

**Endpoint:** `PUT /api/admin/learning/units/by-unitId/unit-21`

**Body:**
```json
{
  "order": 21
}
```

**Verify Ordering:**

**Endpoint:** `GET /api/admin/learning/units`

**Expected:** Units sorted by `order ASC`, then `createdAt ASC`. `unit-21` should appear after `unit-20`.

---

## Additional Examples

### Get All Units (Verify Ordering)

**Endpoint:** `GET /api/admin/learning/units`

**Headers:**
```
x-admin-key: dev-admin
```

**Expected:** Units returned in order:
1. `order: 1, createdAt: ...`
2. `order: 2, createdAt: ...`
3. ...
20. `order: 20, createdAt: ...` (unit-20)
21. `order: 21, createdAt: ...` (unit-21)

---

### Update Lesson by lessonId

**Endpoint:** `PUT /api/admin/learning/lessons/by-lessonId/lesson-1-1`

**Headers:**
```
x-admin-key: dev-admin
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Lesson 1: Updated Title",
  "order": 2
}
```

---

### Delete Question by questionId

**Endpoint:** `DELETE /api/admin/learning/questions/by-questionId/q-listening-01`

**Headers:**
```
x-admin-key: dev-admin
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Question deleted successfully"
  }
}
```

---

### Bulk Reorder Lessons

**Endpoint:** `POST /api/admin/learning/lessons/reorder`

**Headers:**
```
x-admin-key: dev-admin
Content-Type: application/json
```

**Body:**
```json
{
  "items": [
    {
      "lessonId": "lesson-1-1",
      "order": 1
    },
    {
      "lessonId": "lesson-1-2",
      "order": 2
    },
    {
      "id": "clx...",
      "order": 3
    }
  ]
}
```

**Note:** You can mix `lessonId` and `id` in the same request.

---

## Error Responses

### 404 Not Found (Business Key)

**Request:**
```
GET /api/admin/learning/units/by-unitId/non-existent
```

**Response:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Unit with unitId \"non-existent\" not found"
  }
}
```

### 403 Forbidden (Missing Admin Key)

**Request:**
```
GET /api/admin/learning/units/by-unitId/unit-21
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

---

## Summary

✅ **PK Endpoints (Unchanged):**
- Use Prisma `id` (cuid/uuid)
- Example: `/api/admin/learning/units/:id`

✅ **Business Key Endpoints (New):**
- Use business keys (`unitId`, `lessonId`, `questionId`)
- Example: `/api/admin/learning/units/by-unitId/:unitId`

✅ **Bulk Reorder:**
- Accepts either `id` or business key per item
- Atomic transaction
- Example: `POST /api/admin/learning/units/reorder`

✅ **Ordering:**
- Units sorted by `order ASC`, then `createdAt ASC`
- Auto-shift prevents duplicate orders
- Bulk reorder for efficient updates

