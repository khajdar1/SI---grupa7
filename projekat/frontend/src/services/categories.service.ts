import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import type { Category, CreateCategoryDTO, UpdateCategoryDTO } from '@/models/Category';

import { getResponseData } from './errors';

export async function getCategories(): Promise<Category[]> {
  return getResponseData(
    () => api.get<Category[]>(API_ENDPOINTS.CATEGORIES.BASE),
    'Failed to load categories.',
  );
}

export async function createCategory(payload: CreateCategoryDTO): Promise<Category> {
  return getResponseData(
    () => api.post<Category>(API_ENDPOINTS.CATEGORIES.BASE, payload),
    'Failed to create category.',
  );
}

export async function updateCategory(id: number, payload: UpdateCategoryDTO): Promise<Category> {
  return getResponseData(
    () => api.patch<Category>(API_ENDPOINTS.CATEGORIES.BY_ID(id), payload),
    'Failed to update category.',
  );
}

export async function updateCategoryStatus(id: number, active: boolean): Promise<Category> {
  return getResponseData(
    () => api.patch<Category>(API_ENDPOINTS.CATEGORIES.STATUS(id), { active }),
    'Failed to update category status.',
  );
}
