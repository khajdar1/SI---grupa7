import assert from "node:assert";
import { describe, it } from "node:test";

import {
  CategoryRecord,
  CategoryService,
  ICategoryRepository,
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

describe("CategoryService", () => {
  it("creates a category with admin audit metadata", async () => {
    const repo = new MockCategoryRepository();
    const service = new CategoryService(repo);

    const result = await service.createCategory(
      {
        name: "Plumbing",
        description: "Water pipes",
      },
      "Ana Admin",
    );

    assert.strictEqual(result.name, "Plumbing");
    assert.strictEqual(result.description, "Water pipes");
    assert.strictEqual(result.active, true);
    assert.strictEqual(result.createdByName, "Ana Admin");
    assert.strictEqual(result.updatedByName, "Ana Admin");
  });

  it("rejects category creation when name is missing", async () => {
    const repo = new MockCategoryRepository();
    const service = new CategoryService(repo);

    await assert.rejects(
      async () => service.createCategory({ name: "   ", description: "Empty name" }, "Ana Admin"),
      (error: unknown) =>
        error instanceof ValidationError && error.message === "Name is required",
    );
  });

  it("rejects category creation when name already exists", async () => {
    const repo = new MockCategoryRepository();
    const service = new CategoryService(repo);
    repo.seed({ name: "Electrical", active: true });

    await assert.rejects(
      async () => service.createCategory({ name: "Electrical" }, "Ana Admin"),
      (error: unknown) =>
        error instanceof ValidationError &&
        error.message === "Category with this name already exists",
    );
  });

  it("updates an active category and records the admin name", async () => {
    const repo = new MockCategoryRepository();
    const service = new CategoryService(repo);
    repo.seed({ name: "HVAC", description: "Heating", active: true });

    const result = await service.updateCategory(1, { name: "HVAC Updated" }, "Lejla Manager");

    assert.strictEqual(result.name, "HVAC Updated");
    assert.strictEqual(result.updatedByName, "Lejla Manager");
  });

  it("keeps the same category name when updating the same record", async () => {
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

    assert.strictEqual(result.description, "Cooling");
  });

  it("rejects name collisions with other categories", async () => {
    const repo = new MockCategoryRepository();
    const service = new CategoryService(repo);
    repo.seed({ name: "HVAC", active: true });
    repo.seed({ name: "Plumbing", active: true });

    await assert.rejects(
      async () => service.updateCategory(2, { name: "HVAC" }, "Lejla Manager"),
      (error: unknown) =>
        error instanceof ValidationError &&
        error.message === "Another category with this name already exists",
    );
  });

  it("rejects editing inactive categories", async () => {
    const repo = new MockCategoryRepository();
    const service = new CategoryService(repo);
    repo.seed({ name: "HVAC", active: false });

    await assert.rejects(
      async () => service.updateCategory(1, { name: "HVAC Updated" }, "Lejla Manager"),
      (error: unknown) =>
        error instanceof ValidationError &&
        error.message === "Inactive categories cannot be edited",
    );
  });

  it("deactivates a category and records the admin name", async () => {
    const repo = new MockCategoryRepository();
    const service = new CategoryService(repo);
    repo.seed({ name: "HVAC", active: true });

    const result = await service.updateStatus(1, false, "Lejla Manager");

    assert.strictEqual(result.active, false);
    assert.strictEqual(result.updatedByName, "Lejla Manager");
  });

  it("reactivates a category and records the admin name", async () => {
    const repo = new MockCategoryRepository();
    const service = new CategoryService(repo);
    repo.seed({ name: "HVAC", active: false });

    const result = await service.updateStatus(1, true, "Lejla Manager");

    assert.strictEqual(result.active, true);
    assert.strictEqual(result.updatedByName, "Lejla Manager");
  });
});
