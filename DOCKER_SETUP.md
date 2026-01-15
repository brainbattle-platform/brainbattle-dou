# Docker Setup for brainbattle-dou

## ✅ Changes Made

### 1. Dockerfile
- ✅ Added Prisma generate in both build and runtime stages
- ✅ Added migration deploy step before starting app
- ✅ CMD now runs: `npx prisma migrate deploy && node dist/main.js`

### 2. Code Fixes (Removed hardcoded localhost)
- ✅ `src/main.ts`: Changed to use `PORT` env variable, removed localhost from logs
- ✅ `src/storage/storage.service.ts`: Changed MinIO endpoint default from `localhost` to `bb-minio`
- ✅ `src/storage/storage.service.ts`: Changed PUBLIC_BASE_URL default from `localhost:3001` to `dou-service:3001`
- ✅ `src/app.module.ts`: Added `ConfigModule.forRoot({ isGlobal: true })` for environment variables

### 3. docker-compose.yml (brainbattle-infra)
- ✅ Added `dou-db` service (PostgreSQL on port 5436)
- ✅ Added `dou-service` with:
  - Build context pointing to `../brainbattle-dou`
  - Environment variables for DATABASE_URL, PORT, MinIO config
  - Depends on `dou-db` (with healthcheck) and `bb-minio`
  - Port mapping: `4004:3001` (external:internal)
  - Network: `brainbattle-net`

## 🚀 Running with Docker Compose

From `brainbattle-infra` directory:

```bash
# Start dou service and database
docker compose up dou-service dou-db

# Or in detached mode
docker compose up -d dou-service dou-db

# View logs
docker compose logs -f dou-service

# Stop services
docker compose down dou-service dou-db
```

## 🧪 Testing

### Health Check
```bash
# Check if service is running
curl http://localhost:4004/api/learning/map -H "x-user-id: 1"
```

### Learning Profile Overview
```bash
curl -X GET "http://localhost:4004/api/learning/profile/overview" \
  -H "x-user-id: 1" \
  -H "Content-Type: application/json"
```

### Swagger Docs
Open in browser: http://localhost:4004/api/docs

## 📋 Environment Variables

The dou-service uses these environment variables (set in docker-compose.yml):

- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://postgres:postgres@dou-db:5432/brainbattle_dou`)
- `PORT`: Server port (default: 3001)
- `MINIO_ENDPOINT`: MinIO endpoint (default: `bb-minio`)
- `MINIO_PORT`: MinIO port (default: 9000)
- `MINIO_USE_SSL`: Use SSL for MinIO (default: `false`)
- `MINIO_ACCESS_KEY`: MinIO access key (default: `minio-root`)
- `MINIO_SECRET_KEY`: MinIO secret key (default: `minio-root-secret`)
- `MINIO_BUCKET_NAME`: MinIO bucket name (default: `bb-learning`)
- `MINIO_REGION`: MinIO region (default: `us-east-1`)
- `PUBLIC_BASE_URL`: Public base URL for audio assets (default: `http://dou-service:3001`)

## 🔍 Verification

After starting, check logs for:
- ✅ "Prisma migrations applied successfully"
- ✅ "BrainBattle Duo service is running on port 3001"
- ✅ "Swagger UI available at http://0.0.0.0:3001/api/docs"
- ✅ "MinIO bucket 'bb-learning' is ready"

If you see database connection errors, ensure:
1. `dou-db` service is running and healthy
2. `DATABASE_URL` is correct
3. Database is accessible from dou-service container

## 📝 Port Mapping

- **dou-db**: `5436:5432` (host:container)
- **dou-service**: `4004:3001` (host:container)

## 🔗 Service Dependencies

- `dou-service` depends on:
  - `dou-db` (with healthcheck condition)
  - `bb-minio` (MinIO for audio storage)

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if dou-db is running
docker compose ps dou-db

# Check dou-db logs
docker compose logs dou-db

# Test connection from dou-service
docker compose exec dou-service sh -c "psql $DATABASE_URL -c 'SELECT 1'"
```

### MinIO Connection Issues
```bash
# Check if bb-minio is running
docker compose ps bb-minio

# Check MinIO logs
docker compose logs bb-minio
```

### Migration Issues
```bash
# Check migration status
docker compose exec dou-service npx prisma migrate status

# Manually run migrations
docker compose exec dou-service npx prisma migrate deploy
```

