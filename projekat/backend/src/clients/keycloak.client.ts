import type { RegisterInput } from "../modules/auth/auth.schema";
import { HTTP_STATUS } from "../constants";

const DEFAULT_BUSINESS_ROLES = ["Korisnik", "korisnik"] as const;

export const MANAGED_KEYCLOAK_ROLE_ALIASES = {
  KORISNIK: ["Korisnik", "korisnik"],
  SERVISER: ["Serviser", "serviser"],
  KOORDINATOR: ["Koordinator", "koordinator"],
  MENADZMENT: ["Menadzment", "menadzment", "Management", "management"],
  KOMPANIJA_ADMIN: ["KompanijaAdmin", "kompanijaadmin", "CompanyAdmin", "companyadmin"],
  SUPPORT_AGENT: ["SupportAgent", "supportagent", "AgentPodrske", "agentpodrske"],
  ADMIN: ["Admin", "admin", "Administrator", "administrator"],
} as const;

export type ManagedKeycloakRole = keyof typeof MANAGED_KEYCLOAK_ROLE_ALIASES;

type KeycloakRealmRole = {
  id: string;
  name: string;
};

type KeycloakUserSummary = {
  id?: string;
};

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

async function getRealmRoleByName(
  token: string,
  roleName: string
): Promise<KeycloakRealmRole | null> {
  const { url, realm } = getKeycloakConfig();

  const response = await fetch(`${url}/admin/realms/${realm}/roles/${encodeURIComponent(roleName)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === HTTP_STATUS.NOT_FOUND) {
    return null;
  }

  if (!response.ok) {
    throw new KeycloakError(`Failed to load Keycloak role "${roleName}".`);
  }

  const role = (await response.json()) as KeycloakRealmRole;
  return role;
}

async function assignRealmRoleToUser(
  token: string,
  userId: string,
  role: KeycloakRealmRole
): Promise<void> {
  const { url, realm } = getKeycloakConfig();

  const response = await fetch(`${url}/admin/realms/${realm}/users/${userId}/role-mappings/realm`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([{ id: role.id, name: role.name }]),
  });

  if (!response.ok) {
    throw new KeycloakError(`Failed to assign Keycloak role "${role.name}" to user.`);
  }
}

async function removeRealmRolesFromUser(
  token: string,
  userId: string,
  roles: KeycloakRealmRole[]
): Promise<void> {
  if (roles.length === 0) {
    return;
  }

  const { url, realm } = getKeycloakConfig();

  const response = await fetch(`${url}/admin/realms/${realm}/users/${userId}/role-mappings/realm`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(roles.map((role) => ({ id: role.id, name: role.name }))),
  });

  if (!response.ok) {
    throw new KeycloakError("Failed to remove existing Keycloak business roles from user.");
  }
}

async function getUserRealmRoleMappings(
  token: string,
  userId: string
): Promise<KeycloakRealmRole[]> {
  const { url, realm } = getKeycloakConfig();

  const response = await fetch(`${url}/admin/realms/${realm}/users/${userId}/role-mappings/realm`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new KeycloakError("Failed to load Keycloak role mappings for user.");
  }

  return (await response.json()) as KeycloakRealmRole[];
}

async function getExistingManagedRealmRoles(token: string): Promise<KeycloakRealmRole[]> {
  const roles: KeycloakRealmRole[] = [];
  const seenRoleIds = new Set<string>();

  for (const aliases of Object.values(MANAGED_KEYCLOAK_ROLE_ALIASES)) {
    for (const roleName of aliases) {
      const role = await getRealmRoleByName(token, roleName);
      if (role && !seenRoleIds.has(role.id)) {
        roles.push(role);
        seenRoleIds.add(role.id);
      }
    }
  }

  return roles;
}

async function getPreferredRoleForManagedRole(
  token: string,
  managedRole: ManagedKeycloakRole
): Promise<KeycloakRealmRole> {
  for (const roleName of MANAGED_KEYCLOAK_ROLE_ALIASES[managedRole]) {
    const role = await getRealmRoleByName(token, roleName);
    if (role) {
      return role;
    }
  }

  throw new KeycloakError(
    `Keycloak role for ${managedRole} is missing. Create one of: ${MANAGED_KEYCLOAK_ROLE_ALIASES[managedRole].join(", ")}.`
  );
}

async function assignDefaultBusinessRole(token: string, userId: string): Promise<void> {
  for (const roleName of DEFAULT_BUSINESS_ROLES) {
    const role = await getRealmRoleByName(token, roleName);
    if (role) {
      await assignRealmRoleToUser(token, userId, role);
      return;
    }
  }

  throw new KeycloakError(
    `Default business role is missing in Keycloak. Create one of: ${DEFAULT_BUSINESS_ROLES.join(", ")}.`
  );
}

async function deleteKeycloakUserByAdminToken(token: string, sub: string): Promise<void> {
  const { url, realm } = getKeycloakConfig();
  await fetch(`${url}/admin/realms/${realm}/users/${sub}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
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

  try {
    await assignDefaultBusinessRole(token, sub);
  } catch (error) {
    await deleteKeycloakUserByAdminToken(token, sub);
    throw error;
  }

  return sub;
}

export async function updateKeycloakUser(
  token: string,
  userId: string,
  input: Partial<Pick<RegisterInput, "username" | "email" | "firstName" | "lastName">> & {
    enabled?: boolean;
  }
): Promise<void> {
  const { url, realm } = getKeycloakConfig();

  const response = await fetch(`${url}/admin/realms/${realm}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (response.status === HTTP_STATUS.CONFLICT) {
    throw new Error("KEYCLOAK_CONFLICT");
  }

  if (!response.ok) {
    throw new KeycloakError("Failed to update user in Keycloak.");
  }
}

export async function setKeycloakUserPassword(
  token: string,
  userId: string,
  password: string,
): Promise<void> {
  const { url, realm } = getKeycloakConfig();

  const response = await fetch(`${url}/admin/realms/${realm}/users/${userId}/reset-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: "password",
      value: password,
      temporary: false,
    }),
  });

  if (!response.ok) {
    throw new KeycloakError("Failed to update user password in Keycloak.");
  }
}

