import type { CompanyStatus, Prisma } from '@prisma/client';

import {
  getKeycloakAdminToken,
  setKeycloakUserManagedRole,
} from '../../clients/keycloak.client';
import { prisma } from '../../config/database';
import { AuditService } from '../../shared/audit.service';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors';
import type {
  CreateCompanyInput,
  SelfRegisterCompanyInput,
  UpdateCompanyInput,
} from './companies.schema';

const companySelect = {
  id: true,
  name: true,
  contact: true,
  type: true,
  email: true,
  phone: true,
  address: true,
  identificationNumber: true,
  status: true,
  adminUserId: true,
  adminUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      active: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.CompanySelect;

const companyOptionSelect = {
  id: true,
  name: true,
} as const satisfies Prisma.CompanySelect;

type CompanyRecord = Prisma.CompanyGetPayload<{ select: typeof companySelect }>;

export type CompanyAuditActor = {
  id: number;
  username: string;
};

function normalizeNullable(value: string | null | undefined): string | null | undefined {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildCompanyData<TInput extends CreateCompanyInput | UpdateCompanyInput | SelfRegisterCompanyInput>(
  input: TInput,
) {
  return {
    ...input,
    contact: normalizeNullable(input.contact),
    type: normalizeNullable(input.type),
    email: normalizeNullable(input.email),
    phone: normalizeNullable(input.phone),
    address: normalizeNullable(input.address),
    identificationNumber: normalizeNullable(input.identificationNumber),
  } as TInput;
}

function getKeycloakSubject(user: {
  externalIdentities: Array<{ provider: string; providerSubject: string }>;
}): string | null {
  return user.externalIdentities.find((identity) => identity.provider === 'keycloak')
    ?.providerSubject ?? null;
}

async function assertUniqueCompanyFields(
  input: {
    name?: string;
    email?: string | null;
    identificationNumber?: string | null;
  },
  excludeCompanyId?: number,
): Promise<void> {
  const checks: Prisma.CompanyWhereInput[] = [];

  if (input.name) {
    checks.push({ name: input.name });
  }
  if (input.email) {
    checks.push({ email: input.email });
  }
  if (input.identificationNumber) {
    checks.push({ identificationNumber: input.identificationNumber });
  }

  if (checks.length === 0) {
    return;
  }

  const existing = await prisma.company.findFirst({
    where: {
      OR: checks,
      ...(excludeCompanyId ? { NOT: { id: excludeCompanyId } } : {}),
    },
    select: {
      name: true,
      email: true,
      identificationNumber: true,
    },
  });

  if (!existing) {
    return;
  }

  if (input.name && existing.name === input.name) {
    throw new ConflictError('Company name is already taken.');
  }
  if (input.email && existing.email === input.email) {
    throw new ConflictError('Company email is already taken.');
  }
  if (
    input.identificationNumber &&
    existing.identificationNumber === input.identificationNumber
  ) {
    throw new ConflictError('Company identification number is already taken.');
  }
}

async function requireCompany(id: number): Promise<CompanyRecord> {
  const company = await prisma.company.findUnique({
    where: { id },
    select: companySelect,
  });

  if (!company) {
    throw new NotFoundError('Company not found.');
  }

  return company;
}

async function requireLocalCompanyAdmin(userId: number): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      companyId: true,
    },
  });

  if (!user?.companyId) {
    throw new ForbiddenError('Company admin is not assigned to a company.');
  }

  return user.companyId;
}

function assertOwnCompany(requestedCompanyId: number, ownCompanyId: number) {
  if (requestedCompanyId !== ownCompanyId) {
    throw new ForbiddenError('Company admin can access only their own company.');
  }
}

function extractCompanyAuditValues(company: CompanyRecord): Prisma.InputJsonObject {
  return {
    id: company.id,
    name: company.name,
    contact: company.contact,
    type: company.type,
    email: company.email,
    phone: company.phone,
    address: company.address,
    identificationNumber: company.identificationNumber,
    status: company.status,
    adminUserId: company.adminUserId,
  };
}

async function auditCompanyChange(entry: {
  action: string;
  entityId: number;
  actor: CompanyAuditActor;
  details: string;
  oldValues?: Prisma.InputJsonValue;
  newValues?: Prisma.InputJsonValue;
}) {
  await AuditService.record({
    action: entry.action,
    entity: 'Company',
    entityId: entry.entityId,
    actorId: entry.actor.id,
    actorUsername: entry.actor.username,
    details: entry.details,
    oldValues: entry.oldValues,
    newValues: entry.newValues,
  });
}

export class CompanyManagementService {
  async listCompanyOptions() {
    return prisma.company.findMany({
      where: { status: 'ACTIVE' },
      select: companyOptionSelect,
      orderBy: { name: 'asc' },
    });
  }

