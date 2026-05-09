import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

import { parse as parseDotenv } from "dotenv";

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const DEFAULT_PORT = 53682;

type GoogleTokenResponse = {
  refresh_token?: string;
  access_token?: string;
  error?: string;
  error_description?: string;
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function getEnvFileCandidates(): string[] {
  return unique([
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
  ]).filter((filePath) => existsSync(filePath));
}

function loadEnv(): Record<string, string | undefined> {
  const loaded: Record<string, string | undefined> = { ...process.env };

  for (const filePath of getEnvFileCandidates()) {
    const parsed = parseDotenv(readFileSync(filePath));
    for (const [key, value] of Object.entries(parsed)) {
      if (value.trim()) {
        loaded[key] = value;
      }
    }
  }

  return loaded;
}

function base64Url(value: Buffer): string {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function setEnvValue(content: string, key: string, value: string): string {
  const escapedValue = value.replace(/\r?\n/g, "");
  const line = `${key}=${escapedValue}`;
  const matcher = new RegExp(`^${key}=.*$`, "m");

  if (matcher.test(content)) {
    return content.replace(matcher, line);
  }

  const separator = content.endsWith("\n") ? "" : "\n";
  return `${content}${separator}${line}\n`;
}

function writeEnvValues(values: Record<string, string>): void {
  for (const filePath of getEnvFileCandidates()) {
    let content = readFileSync(filePath, "utf-8");
    for (const [key, value] of Object.entries(values)) {
      content = setEnvValue(content, key, value);
    }
    writeFileSync(filePath, content);
    console.log(`[GmailAuthorize] Updated ${filePath}`);
  }
}

function buildAuthUrl(
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
): string {
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GMAIL_SEND_SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  return authUrl.toString();
}

function waitForAuthorizationCode(port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const requestUrl = new URL(req.url || "/", `http://127.0.0.1:${port}`);

      if (requestUrl.pathname !== "/oauth2callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const error = requestUrl.searchParams.get("error");
      const code = requestUrl.searchParams.get("code");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>Gmail authorization failed</h1><p>You can close this tab.</p>");
        server.close();
        reject(new Error(`Google returned OAuth error: ${error}`));
        return;
      }

      if (!code) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          "<h1>Missing authorization code</h1>" +
            "<p>Return to the terminal, open the Google authorization URL, and finish the consent flow.</p>",
        );
        console.warn(
          `[GmailAuthorize] Ignoring callback without code: ${requestUrl.toString()}`,
        );
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>Gmail authorization complete</h1><p>You can close this tab and return to the terminal.</p>");
      server.close();
      resolve(code);
    });

    server.on("error", reject);
    server.listen(port, "127.0.0.1");
  });
}

async function exchangeAuthorizationCode(
  clientId: string,
  clientSecret: string | undefined,
  redirectUri: string,
  code: string,
  codeVerifier: string,
): Promise<string> {
  const body = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
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

  const data = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || data.error) {
    throw new Error(
      data.error_description || data.error || `Google token exchange failed with HTTP ${response.status}.`,
    );
  }

  if (!data.refresh_token) {
    throw new Error(
      "Google did not return a refresh token. Re-run this script and approve consent again.",
    );
  }

  return data.refresh_token;
}

async function main(): Promise<void> {
  const env = loadEnv();
  const clientId = env.GMAIL_CLIENT_ID;
  const clientSecret = env.GMAIL_CLIENT_SECRET || undefined;
  const fromEmail = env.GMAIL_FROM_EMAIL;
  const port = Number(env.GMAIL_OAUTH_PORT || DEFAULT_PORT);
  const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;

  if (!clientId) {
    throw new Error("Set GMAIL_CLIENT_ID in projekat/.env first.");
  }

  if (!fromEmail) {
    throw new Error("Set GMAIL_FROM_EMAIL in projekat/.env to the Gmail address you will authorize.");
  }

  const codeVerifier = base64Url(randomBytes(64));
  const codeChallenge = base64Url(createHash("sha256").update(codeVerifier).digest());
  const authUrl = buildAuthUrl(clientId, redirectUri, codeChallenge);

  console.log("[GmailAuthorize] Open this URL in your browser:");
  console.log(authUrl);
  console.log("");
  console.log(`[GmailAuthorize] Waiting for Google callback on ${redirectUri}`);

  const code = await waitForAuthorizationCode(port);
  const refreshToken = await exchangeAuthorizationCode(
    clientId,
    clientSecret,
    redirectUri,
    code,
    codeVerifier,
  );

  writeEnvValues({
    GMAIL_REFRESH_TOKEN: refreshToken,
    GMAIL_FROM_EMAIL: fromEmail,
  });

  console.log("[GmailAuthorize] Gmail API refresh token saved.");
}

main().catch((error) => {
  console.error("[GmailAuthorize] Failed:", error);
  process.exitCode = 1;
});
