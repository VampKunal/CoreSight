# FitTrack Architecture

## What Was Built

A real-time AI-powered posture correction and diet planning backend with five services:

| Service | Tech | Port | Responsibility |
|---------|------|------|----------------|
| `api-service` | Node.js / Express | 5000 | REST API, JWT auth, store posture sessions + diet plans, call LLM |
| `worker-service` | Node.js | — | Consume RabbitMQ queues, forward posture data to api-service |
| `python-service` | Python / FastAPI | 8000 | Receive video frame, run MediaPipe pose analysis, publish to RabbitMQ |
| `mongodb` | MongoDB 6 | 27017 | Persistent data store |
| `redis` | Redis Alpine | 6379 | Caching for exercise data |
| `rabbitmq` | RabbitMQ 3 | 5672 / 15672 | Async message bus between python-service and worker |

---

## How It Works — Data Flow

```
React Native App (future)
    │
    │  POST /analyze  { frame: "<base64 JPEG>", userId, exercise }
    ▼
[python-service : FastAPI]
  1. Decode base64 → raw bytes
  2. OpenCV → numpy image
  3. MediaPipe Pose → 33 body landmarks
  4. Compute angles: neck tilt, spine, knees, shoulder symmetry
  5. Score (0–100) and list issues
  6. Publish JSON → RabbitMQ "postureQueue"
  7. Return immediate response { sessionId, score, issues, angles, queued }
    │
    │ RabbitMQ  postureQueue
    ▼
[worker-service : Node.js]
  - Consume postureQueue message
  - HTTP POST → api-service /api/posture/ingest
    with X-Internal-Secret header
    │
    ▼
[api-service : Node.js]
  /api/posture/ingest (internalAuth middleware)
  - Validate internal secret
  - Call Gemini gemini-1.5-flash → generate correction suggestions per issue
  - Save PostureSession to MongoDB
  - Return 201

[User fetches results]
  GET /api/posture/sessions    → paginated list (no heavy landmarks)
  GET /api/posture/latest      → most recent session + suggestions
  GET /api/posture/sessions/:id → full detail including landmarks

[Diet Plan]
  POST /api/diet/generate { goal, targetCalories, preferences[] }
  → Gemini generates structured 4-meal plan
  → Saved to MongoDB as DietPlan
  GET /api/diet/      → paginated history
  PATCH /api/diet/:id → manual edits
  DELETE /api/diet/:id
```

---

## File Structure

```
fittrack/
├── docker-compose.yml
├── api-service/
│   ├── controllers/
│   │   ├── authController.js       # register, login, refreshToken
│   │   ├── postureController.js    # ingestSession, getSessions, getLatest
│   │   └── dietController.js       # generatePlan, getDietPlans, update, delete
│   ├── models/
│   │   ├── PostureSession.js       # NEW
│   │   ├── DietPlan.js             # NEW
│   │   └── user.js
│   ├── routes/
│   │   ├── postureRoutes.js        # NEW
│   │   ├── dietRoutes.js           # NEW
│   │   └── authRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT verification
│   │   ├── internalAuthMiddleware.js  # NEW: X-Internal-Secret
│   │   ├── rateLimiter.js          # express-rate-limit
│   │   └── errorMiddleware.js
│   ├── services/
│   │   └── llmService.js           # NEW: Gemini posture suggestions + diet plans
│   └── utils/logger.js             # Winston
├── worker-service/
│   ├── worker.js                   # Consumes postureQueue
│   └── utils/logger.js
└── python-service/                 # NEW
    ├── main.py                     # FastAPI app
    ├── pose_analyzer.py            # MediaPipe + OpenCV analysis
    ├── queue_publisher.py          # pika → RabbitMQ
    ├── requirements.txt
    └── Dockerfile
```

---

## API Endpoints

### Auth  `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register user |
| POST | `/login` | — | Login → access + refresh tokens |
| POST | `/refresh` | — | Rotate tokens |

> Rate limited: 100 req / 15 min per IP

### Posture  `/api/posture`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ingest` | Internal Secret | Worker → save posture session |
| GET | `/sessions?page=&limit=` | JWT | Paginated history |
| GET | `/latest` | JWT | Most recent session |
| GET | `/sessions/:id` | JWT | Full session detail |

### Diet  `/api/diet`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/generate` | JWT | LLM-generated meal plan |
| GET | `/?page=&limit=` | JWT | Paginated plans |
| PATCH | `/:id` | JWT | Edit plan |
| DELETE | `/:id` | JWT | Delete plan |

### Python Service  (port 8000)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/analyze` | Analyze frame: `{ frame, userId, exercise }` |
| GET | `/health` | Liveness check |

---

## Environment Variables

### `api-service/.env`

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `PORT` | API server port | Set to `5000` |
| `MONGO_URI` | MongoDB connection | `mongodb://mongodb:27017/fittrack` (Docker) |
| `REDIS_URL` | Redis connection | `redis://redis:6379` (Docker) |
| `RABBITMQ_URL` | RabbitMQ connection | `amqp://rabbitmq` (Docker) |
| `JWT_SECRET` | Access token signing key | **Generate a strong random string** |
| `JWT_REFRESH_SECRET` | Refresh token signing key | **Generate a strong random string** |
| `INTERNAL_SECRET` | Worker → API auth key | **Any secret string, must match worker .env** |
| `GEMINI_API_KEY` | 🔑 Gemini API key | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |

### `worker-service/.env`

| Variable | Description |
|----------|-------------|
| `RABBITMQ_URL` | `amqp://rabbitmq` |
| `API_SERVICE_URL` | `http://api-service:5000` |
| `INTERNAL_SECRET` | Must match api-service value |

### `python-service/.env`

| Variable | Description |
|----------|-------------|
| `RABBITMQ_URL` | `amqp://rabbitmq` |
| `INTERNAL_SECRET` | Same shared secret |

---

## External APIs Required

| API | Purpose | Env Var | Sign Up |
|-----|---------|---------|---------|
| **Gemini** (required) | Posture suggestions + diet plan generation | `GEMINI_API_KEY` | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) — free tier available (`gemini-1.5-flash`) |
| **Nutritionix** (optional) | Real calorie/macro data per food item | `NUTRITIONIX_APP_ID` + `NUTRITIONIX_APP_KEY` | [developer.nutritionix.com](https://developer.nutritionix.com) — free tier 500 req/day |

---

## How to Run

```bash
# 1. Fill in all real values in .env files
# 2. Build and start all services
docker compose up --build

# Check RabbitMQ management UI
open http://localhost:15672   # guest / guest

# Test posture analysis (with a real base64 frame)
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"frame":"<base64>","userId":"<mongoId>","exercise":"squat"}'

# Fetch posture history (after login to get JWT)
curl http://localhost:5000/api/posture/sessions \
  -H "Authorization: Bearer <accessToken>"

# Generate diet plan
curl -X POST http://localhost:5000/api/diet/generate \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"goal":"muscle gain","targetCalories":2800,"preferences":["high protein"]}'
```

---

## Security Notes

- **INTERNAL_SECRET** must be identical in `api-service`, `worker-service`, and `python-service`. Rotate it in all three when changing.
- **JWT_SECRET** and **JWT_REFRESH_SECRET** should be different strong random strings (e.g. `openssl rand -hex 32`).
- Never commit real `.env` files — add them to `.gitignore`.
- Rate limiting is applied on auth routes (100 req/15 min) and diet generation to protect LLM cost.
