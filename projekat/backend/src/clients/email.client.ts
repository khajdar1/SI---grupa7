export class EmailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

type GmailTokenResponse = {
  access_token?: string;
};

function getResetPasswordBaseUrl(): string {
  return (
    process.env.RESET_PASSWORD_BASE_URL ||
    process.env.PUBLIC_APP_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000/reset-password"
  ).replace(/\/+$/, "");
}

export function buildPasswordResetUrl(token: string): string {
  const baseUrl = getResetPasswordBaseUrl();
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function buildFromHeader(email: string, displayName?: string): string {
  const safeEmail = sanitizeHeader(email);
  const safeDisplayName = sanitizeHeader(displayName || "");

  return safeDisplayName ? `${safeDisplayName} <${safeEmail}>` : safeEmail;
}

function buildPasswordResetHtml(resetUrl: string): string {
  const safeResetUrl = escapeHtml(resetUrl);

  return `
    <p>Zaprimili smo zahtjev za reset lozinke.</p>
    <p>Link vrijedi 30 minuta i moze se iskoristiti samo jednom.</p>
    <p><a href="${safeResetUrl}">Postavi novu lozinku</a></p>
    <p>Ako niste zatrazili reset, mozete ignorisati ovu poruku.</p>
  `;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getGmailAccessToken(): Promise<string> {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !refreshToken) {
    throw new EmailDeliveryError("Gmail API provider is not configured.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new EmailDeliveryError("Failed to authorize Gmail API email provider.");
  }

  const data = (await response.json()) as GmailTokenResponse;

  if (!data.access_token) {
    throw new EmailDeliveryError("Gmail API provider did not return an access token.");
  }

  return data.access_token;
}

function buildRawEmail(email: string, resetUrl: string): string {
  const fromEmail = process.env.GMAIL_FROM_EMAIL;

  if (!fromEmail) {
    throw new EmailDeliveryError("Gmail sender email is not configured.");
  }

  const html = buildPasswordResetHtml(resetUrl);
  const headers = [
    `To: ${sanitizeHeader(email)}`,
    `From: ${buildFromHeader(fromEmail, process.env.GMAIL_FROM_NAME)}`,
    "Subject: Reset lozinke",
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
  ];

  return `${headers.join("\r\n")}\r\n\r\n${html}`;
}

async function sendViaGmailApi(email: string, resetUrl: string): Promise<void> {
  const accessToken = await getGmailAccessToken();
  const raw = encodeBase64Url(buildRawEmail(email, resetUrl));

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    throw new EmailDeliveryError("Failed to send password reset email.");
  }
}

function hasGmailConfig(): boolean {
  return Boolean(
    process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_REFRESH_TOKEN &&
      process.env.GMAIL_FROM_EMAIL,
  );
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = buildPasswordResetUrl(token);

  if (!hasGmailConfig()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[EmailClient] Password reset link for ${email}: ${resetUrl}`);
      return;
    }

    throw new EmailDeliveryError("Gmail API provider is not configured.");
  }

  await sendViaGmailApi(email, resetUrl);
}
