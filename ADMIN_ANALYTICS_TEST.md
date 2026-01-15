# Admin Analytics APIs - Test Plan

## Prerequisites

1. Start the service:
   ```bash
   cd brainbattle-dou
   npm run start:dev
   ```

2. Service should be running at `http://localhost:3001`

## Test Scenarios

### 1. GET /api/admin/learning/summary

```bash
# Get summary (all time)
curl -X GET "http://localhost:3001/api/admin/learning/summary" \
  -H "Content-Type: application/json"

# Get summary with date range
curl -X GET "http://localhost:3001/api/admin/learning/summary?from=2024-01-01&to=2024-01-31" \
  -H "Content-Type: application/json"

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "usersTotal": 150,
#     "usersActive7d": 45,
#     "attemptsTotal": 1250,
#     "attemptsInRange": 320,
#     "completionsInRange": 280,
#     "avgAccuracyInRange": 0.82
#   }
# }
```

### 2. GET /api/admin/learning/timeseries/attempts

```bash
# Get timeseries (all time)
curl -X GET "http://localhost:3001/api/admin/learning/timeseries/attempts" \
  -H "Content-Type: application/json"

# Get timeseries with date range
curl -X GET "http://localhost:3001/api/admin/learning/timeseries/attempts?from=2024-01-01&to=2024-01-31" \
  -H "Content-Type: application/json"

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "points": [
#       { "date": "2024-01-15", "attempts": 123, "completions": 45 },
#       { "date": "2024-01-16", "attempts": 145, "completions": 52 }
#     ]
#   }
# }
```

### 3. GET /api/admin/learning/top-lessons

```bash
# Get top lessons by attempts (default)
curl -X GET "http://localhost:3001/api/admin/learning/top-lessons" \
  -H "Content-Type: application/json"

# Get top lessons by completions
curl -X GET "http://localhost:3001/api/admin/learning/top-lessons?metric=completions" \
  -H "Content-Type: application/json"

# Get top lessons with custom limit
curl -X GET "http://localhost:3001/api/admin/learning/top-lessons?metric=attempts&limit=20" \
  -H "Content-Type: application/json"

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "items": [
#       { "lessonId": "lesson-1-1", "count": 245 },
#       { "lessonId": "lesson-1-2", "count": 189 }
#     ]
#   }
# }
```

### 4. GET /api/admin/learning/users/:userId/overview

```bash
# Get user overview
curl -X GET "http://localhost:3001/api/admin/learning/users/1/overview" \
  -H "Content-Type: application/json"

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "userId": 1,
#     "hearts": {
#       "current": 5,
#       "max": 5
#     },
#     "streakDays": 5,
#     "unitsCompleted": 2,
#     "planetsCompleted": 3,
#     "lastActiveAt": "2024-01-15T10:30:00.000Z"
#   }
# }

# Test invalid userId
curl -X GET "http://localhost:3001/api/admin/learning/users/invalid/overview" \
  -H "Content-Type: application/json"
# Expected: 400 Bad Request
```

### 5. GET /api/admin/learning/users/:userId/attempts

```bash
# Get user attempts (default limit 50)
curl -X GET "http://localhost:3001/api/admin/learning/users/1/attempts" \
  -H "Content-Type: application/json"

# Get user attempts with custom limit
curl -X GET "http://localhost:3001/api/admin/learning/users/1/attempts?limit=20" \
  -H "Content-Type: application/json"

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "items": [
#       {
#         "attemptId": "clxyz123",
#         "lessonId": "lesson-1-1",
#         "mode": "reading",
#         "score": 8,
#         "total": 10,
#         "accuracy": 0.8,
#         "durationSec": 120,
#         "completedAt": "2024-01-15T10:30:00.000Z",
#         "startedAt": "2024-01-15T10:28:00.000Z"
#       }
#     ]
#   }
# }
```

## Notes

- All endpoints are under `/api/admin/learning`
- No authentication required (no x-user-id or x-admin-key)
- Date format: YYYY-MM-DD
- All endpoints return `{ success: true, data: {...} }` format
- Swagger docs available at `http://localhost:3001/docs`

