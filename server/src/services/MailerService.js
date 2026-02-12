function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function toBase64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getAccessToken() {
  if (process.env.GMAIL_ACCESS_TOKEN) return process.env.GMAIL_ACCESS_TOKEN;

  const clientId = requiredEnv("GMAIL_CLIENT_ID");
  const clientSecret = requiredEnv("GMAIL_CLIENT_SECRET");
  const refreshToken = requiredEnv("GMAIL_REFRESH_TOKEN");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token"
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get Google access token: ${text}`);
  }

  const json = await response.json();
  if (!json.access_token) throw new Error("Google token response missing access_token");
  return json.access_token;
}

export class MailerService {
  static async sendOtpEmail({ toEmail, otpCode, expiresAt }) {
    if (String(process.env.OTP_EMAIL_ENABLED || "false").toLowerCase() !== "true") {
      return { skipped: true, reason: "OTP_EMAIL_ENABLED is false" };
    }

    const from = process.env.GMAIL_FROM || requiredEnv("GMAIL_USER");
    const gmailUser = requiredEnv("GMAIL_USER");
    const accessToken = await getAccessToken();

    const subject = "Your SBF Portal OTP Code";
    const text = `Your OTP is ${otpCode}. It expires at ${expiresAt}. If you did not request this, ignore this email.`;

    const mimeMessage = [
      `From: ${from}`,
      `To: ${toEmail}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      text
    ].join("\r\n");

    const raw = toBase64Url(mimeMessage);

    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(gmailUser)}/messages/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send Gmail OTP: ${errorText}`);
    }

    return { skipped: false };
  }
}
