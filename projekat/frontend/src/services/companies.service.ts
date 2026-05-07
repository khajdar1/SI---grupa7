import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import type { Company } from '@/models/Company';

import { getResponseData } from './errors';

export async function getCompanies(): Promise<Company[]> {
  return getResponseData(
    () => api.get<Company[]>(API_ENDPOINTS.COMPANIES.BASE),
    'Failed to load companies.',
  );
}
