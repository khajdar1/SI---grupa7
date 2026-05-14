import type { Request } from 'express';
import { Router } from 'express';

import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';
import { authenticate, authorizeRoles } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { AuditService } from '../../shared/audit.service';
import {
  createCategorySchema,
  updateCategorySchema,
  updateCategoryStatusSchema,
} from './categories.schema';
import {
  CategoryService,
  type CategoryRecord,
  type ICategoryRepository,
  ValidationError,
} from './categories.service';

const categoriesRouter = Router();
const ADMIN_ROLES = ['admin', 'administrator'];

const prismaCategoryRepository: ICategoryRepository = {
  findMany: async () => (await prisma.category.findMany({ orderBy: { createdAt: 'desc' } })) as unknown as CategoryRecord[],
  findById: async (id: number) =>
    (await prisma.category.findUnique({ where: { id } })) as unknown as CategoryRecord | null,
  findByName: async (name: string) =>
    (await prisma.category.findUnique({ where: { name } })) as unknown as CategoryRecord | null,
  create: async (data) => (await prisma.category.create({ data })) as unknown as CategoryRecord,
  update: async (id: number, data) =>
    (await prisma.category.update({ where: { id }, data })) as unknown as CategoryRecord,
};

const categoryService = new CategoryService(prismaCategoryRepository);

function parseCategoryId(rawId: string | string[] | undefined): number | null {
  if (typeof rawId !== 'string') {
    return null;
  }

  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function getActorName(req: Request): string | null {
  const fromAuthContext = req.user?.username?.trim();
  if (fromAuthContext) {
    return fromAuthContext;
  }

  const fromHeader = req.header('x-admin-name')?.trim();
  if (fromHeader) {
    return fromHeader;
  }

  return null;
}

function logCategoryChange(action: string, category: { id: number; name: string }, actorName: string): void {
  AuditService.log({
    action,
    entity: 'Category',
    entityId: category.id,
    details: `${action} for category '${category.name}' by ${actorName}`,
  });
}

categoriesRouter.get('/', async (_req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json(categories);
  } catch {
    res.status(HTTP_STATUS.INTERNAL).json({ message: 'Failed to fetch categories' });
  }
});

categoriesRouter.post(
  '/',
  authenticate,
  authorizeRoles(ADMIN_ROLES),
  validate(createCategorySchema),
  async (req, res) => {
  try {
    const actorName = getActorName(req);
    if (!actorName) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authenticated user context is missing.' });
      return;
    }

    const category = await categoryService.createCategory(req.body, actorName);
    logCategoryChange('CATEGORY_CREATED', category, actorName);
    res.status(HTTP_STATUS.CREATED).json(category);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message });
      return;
    }

    res.status(HTTP_STATUS.INTERNAL).json({ message: 'Failed to create category' });
  }
  },
);

categoriesRouter.patch(
  '/:id',
  authenticate,
  authorizeRoles(ADMIN_ROLES),
  validate(updateCategorySchema),
  async (req, res) => {
  try {
    const id = parseCategoryId(req.params.id);
    if (!id) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Validation failed',
        errors: { id: 'Category id must be a positive integer.' },
      });
      return;
    }

    const actorName = getActorName(req);
    if (!actorName) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authenticated user context is missing.' });
      return;
    }

    const category = await categoryService.updateCategory(id, req.body, actorName);
    logCategoryChange('CATEGORY_UPDATED', category, actorName);
    res.json(category);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message });
      return;
    }

    res.status(HTTP_STATUS.INTERNAL).json({ message: 'Failed to update category' });
  }
  },
);

categoriesRouter.patch(
  '/:id/status',
  authenticate,
  authorizeRoles(ADMIN_ROLES),
  validate(updateCategoryStatusSchema),
  async (req, res) => {
    try {
      const id = parseCategoryId(req.params.id);
      if (!id) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Validation failed',
          errors: { id: 'Category id must be a positive integer.' },
        });
        return;
      }

      const actorName = getActorName(req);
      if (!actorName) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authenticated user context is missing.' });
        return;
      }

      const category = await categoryService.updateStatus(id, req.body.active, actorName);
      logCategoryChange(
        req.body.active ? 'CATEGORY_REACTIVATED' : 'CATEGORY_DEACTIVATED',
        category,
        actorName,
      );
      res.json(category);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message });
        return;
      }

      res.status(HTTP_STATUS.INTERNAL).json({ message: 'Failed to update category status' });
    }
  },
);

export default categoriesRouter;
