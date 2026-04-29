import type { RequestHandler } from 'express';
import { HTTP_STATUS } from '../constants';

type AuthenticatedUser = {
  id?: string;
  username?: string;
  roles: string[];
};

type KeycloakTokenPayload = {
  sub?: string;
  preferred_username?: string;
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

export const authenticate: RequestHandler = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authentication token missing' });
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Invalid authentication token' });
  }

  const roles = extractRoles(payload);

  req.user = {
    id: payload.sub,
    username: payload.preferred_username,
    roles,
  };

  return next();
};

export const authorizeRoles = (allowedRoles: string[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Unauthorized' });
    }

    const hasRequiredRole = allowedRoles.some((role) => req.user?.roles.includes(role));

    if (!hasRequiredRole) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Forbidden' });
    }

    return next();
  };
};

//test commit
