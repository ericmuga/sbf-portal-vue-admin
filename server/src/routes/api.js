import { Router } from "express";
import { can, getAllPermissions, syncRolePermissions } from "../auth/acl.js";
import {
  Approval,
  AuditLog,
  Claim,
  FundingRequest,
  Invoice,
  LedgerEntry,
  NextOfKin,
  Notification,
  Payment,
  Permission,
  PoLine,
  Policy,
  Project,
  ProjectTask,
  PurchaseOrder,
  Role,
  Share,
  User
} from "../models/domain.js";
import { AuthService } from "../services/AuthService.js";
import { WorkflowService } from "../services/WorkflowService.js";

const r = Router();
const GOOGLE_OAUTH_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";
const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || "http://localhost:5173";

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const idx = part.indexOf("=");
        return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
      })
  );
}

function setRefreshCookie(res, refreshToken) {
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

function clearRefreshCookie(res) {
  res.clearCookie("refresh_token", { path: "/api/auth" });
}


function safeUser(user) {
  const record = user.toJSON();
  const role = user.role()?.toJSON() || null;
  const permissions = getAllPermissions(user);
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role,
    permissions
  };
}

function safeUser(user) {
  const record = user.toJSON();
  const role = user.role()?.toJSON() || null;
  const permissions = getAllPermissions(user);
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role,
    permissions
  };
}

function requireAuth(req, res, next) {
  if (req.session.user) {
    req.authUserId = req.session.user.id;
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const payload = AuthService.verifyAccessToken(token);
  if (!payload?.sub) return res.status(401).json({ error: "Not authenticated" });

  req.authUserId = Number(payload.sub);
  next();
}

function requirePermission(permissionKey) {
  return (req, res, next) => {
    if (!can(req.session.user, permissionKey)) {
      return res.status(403).json({ error: "Forbidden", missing: permissionKey });
    }

    if (!req.session.user) req.session.user = safeUser(user);
    next();
  };
}

function currentUser(req) {
  return User.find(req.session.user.id);
}

// ----------- Auth + OTP -----------
r.post("/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "name, email and password are required" });

  const existing = AuthService.findUserByEmail(email);
  if (existing) return res.status(400).json({ error: "Email already exists" });

  const created = User.create({
    name,
    email: String(email).toLowerCase(),
    password_hash: password,
    role_id: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  res.status(201).json({ ok: true, user: safeUser(created) });
});

r.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  const found = AuthService.findUserByEmail(email);
  if (!found || found.toJSON().password_hash !== password) {
    return res.status(400).json({ ok: false, error: "Invalid email or password" });
  }

  req.session.pendingUserId = found.toJSON().id;
  const otp = AuthService.issueOtp(found.toJSON().id);

  res.json({ ok: true, otpRequired: true, message: "OTP required", otpHint: otp.code });
});

r.post("/auth/request-otp", (req, res) => {
  const pendingUserId = req.session.pendingUserId;
  if (!pendingUserId) return res.status(400).json({ error: "No pending login found" });
  const otp = AuthService.issueOtp(pendingUserId);
  res.json({ ok: true, message: "OTP sent", otpHint: otp.code });
});

r.post("/auth/verify-otp", (req, res) => {
  const { otp } = req.body;
  const pendingUserId = req.session.pendingUserId;
  if (!pendingUserId) return res.status(400).json({ ok: false, error: "No pending login found" });

  const result = AuthService.verifyOtp(pendingUserId, otp);
  if (!result.ok) return res.status(400).json({ ok: false, error: result.error });

  const user = User.find(pendingUserId);
  req.session.user = safeUser(user);
  delete req.session.pendingUserId;
  res.json({ ok: true, user: req.session.user });
});

