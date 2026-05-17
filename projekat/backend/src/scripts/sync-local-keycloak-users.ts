import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";
import { parse as parseDotenv } from "dotenv";

type ManagedRole =
  | "KORISNIK"
  | "SERVISER"
  | "KOORDINATOR"
  | "MENADZMENT"
  | "KOMPANIJA_ADMIN"
  | "SUPPORT_AGENT"
  | "ADMIN";

type KeycloakRole = {
  id: string;
  name: string;
  clientRole?: boolean;
  composite?: boolean;
  containerId?: string;
};

type KeycloakClient = {
  id: string;
  clientId: string;
  secret?: string;
  enabled?: boolean;
  serviceAccountsEnabled?: boolean;
  directAccessGrantsEnabled?: boolean;
};

type KeycloakUser = {
  id: string;
  username?: string;
  email?: string;
};

const ROLE_NAMES: Record<ManagedRole, string> = {
  KORISNIK: "Korisnik",
  SERVISER: "Serviser",
  KOORDINATOR: "Koordinator",
  MENADZMENT: "Menadzment",
  KOMPANIJA_ADMIN: "KompanijaAdmin",
  SUPPORT_AGENT: "SupportAgent",
  ADMIN: "Admin",
};

const ROLE_OVERRIDE_ENVS: Record<ManagedRole, string> = {
  KORISNIK: "LOCAL_KEYCLOAK_KORISNIK_USERS",
  SERVISER: "LOCAL_KEYCLOAK_SERVISER_USERS",
  KOORDINATOR: "LOCAL_KEYCLOAK_KOORDINATOR_USERS",
  MENADZMENT: "LOCAL_KEYCLOAK_MENADZMENT_USERS",
  KOMPANIJA_ADMIN: "LOCAL_KEYCLOAK_KOMPANIJA_ADMIN_USERS",
  SUPPORT_AGENT: "LOCAL_KEYCLOAK_SUPPORT_AGENT_USERS",
  ADMIN: "LOCAL_KEYCLOAK_ADMIN_USERS",
};

const OVERRIDE_PRIORITY: ManagedRole[] = [
  "ADMIN",
  "SUPPORT_AGENT",
  "KOMPANIJA_ADMIN",
  "MENADZMENT",
  "KOORDINATOR",
  "SERVISER",
  "KORISNIK",
];

const prisma = new PrismaClient();

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function loadProjectEnv(): void {
  const envFiles = unique([
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
  ]).filter((filePath) => existsSync(filePath));

  for (const filePath of envFiles) {
    const parsed = parseDotenv(readFileSync(filePath));
    for (const [key, value] of Object.entries(parsed)) {
      if (!process.env[key] && value.trim()) {
        process.env[key] = value;
      }
    }
  }
}

loadProjectEnv();

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  email: true,
  active: true,
  externalIdentities: {
    select: {
      provider: true,
      providerSubject: true,
    },
  },
  assignments: {
    select: {
      id: true,
    },
    take: 1,
  },
  createdInterventions: {
    select: {
      id: true,
    },
    take: 1,
  },
  reports: {
    select: {
      id: true,
    },
    take: 1,
  },
} satisfies Prisma.UserSelect;

type LocalUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

function requiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function parseCsvEnv(name: string): Set<string> {
  return new Set(
    (process.env[name] ?? "")
      .split(",")
      .map((item) => normalize(item))
      .filter(Boolean),
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isLocalHost(value: string): boolean {
  try {
    const parsed = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return value.includes("localhost") || value.includes("127.0.0.1");
  }
}

function isLocalDatabaseUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return value.includes("localhost") || value.includes("127.0.0.1");
  }
}

