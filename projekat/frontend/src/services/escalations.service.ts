import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import { getResponseData } from './errors';

export interface EscalationUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
}

export interface EscalationIntervention {
  id: number;
  name: string;
  status: string;
  priority: string;
  companyId: number;
  company: { name: string };
}

export interface Escalation {
  id: number;
  interventionId: number;
  escalatedById: number;
  reason: string;
  comment: string;
  reviewedAt: string | null;
  reviewedById: number | null;
  createdAt: string;
  escalatedBy: EscalationUser;
  reviewedBy: EscalationUser | null;
  intervention?: EscalationIntervention;
}

export interface CreateEscalationPayload {
  reason: string;
  comment: string;
}

export async function createEscalation(
  interventionId: number,
  payload: CreateEscalationPayload,
): Promise<Escalation> {
  return getResponseData(
    () => api.post<Escalation>(API_ENDPOINTS.ESCALATIONS.BY_INTERVENTION(interventionId), payload),
    'Failed to create escalation.',
  );
}

export async function getEscalationsByIntervention(interventionId: number): Promise<Escalation[]> {
  return getResponseData(
    () => api.get<Escalation[]>(API_ENDPOINTS.ESCALATIONS.BY_INTERVENTION(interventionId)),
    'Failed to load escalations.',
  );
}

export async function getAllEscalations(includeReviewed = false): Promise<Escalation[]> {
  const url = includeReviewed
    ? `${API_ENDPOINTS.ESCALATIONS.LIST}?includeReviewed=true`
    : API_ENDPOINTS.ESCALATIONS.LIST;
  return getResponseData(
    () => api.get<Escalation[]>(url),
    'Failed to load escalations.',
  );
}

export async function reviewEscalation(escalationId: number): Promise<Escalation> {
  return getResponseData(
    () => api.patch<Escalation>(API_ENDPOINTS.ESCALATIONS.REVIEW(escalationId), {}),
    'Failed to mark escalation as reviewed.',
  );
}
