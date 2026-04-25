import { PrismaClient } from '@prisma/client';

export const Priority = {
  URGENT: 'URGENT',
  HIGH: 'HIGH',
  NORMAL: 'NORMAL',
  LOW: 'LOW',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const UserRole = {
  GUEST: 'GUEST',
  USER: 'USER',
  SERVICER: 'SERVICER',
  COORDINATOR: 'COORDINATOR',
  MANAGEMENT: 'MANAGEMENT',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const InterventionStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELED: 'CANCELED',
} as const;
export type InterventionStatus = (typeof InterventionStatus)[keyof typeof InterventionStatus];

export const InterventionType = {
  ISSUE: 'ISSUE',
  PREVENTIVE: 'PREVENTIVE',
} as const;
export type InterventionType = (typeof InterventionType)[keyof typeof InterventionType];

export const AssignmentMethod = {
  MANUAL: 'MANUAL',
  AUTOMATIC: 'AUTOMATIC',
} as const;
export type AssignmentMethod = (typeof AssignmentMethod)[keyof typeof AssignmentMethod];

export interface SeedCompanyInput {
  readonly name: string;
  readonly contact: string | null;
  readonly type: string | null;
}

export interface SeedCategoryInput {
  readonly name: string;
  readonly description: string | null;
  readonly active: boolean;
}

export interface SeedSlaConfigurationInput {
  readonly priority: Priority;
  readonly deadlineHours: number;
}

export interface SeedUserInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly username: string;
  readonly email: string;
  readonly role: UserRole;
  readonly active: boolean;
  readonly companyId: number | null;
}

export interface SeedExternalIdentityInput {
  readonly id: number;
  readonly userId: number;
  readonly provider: string;
  readonly providerSubject: string;
}

export interface SeedFaultReportInput {
  readonly id: number;
  readonly description: string;
  readonly location: string;
  readonly userId: number | null;
  readonly categoryId: number;
  readonly companyId: number;
}

export interface SeedInterventionInput {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly location: string;
  readonly priority: Priority;
  readonly status: InterventionStatus;
  readonly type: InterventionType;
  readonly archived: boolean;
  readonly categoryId: number;
  readonly creatorId: number;
  readonly companyId: number;
  readonly faultReportId: number | null;
}

export interface SeedAssignmentInput {
  readonly id: number;
  readonly interventionId: number;
  readonly userId: number;
  readonly method: AssignmentMethod;
}

export interface SeedSummary {
  readonly companyName: string;
  readonly categoryCount: number;
  readonly slaConfigurationCount: number;
  readonly userCount: number;
  readonly externalIdentityCount: number;
  readonly faultReportCount: number;
  readonly interventionCount: number;
  readonly assignmentCount: number;
}

interface SeedRecord {
  id: number;
}

type SeedUserRecord = SeedRecord & SeedUserInput;

interface UpsertModel<TWhere, TData, TResult extends SeedRecord> {
  upsert(args: { where: TWhere; create: TData; update: Partial<TData> }): Promise<TResult>;
}

interface IdUpsertModel<TData extends SeedRecord> {
  upsert(args: { where: { id: number }; create: TData; update: Partial<TData> }): Promise<TData>;
}

export interface SeedClient {
  company: UpsertModel<{ name: string }, SeedCompanyInput, SeedRecord & SeedCompanyInput>;
  category: UpsertModel<{ name: string }, SeedCategoryInput, SeedRecord & SeedCategoryInput>;
  slaConfiguration: UpsertModel<{ priority: Priority }, SeedSlaConfigurationInput, SeedRecord & SeedSlaConfigurationInput>;
  user: UpsertModel<{ email: string }, SeedUserInput, SeedUserRecord>;
  externalIdentity: IdUpsertModel<SeedExternalIdentityInput>;
  faultReport: IdUpsertModel<SeedFaultReportInput>;
  intervention: IdUpsertModel<SeedInterventionInput>;
  assignment: IdUpsertModel<SeedAssignmentInput>;
}

function buildDemoCompanySeed(): SeedCompanyInput {
  return {
    name: 'Servis Alfa d.o.o.',
    contact: 'demo@servis-alfa.local',
    type: 'servisna kompanija',
  };
}

function buildDemoCategorySeeds(): SeedCategoryInput[] {
  return [
    {
      name: 'Elektricni kvar',
      description: 'Kvarovi na elektroinstalacijama, osvetljenju i napajanju.',
      active: true,
    },
    {
      name: 'Vodovodni kvar',
      description: 'Kvarovi na vodovodnim i kanalizacionim instalacijama.',
      active: true,
    },
    {
      name: 'Mreza i internet',
      description: 'Problemi sa lokalnom mrežom, pristupom i povezivanjem.',
      active: true,
    },
    {
      name: 'Opste odrzavanje',
      description: 'Redovni ili manji operativni zahtjevi koji nisu hitni kvarovi.',
      active: true,
    },
  ];
}

