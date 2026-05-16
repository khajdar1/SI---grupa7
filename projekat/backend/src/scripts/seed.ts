import {
  PrismaClient,
} from '@prisma/client';
import { requireDatabaseUrl } from '../config/database-url';

import {
  AssignmentMethod,
  InterventionStatus,
  InterventionType,
  Priority,
} from '../shared/prisma-enums';

export { AssignmentMethod, InterventionStatus, InterventionType, Priority };

export const DemoUserPersona = {
  GUEST: 'GUEST',
  USER: 'USER',
  SERVICER: 'SERVICER',
  COORDINATOR: 'COORDINATOR',
  MANAGEMENT: 'MANAGEMENT',
  ADMIN: 'ADMIN',
} as const;
export type DemoUserPersona = (typeof DemoUserPersona)[keyof typeof DemoUserPersona];

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
  readonly active: boolean;
  readonly companyId: number | null;
}

interface SeedUserSeed extends SeedUserInput {
  readonly persona: DemoUserPersona;
}

export interface SeedExternalIdentityInput {
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

function requireFaultReport(
  faultReports: Array<SeedRecord & SeedFaultReportInput>,
  id: number,
): SeedRecord & SeedFaultReportInput {
  const fr = faultReports.find((f) => f.id === id);
  if (!fr) throw new Error(`Missing seed fault report id=${id}`);
  return fr;
}

interface SeedRecord {
  id: number;
}

type SeedUserRecord = SeedRecord & SeedUserInput & {
  persona: DemoUserPersona;
};

type ExternalIdentityWhereUniqueInput = {
  provider_providerSubject: {
    provider: string;
    providerSubject: string;
  };
};

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
  user: UpsertModel<{ email: string }, SeedUserInput, SeedRecord & SeedUserInput>;
  externalIdentity: UpsertModel<ExternalIdentityWhereUniqueInput, SeedExternalIdentityInput, SeedRecord & SeedExternalIdentityInput>;
  faultReport: IdUpsertModel<SeedFaultReportInput>;
  intervention: IdUpsertModel<SeedInterventionInput>;
  assignment: IdUpsertModel<SeedAssignmentInput>;
}

function buildDemoCompanySeed(): SeedCompanyInput {
  return {
    name: 'Servis Alfa d.o.o.',
    contact: 'demo@servis-alfa.local',
    type: 'service company',
  };
}

function buildDemoCategorySeeds(): SeedCategoryInput[] {
  return [
    {
      name: 'Electrical issue',
      description: 'Electrical wiring, lighting, and power supply issues.',
      active: true,
    },
    {
      name: 'Plumbing issue',
      description: 'Water supply and drainage installation issues.',
      active: true,
    },
    {
      name: 'Network and internet',
      description: 'Local network, access, and connectivity issues.',
      active: true,
    },
    {
      name: 'General maintenance',
      description: 'Regular or minor operational requests that are not urgent faults.',
      active: true,
    },
  ];
}

function buildDemoSlaSeeds(): SeedSlaConfigurationInput[] {
  return [
    {
      priority: Priority.CRITICAL,
      deadlineHours: 4,
    },
    {
      priority: Priority.HIGH,
      deadlineHours: 8,
    },
    {
      priority: Priority.MEDIUM,
      deadlineHours: 24,
    },
    {
      priority: Priority.LOW,
      deadlineHours: 72,
    },
  ];
}

function buildDemoUserSeeds(companyId: number): SeedUserSeed[] {
  return [
    {
      firstName: 'Ana',
      lastName: 'Administrator',
      username: 'ana.admin',
      email: 'ana.admin@demo.local',
      active: true,
      companyId: null,
      persona: DemoUserPersona.ADMIN,
    },
    {
      firstName: 'Milan',
      lastName: 'Coordinator',
      username: 'milan.koordinator',
      email: 'milan.koordinator@demo.local',
      active: true,
      companyId,
      persona: DemoUserPersona.COORDINATOR,
    },
    {
      firstName: 'Marko',
      lastName: 'Technician',
      username: 'marko.serviser',
      email: 'marko.serviser@demo.local',
      active: true,
      companyId,
      persona: DemoUserPersona.SERVICER,
    },
    {
      firstName: 'Lejla',
      lastName: 'Management',
      username: 'lejla.menadzment',
      email: 'lejla.menadzment@demo.local',
      active: true,
      companyId,
      persona: DemoUserPersona.MANAGEMENT,
    },
    {
      firstName: 'Jelena',
      lastName: 'User',
      username: 'jelena.korisnik',
      email: 'jelena.korisnik@demo.local',
      active: false,
      companyId,
      persona: DemoUserPersona.USER,
    },
  ];
}

