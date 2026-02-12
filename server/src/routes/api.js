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
    const user = currentUser(req);
    if (!user || !can(user, permissionKey)) {
      return res.status(403).json({ error: "Forbidden", missing: permissionKey });
    }

    if (!req.session.user) req.session.user = safeUser(user);
    next();
  };
}

function currentUser(req) {
  return User.find(req.authUserId || req.session.user?.id);
}


function serializeProject(project) {
  const row = project.toJSON();
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    budget: Number(row.budget || 0),
    startDate: row.start_date,
    endDate: row.end_date
  };
}

function serializePurchaseOrder(po) {
  const row = po.toJSON();
  return {
    id: row.id,
    poNumber: row.po_number,
    vendor: row.vendor,
    project: row.project,
    status: row.status,
    total: Number(row.total || 0),
    createdAt: row.created_at
  };
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

r.get("/auth/google/start", (req, res) => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    const redirectTo = `${CLIENT_BASE_URL}/login?error=${encodeURIComponent("Google login is not configured. Set GOOGLE_OAUTH_CLIENT_ID")}`;
    return res.redirect(redirectTo);
  }

  const state = Math.random().toString(36).slice(2);
  req.session.googleOAuthState = state;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

r.get("/auth/google/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    const redirectTo = `${CLIENT_BASE_URL}/login?error=${encodeURIComponent("Google login failed: missing code")}`;
    return res.redirect(redirectTo);
  }
  if (!state || state !== req.session.googleOAuthState) {
    const redirectTo = `${CLIENT_BASE_URL}/login?error=${encodeURIComponent("Google login failed: invalid state")}`;
    return res.redirect(redirectTo);
  }

  try {
    const tokenBody = new URLSearchParams({
      code: String(code),
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
      redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
      grant_type: "authorization_code"
    });

    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody
    });
    if (!tokenResp.ok) {
      await tokenResp.text();
      const redirectTo = `${CLIENT_BASE_URL}/login?error=${encodeURIComponent("Google token exchange failed")}`;
      return res.redirect(redirectTo);
    }

    const tokenData = await tokenResp.json();
    const profileResp = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    if (!profileResp.ok) {
      await profileResp.text();
      const redirectTo = `${CLIENT_BASE_URL}/login?error=${encodeURIComponent("Google profile fetch failed")}`;
      return res.redirect(redirectTo);
    }

    const profile = await profileResp.json();
    if (!profile.email) {
      const redirectTo = `${CLIENT_BASE_URL}/login?error=${encodeURIComponent("Google account has no email")}`;
      return res.redirect(redirectTo);
    }

    let user = AuthService.findUserByEmail(profile.email);
    if (!user) {
      user = User.create({
        name: profile.name || profile.email.split("@")[0],
        email: String(profile.email).toLowerCase(),
        password_hash: "oauth-google",
        role_id: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const authTokens = AuthService.issueAuthTokens(user);
    req.session.user = safeUser(user);
    req.authUserId = user.toJSON().id;
    setRefreshCookie(res, authTokens.refreshToken);
    delete req.session.googleOAuthState;

    const redirectTo = `${CLIENT_BASE_URL}/login/google/callback?accessToken=${encodeURIComponent(authTokens.accessToken)}`;
    return res.redirect(redirectTo);
  } catch (error) {
    const redirectTo = `${CLIENT_BASE_URL}/login?error=${encodeURIComponent("Google login failed")}`;
    return res.redirect(redirectTo);
  }
});

r.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const found = AuthService.findUserByEmail(email);
  if (!found || found.toJSON().password_hash !== password) {
    return res.status(400).json({ ok: false, error: "Invalid email or password" });
  }

  req.session.pendingUserId = found.toJSON().id;
  const otp = await AuthService.issueOtp(found.toJSON().id);
  if (!otp.ok) return res.status(500).json({ ok: false, error: otp.error });

  res.json({ ok: true, otpRequired: true, message: "OTP sent to your Gmail address" });
});

r.post("/auth/request-otp", async (req, res) => {
  const pendingUserId = req.session.pendingUserId;
  if (!pendingUserId) return res.status(400).json({ error: "No pending login found" });
  const otp = await AuthService.issueOtp(pendingUserId);
  if (!otp.ok) return res.status(500).json({ ok: false, error: otp.error });
  res.json({ ok: true, message: "OTP sent to your Gmail address" });
});

