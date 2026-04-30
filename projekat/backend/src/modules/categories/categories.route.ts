import { Router } from "express";

import { prisma } from "../../config/database";
import { HTTP_STATUS } from "../../constants";
import { validate } from "../../middleware/validate.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
  updateCategoryStatusSchema,
} from "./categories.schema";
import { CategoryService, ICategoryRepository, ValidationError } from "./categories.service";

const categoriesRouter = Router();

const prismaCategoryRepository: ICategoryRepository = {
  findMany: () => prisma.category.findMany({ orderBy: { createdAt: "desc" } }),
  findByName: (name: string) => prisma.category.findUnique({ where: { name } }),
  create: (data) => prisma.category.create({ data }),
  update: (id: number, data) => prisma.category.update({ where: { id }, data }),
};

const categoryService = new CategoryService(prismaCategoryRepository);

function parseCategoryId(rawId: string | string[] | undefined) {
  if (typeof rawId !== "string") {
    return null;
  }

  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

categoriesRouter.get("/", async (_req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json(categories);
  } catch {
    res.status(HTTP_STATUS.INTERNAL).json({ message: "Failed to fetch categories" });
  }
});

categoriesRouter.post("/", validate(createCategorySchema), async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(HTTP_STATUS.CREATED).json(category);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message });
      return;
    }

    res.status(HTTP_STATUS.INTERNAL).json({ message: "Failed to create category" });
  }
});

categoriesRouter.patch("/:id", validate(updateCategorySchema), async (req, res) => {
  try {
    const id = parseCategoryId(req.params.id);
    if (!id) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Validation failed",
        errors: { id: "Category id must be a positive integer." },
      });
      return;
    }

    const category = await categoryService.updateCategory(id, req.body);
    res.json(category);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message });
      return;
    }

    res.status(HTTP_STATUS.INTERNAL).json({ message: "Failed to update category" });
  }
});

categoriesRouter.patch(
  "/:id/status",
  validate(updateCategoryStatusSchema),
  async (req, res) => {
    try {
      const id = parseCategoryId(req.params.id);
      if (!id) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: "Validation failed",
          errors: { id: "Category id must be a positive integer." },
        });
        return;
      }

      const category = await categoryService.updateStatus(id, req.body.active);
      res.json(category);
    } catch {
      res.status(HTTP_STATUS.INTERNAL).json({ message: "Failed to update category status" });
    }
  },
);

export default categoriesRouter;
