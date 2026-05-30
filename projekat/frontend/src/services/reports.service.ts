import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
export interface MaterialItem {
  name: string;
  quantity: number;
  note: string | null;
}

export interface ReportAuthor {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
}

export interface InterventionReport {
  id: number;
  interventionId: number;
  description: string;
  materialItems: MaterialItem[];
  notes: string | null;
  status: 'DRAFT' | 'FINALIZED';
  author: ReportAuthor;
  reportDate: string;
}
export interface CreateReportPayload {
  description: string;
  materialItems?: MaterialItem[];
  notes?: string | null;
}

export interface UpdateReportPayload {
  description?: string;
  materialItems?: MaterialItem[];
  notes?: string | null;
}

interface ReportApiResponse {
  message: string;
  data: InterventionReport;
}

function toServiceError(error: unknown, fallback: string): Error {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message;
    if (typeof message === 'string' && message.length > 0) {
      return new Error(message);
    }
  }
  if (error instanceof Error && error.message.length > 0) {
    return new Error(error.message);
  }
  return new Error(fallback);
}

export async function getInterventionReport(
  interventionId: number,
): Promise<InterventionReport | null> {
  try {
    const response = await api.get<InterventionReport | { data: null }>(
      API_ENDPOINTS.INTERVENTIONS.REPORT(interventionId),
    );
    const body = response.data;
    if (
      body !== null &&
      typeof body === 'object' &&
      'data' in body &&
      (body as { data: unknown }).data === null
    ) {
      return null;
    }
    return body as InterventionReport;
  } catch (error: unknown) {
    throw toServiceError(error, 'Failed to load the intervention report.');
  }
}

export async function createInterventionReport(
  interventionId: number,
  payload: CreateReportPayload,
): Promise<InterventionReport> {
  try {
    const response = await api.post<ReportApiResponse>(
      API_ENDPOINTS.INTERVENTIONS.REPORT(interventionId),
      payload,
    );
    return response.data.data;
  } catch (error: unknown) {
    throw toServiceError(error, 'Failed to submit the report.');
  }
}

export async function updateInterventionReport(
  interventionId: number,
  payload: UpdateReportPayload,
): Promise<InterventionReport> {
  try {
    const response = await api.patch<ReportApiResponse>(
      API_ENDPOINTS.INTERVENTIONS.REPORT(interventionId),
      payload,
    );
    return response.data.data;
  } catch (error: unknown) {
    throw toServiceError(error, 'Failed to update the report.');
  }
}

export async function getMaterialSuggestions(interventionId: number): Promise<string[]> {
  try {
    const response = await api.get<{ data: string[] }>(
      API_ENDPOINTS.INTERVENTIONS.MATERIAL_SUGGESTIONS(interventionId),
    );
    return response.data.data ?? [];
  } catch {
    return [];
  }
}