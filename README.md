# Real-Time Collaboration Tool

A full-stack real-time collaboration app where users can create/join shared sessions, edit together live, and see presence/activity updates in real time.

## Deliverables

- GitHub Repository: https://github.com/parth-ramchandani/realtime-collab
- Live Backend URL (EC2): http://34.226.206.203/api/health
- Frontend (Local): http://localhost:5173
- Frontend (Deployed): http://34.226.206.203/

## Tech Stack

- Backend: Node.js, TypeScript, Express, Socket.IO
- Frontend: React, TypeScript, Vite
- Infra: AWS EC2, nginx, PM2, GitHub Actions
- Data/Scale: MongoDB, Redis (optional adapter for multi-instance Socket.IO)

## Setup Instructions

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Required backend env values:

- `PORT`
- `CLIENT_ORIGIN`
- `MONGO_URI`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `REDIS_URL`

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Required frontend env values:

- `VITE_API_BASE_URL`
- `VITE_SOCKET_URL`

## Architecture Explanation

- `backend/src/controllers`: HTTP controllers for session/AI endpoints.
- `backend/src/services`: business logic (sessions, AI, persistence behavior).
- `backend/src/sockets`: Socket.IO event registration, presence updates, editor synchronization.
- `backend/src/models`: MongoDB models for session/activity persistence.
- `backend/src/routes`: REST route declarations.
- `frontend/src/pages`: `HomePage` (create/join) and `RoomPage` (editor, presence, activity, AI actions).
- `frontend/src/services`: API and socket clients.
- `frontend/src/hooks`: shared hooks such as editor debounce.

## Scaling Approach

- Session/activity persistence in MongoDB for recoverable session state.
- Optional Redis Socket.IO adapter (`REDIS_URL`) for horizontal backend scaling.
- WebSocket events are room-scoped and editor updates are debounced/throttled to reduce event floods.
- Designed to run behind nginx/load balancer with stateless backend instances.

## Deployment (EC2 + nginx + CI/CD)

- Frontend served by nginx from `/var/www/collab-app`.
- Backend runs as PM2 process (`collab-backend`) on port `4000`.
- nginx proxies:
    - `/api/*` -> backend
    - `/socket.io/*` -> backend websocket transport
- CI: `.github/workflows/ci.yml` (build checks for frontend/backend).
- CD: `.github/workflows/deploy.yml` (SSH deploy to EC2 with health-check gate and rollback).

## Useful Endpoints

- `POST /session/create`
- `POST /session/join`
- `GET /session/:id`
- `POST /ai/session/:id/suggest`
- `POST /ai/session/:id/summarize`