  async listCompanies(): Promise<CompanyRecord[]> {
    return prisma.company.findMany({
      select: companySelect,
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
  }

  async getCompanyForAdmin(id: number): Promise<CompanyRecord> {
    return requireCompany(id);
  }

  async getCompanyForCompanyAdmin(id: number, localUserId: number): Promise<CompanyRecord> {
    const ownCompanyId = await requireLocalCompanyAdmin(localUserId);
    assertOwnCompany(id, ownCompanyId);
    return requireCompany(id);
  }

  async getOwnCompany(localUserId: number): Promise<CompanyRecord> {
    const companyId = await requireLocalCompanyAdmin(localUserId);
    return requireCompany(companyId);
  }

  async selfRegister(input: SelfRegisterCompanyInput): Promise<CompanyRecord> {
    const data = buildCompanyData(input);
    await assertUniqueCompanyFields(data);

    return prisma.company.create({
      data: {
        ...data,
        status: 'PENDING',
      },
      select: companySelect,
    });
  }

  async createCompany(input: CreateCompanyInput, actor: CompanyAuditActor): Promise<CompanyRecord> {
    const { adminUserId, ...companyInput } = input;
    const data = buildCompanyData(companyInput);
    await assertUniqueCompanyFields(data);

    const company = await prisma.company.create({
      data: {
        ...data,
        status: input.status,
      },
      select: companySelect,
    });

    await auditCompanyChange({
      action: 'COMPANY_CREATED',
      entityId: company.id,
      actor,
      details: `Company ${company.name} created by ${actor.username}.`,
      newValues: extractCompanyAuditValues(company),
    });

    if (adminUserId) {
      return this.assignCompanyAdmin(company.id, adminUserId, actor);
    }

    return company;
  }

  async updateCompany(
    id: number,
    input: UpdateCompanyInput,
    actor: CompanyAuditActor,
  ): Promise<CompanyRecord> {
    const existing = await requireCompany(id);
    const data = buildCompanyData(input);
    await assertUniqueCompanyFields(data, id);

    const updated = await prisma.company.update({
      where: { id },
      data,
      select: companySelect,
    });

    await auditCompanyChange({
      action: 'COMPANY_UPDATED',
      entityId: id,
      actor,
      details: `Company ${updated.name} updated by ${actor.username}.`,
      oldValues: extractCompanyAuditValues(existing),
      newValues: extractCompanyAuditValues(updated),
    });

    return updated;
  }

  async updateOwnCompany(
    id: number,
    localUserId: number,
    input: UpdateCompanyInput,
    actor: CompanyAuditActor,
  ): Promise<CompanyRecord> {
    const ownCompanyId = await requireLocalCompanyAdmin(localUserId);
    assertOwnCompany(id, ownCompanyId);
    return this.updateCompany(id, input, actor);
  }

  async updateCompanyStatus(
    id: number,
    status: CompanyStatus,
    actor: CompanyAuditActor,
  ): Promise<CompanyRecord> {
    const existing = await requireCompany(id);

    const updated = await prisma.company.update({
      where: { id },
      data: { status },
      select: companySelect,
    });

    await auditCompanyChange({
      action: 'COMPANY_STATUS_UPDATED',
      entityId: id,
      actor,
      details: `Company ${updated.name} status changed from ${existing.status} to ${status} by ${actor.username}.`,
      oldValues: { status: existing.status },
      newValues: { status },
    });

    return updated;
  }

  async assignCompanyAdmin(
    companyId: number,
    userId: number | null,
    actor: CompanyAuditActor,
  ): Promise<CompanyRecord> {
    const company = await requireCompany(companyId);

    if (userId === null) {
      const updated = await prisma.company.update({
        where: { id: companyId },
        data: { adminUserId: null },
        select: companySelect,
      });

      await auditCompanyChange({
        action: 'COMPANY_ADMIN_REMOVED',
        entityId: companyId,
        actor,
        details: `Company admin removed from ${company.name} by ${actor.username}.`,
        oldValues: { adminUserId: company.adminUserId },
        newValues: { adminUserId: null },
      });

      return updated;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        active: true,
        companyId: true,
        externalIdentities: {
          select: {
            provider: true,
            providerSubject: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Selected company admin user was not found.');
    }

    if (!user.active) {
      throw new ForbiddenError('Deactivated users cannot be assigned as company admins.');
    }

    const keycloakSubject = getKeycloakSubject(user);
    if (!keycloakSubject) {
      throw new ForbiddenError('Selected user is not linked to a Keycloak account.');
    }

    const adminToken = await getKeycloakAdminToken();
    await setKeycloakUserManagedRole(adminToken, keycloakSubject, 'KOMPANIJA_ADMIN');

    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { companyId },
      });

      return tx.company.update({
        where: { id: companyId },
        data: { adminUserId: userId },
        select: companySelect,
      });
    });

    await auditCompanyChange({
      action: 'COMPANY_ADMIN_ASSIGNED',
      entityId: companyId,
      actor,
      details: `User ${userId} assigned as company admin for ${company.name} by ${actor.username}.`,
      oldValues: { adminUserId: company.adminUserId },
      newValues: { adminUserId: userId },
    });

    return updated;
  }
}
