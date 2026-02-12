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

## What was implemented

### 1) Laravel-like permissions (Node.js)
- Role + permission checks via `can(user, permission)`
- Role-permission and direct user-permission sync
- Ability inspection endpoint

### 2) SQLite persistence + abstractions
- `better-sqlite3` database with schema bootstrap in `server/src/db/schema.js`
- Reusable base model (`BaseModel`) and domain model inheritance in `server/src/models/domain.js`
- Shared service inheritance via `BaseDomainService` for audit logs + notifications

### 3) 2FA OTP
- Login now requires OTP verification
- OTP is generated dynamically and expires in 5 minutes
- Endpoints: login, request OTP, verify OTP

### 4) Feature modules from your diagram (core backend coverage)
- SBF module: policies, claims, claim docs, member-admin messaging
- Chakama Ranch module: shares, next-of-kin, projects/tasks, funding requests, PO + PO lines, ledgers
- Approvals/Audit/Notifications: submit/decide approvals, track, audit logs, notifications
- Shared finance core: invoices + invoice lines, receive/view payments, customer ledger posting

## Important API endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `GET /api/admin/users/:id/ability`
- `POST /api/admin/roles/:id/permissions`
- `POST /api/admin/users/:id/permissions`

## Demo Users (password: Pass123!)
- Admin: admin@sbf.test
- Finance Officer: finance@sbf.test
- Project Manager: pm@sbf.test
- Member: member@sbf.test
