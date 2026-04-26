import { Router } from 'express';
import { prisma } from '../../config/database';
import { CategoryService, ICategoryRepository, ValidationError } from './categories.service';

const categoriesRouter = Router();

const prismaCategoryRepository: ICategoryRepository = {
  findMany: () => prisma.category.findMany({ 
    orderBy: { createdAt: 'desc' },
    include: {
      updatedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true
        }
      }
    }
  }),
  findByName: (name: string) => prisma.category.findUnique({ where: { name } }),
  create: (data) => prisma.category.create({ 
    data,
    include: {
      updatedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true
        }
      }
    }
  }),
  update: (id: number, data) => prisma.category.update({ 
    where: { id }, 
    data,
    include: {
      updatedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true
        }
      }
    }
  }),
};

const categoryService = new CategoryService(prismaCategoryRepository);

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
    const category = await categoryService.createCategory(req.body);
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
    const category = await categoryService.updateCategory(id, req.body);
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
    const { active, adminId } = req.body;
    const category = await categoryService.updateStatus(id, active, adminId);
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category status' });
  }
});

export default categoriesRouter;