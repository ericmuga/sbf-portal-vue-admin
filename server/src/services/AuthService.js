import { OtpToken, User } from "../models/domain.js";
import { MailerService } from "./MailerService.js";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
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
}
