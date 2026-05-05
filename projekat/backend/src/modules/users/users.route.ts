import type { Response } from 'express';
import { Router } from 'express';

import {
  createKeycloakUser,
  deleteKeycloakUser,
  getKeycloakAdminToken,
  getKeycloakUserRoleNames,
  setKeycloakUserManagedRole,
  updateKeycloakUser,
  type ManagedKeycloakRole,
} from '../../clients/keycloak.client';
import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';
import { authorizeRoles } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { AuditService } from '../../shared/audit.service';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
} from './users.schema';
import {
  UserConflictError,
  UserForbiddenActionError,
  UserManagementService,
  UserNotFoundError,
  UserValidationError,
  type IUserAuditLogger,
  type IUserIdentityProvider,
  type IUserRepository,
  type UserAuditActor,
  type UserRecord,
} from './users.service';

const usersRouter = Router();
const ADMIN_ROLES = ['admin', 'administrator'];

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  email: true,
  active: true,
  companyId: true,
  company: {
    select: {
      id: true,
      name: true,
    },
  },
  externalIdentities: {
    select: {
      provider: true,
      providerSubject: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const;

const prismaUserRepository: IUserRepository = {
  findMany: async () =>
    (await prisma.user.findMany({
      select: userSelect,
      orderBy: [{ active: 'desc' }, { lastName: 'asc' }, { firstName: 'asc' }],
    })) as UserRecord[],
  findById: async (id) =>
    (await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    })) as UserRecord | null,
  findByUsernameOrEmail: async (username, email) =>
    (await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: userSelect,
    })) as UserRecord | null,
  create: async (input, keycloakSub) =>
    (await prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        username: input.username,
        email: input.email,
        companyId: input.companyId ?? null,
        externalIdentities: {
          create: {
            provider: 'keycloak',
            providerSubject: keycloakSub,
          },
        },
      },
      select: userSelect,
    })) as UserRecord,
  update: async (id, input) =>
    (await prisma.user.update({
      where: { id },
      data: input,
      select: userSelect,
    })) as UserRecord,
  delete: async (id) => {
    await prisma.user.delete({ where: { id } });
  },
  companyExists: async (companyId) => {
    const count = await prisma.company.count({ where: { id: companyId } });
    return count > 0;
  },
  countActiveInterventions: async (userId, statuses) =>
    prisma.intervention.count({
      where: {
        archived: false,
        status: { in: statuses as any },
        OR: [
          { creatorId: userId },
          {
            assignments: {
              some: {
                userId,
              },
            },
          },
        ],
      },
    }),
};

const keycloakIdentityProvider: IUserIdentityProvider = {
  createUser: (input: CreateUserInput) => createKeycloakUserWithExplicitRole(input),
  updateUser: async (keycloakSub, input) => {
    const adminToken = await getKeycloakAdminToken();
    await updateKeycloakUser(adminToken, keycloakSub, input);
  },
  deleteUser: deleteKeycloakUser,
  getUserRoles: async (keycloakSub) => {
    const adminToken = await getKeycloakAdminToken();
    return getKeycloakUserRoleNames(adminToken, keycloakSub);
  },
  setUserRole: async (keycloakSub, role) => {
    const adminToken = await getKeycloakAdminToken();
    await setKeycloakUserManagedRole(adminToken, keycloakSub, role as ManagedKeycloakRole);
  },
};

const auditLogger: IUserAuditLogger = {
  record: (entry) =>
    AuditService.record({
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      actorId: entry.actorId,
      actorUsername: entry.actorUsername,
      details: entry.details,
      oldValues: entry.oldValues,
      newValues: entry.newValues,
    }),
};

const userManagementService = new UserManagementService(
  prismaUserRepository,
  keycloakIdentityProvider,
  auditLogger,
);

async function createKeycloakUserWithExplicitRole(input: CreateUserInput): Promise<string> {
  const adminToken = await getKeycloakAdminToken();
  return createKeycloakUser(adminToken, input);
}

function parseUserId(rawId: string | string[] | undefined): number | null {
  if (typeof rawId !== 'string') {
    return null;
  }

  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function getActor(reqUser: Express.Request['user']): UserAuditActor | null {
  if (!reqUser?.localUserId || !reqUser.username) {
    return null;
  }

  return {
    id: reqUser.localUserId,
    username: reqUser.username,
  };
}

function sendMappedError(res: Response, error: unknown): void {
  if (error instanceof UserValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message });
    return;
  }

  if (error instanceof UserConflictError) {
    res.status(HTTP_STATUS.CONFLICT).json({ message: error.message });
    return;
  }

  if (error instanceof UserForbiddenActionError) {
    res.status(HTTP_STATUS.FORBIDDEN).json({ message: error.message });
    return;
  }

  if (error instanceof UserNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: error.message });
    return;
  }

  console.error('[UsersRoute] Unexpected user-management error:', error);
  res.status(HTTP_STATUS.INTERNAL).json({ message: 'User management request failed.' });
}

usersRouter.use(authorizeRoles(ADMIN_ROLES));

usersRouter.get('/', async (_req, res) => {
  try {
    const users = await userManagementService.listUsers();
    res.json(users);
  } catch (error) {
    sendMappedError(res, error);
  }
});

usersRouter.post('/', validate(createUserSchema), async (req, res) => {
  try {
    const actor = getActor(req.user);
    if (!actor) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authenticated admin context is missing.' });
      return;
    }

    const user = await userManagementService.createUser(req.body, actor);
    res.status(HTTP_STATUS.CREATED).json(user);
  } catch (error) {
    sendMappedError(res, error);
  }
});

usersRouter.patch('/:id', validate(updateUserSchema), async (req, res) => {
  try {
    const id = parseUserId(req.params.id);
    if (!id) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'User id must be a positive integer.' });
      return;
    }

    const actor = getActor(req.user);
    if (!actor) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authenticated admin context is missing.' });
      return;
    }

    const user = await userManagementService.updateUser(id, req.body, actor);
    res.json(user);
  } catch (error) {
    sendMappedError(res, error);
  }
});

usersRouter.patch('/:id/deactivate', async (req, res) => {
  try {
    const id = parseUserId(req.params.id);
    if (!id) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'User id must be a positive integer.' });
      return;
    }

    const actor = getActor(req.user);
    if (!actor) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authenticated admin context is missing.' });
      return;
    }

    const user = await userManagementService.setUserActive(id, false, actor);
    res.json(user);
  } catch (error) {
    sendMappedError(res, error);
  }
});

usersRouter.patch('/:id/activate', async (req, res) => {
  try {
    const id = parseUserId(req.params.id);
    if (!id) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'User id must be a positive integer.' });
      return;
    }

    const actor = getActor(req.user);
    if (!actor) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authenticated admin context is missing.' });
      return;
    }

    const user = await userManagementService.setUserActive(id, true, actor);
    res.json(user);
  } catch (error) {
    sendMappedError(res, error);
  }
});

usersRouter.delete('/:id', async (req, res) => {
  try {
    const id = parseUserId(req.params.id);
    if (!id) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'User id must be a positive integer.' });
      return;
    }

    const actor = getActor(req.user);
    if (!actor) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authenticated admin context is missing.' });
      return;
    }

    await userManagementService.deleteUser(id, actor);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    sendMappedError(res, error);
  }
});

export default usersRouter;
