export type Company = {
  id: number;
  name: string;
  contact?: string | null;
  type?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  identificationNumber?: string | null;
  status?: CompanyStatus;
  adminUserId?: number | null;
  adminUser?: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    active: boolean;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'INACTIVE';
