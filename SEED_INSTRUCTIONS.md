# Seed Listening Content - Instructions

## Prerequisites

Before running the seed script, ensure MinIO is running.

### Option 1: Start MinIO via Docker Compose (Recommended)

```bash
cd brainbattle-infra
docker-compose up -d bb-minio
```

Verify MinIO is running:
```bash
docker ps | grep minio
```

Access MinIO Console: http://localhost:9001
- Username: `minio-root`
- Password: `minio-root-secret`

### Option 2: Start MinIO Manually

```bash
docker run -d -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minio-root \
  -e MINIO_ROOT_PASSWORD=minio-root-secret \
  --name bb-minio \
  minio/minio server /data --console-address ":9001"
```

## Environment Variables

Ensure `.env` file in `brainbattle-dou/` contains:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minio-root
MINIO_SECRET_KEY=minio-root-secret
MINIO_BUCKET_NAME=bb-learning
MINIO_REGION=us-east-1
```

## Run Seed Script

```bash
cd brainbattle-dou
npm run seed:listening
```

## Expected Output

```
🌱 Seeding B1 listening content...

✅ Bucket 'bb-learning' already exists
📥 Downloading audio: anna-bathroom.ogg...
✅ Downloaded 45.23 KB
📤 Uploading to MinIO: audio/abc123...ogg...
✅ Uploaded to MinIO
✅ Created AudioAsset: clxyz123
✅ Created Question: q-listening-b1-01
...
🎉 Seed completed!
📊 Created 6 listening questions with audio
📊 Created 4 additional questions (reading/writing)
```

## Troubleshooting

### Error: ECONNREFUSED
- **Cause**: MinIO is not running
- **Solution**: Start MinIO using one of the options above

### Error: Access Denied
- **Cause**: Wrong MinIO credentials
- **Solution**: Check `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` in `.env`

### Error: Bucket creation failed
- **Cause**: Insufficient permissions or MinIO not fully started
- **Solution**: Wait a few seconds and try again, or create bucket manually in MinIO console