r.post("/auth/verify-otp", (req, res) => {
  const { otp } = req.body;
  const pendingUserId = req.session.pendingUserId;
  if (!pendingUserId) return res.status(400).json({ ok: false, error: "No pending login found" });

  const result = AuthService.verifyOtp(pendingUserId, otp);
  if (!result.ok) return res.status(400).json({ ok: false, error: result.error });

  const user = User.find(pendingUserId);
  const authTokens = AuthService.issueAuthTokens(user);
  req.session.user = safeUser(user);
  delete req.session.pendingUserId;
  setRefreshCookie(res, authTokens.refreshToken);
  res.json({ ok: true, user: req.session.user, accessToken: authTokens.accessToken });
});

r.post("/auth/logout", (req, res) => {
  const cookies = parseCookies(req);
  AuthService.revokeRefreshToken(cookies.refresh_token);
  clearRefreshCookie(res);
  req.session.destroy(() => res.json({ ok: true }));
});
r.post("/auth/refresh", (req, res) => {
  const cookies = parseCookies(req);
  const refreshed = AuthService.refreshAuthTokens(cookies.refresh_token);
  if (!refreshed.ok) return res.status(401).json({ ok: false, error: refreshed.error });

  const userSafe = safeUser(refreshed.user);
  req.session.user = userSafe;
  req.authUserId = userSafe.id;
  setRefreshCookie(res, refreshed.refreshToken);

  res.json({ ok: true, accessToken: refreshed.accessToken, user: userSafe });
});

r.get("/me", requireAuth, (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  const nextUser = safeUser(user);
  req.session.user = nextUser;
  res.json({ user: nextUser });
});

// ---------- SBF module ----------
r.get("/policies", requireAuth, (req, res) => {
  const user = currentUser(req);
  const policies = Policy.where({ user_id: user.toJSON().id }).map(x => x.toJSON());
  res.json({ policies });
});

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

r.get("/admin/users/:id", requireAuth, requirePermission("users.view"), (req, res) => {
  const user = User.find(Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: safeUser(user) });
});

r.post("/admin/users", requireAuth, requirePermission("users.manage"), (req, res) => {
  const { name, email, password, roleId } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "name, email and password are required" });

  const exists = AuthService.findUserByEmail(email);
  if (exists) return res.status(400).json({ error: "Email already exists" });

  const role = Role.find(Number(roleId || 4));
  if (!role) return res.status(400).json({ error: "Invalid role" });

  const created = User.create({
    name,
    email: String(email).toLowerCase(),
    password_hash: password,
    role_id: role.toJSON().id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  res.status(201).json({ user: safeUser(created) });
});

r.put("/admin/users/:id", requireAuth, requirePermission("users.manage"), (req, res) => {
  const user = User.find(Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });

  const updates = {};
  if (req.body.name) updates.name = req.body.name;
  if (req.body.email) {
    const normalized = String(req.body.email).toLowerCase();
    const conflict = AuthService.findUserByEmail(normalized);
    if (conflict && conflict.toJSON().id !== user.toJSON().id) return res.status(400).json({ error: "Email already exists" });
    updates.email = normalized;
  }
  if (req.body.password) updates.password_hash = req.body.password;
  if (req.body.roleId !== undefined) {
    const role = Role.find(Number(req.body.roleId));
    if (!role) return res.status(400).json({ error: "Invalid role" });
    updates.role_id = role.toJSON().id;
  }

  updates.updated_at = new Date().toISOString();
  user.update(updates);

  if (req.body.permissions) user.syncPermissions(req.body.permissions || []);

  const fresh = safeUser(user);
  if (req.session.user?.id === fresh.id) req.session.user = fresh;
  res.json({ user: fresh });
});

r.delete("/admin/users/:id", requireAuth, requirePermission("users.manage"), (req, res) => {
  const id = Number(req.params.id);
  if (req.session.user?.id === id) return res.status(400).json({ error: "You cannot delete your own account" });

  const user = User.find(id);
  if (!user) return res.status(404).json({ error: "User not found" });

  User.db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ ok: true });
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

r.get("/admin/purchase-orders", requireAuth, requirePermission("pos.view"), (req, res) => {
  res.json({ purchaseOrders: PurchaseOrder.all().map(serializePurchaseOrder) });
});

