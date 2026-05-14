import { Router } from 'express';

import { HTTP_STATUS } from '../../constants';
import { authorizeRoles } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../shared/async-handler';
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../../shared/errors';
import {
  assignCompanyAdminSchema,
  createCompanySchema,
  selfRegisterCompanySchema,
  updateCompanySchema,
  updateCompanyStatusSchema,
} from './companies.schema';
import { CompanyManagementService, type CompanyAuditActor } from './companies.service';

const companiesRouter = Router();
const companyService = new CompanyManagementService();

const ADMIN_ROLES = ['admin', 'administrator'];
const COMPANY_ADMIN_ROLES = ['kompanijaadmin', 'companyadmin'];
const COMPANY_MANAGEMENT_ROLES = [...ADMIN_ROLES, ...COMPANY_ADMIN_ROLES];

function parseCompanyId(rawId: string | string[] | undefined): number {
  if (typeof rawId !== 'string') {
    throw new BadRequestError('Company id must be a positive integer.');
  }

  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError('Company id must be a positive integer.');
  }

  return id;
}

function hasAnyRole(reqUser: Express.Request['user'], allowedRoles: readonly string[]): boolean {
  const normalizedAllowed = new Set(allowedRoles.map((role) => role.toLowerCase()));
  return (reqUser?.roles ?? []).some((role) => normalizedAllowed.has(role.toLowerCase()));
}

function getActor(reqUser: Express.Request['user']): CompanyAuditActor {
  if (!reqUser?.localUserId || !reqUser.username) {
    throw new UnauthorizedError('Authenticated user context is missing.');
  }

  return {
    id: reqUser.localUserId,
    username: reqUser.username,
  };
}

function requireLocalUserId(reqUser: Express.Request['user']): number {
  if (!reqUser?.localUserId) {
    throw new UnauthorizedError('Authenticated user context is missing.');
  }

  return reqUser.localUserId;
}

companiesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (hasAnyRole(req.user, ADMIN_ROLES)) {
      res.json(await companyService.listCompanies());
      return;
    }

    res.json(await companyService.listCompanyOptions());
  }),
);

companiesRouter.post(
  '/self-register',
  validate(selfRegisterCompanySchema),
  asyncHandler(async (req, res) => {
    const company = await companyService.selfRegister(req.body);
    res.status(HTTP_STATUS.CREATED).json(company);
  }),
);

companiesRouter.get(
  '/me',
  authorizeRoles(COMPANY_ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const company = await companyService.getOwnCompany(requireLocalUserId(req.user));
    res.json(company);
  }),
);

companiesRouter.post(
  '/',
  authorizeRoles(ADMIN_ROLES),
  validate(createCompanySchema),
  asyncHandler(async (req, res) => {
    const company = await companyService.createCompany(req.body, getActor(req.user));
    res.status(HTTP_STATUS.CREATED).json(company);
  }),
);

companiesRouter.get(
  '/:id',
  authorizeRoles(COMPANY_MANAGEMENT_ROLES),
  asyncHandler(async (req, res) => {
    const id = parseCompanyId(req.params.id);

    if (hasAnyRole(req.user, ADMIN_ROLES)) {
      res.json(await companyService.getCompanyForAdmin(id));
      return;
    }

    if (!hasAnyRole(req.user, COMPANY_ADMIN_ROLES)) {
      throw new ForbiddenError();
    }

    res.json(await companyService.getCompanyForCompanyAdmin(id, requireLocalUserId(req.user)));
  }),
);

companiesRouter.patch(
  '/:id',
  authorizeRoles(COMPANY_MANAGEMENT_ROLES),
  validate(updateCompanySchema),
  asyncHandler(async (req, res) => {
    const id = parseCompanyId(req.params.id);
    const actor = getActor(req.user);

    if (hasAnyRole(req.user, ADMIN_ROLES)) {
      res.json(await companyService.updateCompany(id, req.body, actor));
      return;
    }

    if (!hasAnyRole(req.user, COMPANY_ADMIN_ROLES)) {
      throw new ForbiddenError();
    }

    res.json(await companyService.updateOwnCompany(id, actor.id, req.body, actor));
  }),
);

companiesRouter.patch(
  '/:id/status',
  authorizeRoles(ADMIN_ROLES),
  validate(updateCompanyStatusSchema),
  asyncHandler(async (req, res) => {
    const id = parseCompanyId(req.params.id);
    const company = await companyService.updateCompanyStatus(id, req.body.status, getActor(req.user));
    res.json(company);
  }),
);

companiesRouter.patch(
  '/:id/admin',
  authorizeRoles(ADMIN_ROLES),
  validate(assignCompanyAdminSchema),
  asyncHandler(async (req, res) => {
    const id = parseCompanyId(req.params.id);
    const company = await companyService.assignCompanyAdmin(id, req.body.userId, getActor(req.user));
    res.json(company);
  }),
);

export default companiesRouter;
