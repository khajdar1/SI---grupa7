import { expect, test, vi } from 'vitest';

import {
  UserForbiddenActionError,
  UserManagementService,
  UserValidationError,
  deriveManagedRoleFromKeycloakRoles,
  type IUserAuditLogger,
  type IUserIdentityProvider,
  type IUserRepository,
  type UserRecord,
} from '../src/modules/users/users.service';
import type { CreateUserInput, ManagedUserRole } from '../src/modules/users/users.schema';

function buildUser(overrides: Partial<UserRecord> = {}): UserRecord {
  const now = new Date('2026-05-04T12:00:00.000Z');
  const companyId = Object.prototype.hasOwnProperty.call(overrides, 'companyId')
    ? overrides.companyId ?? null
    : 1;

  return {
    id: overrides.id ?? 1,
    firstName: overrides.firstName ?? 'Ana',
    lastName: overrides.lastName ?? 'Admin',
    username: overrides.username ?? 'ana.admin',
    email: overrides.email ?? 'ana.admin@example.com',
    active: overrides.active ?? true,
    companyId,
    company: overrides.company ?? (companyId ? { id: companyId, name: 'Servis Alfa' } : null),
    externalIdentities: overrides.externalIdentities ?? [
      { provider: 'keycloak', providerSubject: `kc-${overrides.id ?? 1}` },
    ],
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

class MockUserRepository implements IUserRepository {
  users = [buildUser({ id: 1, username: 'ana.admin', email: 'ana.admin@example.com' })];
  activeInterventionCount = 0;

  async findMany() {
    return this.users;
  }

  async findById(id: number) {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByUsernameOrEmail(username: string, email: string) {
    return this.users.find((user) => user.username === username || user.email === email) ?? null;
  }

  async create(input: Omit<CreateUserInput, 'password' | 'role'>, keycloakSub: string) {
    const user = buildUser({
      id: this.users.length + 1,
      ...input,
      company: input.companyId ? { id: input.companyId, name: 'Servis Alfa' } : null,
      externalIdentities: [{ provider: 'keycloak', providerSubject: keycloakSub }],
    });
    this.users.push(user);
    return user;
  }

  async update(id: number, input: Partial<Pick<UserRecord, 'firstName' | 'lastName' | 'email' | 'companyId' | 'active'>>) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('Missing user');
    }

    Object.assign(user, input, {
      company: input.companyId ? { id: input.companyId, name: 'Servis Alfa' } : user.company,
    });
    return user;
  }

  async delete(id: number) {
    this.users = this.users.filter((user) => user.id !== id);
  }

  async companyExists(companyId: number) {
    return companyId === 1;
  }

  async countActiveInterventions() {
    return this.activeInterventionCount;
  }
}

class MockIdentityProvider implements IUserIdentityProvider {
  roles = new Map<string, string[]>([['kc-1', ['Admin']]]);

  async createUser() {
    return `kc-${this.roles.size + 1}`;
  }

  async updateUser() {}

  async deleteUser() {}

  async getUserRoles(keycloakSub: string) {
    return this.roles.get(keycloakSub) ?? ['Korisnik'];
  }

  async setUserRole(keycloakSub: string, role: ManagedUserRole) {
    this.roles.set(keycloakSub, [role === 'ADMIN' ? 'Admin' : role]);
  }
}

function createService(repo = new MockUserRepository(), identity = new MockIdentityProvider()) {
  const auditLogger: IUserAuditLogger = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  return {
    repo,
    identity,
    auditLogger,
    service: new UserManagementService(repo, identity, auditLogger),
  };
}

test('deriveManagedRoleFromKeycloakRoles maps admin aliases', () => {
  expect(deriveManagedRoleFromKeycloakRoles(['administrator'])).toBe('ADMIN');
  expect(deriveManagedRoleFromKeycloakRoles(['management'])).toBe('MENADZMENT');
  expect(deriveManagedRoleFromKeycloakRoles(['CompanyAdmin'])).toBe('KOMPANIJA_ADMIN');
  expect(deriveManagedRoleFromKeycloakRoles(['unknown'])).toBeNull();
});

test('UserManagementService does not query Keycloak for non-Keycloak identities', async () => {
  const repo = new MockUserRepository();
  repo.users = [
    buildUser({
      id: 1,
      externalIdentities: [{ provider: 'entra', providerSubject: 'entra-admin-001' }],
    }),
  ];
  const identity = new MockIdentityProvider();
  const getUserRoles = vi.spyOn(identity, 'getUserRoles');
  const { service } = createService(repo, identity);

  const users = await service.listUsers();

  expect(users[0].role).toBeNull();
  expect(getUserRoles).not.toHaveBeenCalled();
});

test('UserManagementService rejects non-admin user creation without company', async () => {
  const { service } = createService();

  await expect(
    service.createUser(
      {
        firstName: 'Marko',
        lastName: 'Serviser',
        username: 'marko.serviser',
        email: 'marko.serviser@example.com',
        password: 'Password1',
        role: 'SERVISER',
        companyId: null,
      },
      { id: 1, username: 'ana.admin' },
    ),
  ).rejects.toBeInstanceOf(UserValidationError);
});

test('UserManagementService rejects company admin creation without company', async () => {
  const { service } = createService();

  await expect(
    service.createUser(
      {
        firstName: 'Amina',
        lastName: 'Kompanija',
        username: 'amina.kompanija',
        email: 'amina.kompanija@example.com',
        password: 'Password1',
        role: 'KOMPANIJA_ADMIN',
        companyId: null,
      },
      { id: 1, username: 'ana.admin' },
    ),
  ).rejects.toBeInstanceOf(UserValidationError);
});

test('UserManagementService blocks admin self-deactivation', async () => {
  const { service } = createService();

  await expect(
    service.setUserActive(1, false, { id: 1, username: 'ana.admin' }),
  ).rejects.toBeInstanceOf(UserForbiddenActionError);
});

test('UserManagementService blocks deletion when user has active interventions', async () => {
  const repo = new MockUserRepository();
  repo.users.push(buildUser({ id: 2, username: 'marko.serviser', email: 'marko@example.com' }));
  repo.activeInterventionCount = 1;
  const { service } = createService(repo);

  await expect(
    service.deleteUser(2, { id: 1, username: 'ana.admin' }),
  ).rejects.toThrow('active interventions');
});

test('UserManagementService creates user and records audit entry', async () => {
  const { service, auditLogger } = createService();

  const created = await service.createUser(
    {
      firstName: 'Lejla',
      lastName: 'Korisnik',
      username: 'lejla.korisnik',
      email: 'lejla@example.com',
      password: 'Password1',
      role: 'KORISNIK',
      companyId: 1,
    },
    { id: 1, username: 'ana.admin' },
  );

  expect(created.username).toBe('lejla.korisnik');
  expect(created.role).toBe('KORISNIK');
  expect(auditLogger.record).toHaveBeenCalledWith(
    expect.objectContaining({
      action: 'USER_CREATED',
      entity: 'User',
      actorUsername: 'ana.admin',
    }),
  );
});

test('UserManagementService allows regular user without company', async () => {
  const { service } = createService();

  const created = await service.createUser(
    {
      firstName: 'Jelena',
      lastName: 'Korisnik',
      username: 'jelena.korisnik',
      email: 'jelena@example.com',
      password: 'Password1',
      role: 'KORISNIK',
      companyId: null,
    },
    { id: 1, username: 'ana.admin' },
  );

  expect(created.username).toBe('jelena.korisnik');
  expect(created.companyId).toBeNull();
});