// Compatibility alias for clients using snake_case
r.get("/admin/purchase_orders", requireAuth, requirePermission("pos.view"), (req, res) => {
  res.json({ purchaseOrders: PurchaseOrder.all().map(serializePurchaseOrder) });
});

r.get("/admin/purchase-orders/:id", requireAuth, requirePermission("pos.view"), (req, res) => {
  const po = PurchaseOrder.find(Number(req.params.id));
  if (!po) return res.status(404).json({ error: "Purchase order not found" });
  res.json({ purchaseOrder: serializePurchaseOrder(po) });
});

r.post("/admin/purchase-orders", requireAuth, requirePermission("pos.manage"), (req, res) => {
  const { poNumber, vendor, project, status, total } = req.body;
  if (!poNumber || !vendor) return res.status(400).json({ error: "poNumber and vendor are required" });

  const created = PurchaseOrder.create({
    po_number: poNumber,
    vendor,
    project: project || null,
    status: status || "submitted",
    total: Number(total || 0),
    created_at: new Date().toISOString()
  });
  res.status(201).json({ purchaseOrder: serializePurchaseOrder(created) });
});

r.put("/admin/purchase-orders/:id", requireAuth, requirePermission("pos.manage"), (req, res) => {
  const po = PurchaseOrder.find(Number(req.params.id));
  if (!po) return res.status(404).json({ error: "Purchase order not found" });

  const updates = {};
  if (req.body.poNumber !== undefined) updates.po_number = req.body.poNumber;
  if (req.body.vendor !== undefined) updates.vendor = req.body.vendor;
  if (req.body.project !== undefined) updates.project = req.body.project;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.total !== undefined) updates.total = Number(req.body.total || 0);

  po.update(updates);
  res.json({ purchaseOrder: serializePurchaseOrder(po) });
});

r.delete("/admin/purchase-orders/:id", requireAuth, requirePermission("pos.manage"), (req, res) => {
  const id = Number(req.params.id);
  const po = PurchaseOrder.find(id);
  if (!po) return res.status(404).json({ error: "Purchase order not found" });

  PurchaseOrder.db.prepare("DELETE FROM purchase_orders WHERE id = ?").run(id);
  res.json({ ok: true });
});

r.get("/admin/pos", requireAuth, requirePermission("pos.view"), (req, res) => {
  res.json({ purchaseOrders: PurchaseOrder.all().map(serializePurchaseOrder) });
});

r.get("/admin/projects", requireAuth, requirePermission("projects.view"), (req, res) => {
  res.json({ projects: Project.all().map(serializeProject) });
});

r.get("/admin/projects/:id", requireAuth, requirePermission("projects.view"), (req, res) => {
  const project = Project.find(Number(req.params.id));
  if (!project) return res.status(404).json({ error: "Project not found" });
  res.json({ project: serializeProject(project) });
});

r.post("/admin/projects", requireAuth, requirePermission("projects.manage"), (req, res) => {
  const { title, status, budget, startDate, endDate } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });

  const created = Project.create({
    title,
    status: status || "planned",
    budget: Number(budget || 0),
    start_date: startDate || null,
    end_date: endDate || null
  });
  res.status(201).json({ project: serializeProject(created) });
});

r.put("/admin/projects/:id", requireAuth, requirePermission("projects.manage"), (req, res) => {
  const project = Project.find(Number(req.params.id));
  if (!project) return res.status(404).json({ error: "Project not found" });

  const updates = {};
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.budget !== undefined) updates.budget = Number(req.body.budget || 0);
  if (req.body.startDate !== undefined) updates.start_date = req.body.startDate;
  if (req.body.endDate !== undefined) updates.end_date = req.body.endDate;

  project.update(updates);
  res.json({ project: serializeProject(project) });
});

r.delete("/admin/projects/:id", requireAuth, requirePermission("projects.manage"), (req, res) => {
  const id = Number(req.params.id);
  const project = Project.find(id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  Project.db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  res.json({ ok: true });
});

r.get("/admin/projects/:id/tasks", requireAuth, requirePermission("projects.view"), (req, res) => {
  res.json({ tasks: ProjectTask.where({ project_id: Number(req.params.id) }).map(x => x.toJSON()) });
});

export default r;
