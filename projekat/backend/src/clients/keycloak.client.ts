import type { RegisterInput } from "../modules/auth/auth.schema";


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

  if (res.status === 409) {
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