function buildDemoSlaSeeds(): SeedSlaConfigurationInput[] {
  return [
    {
      priority: Priority.URGENT,
      deadlineHours: 4,
    },
    {
      priority: Priority.HIGH,
      deadlineHours: 8,
    },
    {
      priority: Priority.NORMAL,
      deadlineHours: 24,
    },
    {
      priority: Priority.LOW,
      deadlineHours: 72,
    },
  ];
}

function buildDemoUserSeeds(companyId: number): SeedUserInput[] {
  return [
    {
      firstName: 'Ana',
      lastName: 'Administrator',
      username: 'ana.admin',
      email: 'ana.admin@demo.local',
      role: UserRole.ADMIN,
      active: true,
      companyId: null,
    },
    {
      firstName: 'Milan',
      lastName: 'Koordinator',
      username: 'milan.koordinator',
      email: 'milan.koordinator@demo.local',
      role: UserRole.COORDINATOR,
      active: true,
      companyId,
    },
    {
      firstName: 'Marko',
      lastName: 'Serviser',
      username: 'marko.serviser',
      email: 'marko.serviser@demo.local',
      role: UserRole.SERVICER,
      active: true,
      companyId,
    },
    {
      firstName: 'Lejla',
      lastName: 'Menadzment',
      username: 'lejla.menadzment',
      email: 'lejla.menadzment@demo.local',
      role: UserRole.MANAGEMENT,
      active: true,
      companyId,
    },
    {
      firstName: 'Jelena',
      lastName: 'Korisnik',
      username: 'jelena.korisnik',
      email: 'jelena.korisnik@demo.local',
      role: UserRole.USER,
      active: true,
      companyId,
    },
  ];
}

function buildDemoExternalIdentitySeeds(
  users: SeedUserRecord[],
): SeedExternalIdentityInput[] {
  const adminUser = requireSeedUser(users, UserRole.ADMIN);
  const coordinatorUser = requireSeedUser(users, UserRole.COORDINATOR);
  const servicerUser = requireSeedUser(users, UserRole.SERVICER);
  const managementUser = requireSeedUser(users, UserRole.MANAGEMENT);
  const customerUser = requireSeedUser(users, UserRole.USER);

  return [
    {
      id: 1,
      userId: adminUser.id,
      provider: 'entra',
      providerSubject: 'entra-admin-001',
    },
    {
      id: 2,
      userId: coordinatorUser.id,
      provider: 'entra',
      providerSubject: 'entra-coordinator-001',
    },
    {
      id: 3,
      userId: servicerUser.id,
      provider: 'entra',
      providerSubject: 'entra-servicer-001',
    },
    {
      id: 4,
      userId: managementUser.id,
      provider: 'entra',
      providerSubject: 'entra-management-001',
    },
    {
      id: 5,
      userId: customerUser.id,
      provider: 'entra',
      providerSubject: 'entra-user-001',
    },
  ];
}

function buildDemoFaultReportSeed(companyId: number, categoryId: number, userId: number): SeedFaultReportInput {
  return {
    id: 1,
    description: 'Kvar na ulaznom osvetljenju u prizemlju.',
    location: 'Glavni ulaz, objekat A',
    userId,
    categoryId,
    companyId,
  };
}

function buildDemoInterventionSeed(
  companyId: number,
  categoryId: number,
  creatorId: number,
  faultReportId: number,
): SeedInterventionInput {
  return {
    id: 1,
    name: 'Uklanjanje kvara na ulaznom osvjetljenju',
    description: 'Koordinator je kreirao intervenciju na osnovu prijave kvara.',
    location: 'Glavni ulaz, objekat A',
    priority: Priority.HIGH,
    status: InterventionStatus.OPEN,
    type: InterventionType.ISSUE,
    archived: false,
    categoryId,
    creatorId,
    companyId,
    faultReportId,
  };
}

function buildDemoAssignmentSeed(interventionId: number, userId: number): SeedAssignmentInput {
  return {
    id: 1,
    interventionId,
    userId,
    method: AssignmentMethod.MANUAL,
  };
}

function requireSeedCategory(
  categories: Array<SeedRecord & SeedCategoryInput>,
  categoryName: string,
): SeedRecord & SeedCategoryInput {
  const category = categories.find((item) => item.name === categoryName);

  if (!category) {
    throw new Error(`Missing seed category: ${categoryName}`);
  }

  return category;
}

function requireSeedUser(
  users: SeedUserRecord[],
  role: UserRole,
): SeedUserRecord {
  const user = users.find((item) => item.role === role);

  if (!user) {
    throw new Error(`Missing seed user role: ${role}`);
  }

  return user;
}

async function seedExternalIdentities(
  client: SeedClient,
  users: SeedUserRecord[],
): Promise<Array<SeedRecord & SeedExternalIdentityInput>> {
  return Promise.all(
    buildDemoExternalIdentitySeeds(users).map((identitySeed) =>
      client.externalIdentity.upsert({
        where: { id: identitySeed.id },
        create: identitySeed,
        update: identitySeed,
      }),
    ),
  );
}

