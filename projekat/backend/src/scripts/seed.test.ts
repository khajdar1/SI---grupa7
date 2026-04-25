import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AssignmentMethod,
  InterventionStatus,
  InterventionType,
  type SeedClient,
  type SeedAssignmentInput,
  type SeedCategoryInput,
  type SeedCompanyInput,
  type SeedFaultReportInput,
  type SeedInterventionInput,
  type SeedExternalIdentityInput,
  type SeedSlaConfigurationInput,
  type SeedUserInput,
  Priority,
  UserRole,
  seedDatabase,
} from './seed';

type PriorityValue = (typeof Priority)[keyof typeof Priority];

interface MemoryState {
  companies: Map<string, SeedCompanyInput & { id: number }>;
  categories: Map<string, SeedCategoryInput & { id: number }>;
  slaConfigurations: Map<PriorityValue, SeedSlaConfigurationInput & { id: number }>;
  users: Map<string, SeedUserInput & { id: number }>;
  externalIdentities: Map<number, SeedExternalIdentityInput>;
  faultReports: Map<number, SeedFaultReportInput>;
  interventions: Map<number, SeedInterventionInput>;
  assignments: Map<number, SeedAssignmentInput>;
}

function createMemorySeedClient(): { client: SeedClient; state: MemoryState } {
  let nextId = 1;

  const state: MemoryState = {
    companies: new Map(),
    categories: new Map(),
    slaConfigurations: new Map(),
    users: new Map(),
    externalIdentities: new Map(),
    faultReports: new Map(),
    interventions: new Map(),
    assignments: new Map(),
  };

  const upsertByKey = <TKey, TData extends object>(
    store: Map<TKey, TData & { id: number }>,
    key: TKey,
    create: TData,
    update: Partial<TData>,
  ): TData & { id: number } => {
    const existing = store.get(key);

    if (existing) {
      const updated: TData & { id: number } = { ...existing, ...update, id: existing.id };
      store.set(key, updated);
      return updated;
    }

    const created: TData & { id: number } = { id: nextId++, ...create };
    store.set(key, created);
    return created;
  };

  const client: SeedClient = {
    company: {
      upsert: async ({ where, create, update }) => upsertByKey(state.companies, where.name, create, update),
    },
    category: {
      upsert: async ({ where, create, update }) => upsertByKey(state.categories, where.name, create, update),
    },
    slaConfiguration: {
      upsert: async ({ where, create, update }) => upsertByKey(state.slaConfigurations, where.priority, create, update),
    },
    user: {
      upsert: async ({ where, create, update }) => upsertByKey(state.users, where.email, create, update),
    },
    externalIdentity: {
      upsert: async ({ where, create, update }) => upsertByKey(state.externalIdentities, where.id, create, update),
    },
    faultReport: {
      upsert: async ({ where, create, update }) => upsertByKey(state.faultReports, where.id, create, update),
    },
    intervention: {
      upsert: async ({ where, create, update }) => upsertByKey(state.interventions, where.id, create, update),
    },
    assignment: {
      upsert: async ({ where, create, update }) => upsertByKey(state.assignments, where.id, create, update),
    },
  };

  return { client, state };
}

