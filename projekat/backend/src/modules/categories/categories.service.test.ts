import test from 'node:test';
import assert from 'node:assert/strict';
import { CategoryService, ICategoryRepository, ValidationError, CategoryData } from './categories.service';

class MockCategoryRepository implements ICategoryRepository {
  private categories: any[] = [];
  private nextId = 1;

  async findMany() {
    return [...this.categories].sort((a, b) => b.id - a.id);
  }

  async findByName(name: string) {
    return this.categories.find(c => c.name === name) || null;
  }

  async create(data: CategoryData) {
    const category = { id: this.nextId++, ...data, active: true };
    this.categories.push(category);
    return category;
  }

  async update(id: number, data: Partial<CategoryData>) {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Not found');
    this.categories[index] = { ...this.categories[index], ...data };
    return this.categories[index];
  }

  // Test helper
  seed(data: any) {
    this.categories.push({ id: this.nextId++, ...data });
  }
}

test('CategoryService - createCategory (Happy Path)', async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);

  const result = await service.createCategory({ name: 'Plumbing', description: 'Water pipes' });
  
  assert.equal(result.name, 'Plumbing');
  assert.equal(result.description, 'Water pipes');
  assert.equal(result.active, true);
});

test('CategoryService - createCategory (Validation Error: missing name)', async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);

  await assert.rejects(
    async () => service.createCategory({ name: '   ', description: 'Empty name' }),
    (err: any) => err instanceof ValidationError && err.message === 'Name is required'
  );
});

test('CategoryService - createCategory (Business Rule: unique name)', async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);
  repo.seed({ name: 'Electrical', active: true });

  await assert.rejects(
    async () => service.createCategory({ name: 'Electrical' }),
    (err: any) => err instanceof ValidationError && err.message === 'Category with this name already exists'
  );
});

test('CategoryService - updateCategory (Happy Path)', async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);
  repo.seed({ name: 'HVAC', description: 'Heating', active: true });

  const result = await service.updateCategory(1, { name: 'HVAC Updated' });
  
  assert.equal(result.name, 'HVAC Updated');
});

test('CategoryService - updateCategory (Business Rule: unique name check ignores self)', async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);
  repo.seed({ name: 'HVAC', description: 'Heating', active: true });

  // Updating other fields should not trip the unique name validation
  const result = await service.updateCategory(1, { name: 'HVAC', description: 'Cooling' });
  
  assert.equal(result.description, 'Cooling');
});

test('CategoryService - updateCategory (Business Rule: unique name conflicts with other)', async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);
  repo.seed({ name: 'HVAC', active: true });
  repo.seed({ name: 'Plumbing', active: true });

  await assert.rejects(
    async () => service.updateCategory(2, { name: 'HVAC' }),
    (err: any) => err instanceof ValidationError && err.message === 'Another category with this name already exists'
  );
});

test('CategoryService - updateStatus', async () => {
  const repo = new MockCategoryRepository();
  const service = new CategoryService(repo);
  repo.seed({ name: 'HVAC', active: true });

  const result = await service.updateStatus(1, false);
  
  assert.equal(result.active, false);
});