function buildDemoExternalIdentitySeeds(
  users: SeedUserRecord[],
): SeedExternalIdentityInput[] {
  const adminUser = requireSeedUser(users, DemoUserPersona.ADMIN);
  const coordinatorUser = requireSeedUser(users, DemoUserPersona.COORDINATOR);
  const servicerUser = requireSeedUser(users, DemoUserPersona.SERVICER);
  const managementUser = requireSeedUser(users, DemoUserPersona.MANAGEMENT);
  const customerUser = requireSeedUser(users, DemoUserPersona.USER);

  return [
    {
      userId: adminUser.id,
      provider: 'entra',
      providerSubject: 'entra-admin-001',
    },
    {
      userId: coordinatorUser.id,
      provider: 'entra',
      providerSubject: 'entra-coordinator-001',
    },
    {
      userId: servicerUser.id,
      provider: 'entra',
      providerSubject: 'entra-servicer-001',
    },
    {
      userId: managementUser.id,
      provider: 'entra',
      providerSubject: 'entra-management-001',
    },
    {
      userId: customerUser.id,
      provider: 'entra',
      providerSubject: 'entra-user-001',
    },
  ];
}

function buildDemoFaultReportSeeds(companyId: number, categories: Array<SeedRecord & SeedCategoryInput>, userId: number): SeedFaultReportInput[] {
  const electrical = requireSeedCategory(categories, 'Electrical issue');
  const plumbing = requireSeedCategory(categories, 'Plumbing issue');
  const network = requireSeedCategory(categories, 'Network and internet');
  return [
    {
      id: 1,
      description: 'Entrance lighting issue on the ground floor.',
      location: 'Main entrance, building A',
      userId,
      categoryId: electrical.id,
      companyId,
    },
    {
      id: 2,
      description: 'Burst pipe in the bathroom on the 2nd floor.',
      location: 'Floor 2, bathroom B',
      userId,
      categoryId: plumbing.id,
      companyId,
    },
    {
      id: 3,
      description: 'Internet connection is down across the entire building.',
      location: 'Server room, ground floor',
      userId,
      categoryId: network.id,
      companyId,
    },
  ];
}

