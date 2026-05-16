import type { CreateUserInput, ManagedUserRole, UpdateUserInput } from './users.schema';

export const MANAGED_USER_ROLES: readonly ManagedUserRole[] = [
  'KORISNIK',
  'SERVISER',
  'KOORDINATOR',
  'MENADZMENT',
  'KOMPANIJA_ADMIN',
  'SUPPORT_AGENT',
  'ADMIN',
] as const;

const ROLE_ALIASES: Record<ManagedUserRole, readonly string[]> = {
  KORISNIK: ['korisnik'],
  SERVISER: ['serviser'],
  KOORDINATOR: ['koordinator'],
  MENADZMENT: ['menadzment', 'management'],
  KOMPANIJA_ADMIN: ['kompanijaadmin', 'companyadmin'],
  SUPPORT_AGENT: ['supportagent', 'agentpodrske'],
  ADMIN: ['admin', 'administrator'],
};

const ACTIVE_INTERVENTION_STATUSES = ['NEW', 'ASSIGNED', 'IN_PROGRESS'] as const;

export type UserCompany = {
  id: number;
  name: string;
} | null;

export type UserExternalIdentity = {
  provider: string;
  providerSubject: string;
};

export type UserRecord = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  active: boolean;
  companyId: number | null;
  company: UserCompany;
  externalIdentities: UserExternalIdentity[];
  createdAt: Date;
  updatedAt: Date;
};

export type UserResponse = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: ManagedUserRole | null;
  active: boolean;
  companyId: number | null;
  companyName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserAuditActor = {
  id: number;
  username: string;
};

export interface IUserRepository {
  findMany(): Promise<UserRecord[]>;
  findById(id: number): Promise<UserRecord | null>;
  findByUsernameOrEmail(username: string, email: string): Promise<UserRecord | null>;
  create(input: Omit<CreateUserInput, 'password' | 'role'>, keycloakSub: string): Promise<UserRecord>;
  update(id: number, input: Partial<Pick<UserRecord, 'firstName' | 'lastName' | 'email' | 'companyId' | 'active'>>): Promise<UserRecord>;
  delete(id: number): Promise<void>;
  companyExists(companyId: number): Promise<boolean>;
  countActiveInterventions(userId: number, statuses: readonly string[]): Promise<number>;
}

export interface IUserIdentityProvider {
  createUser(input: CreateUserInput): Promise<string>;
  updateUser(keycloakSub: string, input: Partial<Pick<CreateUserInput, 'firstName' | 'lastName' | 'email' | 'username'>> & { enabled?: boolean }): Promise<void>;
  deleteUser(keycloakSub: string): Promise<void>;
  getUserRoles(keycloakSub: string): Promise<string[]>;
  setUserRole(keycloakSub: string, role: ManagedUserRole): Promise<void>;
}

export interface IUserAuditLogger {
  record(entry: {
    action: string;
    entity: string;
    entityId: number | string;
    actorId: number;
    actorUsername: string;
    details: string;
    oldValues?: Record<string, string | number | boolean | null>;
    newValues?: Record<string, string | number | boolean | null>;
  }): Promise<void>;
}

export class UserValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserValidationError';
  }
}

export class UserNotFoundError extends Error {
  constructor(message = 'User not found.') {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

export class UserConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserConflictError';
  }
}

export class UserForbiddenActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserForbiddenActionError';
  }
}

function normalizeRoleName(roleName: string): string {
  return roleName.trim().toLowerCase();
}

export function deriveManagedRoleFromKeycloakRoles(roleNames: readonly string[]): ManagedUserRole | null {
  const normalizedRoles = new Set(roleNames.map(normalizeRoleName));

  for (const role of MANAGED_USER_ROLES) {
    if (ROLE_ALIASES[role].some((alias) => normalizedRoles.has(alias))) {
      return role;
    }
  }

  return null;
}

function getPrimaryKeycloakSubject(user: UserRecord): string | null {
  const keycloakIdentity = user.externalIdentities.find((identity) => identity.provider === 'keycloak');
  return keycloakIdentity?.providerSubject ?? null;
}

function sanitizeUser(user: UserRecord, role: ManagedUserRole | null): UserResponse {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    role,
    active: user.active,
    companyId: user.companyId,
    companyName: user.company?.name ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function extractComparableUserValues(user: UserResponse) {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    active: user.active,
    companyId: user.companyId,
  };
}

export class UserManagementService {
  constructor(
    private readonly repository: IUserRepository,
    private readonly identityProvider: IUserIdentityProvider,
    private readonly auditLogger: IUserAuditLogger,
  ) {}

  async listUsers(): Promise<UserResponse[]> {
    const users = await this.repository.findMany();

    return Promise.all(
      users.map(async (user) => {
        const keycloakSub = getPrimaryKeycloakSubject(user);
        let roleNames: string[] = [];
        if (keycloakSub) {
          try {
            roleNames = await this.identityProvider.getUserRoles(keycloakSub);
          } catch (error) {
            console.warn(`[UserManagement] Failed to fetch roles for orphaned Keycloak user ${keycloakSub}.`, error);
          }
        }
        return sanitizeUser(user, deriveManagedRoleFromKeycloakRoles(roleNames));
      }),
    );
  }

