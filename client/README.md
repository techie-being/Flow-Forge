# FlowForge frontend

React + Vite client for the FlowForge backend (Node/Express + PostgreSQL).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Start the backend on `http://localhost:5000` first. In dev, Vite proxies `/api/*` to it, so the browser talks to a single origin: no CORS setup, and the HTTP-only `accessToken` / `refreshToken` cookies just work.

To call the backend directly instead, copy `.env.example` to `.env`, set `VITE_API_BASE=http://localhost:5000/api/v1`, and make sure the backend CORS config allows your frontend origin with `credentials: true`.

## What's covered

| Guide | Endpoint | Where in the UI |
|---|---|---|
| Health | `GET /health` | Status pill in the sidebar (re-checks every 30s, click to re-check) |
| Users | `POST /users/register` | Create account |
| | `POST /users/login` | Sign in |
| | `POST /users/logout` | Account → Sign out |
| | `POST /users/refresh-token` | Automatic retry on 401, plus Account → Refresh session |
| | `GET /users/me` | Session check on load, Account page |
| | `POST /users/setup-account` (multipart: `fullname`, `avatar`) | Account → Update profile |
| | `GET /users/profile/:username` | `/u/:username` (works signed out; username is URL-encoded) |
| Tasks | `POST /tasks` (multipart: `description`, `file`) | Tasks → New task (PDF only, 5 MB, checked before upload) |
| | `GET /tasks/get-all-task` | Tasks list, filter by status, quiet refresh every 10s |
| | `GET /tasks/taskBy/:id` | Task detail |
| | `DELETE /tasks/:id` | Two-step delete from list and detail |
| Workers | `POST /workers/register` | Workers → Register a worker |
| | `GET /workers/get-all` | Workers list with load meter |
| | `GET /workers/by/:id` | Worker detail |
| | `PATCH /workers/status/:id` | Status dropdown (idle, busy, offline, error) |

There is no worker delete in the UI, matching the guide.

## Notes

- All HTTP traffic uses the shared transport in `src/api/api.js`, configured by `VITE_API_BASE`. The legacy `flowForgeApi` facade reuses that transport and preserves the response envelope expected by older components and Redux slices.
- Profile setup accepts JPEG, PNG, WebP, or GIF images up to 500 KB, matching the backend upload middleware.
- The worker routes currently have no JWT protection; secure them before exposing worker management in production.
- Registration allows any non-whitespace password, matching the backend validation.
