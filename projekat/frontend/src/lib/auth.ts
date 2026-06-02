
type KeycloakTokenPayload = {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
};

function decodeTokenPayload(token: string): KeycloakTokenPayload | null {
  const [, payload] = token.split('.');
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    return JSON.parse(window.atob(padded)) as KeycloakTokenPayload;
  } catch {
    return null;
  }
}

export function getSessionRoles(): Set<string> {
  if (typeof window === 'undefined') return new Set();

  const roles = new Set<string>();
  const rawUser = window.localStorage.getItem('user');
  const token = window.localStorage.getItem('token');

  try {
    if (rawUser) {
      const user = JSON.parse(rawUser) as { role?: string; roles?: string[] };
      if (user.role) roles.add(user.role.toLowerCase());
      user.roles?.forEach((r) => roles.add(r.toLowerCase()));
    }
  } catch {
  }

  if (token) {
    const payload = decodeTokenPayload(token);
    payload?.realm_access?.roles?.forEach((r) => roles.add(r.toLowerCase()));
    Object.values(payload?.resource_access ?? {}).forEach((client) =>
      client.roles?.forEach((r) => roles.add(r.toLowerCase())),
    );
  }

  return roles;
}

export function hasSessionRole(allowedRoles: Set<string>): boolean {
  const roles = getSessionRoles();
  return Array.from(roles).some((role) => allowedRoles.has(role));
}

export function getSessionUserId(): number | null {
  if (typeof window === 'undefined') return null;

  const rawUser = window.localStorage.getItem('user');
  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as { id?: unknown };
    if (typeof user.id === 'number' && Number.isInteger(user.id)) {
      return user.id;
    }
    if (typeof user.id === 'string') {
      const parsed = Number(user.id);
      return Number.isInteger(parsed) ? parsed : null;
    }
    return null;
  } catch {
    return null;
  }
}
