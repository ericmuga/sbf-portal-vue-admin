import crypto from "node:crypto";
import { OtpToken, User } from "../models/domain.js";
import { MailerService } from "./MailerService.js";

const ACCESS_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 900);
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getTokenSecret() {
  return process.env.AUTH_TOKEN_SECRET || process.env.SESSION_SECRET || "dev-secret";
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signAccessToken(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + ACCESS_TTL_SECONDS };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(claims));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", getTokenSecret()).update(data).digest("base64url");
  return `${data}.${signature}`;
}

function verifyAccessToken(token) {
  if (!token || token.split(".").length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = token.split(".");
  const data = `${encodedHeader}.${encodedPayload}`;
  const expected = crypto.createHmac("sha256", getTokenSecret()).update(data).digest("base64url");
  if (expected !== signature) return null;

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function newRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

export class AuthService {
  static findUserByEmail(email) {
    return User.where({ email: String(email || "").toLowerCase() })[0] || null;
  }

  static async issueOtp(userId) {
    const user = User.find(userId);
    if (!user) return { ok: false, error: "User not found" };

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    OtpToken.create({ user_id: userId, code, expires_at: expiresAt });

    try {
      const mailStatus = await MailerService.sendOtpEmail({
        toEmail: user.toJSON().email,
        otpCode: code,
        expiresAt
      });
      return { ok: true, expiresAt, mailStatus };
    } catch (error) {
      return { ok: false, error: `Failed to send OTP email: ${error.message}` };
    }
  }

  static verifyOtp(userId, otpCode) {
    const row = OtpToken.db
      .prepare("SELECT * FROM otp_tokens WHERE user_id = ? AND consumed_at IS NULL ORDER BY id DESC LIMIT 1")
      .get(userId);

    if (!row) return { ok: false, error: "No OTP requested" };
    if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, error: "OTP expired" };
    if (row.code !== otpCode) return { ok: false, error: "Invalid OTP" };

    OtpToken.db.prepare("UPDATE otp_tokens SET consumed_at = ? WHERE id = ?").run(new Date().toISOString(), row.id);
    return { ok: true };
  }

  static issueAuthTokens(user) {
    const userData = user.toJSON();
    const accessToken = signAccessToken({ sub: userData.id, email: userData.email, type: "access" });

    const rawRefresh = newRefreshToken();
    const refreshHash = hashToken(rawRefresh);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    OtpToken.db
      .prepare("INSERT INTO refresh_tokens(user_id, token_hash, expires_at) VALUES(?, ?, ?)")
      .run(userData.id, refreshHash, expiresAt);

    return { accessToken, refreshToken: rawRefresh, refreshExpiresAt: expiresAt };
  }

  static verifyAccessToken(token) {
    return verifyAccessToken(token);
  }

  static refreshAuthTokens(refreshToken) {
    if (!refreshToken) return { ok: false, error: "Missing refresh token" };

    const tokenHash = hashToken(refreshToken);
    const row = OtpToken.db
      .prepare("SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL ORDER BY id DESC LIMIT 1")
      .get(tokenHash);

    if (!row) return { ok: false, error: "Invalid refresh token" };
    if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, error: "Refresh token expired" };

    const user = User.find(row.user_id);
    if (!user) return { ok: false, error: "User not found" };

    OtpToken.db.prepare("UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?").run(new Date().toISOString(), row.id);

    const next = this.issueAuthTokens(user);
    return { ok: true, user, ...next };
  }

  static revokeRefreshToken(refreshToken) {
    if (!refreshToken) return;
    const tokenHash = hashToken(refreshToken);
    OtpToken.db.prepare("UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL").run(new Date().toISOString(), tokenHash);
  }
}
