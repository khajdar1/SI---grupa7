import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import type { Company } from '@/models/Company';

import { ServiceError, getErrorMessage } from './errors';

export async function getCompanies(): Promise<Company[]> {
  try {
    const response = await api.get<Company[]>(API_ENDPOINTS.COMPANIES.BASE);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to load companies.'), error);
  }
}