export async function logoutKeycloakUserSessions(
  token: string,
  userId: string,
): Promise<void> {
  const { url, realm } = getKeycloakConfig();

  const response = await fetch(`${url}/admin/realms/${realm}/users/${userId}/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new KeycloakError("Failed to invalidate user sessions in Keycloak.");
  }
}

export async function getKeycloakUserRoleNames(
  token: string,
  userId: string
): Promise<string[]> {
  const roles = await getUserRealmRoleMappings(token, userId);
  return roles.map((role) => role.name);
}

async function findKeycloakUserIdByQuery(token: string, query: string): Promise<string | null> {
  const { url, realm } = getKeycloakConfig();
  const response = await fetch(`${url}/admin/realms/${realm}/users?${query}&exact=true`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new KeycloakError("Failed to find user in Keycloak.");
  }

  const users = (await response.json()) as KeycloakUserSummary[];
  return users[0]?.id ?? null;
}

export async function findKeycloakUserIdByUsernameOrEmail(
  token: string,
  input: { username?: string | null; email?: string | null },
): Promise<string | null> {
  const username = input.username?.trim();
  if (username) {
    const userId = await findKeycloakUserIdByQuery(token, `username=${encodeURIComponent(username)}`);
    if (userId) {
      return userId;
    }
  }

  const email = input.email?.trim();
  if (email) {
    return findKeycloakUserIdByQuery(token, `email=${encodeURIComponent(email)}`);
  }

  return null;
}

export async function setKeycloakUserManagedRole(
  token: string,
  userId: string,
  managedRole: ManagedKeycloakRole
): Promise<void> {
  const existingManagedRoles = await getExistingManagedRealmRoles(token);
  const currentRoleMappings = await getUserRealmRoleMappings(token, userId);
  const managedRoleIds = new Set(existingManagedRoles.map((role) => role.id));
  const currentManagedRoles = currentRoleMappings.filter((role) => managedRoleIds.has(role.id));
  const targetRole = await getPreferredRoleForManagedRole(token, managedRole);

  await removeRealmRolesFromUser(token, userId, currentManagedRoles);
  await assignRealmRoleToUser(token, userId, targetRole);
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

  let res: globalThis.Response;
  try {
    res = await fetch(`${url}/realms/${realm}/protocol/openid-connect/token`, {
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
  } catch (error) {
    console.warn("[KeycloakClient] Login request failed before receiving response.", error);
    throw new KeycloakError("Failed to authenticate user in Keycloak.");
  }

  if (!res.ok) {
    console.warn(
      `[KeycloakClient] Keycloak rejected login attempt. HTTP status: ${res.status}`
    );
    // Keycloak returns 400/401 for bad resource owner credentials.
    if (res.status === 400 || res.status === 401) {
      throw new KeycloakError("Invalid username or password.");
    }
    throw new KeycloakError("Failed to authenticate user in Keycloak.");
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
