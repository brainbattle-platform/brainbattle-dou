# BrainBattle Duo Service (NestJS skeleton)

- 10+ modules under `src/duo`:
  - user-profile
  - language
  - course
  - skill
  - lesson
  - exercise
  - answer
  - progress
  - review
  - recommend
  - telemetry
  - notification

## Quick start

```bash
npm install
npm run start:dev
```

Service runs at: `http://localhost:3001/api`

Example endpoints:

- `GET /api/duo/skills/11/lessons`
- `GET /api/duo/lessons/101`
- `POST /api/duo/lessons/101/answer`