function buildDemoInterventionSeeds(
  companyId: number,
  categories: Array<SeedRecord & SeedCategoryInput>,
  creatorId: number,
  faultReports: Array<SeedRecord & SeedFaultReportInput>,
): SeedInterventionInput[] {
  const electrical = requireSeedCategory(categories, 'Electrical issue');
  const plumbing = requireSeedCategory(categories, 'Plumbing issue');
  const network = requireSeedCategory(categories, 'Network and internet');
  const maintenance = requireSeedCategory(categories, 'General maintenance');
  const fr1 = faultReports.find((f) => f.id === 1)!;
  const fr2 = faultReports.find((f) => f.id === 2)!;
  const fr3 = faultReports.find((f) => f.id === 3)!;
  return [
    {
      id: 1,
      name: 'Fix entrance lighting issue',
      description: 'The coordinator created an intervention from the fault report.',
      location: 'Main entrance, building A',
      priority: Priority.HIGH,
      status: InterventionStatus.NEW,
      type: InterventionType.ISSUE,
      archived: false,
      categoryId: electrical.id,
      creatorId,
      companyId,
      faultReportId: fr1.id,
    },
    {
      id: 20,
      name: 'Plumbing repair',
      description: 'Technician is on site and work is in progress.',
      location: 'Floor 2, bathroom B',
      priority: Priority.HIGH,
      status: InterventionStatus.IN_PROGRESS,
      type: InterventionType.ISSUE,
      archived: false,
      categoryId: plumbing.id,
      creatorId,
      companyId,
      faultReportId: fr2.id,
    },
    {
      id: 21,
      name: 'Preventive network inspection',
      description: 'Quarterly LAN infrastructure inspection.',
      location: 'Server room, ground floor',
      priority: Priority.MEDIUM,
      status: InterventionStatus.IN_PROGRESS,
      type: InterventionType.PREVENTIVE,
      archived: false,
      categoryId: network.id,
      creatorId,
      companyId,
      faultReportId: null,
    },
    {
      id: 22,
      name: 'Security camera replacement',
      description: 'Replaced 3 cameras at the entrance.',
      location: 'Main entrance',
      priority: Priority.LOW,
      status: InterventionStatus.RESOLVED,
      type: InterventionType.PREVENTIVE,
      archived: false,
      categoryId: maintenance.id,
      creatorId,
      companyId,
      faultReportId: null,
    },
    {
      id: 23,
      name: 'New cooling unit installation',
      description: 'Cancelled - budget rejected.',
      location: 'Server room',
      priority: Priority.CRITICAL,
      status: InterventionStatus.CANCELLED,
      type: InterventionType.PREVENTIVE,
      archived: false,
      categoryId: network.id,
      creatorId,
      companyId,
      faultReportId: null,
    },
    {
      id: 24,
      name: 'Internet connection repair',
      description: 'Internet connection is unstable and needs diagnostics.',
      location: 'Server room, ground floor',
      priority: Priority.CRITICAL,
      status: InterventionStatus.NEW,
      type: InterventionType.ISSUE,
      archived: false,
      categoryId: network.id,
      creatorId,
      companyId,
      faultReportId: fr3.id,
    },
  ];
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
  persona: DemoUserPersona,
): SeedUserRecord {
  const user = users.find((item) => item.persona === persona);

  if (!user) {
    throw new Error(`Missing seed user persona: ${persona}`);
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
        where: {
          provider_providerSubject: {
            provider: identitySeed.provider,
            providerSubject: identitySeed.providerSubject,
          },
        },
        create: identitySeed,
        update: {
          userId: identitySeed.userId,
        },
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
      upsert: (args) =>
        prisma.assignment.upsert({
          where: {
            interventionId_userId: {
              interventionId: args.create.interventionId,
              userId: args.create.userId,
            },
          },
          create: {
            interventionId: args.create.interventionId,
            userId: args.create.userId,
            method: args.create.method,
          },
          update: {
            method: args.update.method,
          },
        }),
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
    buildDemoUserSeeds(companyId).map(async (userSeed) => {
      const { persona, ...persistedUserSeed } = userSeed;
      const user = await client.user.upsert({
        where: { email: persistedUserSeed.email },
        create: persistedUserSeed,
        update: persistedUserSeed,
      });

      return {
        ...user,
        persona,
      };
    }),
  );
}

async function seedFaultReports(
  client: SeedClient,
  companyId: number,
  categories: Array<SeedRecord & SeedCategoryInput>,
  userId: number,
): Promise<Array<SeedRecord & SeedFaultReportInput>> {
  return Promise.all(
    buildDemoFaultReportSeeds(companyId, categories, userId).map((faultReportSeed) =>
      client.faultReport.upsert({
        where: { id: faultReportSeed.id },
        create: faultReportSeed,
        update: faultReportSeed,
      }),
    ),
  );
}

async function seedInterventions(
  client: SeedClient,
  companyId: number,
  categories: Array<SeedRecord & SeedCategoryInput>,
  creatorId: number,
  faultReports: Array<SeedRecord & SeedFaultReportInput>,
): Promise<Array<SeedRecord & SeedInterventionInput>> {
  return Promise.all(
    buildDemoInterventionSeeds(companyId, categories, creatorId, faultReports).map((interventionSeed) =>
      client.intervention.upsert({
        where: { id: interventionSeed.id },
        create: interventionSeed,
        update: interventionSeed,
      }),
    ),
  );
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
  const electricalCategory = requireSeedCategory(categories, 'Electrical issue');
  const customerUser = requireSeedUser(users, DemoUserPersona.USER);
  const coordinatorUser = requireSeedUser(users, DemoUserPersona.COORDINATOR);
  const servicerUser = requireSeedUser(users, DemoUserPersona.SERVICER);
  const faultReports = await seedFaultReports(client, company.id, categories, customerUser.id);
  const interventions = await seedInterventions(client, company.id, categories, coordinatorUser.id, faultReports);
  await seedAssignment(client, interventions[0].id, servicerUser.id);

  return {
    companyName: company.name,
    categoryCount: categories.length,
    slaConfigurationCount: slaConfigurations.length,
    userCount: users.length,
    externalIdentityCount: externalIdentities.length,
    faultReportCount: faultReports.length,
    interventionCount: interventions.length,
    assignmentCount: 1,
  };
}

export async function main(): Promise<void> {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: requireDatabaseUrl('seed script'),
      },
    },
  });

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
