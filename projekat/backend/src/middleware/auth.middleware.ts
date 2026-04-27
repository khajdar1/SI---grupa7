import type { RequestHandler } from 'express';

type MockUser = {
  id: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: MockUser;
    }
  }
}

export const authenticate: RequestHandler = (req, res, next) => {
  const authorizationHeader = req.header('Authorization');

  if (!authorizationHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  req.user = {
    id: 'mock-user-id',
    role: 'admin',
  };

  return next();
};

export const authorizeRoles = (roles: string[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
};
