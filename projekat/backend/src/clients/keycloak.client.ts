import type { RegisterInput } from "../modules/auth/auth.schema";
import { HTTP_STATUS } from "../constants";


function getKeycloakConfig() {
  const url = process.env.KEYCLOAK_URL;
  const realm = process.env.KEYCLOAK_REALM;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  if (!url || !realm || !clientId || !clientSecret) {
    throw new Error(
      "Missing required Keycloak environment variables: " +
        "KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET"
    );
  }

  return { url, realm, clientId, clientSecret };
}

export class KeycloakError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KeycloakError";
  }
}

export async function getKeycloakAdminToken(): Promise<string> {
  const { url, realm, clientId, clientSecret } = getKeycloakConfig();

  const res = await fetch(
    `${url}/realms/${realm}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  );

  if (!res.ok) {
    throw new KeycloakError("Failed to obtain Keycloak admin token.");
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function createKeycloakUser(
  token: string,
  input: Pick<RegisterInput, "username" | "email" | "firstName" | "lastName" | "password">
): Promise<string> {
  const { url, realm } = getKeycloakConfig();

  const res = await fetch(`${url}/admin/realms/${realm}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      username: input.username,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      enabled: true,
      credentials: [
        { type: "password", value: input.password, temporary: false },
      ],
    }),
  });

  if (res.status === HTTP_STATUS.CONFLICT) {
    throw new Error("KEYCLOAK_CONFLICT");
  }

  if (!res.ok) {
    const details = await res.text();
    console.error("[KeycloakClient] User creation failed:", details);
    throw new KeycloakError("Failed to create user in Keycloak.");
  }

  const location = res.headers.get("Location");
  if (!location) {
    throw new KeycloakError("Keycloak did not return the new user's ID.");
  }

  const sub = location.split("/").pop();
  if (!sub) {
    throw new KeycloakError("Could not parse Keycloak user ID from Location header.");
  }

  return sub;
}

export async function deleteKeycloakUser(sub: string): Promise<void> {
  const { url, realm } = getKeycloakConfig();

  try {
    const token = await getKeycloakAdminToken();

    const res = await fetch(`${url}/admin/realms/${realm}/users/${sub}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error(
        `[KeycloakClient] Failed to delete orphaned user (sub=${sub}): HTTP ${res.status}`
      );
    } else {
      console.warn(
        `[KeycloakClient] Orphaned Keycloak user deleted (sub=${sub}).`
      );
    }
  } catch (err) {
    console.error(
      `[KeycloakClient] Exception while deleting orphaned user (sub=${sub}):`,
      err
    );
  }
}

export async function loginKeycloakUser(
  username: string,
  password: string
): Promise<{ access_token: string; refresh_token: string }> {
  const { url, realm, clientId, clientSecret } = getKeycloakConfig();

  console.log("[KeycloakClient] Login token request initiated.");

  const res = await fetch(`${url}/realms/${realm}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password,
    }),
  });

  if (!res.ok) {
    console.warn(
      `[KeycloakClient] Keycloak rejected login attempt. HTTP status: ${res.status}`
    );
    throw new KeycloakError("Invalid username or password.");
  }

  console.log(`[KeycloakClient] Token obtained successfully — username: ${username}`);
  return res.json();
}

export async function logoutKeycloakUser(refreshToken: string): Promise<void> {
  const { url, realm, clientId, clientSecret } = getKeycloakConfig();

  console.log("[KeycloakClient] Logout token request initiated.");

  const res = await fetch(`${url}/realms/${realm}/protocol/openid-connect/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    console.warn(`[KeycloakClient] Keycloak rejected logout attempt. HTTP status: ${res.status}`);
  } else {
    console.log(`[KeycloakClient] Keycloak session terminated successfully.`);
  }
}

export async function sendKeycloakResetEmail(adminToken: string, email: string): Promise<void> {
  const { url, realm } = getKeycloakConfig();

  const usersRes = await fetch(
    `${url}/admin/realms/${realm}/users?email=${encodeURIComponent(email)}&exact=true`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!usersRes.ok) {
    throw new KeycloakError("Failed to fetch user for password reset.");
  }

  const users = await usersRes.json();
  if (!users || users.length === 0) {
    console.warn(`[KeycloakClient] Reset requested for unknown email: ${email}`);
    return; 
  }

  const userId = users[0].id;

  const actionsRes = await fetch(
    `${url}/admin/realms/${realm}/users/${userId}/execute-actions-email`,
    {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["UPDATE_PASSWORD"]),
    }
  );

  if (!actionsRes.ok) {
    throw new KeycloakError("Failed to trigger password reset email in Keycloak.");
  }

  console.log(`[KeycloakClient] Password reset email triggered for user ID: ${userId}`);
}