export function createPrismaSeedClient(prisma: PrismaClient): SeedClient {
  return {
    company: {
      upsert: (args) => prisma.company.upsert(args),
    },
    category: {
      upsert: (args) => prisma.category.upsert(args),
    },
    slaConfiguration: {
      upsert: (args) => prisma.slaConfiguration.upsert(args),
    },
    user: {
      upsert: async (args) => prisma.user.upsert(args),
    },
    externalIdentity: {
      upsert: (args) => prisma.externalIdentity.upsert(args),
    },
    faultReport: {
      upsert: (args) => prisma.faultReport.upsert(args),
    },
    intervention: {
      upsert: (args) => prisma.intervention.upsert(args),
    },
    assignment: {
      upsert: (args) => prisma.assignment.upsert(args),
    },
  };
}

async function seedCompany(client: SeedClient): Promise<SeedRecord & SeedCompanyInput> {
  const companySeed = buildDemoCompanySeed();

  return client.company.upsert({
    where: { name: companySeed.name },
    create: companySeed,
    update: companySeed,
  });
}

async function seedCategories(client: SeedClient): Promise<Array<SeedRecord & SeedCategoryInput>> {
  return Promise.all(
    buildDemoCategorySeeds().map((categorySeed) =>
      client.category.upsert({
        where: { name: categorySeed.name },
        create: categorySeed,
        update: categorySeed,
      }),
    ),
  );
}

async function seedSlaConfigurations(client: SeedClient): Promise<Array<SeedRecord & SeedSlaConfigurationInput>> {
  return Promise.all(
    buildDemoSlaSeeds().map((slaSeed) =>
      client.slaConfiguration.upsert({
        where: { priority: slaSeed.priority },
        create: slaSeed,
        update: slaSeed,
      }),
    ),
  );
}

async function seedUsers(
  client: SeedClient,
  companyId: number,
): Promise<SeedUserRecord[]> {
  return Promise.all(
    buildDemoUserSeeds(companyId).map((userSeed) =>
      client.user.upsert({
        where: { email: userSeed.email },
        create: userSeed,
        update: userSeed,
      }),
    ),
  );
}

async function seedFaultReport(
  client: SeedClient,
  companyId: number,
  categoryId: number,
  userId: number,
): Promise<SeedRecord & SeedFaultReportInput> {
  const faultReportSeed = buildDemoFaultReportSeed(companyId, categoryId, userId);

  return client.faultReport.upsert({
    where: { id: faultReportSeed.id },
    create: faultReportSeed,
    update: faultReportSeed,
  });
}

async function seedIntervention(
  client: SeedClient,
  companyId: number,
  categoryId: number,
  creatorId: number,
  faultReportId: number,
): Promise<SeedRecord & SeedInterventionInput> {
  const interventionSeed = buildDemoInterventionSeed(companyId, categoryId, creatorId, faultReportId);

  return client.intervention.upsert({
    where: { id: interventionSeed.id },
    create: interventionSeed,
    update: interventionSeed,
  });
}

async function seedAssignment(
  client: SeedClient,
  interventionId: number,
  userId: number,
): Promise<SeedRecord & SeedAssignmentInput> {
  const assignmentSeed = buildDemoAssignmentSeed(interventionId, userId);

  return client.assignment.upsert({
    where: { id: assignmentSeed.id },
    create: assignmentSeed,
    update: assignmentSeed,
  });
}

export async function seedDatabase(client: SeedClient): Promise<SeedSummary> {
  const company = await seedCompany(client);
  const categories = await seedCategories(client);
  const slaConfigurations = await seedSlaConfigurations(client);
  const users = await seedUsers(client, company.id);
  const externalIdentities = await seedExternalIdentities(client, users);
  const electricalCategory = requireSeedCategory(categories, 'Elektricni kvar');
  const customerUser = requireSeedUser(users, UserRole.USER);
  const coordinatorUser = requireSeedUser(users, UserRole.COORDINATOR);
  const servicerUser = requireSeedUser(users, UserRole.SERVICER);
  const faultReport = await seedFaultReport(client, company.id, electricalCategory.id, customerUser.id);
  const intervention = await seedIntervention(client, company.id, electricalCategory.id, coordinatorUser.id, faultReport.id);
  await seedAssignment(client, intervention.id, servicerUser.id);

  return {
    companyName: company.name,
    categoryCount: categories.length,
    slaConfigurationCount: slaConfigurations.length,
    userCount: users.length,
    externalIdentityCount: externalIdentities.length,
    faultReportCount: 1,
    interventionCount: 1,
    assignmentCount: 1,
  };
}

export async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    const summary = await seedDatabase(createPrismaSeedClient(prisma));

    console.log(
      `Seed completed for ${summary.companyName}: ${summary.categoryCount} categories, ${summary.slaConfigurationCount} SLA rows, ${summary.userCount} users, ${summary.externalIdentityCount} external identities.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error('Seed execution failed.');

    if (error instanceof Error) {
      console.error(error.message);
    }

    process.exitCode = 1;
  });
}
