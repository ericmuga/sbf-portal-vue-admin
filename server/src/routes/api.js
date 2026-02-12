import { Router } from "express";
import {
  permissions,
  roles,
  users,
  getRole,
  safeUser,
  mockPolicies,
  beneficiariesByPolicy,
  claims,
  createClaim,
  purchaseOrders,
  projects,
  projectTasksByProject,
  payments
} from "../data/mock.js";

const r = Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Not authenticated" });
  next();
}

function requirePermission(permissionKey) {
  return (req, res, next) => {
    const u = req.session.user;
    if (!u?.permissions?.includes(permissionKey)) {
      return res.status(403).json({ error: "Forbidden", missing: permissionKey });
    }
    next();
  };
}

// --- Auth (credentials -> OTP) ---
r.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  const found = users.find(u => u.email.toLowerCase() === String(email || "").toLowerCase());
  if (!found || found.password !== password) {
    return res.status(400).json({ ok: false, error: "Invalid email or password" });
  }

  // store pending user until OTP verification
  req.session.pendingUserId = found.id;
  res.json({ ok: true, otpRequired: true, message: "OTP required. Use 123456 (demo)." });
});

r.post("/auth/request-otp", (req, res) => {
  // In real life: generate OTP and send via SMS/email
  res.json({ ok: true, message: "OTP sent (demo). Use 123456." });
});

r.post("/auth/verify-otp", (req, res) => {
  const { otp } = req.body;
  if (otp !== "123456") return res.status(400).json({ ok: false, error: "Invalid OTP" });

  const pendingId = req.session.pendingUserId;
  const found = users.find(u => u.id === pendingId);
  if (!found) return res.status(400).json({ ok: false, error: "No pending login found" });

  req.session.user = safeUser(found);
  delete req.session.pendingUserId;

  res.json({ ok: true, user: req.session.user });
});

r.post("/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

r.get("/me", requireAuth, (req, res) => res.json({ user: req.session.user }));

// --- Member portal APIs ---
r.get("/policies", requireAuth, (req, res) => res.json({ policies: mockPolicies }));

r.get("/beneficiaries", requireAuth, (req, res) => {
  const policyNo = req.query.policyNo;
  if (!policyNo) return res.status(400).json({ error: "policyNo is required" });
  res.json({ policyNo, beneficiaries: beneficiariesByPolicy[policyNo] || [] });
});

r.get("/claims", requireAuth, (req, res) => res.json({ claims }));

r.post("/claims", requireAuth, (req, res) => {
  const { policyNo, type, description, amount } = req.body;
  if (!policyNo || !type) return res.status(400).json({ error: "policyNo and type are required" });
  const created = createClaim({ policyNo, type, description, amount, docs: [] });
  res.status(201).json({ claim: created });
});

r.post("/payments/initiate", requireAuth, (req, res) => {
  const ref = `PAY-${Math.random().toString(16).slice(2).toUpperCase()}`;
  res.json({ ok: true, reference: ref, status: "PENDING", message: "Payment initiated (demo)." });
});

// -------------------- Admin APIs --------------------
r.get("/admin/summary", requireAuth, requirePermission("admin.access"), (req, res) => {
  res.json({
    ok: true,
    stats: {
      users: users.length,
      payments: payments.length,
      pos: purchaseOrders.length,
      projects: projects.length
    }
  });
});

// Users / Roles / Permissions
r.get("/admin/permissions", requireAuth, requirePermission("roles.view"), (req, res) => res.json({ permissions }));
r.get("/admin/roles", requireAuth, requirePermission("roles.view"), (req, res) => res.json({ roles }));

r.get("/admin/users", requireAuth, requirePermission("users.view"), (req, res) => {
  res.json({ users: users.map(safeUser) });
});

r.post("/admin/users/:id/role", requireAuth, requirePermission("users.manage"), (req, res) => {
  const id = Number(req.params.id);
  const { roleId } = req.body;
  const u = users.find(x => x.id === id);
  const r0 = roles.find(x => x.id === Number(roleId));
  if (!u || !r0) return res.status(400).json({ error: "Invalid user or role" });
  u.roleId = r0.id;
  res.json({ ok: true, user: safeUser(u) });
});

// Payments
r.get("/admin/payments", requireAuth, requirePermission("payments.view"), (req, res) => {
  res.json({ payments });
});

// POs
r.get("/admin/pos", requireAuth, requirePermission("pos.view"), (req, res) => {
  res.json({ purchaseOrders });
});

// Projects + tasks
r.get("/admin/projects", requireAuth, requirePermission("projects.view"), (req, res) => {
  res.json({ projects });
});

r.get("/admin/projects/:id/tasks", requireAuth, requirePermission("projects.view"), (req, res) => {
  const id = Number(req.params.id);
  res.json({ tasks: projectTasksByProject[id] || [] });
});

export default r;
