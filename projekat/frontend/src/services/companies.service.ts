import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import type { Company, CompanyStatus } from '@/models/Company';

import { getResponseData, withServiceError } from './errors';

export interface CompanyFormInput {
  name: string;
  contact?: string | null;
  type?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  identificationNumber?: string | null;
}

export interface CreateCompanyInput extends CompanyFormInput {
  status?: CompanyStatus;
  adminUserId?: number | null;
}

export async function getCompanies(): Promise<Company[]> {
  return getResponseData(
    () => api.get<Company[]>(API_ENDPOINTS.COMPANIES.BASE),
    'Failed to load companies.',
  );
}

export async function selfRegisterCompany(input: CompanyFormInput): Promise<Company> {
  return getResponseData(
    () => api.post<Company>(API_ENDPOINTS.COMPANIES.SELF_REGISTER, input),
    'Failed to register company.',
  );
}

export async function getMyCompany(): Promise<Company> {
  return getResponseData(
    () => api.get<Company>(API_ENDPOINTS.COMPANIES.ME),
    'Failed to load company profile.',
  );
}

export async function getCompany(id: number): Promise<Company> {
  return getResponseData(
    () => api.get<Company>(API_ENDPOINTS.COMPANIES.BY_ID(id)),
    'Failed to load company.',
  );
}

export async function createCompany(input: CreateCompanyInput): Promise<Company> {
  return getResponseData(
    () => api.post<Company>(API_ENDPOINTS.COMPANIES.BASE, input),
    'Failed to create company.',
  );
}

export async function updateCompany(id: number, input: Partial<CompanyFormInput>): Promise<Company> {
  return getResponseData(
    () => api.patch<Company>(API_ENDPOINTS.COMPANIES.BY_ID(id), input),
    'Failed to update company.',
  );
}

export async function updateCompanyStatus(id: number, status: CompanyStatus): Promise<Company> {
  return getResponseData(
    () => api.patch<Company>(API_ENDPOINTS.COMPANIES.STATUS(id), { status }),
    'Failed to update company status.',
  );
}

export async function assignCompanyAdmin(id: number, userId: number | null): Promise<Company> {
  return getResponseData(
    () => api.patch<Company>(API_ENDPOINTS.COMPANIES.ADMIN(id), { userId }),
    'Failed to assign company admin.',
  );
}

export async function clearCompanyAdmin(id: number): Promise<void> {
  return withServiceError(async () => {
    await assignCompanyAdmin(id, null);
  }, 'Failed to remove company admin.');
}
