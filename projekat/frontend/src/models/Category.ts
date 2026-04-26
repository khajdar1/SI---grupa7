export interface Category {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  updatedById: number | null;
  updatedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
  } | null;
}

export interface CreateCategoryDTO {
  name: string;
  description?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
}
