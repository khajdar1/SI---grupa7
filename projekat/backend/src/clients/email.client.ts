import nodemailer from "nodemailer";

export class EmailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

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

function buildPasswordResetHtml(resetUrl: string): string {
  return `
    <p>Zaprimili smo zahtjev za reset lozinke.</p>
    <p>Link vrijedi 30 minuta i moze se iskoristiti samo jednom.</p>
    <p><a href="${resetUrl}">Postavi novu lozinku</a></p>
    <p>Ako niste zatrazili reset, mozete ignorisati ovu poruku.</p>
  `;
}

async function sendViaSmtp(email: string, resetUrl: string, from: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user || !pass) {
    throw new EmailDeliveryError("SMTP provider is not configured.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from,
    to: email,
    subject: "Reset lozinke",
    html: buildPasswordResetHtml(resetUrl),
  });
}

async function sendViaResend(email: string, resetUrl: string, from: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new EmailDeliveryError("Resend provider is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Reset lozinke",
      html: buildPasswordResetHtml(resetUrl),
    }),
  });

  if (!response.ok) {
    throw new EmailDeliveryError("Failed to send password reset email.");
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = buildPasswordResetUrl(token);
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM;
  const hasSmtpConfig = Boolean(
    process.env.SMTP_HOST || process.env.SMTP_USER || process.env.SMTP_PASSWORD,
  );
  const hasResendConfig = Boolean(process.env.RESEND_API_KEY);

  if (!from || (!hasSmtpConfig && !hasResendConfig)) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[EmailClient] Password reset link for ${email}: ${resetUrl}`);
      return;
    }

    throw new EmailDeliveryError("Email provider is not configured.");
  }

  if (hasSmtpConfig) {
    await sendViaSmtp(email, resetUrl, from);
    return;
  }

  await sendViaResend(email, resetUrl, from);
}
