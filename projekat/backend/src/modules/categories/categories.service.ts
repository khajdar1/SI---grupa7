export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface CategoryData {
  name: string;
  description?: string;
  active?: boolean;
}

export interface ICategoryRepository {
  findMany(): Promise<any[]>;
  findByName(name: string): Promise<any | null>;
  create(data: CategoryData): Promise<any>;
  update(id: number, data: Partial<CategoryData>): Promise<any>;
}

export class CategoryService {
  constructor(private readonly repository: ICategoryRepository) {}

  async getAllCategories() {
    return this.repository.findMany();
  }

  async createCategory(data: CategoryData) {
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('Name is required');
    }

    const name = data.name.trim();

    const existing = await this.repository.findByName(name);
    if (existing) {
      throw new ValidationError('Category with this name already exists');
    }

    return this.repository.create({
      name,
      description: data.description?.trim(),
    });
  }

  async updateCategory(id: number, data: Partial<CategoryData>) {
    const updateData: Partial<CategoryData> = { ...data };

    if (data.name !== undefined) {
      if (data.name.trim() === '') {
        throw new ValidationError('Name cannot be empty');
      }
      updateData.name = data.name.trim();

      const existing = await this.repository.findByName(updateData.name);
      if (existing && existing.id !== id) {
        throw new ValidationError('Another category with this name already exists');
      }
    }

    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }

    return this.repository.update(id, updateData);
  }

  async updateStatus(id: number, active: boolean) {
    return this.repository.update(id, { active });
  }
}