r.post("/auth/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));
r.get("/me", requireAuth, (req, res) => res.json({ user: req.session.user }));

// ---------- SBF module ----------
r.get("/policies", requireAuth, (req, res) => {
  const user = currentUser(req);
  const policies = Policy.where({ user_id: user.toJSON().id }).map(x => x.toJSON());
  res.json({ policies });
});
r.post("/auth/refresh", (req, res) => {
  const cookies = parseCookies(req);
  const refreshed = AuthService.refreshAuthTokens(cookies.refresh_token);
  if (!refreshed.ok) return res.status(401).json({ ok: false, error: refreshed.error });

r.get("/claims", requireAuth, (req, res) => {
  const user = currentUser(req);
  const claims = Claim.where({ user_id: user.toJSON().id }).map(x => x.toJSON());
  res.json({ claims });
});

r.post("/claims", requireAuth, (req, res) => {
  const user = currentUser(req);
  const claim = WorkflowService.submitClaim({ actorId: user.toJSON().id, payload: req.body });
  res.status(201).json({ claim: claim.toJSON() });
});

r.post("/claims/:id/documents", requireAuth, (req, res) => {
  const user = currentUser(req);
  const claim = Claim.find(Number(req.params.id));
  if (!claim) return res.status(404).json({ error: "Claim not found" });

  const { fileName, fileUrl } = req.body;
  if (!fileName) return res.status(400).json({ error: "fileName is required" });
  const doc = WorkflowService.uploadClaimDocument({ actorId: user.toJSON().id, claimId: claim.toJSON().id, fileName, fileUrl });
  res.status(201).json({ document: doc.toJSON() });
});

r.post("/messages", requireAuth, (req, res) => {
  const user = currentUser(req);
  const { recipientId, body } = req.body;
  const msg = WorkflowService.sendMessage({ actorId: user.toJSON().id, recipientId, body });
  res.status(201).json({ message: msg.toJSON() });
});

// -------- Chakama ranch module --------
r.post("/shares/subscribe", requireAuth, (req, res) => {
  const user = currentUser(req);
  const share = WorkflowService.subscribeShares({ actorId: user.toJSON().id, quantity: Number(req.body.quantity || 0) });
  res.status(201).json({ share: share.toJSON() });
});

r.get("/shares", requireAuth, (req, res) => {
  const user = currentUser(req);
  res.json({ shares: Share.where({ member_id: user.toJSON().id }).map(x => x.toJSON()) });
});

r.post("/next-of-kin", requireAuth, (req, res) => {
  const user = currentUser(req);
  const nok = WorkflowService.maintainNextOfKin({ actorId: user.toJSON().id, payload: req.body });
  res.status(201).json({ nextOfKin: nok.toJSON() });
});

r.get("/next-of-kin", requireAuth, (req, res) => {
  const user = currentUser(req);
  res.json({ nextOfKin: NextOfKin.where({ user_id: user.toJSON().id }).map(x => x.toJSON()) });
});

r.get("/vendor-ledger", requireAuth, requirePermission("ledger.manage"), (req, res) => {
  res.json({ entries: LedgerEntry.where({ ledger_type: "vendor" }).map(x => x.toJSON()) });
});

r.get("/customer-ledger", requireAuth, requirePermission("ledger.manage"), (req, res) => {
  res.json({ entries: LedgerEntry.where({ ledger_type: "customer" }).map(x => x.toJSON()) });
});

r.get("/funding-requests", requireAuth, (req, res) => {
  res.json({ fundingRequests: FundingRequest.all().map(x => x.toJSON()) });
});

r.post("/funding-requests", requireAuth, (req, res) => {
  const user = currentUser(req);
  const record = WorkflowService.createFundingRequest({ actorId: user.toJSON().id, payload: req.body });
  res.status(201).json({ fundingRequest: record.toJSON() });
});

r.get("/purchase-orders", requireAuth, (req, res) => res.json({ purchaseOrders: PurchaseOrder.all().map(x => x.toJSON()) }));
r.post("/purchase-orders", requireAuth, (req, res) => {
  const user = currentUser(req);
  const created = WorkflowService.createPurchaseOrder({ actorId: user.toJSON().id, payload: req.body });
  res.status(201).json({ purchaseOrder: created.toJSON() });
});

r.post("/purchase-orders/:id/lines", requireAuth, (req, res) => {
  const user = currentUser(req);
  const created = WorkflowService.addPoLine({ actorId: user.toJSON().id, purchaseOrderId: Number(req.params.id), payload: req.body });
  res.status(201).json({ line: created.toJSON() });
});

r.get("/purchase-orders/:id/lines", requireAuth, (req, res) => {
  res.json({ lines: PoLine.where({ purchase_order_id: Number(req.params.id) }).map(x => x.toJSON()) });
});

r.get("/projects", requireAuth, (req, res) => res.json({ projects: Project.all().map(x => x.toJSON()) }));
r.post("/projects/:id/tasks", requireAuth, (req, res) => {
  const user = currentUser(req);
  const task = WorkflowService.createProjectTask({ actorId: user.toJSON().id, payload: { ...req.body, project_id: Number(req.params.id) } });
  res.status(201).json({ task: task.toJSON() });
});

r.get("/projects/:id/tasks", requireAuth, (req, res) => {
  res.json({ tasks: ProjectTask.where({ project_id: Number(req.params.id) }).map(x => x.toJSON()) });
});

// ------ Approvals, audit, notifications ------
r.post("/approvals", requireAuth, (req, res) => {
  const user = currentUser(req);
  const record = WorkflowService.submitApproval({ actorId: user.toJSON().id, payload: req.body });
  res.status(201).json({ approval: record.toJSON() });
});

r.post("/approvals/:id/decision", requireAuth, requirePermission("approvals.manage"), (req, res) => {
  const user = currentUser(req);
  const { status, note } = req.body;
  if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "status must be approved or rejected" });

  const result = WorkflowService.approveReject({ actorId: user.toJSON().id, approvalId: Number(req.params.id), status, note });
  if (!result) return res.status(404).json({ error: "Approval request not found" });
  res.json({ approval: result.toJSON() });
});

r.get("/approvals", requireAuth, (req, res) => res.json({ approvals: Approval.all().map(x => x.toJSON()) }));
r.get("/audit-logs", requireAuth, requirePermission("approvals.manage"), (req, res) => res.json({ auditLogs: AuditLog.all().map(x => x.toJSON()) }));
r.get("/notifications", requireAuth, (req, res) => {
  const user = currentUser(req);
  res.json({ notifications: Notification.where({ user_id: user.toJSON().id }).map(x => x.toJSON()) });
});

// ------ Shared finance core ------
r.post("/invoices", requireAuth, (req, res) => {
  const user = currentUser(req);
  const invoice = WorkflowService.createInvoice({ actorId: user.toJSON().id, payload: req.body });
  res.status(201).json({ invoice: invoice.toJSON() });
});

r.post("/invoices/:id/lines", requireAuth, (req, res) => {
  const user = currentUser(req);
  const line = WorkflowService.addInvoiceLine({ actorId: user.toJSON().id, invoiceId: Number(req.params.id), payload: req.body });
  res.status(201).json({ line: line.toJSON() });
});

r.get("/invoices", requireAuth, (req, res) => res.json({ invoices: Invoice.all().map(x => x.toJSON()) }));

r.post("/payments/initiate", requireAuth, (req, res) => {
  const ref = `PAY-${Math.random().toString(16).slice(2).toUpperCase()}`;
  res.json({ ok: true, reference: ref, status: "PENDING", message: "Payment initiated" });
});

r.post("/payments/receive", requireAuth, requirePermission("payments.manage"), (req, res) => {
  const user = currentUser(req);
  const payment = WorkflowService.receivePayment({ actorId: user.toJSON().id, payload: req.body });
  res.status(201).json({ payment: payment.toJSON() });
});

r.get("/payments", requireAuth, requirePermission("payments.view"), (req, res) => res.json({ payments: Payment.all().map(x => x.toJSON()) }));

// ---------- Admin RBAC ----------
r.get("/admin/permissions", requireAuth, requirePermission("roles.view"), (req, res) => {
  res.json({ permissions: Permission.all().map(x => x.toJSON()) });
});

r.get("/admin/roles", requireAuth, requirePermission("roles.view"), (req, res) => {
  const roles = Role.all().map(role => ({ ...role.toJSON(), permissions: role.permissions().map(p => p.key) }));
  res.json({ roles });
});

r.post("/admin/roles/:id/permissions", requireAuth, requirePermission("roles.manage"), (req, res) => {
  const role = syncRolePermissions(Number(req.params.id), req.body.permissions || []);
  if (!role) return res.status(400).json({ error: "Invalid role" });
  res.json({ ok: true, role: { ...role.toJSON(), permissions: role.permissions().map(x => x.key) } });
});

r.get("/admin/users", requireAuth, requirePermission("users.view"), (req, res) => {
  res.json({ users: User.all().map(u => safeUser(u)) });
});

r.post("/admin/users/:id/role", requireAuth, requirePermission("users.manage"), (req, res) => {
  const user = User.find(Number(req.params.id));
  const role = Role.find(Number(req.body.roleId));
  if (!user || !role) return res.status(400).json({ error: "Invalid user or role" });

  user.assignRole(role.toJSON().id);
  const fresh = safeUser(user);
  if (req.session.user?.id === fresh.id) req.session.user = fresh;
  res.json({ ok: true, user: fresh });
});

r.post("/admin/users/:id/permissions", requireAuth, requirePermission("users.manage"), (req, res) => {
  const user = User.find(Number(req.params.id));
  if (!user) return res.status(400).json({ error: "Invalid user" });
  user.syncPermissions(req.body.permissions || []);

  const fresh = safeUser(user);
  if (req.session.user?.id === fresh.id) req.session.user = fresh;
  res.json({ ok: true, user: fresh });
});

r.get("/admin/users/:id/ability", requireAuth, requirePermission("users.view"), (req, res) => {
  const user = User.find(Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ userId: user.toJSON().id, role: user.role()?.toJSON().name || null, permissions: getAllPermissions(user) });
});

r.get("/admin/summary", requireAuth, requirePermission("admin.access"), (req, res) => {
  res.json({
    ok: true,
    stats: {
      users: User.all().length,
      payments: Payment.all().length,
      pos: PurchaseOrder.all().length,
      projects: Project.all().length,
      approvals: Approval.all().length,
      fundingRequests: FundingRequest.all().length
    }
  });
});


r.get("/admin/payments", requireAuth, requirePermission("payments.view"), (req, res) => {
  res.json({ payments: Payment.all().map(x => x.toJSON()) });
});

r.get("/admin/pos", requireAuth, requirePermission("pos.view"), (req, res) => {
  res.json({ purchaseOrders: PurchaseOrder.all().map(x => x.toJSON()) });
});

r.get("/admin/projects", requireAuth, requirePermission("projects.view"), (req, res) => {
  res.json({ projects: Project.all().map(x => x.toJSON()) });
});

r.get("/admin/projects/:id/tasks", requireAuth, requirePermission("projects.view"), (req, res) => {
  res.json({ tasks: ProjectTask.where({ project_id: Number(req.params.id) }).map(x => x.toJSON()) });
});

export default r;
