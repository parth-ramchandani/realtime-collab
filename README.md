# Real-Time Collaboration Tool

A practical real-time collaboration app where multiple users can join a shared room, edit text together, and see live activity updates.

## Tech Stack

- Backend: Node.js, TypeScript, Express, Socket.IO
- Frontend: React, TypeScript, Vite
- Deployment target: AWS EC2 + nginx + GitHub Actions

## Features Implemented

- Session management (`create`, `join`, `fetch`)
- Presence system with active users list
- Shared editor with real-time sync (last write wins)
- Real-time activity feed (join, leave, message, editor updates)
- Debounced editor updates to reduce socket event noise
- CI pipeline for backend and frontend build checks

## Project Structure

```text
backend/src/
  controllers/
  routes/
  services/
  sockets/
  types/
  utils/

frontend/src/
  components/
  hooks/
  pages/
  services/
```

## Local Setup

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:4000`.

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## API Endpoints

- `POST /session/create`
- `POST /session/join`
- `GET /session/:id`
- `POST /ai/session/:id/summarize`
- `POST /ai/session/:id/suggest`

## WebSocket Events

- Client -> Server: `join_session`, `leave_session`, `send_message`, `editor_update`
- Server -> Client: `presence_updated`, `activity_updated`, `editor_state`, `error_event`

## EC2 Deployment Notes

### Backend

1. Launch EC2 (Ubuntu), open ports `22`, `80`, `443`, `4000` (or keep `4000` internal only).
2. Install Node.js 20, nginx, git.
3. Clone repo and set up environment:
   - `backend/.env` with `PORT=4000` and `CLIENT_ORIGIN=http://<EC2_PUBLIC_IP>`
4. Build and run backend with PM2:
   - `npm ci && npm run build`
   - `pm2 start dist/server.js --name collab-backend`

### Frontend + nginx

1. Build frontend: `npm ci && npm run build`
2. Copy `frontend/dist` to `/var/www/collab-app`
3. Use `deploy/nginx.conf` in `/etc/nginx/sites-available/default`
4. Restart nginx: `sudo systemctl restart nginx`

The nginx config proxies WebSocket traffic (`/socket.io/`) and API calls (`/api/`) to the backend.

## CI/CD from GitHub Actions

- CI workflow is available at `.github/workflows/ci.yml`.
- For CD, add an SSH deployment job that:
  - connects to EC2
  - pulls latest `main`
  - runs backend/frontend build
  - reloads PM2 and nginx

## Scaling Approach

- Stateless backend instances behind a load balancer
- Socket.IO Redis adapter (enabled when `REDIS_URL` is provided) for multi-instance fan-out
- Session and activity persistence in MongoDB
- Sticky sessions or shared socket adapter for connection affinity
- Rate limiting and event batching for editor updates under heavy load

## Bonus Features Completed

- **Message persistence**: chat and activity events are stored in MongoDB and reloaded on join.
- **Scaling awareness in code**: optional Redis adapter support is implemented for horizontal socket scaling.
- **Managed WebSocket guidance**: implementation path documented in `deploy/apigateway-websocket-notes.md`.
- **AI feature**: added both:
  - suggest next sentence (`POST /ai/session/:id/suggest`)
  - summarize session (`POST /ai/session/:id/summarize`)
- **Performance hardening**:
  - client-side debounced editor updates
  - server-side editor activity throttling and duplicate-content suppression