  async createUser(input: CreateUserInput, actor: UserAuditActor): Promise<UserResponse> {
    await this.assertCompanyCanBeAssigned(input.companyId ?? null, input.role);

    const existing = await this.repository.findByUsernameOrEmail(input.username, input.email);
    if (existing) {
      throw new UserConflictError('Username or email is already taken.');
    }

    const keycloakSub = await this.identityProvider.createUser(input);
    await this.identityProvider.setUserRole(keycloakSub, input.role);

    try {
      const user = await this.repository.create(
        {
          firstName: input.firstName,
          lastName: input.lastName,
          username: input.username,
          email: input.email,
          companyId: input.companyId ?? null,
        },
        keycloakSub,
      );
      const response = sanitizeUser(user, input.role);

      await this.auditLogger.record({
        action: 'USER_CREATED',
        entity: 'User',
        entityId: user.id,
        actorId: actor.id,
        actorUsername: actor.username,
        details: `User ${user.username} created by ${actor.username}.`,
        newValues: extractComparableUserValues(response),
      });

      return response;
    } catch (error) {
      await this.identityProvider.deleteUser(keycloakSub);
      throw error;
    }
  }

  async updateUser(id: number, input: UpdateUserInput, actor: UserAuditActor): Promise<UserResponse> {
    const existing = await this.requireUser(id);
    const keycloakSub = this.requireKeycloakSubject(existing);
    const currentRole = await this.getCurrentManagedRole(keycloakSub);
    const oldResponse = sanitizeUser(existing, currentRole);

    if (actor.id === id && input.role && input.role !== 'ADMIN') {
      throw new UserForbiddenActionError('Admin cannot remove their own admin role.');
    }

    const nextCompanyId = Object.prototype.hasOwnProperty.call(input, 'companyId')
      ? input.companyId
      : existing.companyId;

    await this.assertCompanyCanBeAssigned(nextCompanyId, input.role ?? currentRole);

    await this.identityProvider.updateUser(keycloakSub, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
    });

    if (input.role) {
      await this.identityProvider.setUserRole(keycloakSub, input.role);
    }

    const updated = await this.repository.update(id, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      companyId: input.companyId,
    });
    const response = sanitizeUser(updated, input.role ?? currentRole);

    await this.auditLogger.record({
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: id,
      actorId: actor.id,
      actorUsername: actor.username,
      details: `User ${updated.username} updated by ${actor.username}.`,
      oldValues: extractComparableUserValues(oldResponse),
      newValues: extractComparableUserValues(response),
    });

    return response;
  }

  async setUserActive(id: number, active: boolean, actor: UserAuditActor): Promise<UserResponse> {
    if (actor.id === id && !active) {
      throw new UserForbiddenActionError('Admin cannot deactivate their own account.');
    }

    const existing = await this.requireUser(id);
    const keycloakSub = this.requireKeycloakSubject(existing);
    const currentRole = await this.getCurrentManagedRole(keycloakSub);
    const oldResponse = sanitizeUser(existing, currentRole);

    await this.identityProvider.updateUser(keycloakSub, { enabled: active });
    const updated = await this.repository.update(id, { active });
    const response = sanitizeUser(updated, currentRole);

    await this.auditLogger.record({
      action: active ? 'USER_REACTIVATED' : 'USER_DEACTIVATED',
      entity: 'User',
      entityId: id,
      actorId: actor.id,
      actorUsername: actor.username,
      details: `User ${updated.username} ${active ? 'reactivated' : 'deactivated'} by ${actor.username}.`,
      oldValues: extractComparableUserValues(oldResponse),
      newValues: extractComparableUserValues(response),
    });

    return response;
  }

  async deleteUser(id: number, actor: UserAuditActor): Promise<void> {
    if (actor.id === id) {
      throw new UserForbiddenActionError('Admin cannot delete their own account.');
    }

    const existing = await this.requireUser(id);
    const activeInterventionCount = await this.repository.countActiveInterventions(
      id,
      ACTIVE_INTERVENTION_STATUSES,
    );

    if (activeInterventionCount > 0) {
      throw new UserForbiddenActionError('User cannot be deleted while linked to active interventions.');
    }

    const keycloakSub = this.requireKeycloakSubject(existing);
    await this.identityProvider.deleteUser(keycloakSub);
    await this.repository.delete(id);

    await this.auditLogger.record({
      action: 'USER_DELETED',
      entity: 'User',
      entityId: id,
      actorId: actor.id,
      actorUsername: actor.username,
      details: `User ${existing.username} deleted by ${actor.username}.`,
      oldValues: {
        id: existing.id,
        username: existing.username,
        email: existing.email,
        active: existing.active,
        companyId: existing.companyId,
      },
    });
  }

  private async requireUser(id: number): Promise<UserRecord> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }

  private requireKeycloakSubject(user: UserRecord): string {
    const keycloakSub = getPrimaryKeycloakSubject(user);
    if (!keycloakSub) {
      throw new UserValidationError('User does not have a linked Keycloak identity.');
    }

    return keycloakSub;
  }

  private async getCurrentManagedRole(keycloakSub: string): Promise<ManagedUserRole | null> {
    try {
      const roles = await this.identityProvider.getUserRoles(keycloakSub);
      return deriveManagedRoleFromKeycloakRoles(roles);
    } catch (error) {
      throw new UserValidationError('The Keycloak account for this user is missing. This user is orphaned and can only be deleted.');
    }
  }

  private async assertCompanyCanBeAssigned(
    companyId: number | null | undefined,
    role: ManagedUserRole | null,
  ): Promise<void> {
    if (!companyId) {
      if (role === 'SERVISER' || role === 'KOMPANIJA_ADMIN') {
        throw new UserValidationError('Company must be assigned for servicer and company admin users.');
      }

      return;
    }

    const companyExists = await this.repository.companyExists(companyId);
    if (!companyExists) {
      throw new UserValidationError('Selected company does not exist.');
    }
  }
}
