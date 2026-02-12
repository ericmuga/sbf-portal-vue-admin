# SBF Portal (Vue + Tailwind) + Node/Express API (ES6) — Member + Admin Portal

This repo contains:
- `server/` Express API (ES modules) with demo RBAC
- `client/` Vue 3 + Vite + Tailwind UI:
  - Member portal (Dashboard, Payments Cart, Claims workflow, Beneficiaries)
  - Admin portal (Users, Roles & Permissions, Payments, POs, Projects)

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

## Demo Login Flow
1) Go to `/login` (email + password)
2) After successful credentials, go to OTP screen
3) OTP is `123456`

## Demo Users (password: Pass123!)
- Admin: admin@sbf.test
- Finance Officer: finance@sbf.test
- Project Manager: pm@sbf.test
- Member: member@sbf.test

## Role-Based Access
Admin routes require permissions like:
- `admin.access`
- `users.view`, `users.manage`
- `roles.view`
- `payments.view`
- `pos.view`
- `projects.view`
