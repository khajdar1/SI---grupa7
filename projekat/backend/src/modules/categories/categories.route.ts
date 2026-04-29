import { Request, Router } from 'express';

import { prisma } from '../../config/database';
import { AuditService } from '../../shared/audit.service';
import { CategoryService, ICategoryRepository, ValidationError } from './categories.service';

const categoriesRouter = Router();

const prismaCategoryRepository: ICategoryRepository = {
  findMany: () => prisma.category.findMany({ orderBy: { createdAt: 'desc' } }),
  findById: (id: number) => prisma.category.findUnique({ where: { id } }),
  findByName: (name: string) => prisma.category.findUnique({ where: { name } }),
  create: (data) => prisma.category.create({ data }),
  update: (id: number, data) => prisma.category.update({ where: { id }, data }),
};

const categoryService = new CategoryService(prismaCategoryRepository);

function getAdminName(req: Request): string | null {
  const adminName = req.header('x-admin-name')?.trim();

  if (!adminName) {
    return null;
  }

  return adminName;
}

function logCategoryChange(action: string, category: { id: number; name: string }, adminName: string): void {
  AuditService.log({
    action,
    entity: 'Category',
    entityId: category.id,
    details: `${action} for category '${category.name}' by ${adminName}`,
  });
}

categoriesRouter.get('/', async (_req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

categoriesRouter.post('/', async (req, res) => {
  try {
    const adminName = getAdminName(req);

    if (!adminName) {
      res.status(400).json({ message: 'Admin name is required to create a category.' });
      return;
    }

    const category = await categoryService.createCategory(req.body, adminName);
    logCategoryChange('CATEGORY_CREATED', category, adminName);
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to create category' });
  }
});

categoriesRouter.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const adminName = getAdminName(req);

    if (!adminName) {
      res.status(400).json({ message: 'Admin name is required to edit a category.' });
      return;
    }

    const category = await categoryService.updateCategory(id, req.body, adminName);
    logCategoryChange('CATEGORY_UPDATED', category, adminName);
    res.json(category);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to update category' });
  }
});

categoriesRouter.patch('/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { active } = req.body;
    const adminName = getAdminName(req);

    if (!adminName) {
      res.status(400).json({ message: 'Admin name is required to change category status.' });
      return;
    }

    const category = await categoryService.updateStatus(id, active, adminName);
    logCategoryChange(active ? 'CATEGORY_REACTIVATED' : 'CATEGORY_DEACTIVATED', category, adminName);
    res.json(category);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to update category status' });
  }
});

export default categoriesRouter;