test('should seed the demo dataset with local profiles and external identities', async () => {
  const { client, state } = createMemorySeedClient();

  const summary = await seedDatabase(client);

  assert.equal(summary.companyName, 'Servis Alfa d.o.o.');
  assert.equal(summary.categoryCount, 4);
  assert.equal(summary.slaConfigurationCount, 4);
  assert.equal(summary.userCount, 5);
  assert.equal(summary.externalIdentityCount, 5);
  assert.equal(summary.faultReportCount, 1);
  assert.equal(summary.interventionCount, 1);
  assert.equal(summary.assignmentCount, 1);
  assert.equal(state.companies.size, 1);
  assert.equal(state.categories.size, 4);
  assert.equal(state.slaConfigurations.size, 4);
  assert.equal(state.users.size, 5);
  assert.equal(state.externalIdentities.size, 5);
  assert.equal(state.faultReports.size, 1);
  assert.equal(state.interventions.size, 1);
  assert.equal(state.assignments.size, 1);

  const company = state.companies.get('Servis Alfa d.o.o.');
  assert.ok(company);

  const electricalCategory = state.categories.get('Elektricni kvar');
  assert.ok(electricalCategory);

  const customer = Array.from(state.users.values()).find((user) => user.role === UserRole.USER);
  const coordinator = Array.from(state.users.values()).find((user) => user.role === UserRole.COORDINATOR);
  const servicer = Array.from(state.users.values()).find((user) => user.role === UserRole.SERVICER);
  assert.ok(customer);
  assert.ok(coordinator);
  assert.ok(servicer);

  const externalIdentityProviders = Array.from(state.externalIdentities.values())
    .map((identity) => identity.provider)
    .sort();
  assert.deepEqual(externalIdentityProviders, ['entra', 'entra', 'entra', 'entra', 'entra']);

  const externalIdentityUserIds = new Set(Array.from(state.externalIdentities.values()).map((identity) => identity.userId));
  for (const user of state.users.values()) {
    assert.equal(externalIdentityUserIds.has(user.id), true);
  }

  const faultReport = state.faultReports.get(1);
  const intervention = state.interventions.get(1);
  const assignment = state.assignments.get(1);
  assert.ok(faultReport);
  assert.ok(intervention);
  assert.ok(assignment);
  assert.equal(faultReport.companyId, company.id);
  assert.equal(faultReport.categoryId, electricalCategory.id);
  assert.equal(faultReport.userId, customer.id);
  assert.equal(intervention.companyId, company.id);
  assert.equal(intervention.categoryId, electricalCategory.id);
  assert.equal(intervention.faultReportId, faultReport.id);
  assert.equal(intervention.creatorId, coordinator.id);
  assert.equal(intervention.status, InterventionStatus.OPEN);
  assert.equal(intervention.type, InterventionType.ISSUE);
  assert.equal(assignment.interventionId, intervention.id);
  assert.equal(assignment.userId, servicer.id);
  assert.equal(assignment.method, AssignmentMethod.MANUAL);

  const userRoles = Array.from(state.users.values()).map((user) => user.role).sort();
  assert.deepEqual(userRoles, [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MANAGEMENT, UserRole.SERVICER, UserRole.USER].sort());

  const linkedUsers = Array.from(state.users.values()).filter((user) => user.role !== UserRole.ADMIN);
  for (const user of linkedUsers) {
    assert.equal(user.companyId, company.id);
  }

  const externalIdentityLinks = Array.from(state.externalIdentities.values()).map((identity) => `${identity.userId}:${identity.provider}`);
  assert.equal(new Set(externalIdentityLinks).size, 5);

  const admin = Array.from(state.users.values()).find((user) => user.role === UserRole.ADMIN);
  assert.ok(admin);
  assert.equal(admin.companyId, null);

  assert.deepEqual(
    Array.from(state.slaConfigurations.values())
      .map((configuration) => configuration.priority)
      .sort(),
    [Priority.URGENT, Priority.HIGH, Priority.NORMAL, Priority.LOW].sort(),
  );
});

test('should remain idempotent when the seed runs twice', async () => {
  const { client, state } = createMemorySeedClient();

  const firstSummary = await seedDatabase(client);
  const firstCompanyId = state.companies.get('Servis Alfa d.o.o.')?.id;

  const secondSummary = await seedDatabase(client);
  const secondCompanyId = state.companies.get('Servis Alfa d.o.o.')?.id;

  assert.equal(firstSummary.companyName, secondSummary.companyName);
  assert.equal(firstSummary.categoryCount, secondSummary.categoryCount);
  assert.equal(firstSummary.slaConfigurationCount, secondSummary.slaConfigurationCount);
  assert.equal(firstSummary.userCount, secondSummary.userCount);
  assert.equal(state.companies.size, 1);
  assert.equal(state.categories.size, 4);
  assert.equal(state.slaConfigurations.size, 4);
  assert.equal(state.users.size, 5);
  assert.equal(state.externalIdentities.size, 5);
  assert.equal(state.faultReports.size, 1);
  assert.equal(state.interventions.size, 1);
  assert.equal(state.assignments.size, 1);
  assert.equal(firstCompanyId, secondCompanyId);
});
