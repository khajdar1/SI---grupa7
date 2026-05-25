import { prisma } from "../config/database";
import { getKeycloakAdminToken, getKeycloakUserRoleNames } from "../clients/keycloak.client";

const CONCURRENCY = 10;

export async function shouldNotifyUser(
  userId: number,
  type: string,
): Promise<boolean> {
  const prefs = await prisma.userPreference.findUnique({
    where: { userId },
    select: { notificationPreferences: true },
  });
  const preferences = prefs?.notificationPreferences as Record<string, boolean> | null;
  return preferences ? (preferences[type] ?? true) : true;
}

export async function filterByPreferences(
  userIds: number[],
  type: string,
): Promise<number[]> {
  if (userIds.length === 0) return [];

  const prefs = await prisma.userPreference.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, notificationPreferences: true },
  });
  const map = new Map(
    prefs.map((p) => [p.userId, p.notificationPreferences as Record<string, boolean>]),
  );

  return userIds.filter((id) => {
    const p = map.get(id);
    return p ? (p[type] ?? true) : true;
  });
}

async function resolveRoleAliases(role: string): Promise<string[]> {
  const aliases: Record<string, string[]> = {
    koordinator: ["Koordinator", "koordinator", "Coordinator", "coordinator"],
    admin: ["Admin", "admin", "Administrator", "administrator"],
    supportagent: ["SupportAgent", "supportagent", "AgentPodrske", "agentpodrske"],
    serviser: ["Serviser", "serviser"],
  };
  return aliases[role] ?? [role];
}

export async function getActiveUserIdsByKeycloakRole(role: string): Promise<number[]> {
  const normalizedAliases = (await resolveRoleAliases(role)).map((a) => a.toLowerCase());

  const users = await prisma.user.findMany({
    where: { active: true },
    select: {
      id: true,
      externalIdentities: {
        where: { provider: "keycloak" },
        select: { providerSubject: true },
        take: 1,
      },
    },
  });

  const adminToken = await getKeycloakAdminToken();
  const result: number[] = [];

  for (let i = 0; i < users.length; i += CONCURRENCY) {
    const batch = users.slice(i, i + CONCURRENCY);
    const checked = await Promise.all(
      batch.map(async (user) => {
        const sub = user.externalIdentities[0]?.providerSubject;
        if (!sub) return null;
        const roles = await getKeycloakUserRoleNames(adminToken, sub);
        const hasRole = roles.some((r) => normalizedAliases.includes(r.toLowerCase()));
        return hasRole ? user.id : null;
      }),
    );
    for (const id of checked) {
      if (id !== null) result.push(id);
    }
  }

  return result;
}
