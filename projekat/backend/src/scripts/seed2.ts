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
  readonly commentCount: number;
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
  interventionComment: {
    create(args: { data: { interventionId: number; authorId: number; text: string } }): Promise<{ id: number }>;
  };
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
      lastName: 'Koordinator',
      username: 'milan.koordinator',
      email: 'milan.koordinator@demo.local',
      active: true,
      companyId,
      persona: DemoUserPersona.COORDINATOR,
    },
    {
      firstName: 'Marko',
      lastName: 'Serviser',
      username: 'marko.serviser',
      email: 'marko.serviser@demo.local',
      active: true,
      companyId,
      persona: DemoUserPersona.SERVICER,
    },
    {
      firstName: 'Lejla',
      lastName: 'Menadzment',
      username: 'lejla.menadzment',
      email: 'lejla.menadzment@demo.local',
      active: true,
      companyId,
      persona: DemoUserPersona.MANAGEMENT,
    },
    {
      firstName: 'Jelena',
      lastName: 'Korisnik',
      username: 'jelena.korisnik',
      email: 'jelena.korisnik@demo.local',
      active: true,
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
  const electrical = requireSeedCategory(categories, 'Elektricni kvar');
  const plumbing = requireSeedCategory(categories, 'Vodovodni kvar');
  const network = requireSeedCategory(categories, 'Mreza i internet');
  return [
    {
      id: 1,
      description: 'Kvar na ulaznom osvetljenju u prizemlju.',
      location: 'Glavni ulaz, objekat A',
      userId,
      categoryId: electrical.id,
      companyId,
    },
    {
      id: 2,
      description: 'Pukla cijev u kupatilu na 2. spratu.',
      location: 'Sprat 2, kupatilo B',
      userId,
      categoryId: plumbing.id,
      companyId,
    },
    {
      id: 3,
      description: 'Internet veza pala u cijeloj zgradi.',
      location: 'Server soba, prizemlje',
      userId,
      categoryId: network.id,
      companyId,
    },
    // PBI-025: Seed prijave za demonstraciju detekcije duplikata
    // fr-101 i fr-102 su namjerno slični (ista lokacija, sličan opis) → treba aktivirati upozorenje
    {
      id: 101,
      description: 'Kvar na ulaznom osvjetljenju – lampe ne rade.',
      location: 'Glavni ulaz, objekat A',
      userId,
      categoryId: electrical.id,
      companyId,
    },
    // fr-103: ista lokacija ali RAZLIČIT opis (kvar vodovodne instalacije) → ne smije biti duplikat fr-101
    {
      id: 103,
      description: 'Procurila voda ispod sudopere u kantini.',
      location: 'Kuhinja, prizemlje',
      userId,
      categoryId: plumbing.id,
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
  const electrical = requireSeedCategory(categories, 'Elektricni kvar');
  const plumbing = requireSeedCategory(categories, 'Vodovodni kvar');
  const network = requireSeedCategory(categories, 'Mreza i internet');
  const maintenance = requireSeedCategory(categories, 'Opste odrzavanje');
  const fr1 = faultReports.find((f) => f.id === 1)!;
  const fr2 = faultReports.find((f) => f.id === 2)!;
  const fr3 = faultReports.find((f) => f.id === 3)!;
  return [
    {
      id: 1,
      name: 'Uklanjanje kvara na ulaznom osvjetljenju',
      description: 'Koordinator je kreirao intervenciju na osnovu prijave kvara.',
      location: 'Glavni ulaz, objekat A',
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
      name: 'Popravak vodovodne instalacije',
      description: 'Majstor na terenu, radovi u toku.',
      location: 'Sprat 2, kupatilo B',
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
      name: 'Preventivni pregled mreze',
      description: 'Kvartalini pregled LAN infrastrukture.',
      location: 'Server soba, prizemlje',
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
      name: 'Zamjena sigurnosnih kamera',
      description: 'Zamijenjene 3 kamere na ulazu.',
      location: 'Glavni ulaz',
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
      name: 'Instalacija novog rashladnog uredjaja',
      description: 'Otkazano - budzet odbijen.',
      location: 'Server soba',
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
      name: 'Popravka internet konekcije',
      description: 'Internet veza nestabilna, potrebna dijagnostika.',
      location: 'Server soba, prizemlje',
      priority: Priority.CRITICAL,
      status: InterventionStatus.NEW,
      type: InterventionType.ISSUE,
      archived: false,
      categoryId: network.id,
      creatorId,
      companyId,
      faultReportId: fr3.id,
    },
    // PBI-025 seed: aktivna intervencija za fr-101 (ulazno osvjetljenje)
    // Korisnik koji ponovo prijavi sličan kvar na istoj lokaciji treba dobiti upozorenje
    {
      id: 101,
      name: 'Popravka osvjetljenja na ulazu – prijava #101',
      description: 'Lampe na ulazu ne rade, prijavila korisnica. Intervencija u toku.',
      location: 'Glavni ulaz, objekat A',
      priority: Priority.HIGH,
      status: InterventionStatus.ASSIGNED,
      type: InterventionType.ISSUE,
      archived: false,
      categoryId: electrical.id,
      creatorId,
      companyId,
      faultReportId: 101,
    },
    // PBI-025 seed: aktivna intervencija za fr-103 (vodovodna instalacija)
    {
      id: 103,
      name: 'Popravka vodovodne instalacije u kantini',
      description: 'Procurila voda u kantini, potrebna hitna intervencija.',
      location: 'Kuhinja, prizemlje',
      priority: Priority.MEDIUM,
      status: InterventionStatus.NEW,
      type: InterventionType.ISSUE,
      archived: false,
      categoryId: plumbing.id,
      creatorId,
      companyId,
      faultReportId: 103,
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
      upsert: (args) => prisma.assignment.upsert(args),
    },
    interventionComment: {
      create: (args) => prisma.interventionComment.create(args),
    },
  };
}


function buildDemoCommentSeeds(
  coordinatorId: number,
  servicerId: number,
  interventions: Array<{ id: number }>,
): Array<{ interventionId: number; authorId: number; text: string }> {
  const seeds: Array<{ interventionId: number; authorId: number; text: string }> = [];
  const [first, second, third] = interventions;
  const fourth = interventions[interventions.length - 1];

  if (first) {
    seeds.push(
      {
        interventionId: first.id,
        authorId: coordinatorId,
        text: 'Intervencija je prioritetna - molim servisera da odmah izadje na teren i provjeri stanje ulaznog osvjetljenja.',
      },
      {
        interventionId: first.id,
        authorId: servicerId,
        text: 'Na terenu sam. Ustanovio sam da su pregorjele 3 od 5 sijalica. Narudjba materijala u toku, ocekujem isporuku sutra.',
      },
      {
        interventionId: first.id,
        authorId: coordinatorId,
        text: 'Hvala na azuriranju. Obavijesti me kada stigne materijal kako bismo odobrili nastavak radova.',
      },
    );
  }

  if (second) {
    seeds.push(
      {
        interventionId: second.id,
        authorId: coordinatorId,
        text: 'Provjeriti i zamijeniti sve dotrajale cijevi u podrumu. Stanari su vec prijavili vlagu na zidovima.',
      },
      {
        interventionId: second.id,
        authorId: servicerId,
        text: 'Kasnjenje zbog nedostatka odgovarajucih cijevi na lageru. Novi dolazak materijala ocekujem za 2 dana.',
      },
    );
  }

  if (third) {
    seeds.push(
      {
        interventionId: third.id,
        authorId: servicerId,
        text: 'Kvar lociran - ruter u serveru se pregrijava. Privremeno rjesenje postavljeno, trajna zamjena se planira.',
      },
      {
        interventionId: third.id,
        authorId: coordinatorId,
        text: 'Dobro. Naruci novi ruter i zakazemo zamjenu za subotu kako ne bismo ometali radni proces.',
      },
    );
  }

  if (fourth && fourth.id !== (first?.id ?? -1)) {
    seeds.push({
      interventionId: fourth.id,
      authorId: coordinatorId,
      text: 'Hitna intervencija! Internet veza potpuno pala u cijeloj zgradi. Molim servisera da odmah reaguje.',
    });
  }

  return seeds;
}

async function seedComments(
  client: SeedClient,
  coordinatorId: number,
  servicerId: number,
  interventions: Array<{ id: number }>,
): Promise<number> {
  const commentSeeds = buildDemoCommentSeeds(coordinatorId, servicerId, interventions);

  const results = await Promise.all(
    commentSeeds.map((commentSeed) =>
      client.interventionComment.create({ data: commentSeed }),
    ),
  );

  return results.length;
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
  const electricalCategory = requireSeedCategory(categories, 'Elektricni kvar');
  const customerUser = requireSeedUser(users, DemoUserPersona.USER);
  const coordinatorUser = requireSeedUser(users, DemoUserPersona.COORDINATOR);
  const servicerUser = requireSeedUser(users, DemoUserPersona.SERVICER);
  const faultReports = await seedFaultReports(client, company.id, categories, customerUser.id);
  const interventions = await seedInterventions(client, company.id, categories, coordinatorUser.id, faultReports);
  await seedAssignment(client, interventions[0].id, servicerUser.id);
  const commentCount = await seedComments(client, coordinatorUser.id, servicerUser.id, interventions);

  return {
    companyName: company.name,
    categoryCount: categories.length,
    slaConfigurationCount: slaConfigurations.length,
    userCount: users.length,
    externalIdentityCount: externalIdentities.length,
    faultReportCount: faultReports.length,
    interventionCount: interventions.length,
    assignmentCount: 1,
    commentCount,
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
      `Seed completed for ${summary.companyName}: ${summary.categoryCount} categories, ${summary.slaConfigurationCount} SLA rows, ${summary.userCount} users, ${summary.externalIdentityCount} external identities, ${summary.commentCount} comments.`,
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
