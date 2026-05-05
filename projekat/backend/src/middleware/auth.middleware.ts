import type { RequestHandler } from 'express';
import { prisma } from '../config/database';
import { HTTP_STATUS } from '../constants';
import {
  getKeycloakAdminToken,
  getKeycloakUserRoleNames,
} from '../clients/keycloak.client';

type AuthenticatedUser = {
  id?: string;
  localUserId?: number;
  username?: string;
  roles: string[];
};

type KeycloakTokenPayload = {
  sub?: string;
  preferred_username?: string;
  exp?: number;
  nbf?: number;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function getTokenFromRequest(req: Parameters<RequestHandler>[0]): string | null {
  const authHeader = req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim();
  }

  const cookieHeader = req.header('Cookie');
  const tokenCookie = cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('token='));

  return tokenCookie ? decodeURIComponent(tokenCookie.replace('token=', '')) : null;
}

function decodeJwtPayload(token: string): KeycloakTokenPayload | null {
  try {
    const payload = token.split('.')[1];

    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = Buffer.from(normalizedPayload, 'base64').toString('utf-8');

    return JSON.parse(decodedPayload) as KeycloakTokenPayload;
  } catch {
    return null;
  }
}

function extractRoles(payload: KeycloakTokenPayload): string[] {
  const realmRoles = payload.realm_access?.roles ?? [];

  const clientRoles = Object.values(payload.resource_access ?? {}).flatMap(
    (clientAccess) => clientAccess.roles ?? []
  );

  return Array.from(new Set([...realmRoles, ...clientRoles]));
}

async function loadLocalUserContext(providerSubject?: string, username?: string) {
  if (providerSubject) {
    const identity = await prisma.externalIdentity.findFirst({
      where: { providerSubject },
      select: {
        user: {
          select: {
            id: true,
            username: true,
            active: true,
          },
        },
      },
    });

    if (identity?.user) {
      return identity.user;
    }
  }

  if (username) {
    return prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        active: true,
      },
    });
  }

  return null;
}

async function loadLiveKeycloakRoles(providerSubject?: string): Promise<string[]> {
  if (!providerSubject) {
    return [];
  }

  try {
    const adminToken = await getKeycloakAdminToken();
    return await getKeycloakUserRoleNames(adminToken, providerSubject);
  } catch (error) {
    console.warn('[AuthMiddleware] Could not refresh live Keycloak roles; using token roles.', error);
    return [];
  }
}

export const authenticate: RequestHandler = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authentication token missing' });
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Invalid authentication token' });
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (typeof payload.nbf === 'number' && payload.nbf > nowInSeconds) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authentication token is not active yet' });
  }

  if (typeof payload.exp === 'number' && payload.exp <= nowInSeconds) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authentication token has expired' });
  }

  const roles = extractRoles(payload);
  let localUser: Awaited<ReturnType<typeof loadLocalUserContext>>;

  try {
    localUser = await loadLocalUserContext(payload.sub, payload.preferred_username);
  } catch (error) {
    return next(error);
  }

  if (localUser && !localUser.active) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'User account is deactivated' });
  }

  req.user = {
    id: payload.sub,
    localUserId: localUser?.id,
    username: localUser?.username ?? payload.preferred_username,
    roles,
  };

  return next();
};

export const authorizeRoles = (allowedRoles: string[]): RequestHandler => {
  const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());

  return async (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Unauthorized' });
    }

    const liveRoles = await loadLiveKeycloakRoles(req.user.id);
    const roleSource = liveRoles.length > 0 ? liveRoles : req.user.roles;
    const normalizedUserRoles = roleSource.map((role) => role.toLowerCase());
    const hasRequiredRole = normalizedAllowedRoles.some((role) =>
      normalizedUserRoles.includes(role),
    );

    if (!hasRequiredRole) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Forbidden' });
    }

    return next();
  };
};
