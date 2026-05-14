export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface CategoryData {
  name: string;
  description?: string;
}

export interface CategoryRecord {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryCreateData {
  name: string;
  description?: string;
  createdByName: string;
  updatedByName: string;
}

export interface CategoryUpdateData {
  name?: string;
  description?: string;
  active?: boolean;
  updatedByName: string;
}

export interface ICategoryRepository {
  findMany(): Promise<CategoryRecord[]>;
  findById(id: number): Promise<CategoryRecord | null>;
  findByName(name: string): Promise<CategoryRecord | null>;
  create(data: CategoryCreateData): Promise<CategoryRecord>;
  update(id: number, data: Partial<CategoryUpdateData>): Promise<CategoryRecord>;
}

export class CategoryService {
  constructor(private readonly repository: ICategoryRepository) {}

  async getAllCategories(): Promise<CategoryRecord[]> {
    return this.repository.findMany();
  }

  async createCategory(data: CategoryData, adminName: string): Promise<CategoryRecord> {
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
      createdByName: adminName,
      updatedByName: adminName,
    });
  }

  async updateCategory(id: number, data: Partial<CategoryData>, adminName: string): Promise<CategoryRecord> {
    const currentCategory = await this.repository.findById(id);

    if (!currentCategory) {
      throw new ValidationError('Category not found');
    }

    if (!currentCategory.active) {
      throw new ValidationError('Inactive categories cannot be edited');
    }

    const updateData: Partial<CategoryUpdateData> = {
      updatedByName: adminName,
    };

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

  async updateStatus(id: number, active: boolean, adminName: string): Promise<CategoryRecord> {
    const category = await this.repository.findById(id);

    if (!category) {
      throw new ValidationError('Category not found');
    }

    return this.repository.update(id, {
      active,
      updatedByName: adminName,
    });
  }
}
