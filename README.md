# SBF Portal (Vue + Tailwind) + Node/Express API (ES6)

This repo contains:
- `server/` Express API (ES modules) with SQLite-backed RBAC and workflow modules
- `client/` Vue 3 + Vite + Tailwind UI

## Run (Dev)

### 1) API
```bash
cd server
npm install
npm run dev
```
API runs on http://localhost:3000

### 2) Client
```bash
cd client
npm install
npm run dev
```
Client runs on http://localhost:5173

## Auth features implemented

### Email OTP 2FA
- Email/password login requires OTP verification
- OTP expires in 5 minutes
- OTP sent with Gmail API OAuth2 transport

### Google Login
- Login page has **Continue with Google**
- Backend OAuth flow:
  - `GET /api/auth/google/start`
  - `GET /api/auth/google/callback`
- Callback redirects to client route:
  - `/login/google/callback?accessToken=...`
- If Google OAuth is not configured/misconfigured, server redirects back to `/login` with a user-friendly error query message.

### Self registration
- Login page **Create an Account** now navigates to `/login/register`
- New users can register with name, email, and password via `POST /api/auth/register`

### Access + Refresh token flow
- Access token is a short-lived signed token (default 15 minutes)
- Refresh token is long-lived, HTTP-only cookie (default 30 days)
- Refresh endpoint:
  - `POST /api/auth/refresh`
- Client axios interceptor auto-refreshes on `401` and retries request

## Required env for Google login + token refresh
Use `server/.env.example` as base.

```bash
SESSION_SECRET=dev-secret
AUTH_TOKEN_SECRET=dev-token-secret
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_DAYS=30
CLIENT_BASE_URL=http://localhost:5173
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
```

## Google Cloud OAuth local setup
For localhost testing:

- Authorized JavaScript origins:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
- Authorized redirect URI:
  - `http://localhost:3000/api/auth/google/callback`
  - `http://127.0.0.1:3000/api/auth/google/callback`

## Existing backend modules
- Laravel-like permissions (role + direct permission sync)
- SQLite model abstractions + service inheritance
- SBF module, Chakama ranch module, approvals/audit/notifications, and shared finance workflows