function assertLocalOnly(): void {
  const allowUnsafe = process.env.LOCAL_KEYCLOAK_ALLOW_NON_LOCAL === "true";
  const databaseUrl = requiredEnv("DATABASE_URL");
  const keycloakUrl = requiredEnv("KEYCLOAK_URL", "http://localhost:8080");

  if (process.env.NODE_ENV === "production" && !allowUnsafe) {
    throw new Error(
      "Refusing to run with NODE_ENV=production. This script is only for local test data.",
    );
  }

  if (!allowUnsafe && !isLocalDatabaseUrl(databaseUrl)) {
    throw new Error(
      "Refusing to run against a non-local DATABASE_URL. Use a local DB dump for this script.",
    );
  }

  if (!allowUnsafe && !isLocalHost(keycloakUrl)) {
    throw new Error(
      "Refusing to run against a non-local KEYCLOAK_URL. Use the local Keycloak container.",
    );
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function retry<T>(label: string, task: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      const delayMs = Math.min(1000 + attempt * 300, 5000);
      console.warn(`[KeycloakSync] ${label} failed (${attempt}/30). Retrying in ${delayMs}ms.`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

function getKeycloakSettings() {
  return {
    url: trimTrailingSlash(requiredEnv("KEYCLOAK_URL", "http://localhost:8080")),
    realm: requiredEnv("KEYCLOAK_REALM", "service-system"),
    clientId: requiredEnv("KEYCLOAK_CLIENT_ID", "backend-service"),
    clientSecret: requiredEnv("KEYCLOAK_CLIENT_SECRET"),
    adminUsername: requiredEnv("KC_ADMIN_USERNAME", "service_app_admin"),
    adminPassword: requiredEnv("KC_ADMIN_PASSWORD"),
  };
}

function realmAdminPath(path: string): string {
  const { url, realm } = getKeycloakSettings();
  return `${url}/admin/realms/${encodeURIComponent(realm)}${path}`;
}

async function readResponseBody(response: Response): Promise<string> {
  const text = await response.text();
  return text.length > 300 ? `${text.slice(0, 300)}...` : text;
}

async function keycloakRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
  okStatuses: number[] = [200],
): Promise<T> {
  const response = await fetch(realmAdminPath(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!okStatuses.includes(response.status)) {
    const body = await readResponseBody(response);
    throw new Error(`Keycloak request failed: ${init.method ?? "GET"} ${path} -> ${response.status} ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return text as T;
  }

  return JSON.parse(text) as T;
}

async function getAdminToken(): Promise<string> {
  const { url, adminUsername, adminPassword } = getKeycloakSettings();
  const response = await fetch(`${url}/realms/master/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: "admin-cli",
      username: adminUsername,
      password: adminPassword,
    }),
  });

  if (!response.ok) {
    const body = await readResponseBody(response);
    throw new Error(`Could not obtain local Keycloak admin token: ${response.status} ${body}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Keycloak did not return an admin access token.");
  }

  return data.access_token;
}

async function ensureRealmRole(token: string, roleName: string): Promise<KeycloakRole> {
  const encodedRole = encodeURIComponent(roleName);
  const existing = await fetch(realmAdminPath(`/roles/${encodedRole}`), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (existing.status === 200) {
    return (await existing.json()) as KeycloakRole;
  }

  if (existing.status !== 404) {
    const body = await readResponseBody(existing);
    throw new Error(`Could not load Keycloak role ${roleName}: ${existing.status} ${body}`);
  }

  await keycloakRequest<void>(
    "/roles",
    token,
    {
      method: "POST",
      body: JSON.stringify({ name: roleName }),
    },
    [201],
  );

  return keycloakRequest<KeycloakRole>(`/roles/${encodedRole}`, token);
}

async function ensureAppRoles(token: string): Promise<Record<ManagedRole, KeycloakRole>> {
  const roles = {} as Record<ManagedRole, KeycloakRole>;

  for (const [managedRole, roleName] of Object.entries(ROLE_NAMES) as Array<[ManagedRole, string]>) {
    roles[managedRole] = await ensureRealmRole(token, roleName);
  }

  return roles;
}

async function findClient(token: string, clientId: string): Promise<KeycloakClient | null> {
  const clients = await keycloakRequest<KeycloakClient[]>(
    `/clients?clientId=${encodeURIComponent(clientId)}`,
    token,
  );
  return clients[0] ?? null;
}

async function ensureBackendClient(token: string): Promise<KeycloakClient> {
  const { clientId, clientSecret } = getKeycloakSettings();
  const existing = await findClient(token, clientId);

  if (existing) {
    return existing;
  }

  await keycloakRequest<void>(
    "/clients",
    token,
    {
      method: "POST",
      body: JSON.stringify({
        clientId,
        secret: clientSecret,
        enabled: true,
        protocol: "openid-connect",
        publicClient: false,
        serviceAccountsEnabled: true,
        directAccessGrantsEnabled: true,
        standardFlowEnabled: false,
        fullScopeAllowed: true,
      }),
    },
    [201],
  );

  const created = await findClient(token, clientId);
  if (!created) {
    throw new Error(`Keycloak client ${clientId} was created but could not be reloaded.`);
  }

  return created;
}

async function ensureBackendClientCanManageUsers(token: string): Promise<void> {
  const backendClient = await ensureBackendClient(token);
  const realmManagementClient = await findClient(token, "realm-management");

  if (!realmManagementClient) {
    throw new Error("Keycloak realm-management client is missing.");
  }

  const serviceAccount = await keycloakRequest<KeycloakUser>(
    `/clients/${encodeURIComponent(backendClient.id)}/service-account-user`,
    token,
  );
  const realmAdminRole = await keycloakRequest<KeycloakRole>(
    `/clients/${encodeURIComponent(realmManagementClient.id)}/roles/realm-admin`,
    token,
  );

  await keycloakRequest<void>(
    `/users/${encodeURIComponent(serviceAccount.id)}/role-mappings/clients/${encodeURIComponent(realmManagementClient.id)}`,
    token,
    {
      method: "POST",
      body: JSON.stringify([realmAdminRole]),
    },
    [204, 409],
  );
}

async function findKeycloakUser(token: string, user: LocalUser): Promise<KeycloakUser | null> {
  const byUsername = await keycloakRequest<KeycloakUser[]>(
    `/users?username=${encodeURIComponent(user.username)}&exact=true`,
    token,
  );
  if (byUsername[0]) {
    return byUsername[0];
  }

  const byEmail = await keycloakRequest<KeycloakUser[]>(
    `/users?email=${encodeURIComponent(user.email)}&exact=true`,
    token,
  );
  return byEmail[0] ?? null;
}

function getCurrentKeycloakSubject(user: LocalUser): string | null {
  return (
    user.externalIdentities.find((identity) => identity.provider === "keycloak")
      ?.providerSubject ?? null
  );
}

async function createKeycloakUserForLocalUser(token: string, user: LocalUser): Promise<string> {
  const existing = await findKeycloakUser(token, user);
  if (existing?.id) {
    return existing.id;
  }

  const existingSubject = getCurrentKeycloakSubject(user);
  const requestedId = existingSubject && isUuid(existingSubject) ? existingSubject : undefined;
  const body = {
    ...(requestedId ? { id: requestedId } : {}),
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    enabled: user.active,
    emailVerified: true,
    credentials: [
      {
        type: "password",
        value: requiredEnv("LOCAL_KEYCLOAK_DEFAULT_PASSWORD", "Password123!"),
        temporary: false,
      },
    ],
  };

  const response = await fetch(realmAdminPath("/users"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.status === 409) {
    const conflicted = await findKeycloakUser(token, user);
    if (conflicted?.id) {
      return conflicted.id;
    }
  }

  if (response.status !== 201) {
    const responseBody = await readResponseBody(response);
    throw new Error(`Failed to create Keycloak user ${user.username}: ${response.status} ${responseBody}`);
  }

  const location = response.headers.get("Location");
  const createdId = location?.split("/").pop();
  if (!createdId) {
    throw new Error(`Keycloak did not return a user id for ${user.username}.`);
  }

  return createdId;
}

async function updateKeycloakUserFromLocalUser(token: string, keycloakUserId: string, user: LocalUser): Promise<void> {
  await keycloakRequest<void>(
    `/users/${encodeURIComponent(keycloakUserId)}`,
    token,
    {
      method: "PUT",
      body: JSON.stringify({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        enabled: user.active,
        emailVerified: true,
      }),
    },
    [204],
  );

  if (process.env.LOCAL_KEYCLOAK_SET_PASSWORD !== "false") {
    await keycloakRequest<void>(
      `/users/${encodeURIComponent(keycloakUserId)}/reset-password`,
      token,
      {
        method: "PUT",
        body: JSON.stringify({
          type: "password",
          value: requiredEnv("LOCAL_KEYCLOAK_DEFAULT_PASSWORD", "Password123!"),
          temporary: false,
        }),
      },
      [204],
    );
  }
}

async function setUserRealmRole(
  token: string,
  keycloakUserId: string,
  role: ManagedRole,
  appRoles: Record<ManagedRole, KeycloakRole>,
): Promise<void> {
  const currentRoles = await keycloakRequest<KeycloakRole[]>(
    `/users/${encodeURIComponent(keycloakUserId)}/role-mappings/realm`,
    token,
  );
  const managedRoleIds = new Set(Object.values(appRoles).map((item) => item.id));
  const currentManagedRoles = currentRoles.filter((item) => managedRoleIds.has(item.id));

  if (currentManagedRoles.length > 0) {
    await keycloakRequest<void>(
      `/users/${encodeURIComponent(keycloakUserId)}/role-mappings/realm`,
      token,
      {
        method: "DELETE",
        body: JSON.stringify(currentManagedRoles),
      },
      [204],
    );
  }

  await keycloakRequest<void>(
    `/users/${encodeURIComponent(keycloakUserId)}/role-mappings/realm`,
    token,
    {
      method: "POST",
      body: JSON.stringify([appRoles[role]]),
    },
    [204],
  );
}

function userMatches(user: LocalUser, values: Set<string>): boolean {
  if (values.size === 0) {
    return false;
  }

  const candidates = [
    String(user.id),
    user.username,
    user.email,
    `${user.firstName} ${user.lastName}`,
  ].map(normalize);

  return candidates.some((candidate) => values.has(candidate));
}

function getDefaultRole(): ManagedRole {
  const rawRole = normalize(process.env.LOCAL_KEYCLOAK_DEFAULT_ROLE ?? "KORISNIK").toUpperCase();
  if (rawRole in ROLE_NAMES) {
    return rawRole as ManagedRole;
  }

  return "KORISNIK";
}

function inferRole(user: LocalUser, overrides: Record<ManagedRole, Set<string>>): ManagedRole {
  for (const role of OVERRIDE_PRIORITY) {
    if (userMatches(user, overrides[role])) {
      return role;
    }
  }

  const usernameOrEmail = normalize(`${user.username} ${user.email}`);

  if (usernameOrEmail.includes("admin")) {
    return "ADMIN";
  }

  if (usernameOrEmail.includes("menadz") || usernameOrEmail.includes("management")) {
    return "MENADZMENT";
  }

  if (user.assignments.length > 0 || user.reports.length > 0) {
    return "SERVISER";
  }

  if (user.createdInterventions.length > 0) {
    return "KOORDINATOR";
  }

  return getDefaultRole();
}

async function linkLocalUserToKeycloak(userId: number, keycloakUserId: string): Promise<void> {
  await prisma.externalIdentity.deleteMany({
    where: {
      provider: "keycloak",
      providerSubject: keycloakUserId,
      NOT: {
        userId,
      },
    },
  });

  await prisma.externalIdentity.upsert({
    where: {
      userId_provider: {
        userId,
        provider: "keycloak",
      },
    },
    update: {
      providerSubject: keycloakUserId,
    },
    create: {
      userId,
      provider: "keycloak",
      providerSubject: keycloakUserId,
    },
  });
}

async function syncUsers(): Promise<void> {
  assertLocalOnly();

  const token = await retry("admin token", getAdminToken);
  const appRoles = await ensureAppRoles(token);
  await ensureBackendClientCanManageUsers(token);

  const overrides = Object.fromEntries(
    Object.entries(ROLE_OVERRIDE_ENVS).map(([role, envName]) => [
      role,
      parseCsvEnv(envName),
    ]),
  ) as Record<ManagedRole, Set<string>>;

  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: {
      id: "asc",
    },
  });

  console.log(`[KeycloakSync] Found ${users.length} local DB users.`);

  for (const user of users) {
    const role = inferRole(user, overrides);
    const keycloakUserId = await createKeycloakUserForLocalUser(token, user);

    await updateKeycloakUserFromLocalUser(token, keycloakUserId, user);
    await setUserRealmRole(token, keycloakUserId, role, appRoles);
    await linkLocalUserToKeycloak(user.id, keycloakUserId);

    console.log(
      `[KeycloakSync] ${user.id} ${user.username} <${user.email}> -> ${keycloakUserId} (${ROLE_NAMES[role]})`,
    );
  }

  console.log(
    "[KeycloakSync] Done. Synced users can log in with the password configured via LOCAL_KEYCLOAK_DEFAULT_PASSWORD (or the script default if unset).",
  );
}

syncUsers()
  .catch((error) => {
    console.error("[KeycloakSync] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
