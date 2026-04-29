import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import type { Category, CreateCategoryDTO, UpdateCategoryDTO } from '@/models/Category';

import { ServiceError, getErrorMessage } from './errors';

export async function getCategories(): Promise<Category[]> {
  try {
    const response = await api.get<Category[]>(API_ENDPOINTS.CATEGORIES.BASE);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to load categories.'), error);
  }
}

export async function createCategory(payload: CreateCategoryDTO): Promise<Category> {
  try {
    const response = await api.post<Category>(API_ENDPOINTS.CATEGORIES.BASE, payload);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to create category.'), error);
  }
}

export async function updateCategory(id: number, payload: UpdateCategoryDTO): Promise<Category> {
  try {
    const response = await api.patch<Category>(API_ENDPOINTS.CATEGORIES.BY_ID(id), payload);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to update category.'), error);
  }
}

export async function updateCategoryStatus(id: number, active: boolean): Promise<Category> {
  try {
    const response = await api.patch<Category>(API_ENDPOINTS.CATEGORIES.STATUS(id), { active });
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to update category status.'), error);
  }
}
