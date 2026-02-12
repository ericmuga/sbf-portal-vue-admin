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

## Google/Gmail OTP delivery
OTP is now sent to Gmail using the Google Gmail API (OAuth2).

Set these environment variables before starting the API:

```bash
OTP_EMAIL_ENABLED=true
GMAIL_USER=youraccount@gmail.com
GMAIL_FROM="SBF Portal <youraccount@gmail.com>"

# Option A: use a long-lived access token you rotate manually
GMAIL_ACCESS_TOKEN=...

# Option B: auto-refresh token (recommended)
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
```

If `OTP_EMAIL_ENABLED` is false, OTP email delivery is skipped (useful in local dev).

## What was implemented

### 1) Laravel-like permissions (Node.js)
- Role + permission checks via `can(user, permission)`
- Role-permission and direct user-permission sync
- Ability inspection endpoint

### 2) SQLite persistence + abstractions
- SQLite via Node's built-in `node:sqlite`
- Schema bootstrap in `server/src/db/schema.js`
- Reusable base model (`BaseModel`) and domain model inheritance in `server/src/models/domain.js`
- Shared service inheritance via `BaseDomainService` for audit logs + notifications

### 3) 2FA OTP
- Login requires OTP verification
- OTP expires in 5 minutes
- OTP is delivered over Gmail email transport
- Endpoints: login, request OTP, verify OTP

### 4) Feature modules from your diagram (core backend coverage)
- SBF module: policies, claims, claim docs, member-admin messaging
- Chakama Ranch module: shares, next-of-kin, projects/tasks, funding requests, PO + PO lines, ledgers
- Approvals/Audit/Notifications: submit/decide approvals, track, audit logs, notifications
- Shared finance core: invoices + invoice lines, receive/view payments, customer ledger posting
