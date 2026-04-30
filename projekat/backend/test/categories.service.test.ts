import { expect, test } from "vitest";

import {
  CategoryService,
  type CategoryRecord,
  type ICategoryRepository,
  ValidationError,
} from "../src/modules/categories/categories.service";

class MockCategoryRepository implements ICategoryRepository {
  private categories: CategoryRecord[] = [];
  private nextId = 1;

  async findMany(): Promise<CategoryRecord[]> {
    return [...this.categories].sort((a, b) => b.id - a.id);
  }

  async findById(id: number): Promise<CategoryRecord | null> {
    return this.categories.find((category) => category.id === id) ?? null;
  }

  async findByName(name: string): Promise<CategoryRecord | null> {
    return this.categories.find((category) => category.name === name) ?? null;
  }

  async create(data: {
    name: string;
    description?: string;
    createdByName: string;
    updatedByName: string;
  }): Promise<CategoryRecord> {
    const now = new Date("2026-04-29T10:00:00.000Z");
    const category: CategoryRecord = {
      id: this.nextId++,
      name: data.name,
      description: data.description ?? null,
      active: true,
      createdByName: data.createdByName,
      updatedByName: data.updatedByName,
      createdAt: now,
      updatedAt: now,
    };

    this.categories.push(category);
    return category;
  }

  async update(
    id: number,
    data: Partial<{
      name: string;
      description?: string;
      active: boolean;
      updatedByName: string;
    }>,
  ): Promise<CategoryRecord> {
    const index = this.categories.findIndex((category) => category.id === id);

    if (index === -1) {
      throw new Error("Not found");
    }

    this.categories[index] = {
      ...this.categories[index],
      ...data,
      updatedAt: new Date("2026-04-29T11:00:00.000Z"),
    };

    return this.categories[index];
  }

  seed(data: Partial<CategoryRecord> & { name: string }): void {
    const now = new Date("2026-04-29T09:00:00.000Z");
    this.categories.push({
      id: this.nextId++,
      name: data.name,
      description: data.description ?? null,
      active: data.active ?? true,
      createdByName: data.createdByName ?? null,
      updatedByName: data.updatedByName ?? null,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    });
  }
}

test("CategoryService - createCategory (happy path)", async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);

  const result = await service.createCategory(
    {
      name: "Plumbing",
      description: "Water pipes",
    },
    "Ana Admin",
  );

  expect(result.name).toBe("Plumbing");
  expect(result.description).toBe("Water pipes");
  expect(result.active).toBe(true);
  expect(result.createdByName).toBe("Ana Admin");
  expect(result.updatedByName).toBe("Ana Admin");
});

test("CategoryService - createCategory (Validation Error: missing name)", async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);

  await expect(
    service.createCategory({ name: "   ", description: "Empty name" }, "Ana Admin"),
  ).rejects.toThrow("Name is required");
});

test("CategoryService - createCategory (Business Rule: unique name)", async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);
  repo.seed({ name: "Electrical", active: true });

  await expect(service.createCategory({ name: "Electrical" }, "Ana Admin")).rejects.toThrow(
    "Category with this name already exists",
  );
});

test("CategoryService - updateCategory (Happy Path)", async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);
  repo.seed({ name: "HVAC", description: "Heating", active: true });

  const result = await service.updateCategory(
    1,
    { name: "HVAC Updated" },
    "Lejla Manager",
  );

  expect(result.name).toBe("HVAC Updated");
  expect(result.updatedByName).toBe("Lejla Manager");
});

test("CategoryService - updateCategory (Business Rule: unique name check ignores self)", async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);
  repo.seed({ name: "HVAC", description: "Heating", active: true });

  const result = await service.updateCategory(
    1,
    {
      name: "HVAC",
      description: "Cooling",
    },
    "Lejla Manager",
  );

  expect(result.description).toBe("Cooling");
});

test("CategoryService - updateCategory (Business Rule: reject name collision)", async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);
  repo.seed({ name: "HVAC", active: true });
  repo.seed({ name: "Plumbing", active: true });

  await expect(service.updateCategory(2, { name: "HVAC" }, "Lejla Manager")).rejects.toThrow(
    "Another category with this name already exists",
  );
});

test("CategoryService - updateCategory (Business Rule: reject inactive categories)", async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);
  repo.seed({ name: "HVAC", active: false });

  await expect(
    service.updateCategory(1, { name: "HVAC Updated" }, "Lejla Manager"),
  ).rejects.toThrow("Inactive categories cannot be edited");
});

test("CategoryService - updateStatus (deactivate category)", async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);
  repo.seed({ name: "HVAC", active: true });

  const result = await service.updateStatus(1, false, "Lejla Manager");

  expect(result.active).toBe(false);
  expect(result.updatedByName).toBe("Lejla Manager");
});

test("CategoryService - updateStatus (reactivate category)", async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);
  repo.seed({ name: "HVAC", active: false });

  const result = await service.updateStatus(1, true, "Lejla Manager");

  expect(result.active).toBe(true);
  expect(result.updatedByName).toBe("Lejla Manager");
});

test("CategoryService - errors are ValidationError instances", async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);

  await expect(service.createCategory({ name: "" }, "Admin")).rejects.toBeInstanceOf(
    ValidationError,
  );
});
