import type { InterventionStatus, Priority } from '@shared/enums';

import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import type { LanguageCode } from '@/lib/i18n';

import { getResponseData, withServiceError } from './errors';

export interface InterventionFaultReportLink {
  id: number;
  description: string;
  reportedAt: string;
}

export interface InterventionListItem {
  id: string;
  title: string;
  name: string;
  description: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  categoryId: number;
  categoryName: string;
  companyId: number;
  companyName: string;
  priority: Priority;
  status: InterventionStatus;
  type: 'ISSUE' | 'PREVENTIVE';
  owner: string;
  createdAt: string;
  startedAt: string | null;
  dueAt: string | null;
  isOverdue?: boolean;
  faultReport: InterventionFaultReportLink | null;
  recurringPeriod?: string | null;
  assignments?: Array<{
    id: number;
    userId: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      username: string;
      email: string;
    };
    assignedAt: string;
  }>;
  pauses?: InterventionPause[];
}

export interface InterventionPause {
  id: number;
  reason: PauseReason;
  otherReason: string | null;
  previousStatus: InterventionStatus;
  pausedAt: string;
  resumedAt: string | null;
  resumeNote: string | null;
  pausedBy: { id: number; firstName: string; lastName: string; username: string };
  responsibleUser: { id: number; firstName: string; lastName: string; username: string } | null;
}

export type PauseReason =
  | 'WAITING_FOR_CUSTOMER'
  | 'WAITING_FOR_MATERIAL'
  | 'WAITING_FOR_EXTERNAL_CONTRACTOR'
  | 'WAITING_FOR_APPROVAL'
  | 'OTHER';

export interface InterventionFormPayload {
  name: string;
  description: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  startedAt?: string;
  dueAt?: string;
  faultReportId?: number | null;
  companyId?: number;
  categoryId?: number;
  priority: Priority;
  recurringPeriod?: string | null;
}

export interface InterventionOption {
  id: number;
  name: string;
}

export interface InterventionFaultReportOption {
  id: number;
  description: string;
  location: string;
  reportedAt: string;
  company: InterventionOption;
  category: InterventionOption;
}

export interface InterventionOptions {
  companies: InterventionOption[];
  categories: InterventionOption[];
  faultReports: InterventionFaultReportOption[];
}

export interface InterventionHistoryItem {
  id: string;
  date: string;
  status: InterventionStatus;
  priority: Priority;
  location: string;
  categoryId: number;
  categoryName: string;
  summary: string;
  servicer: string;
}

export interface InterventionHistoryPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface InterventionHistoryResponse {
  message: string;
  data: InterventionHistoryItem[];
  pagination: InterventionHistoryPagination;
}

export interface InterventionHistoryQuery {
  location?: string;
  category?: string;
  categoryId?: number | string;
  page?: number;
  pageSize?: number;
}

export interface KnowledgeBaseSolution {
  reportId: number;
  title: string;
  problemDescription: string;
  solution: string;
  material: string | null;
  notes: string | null;
  locationHint: string;
  categoryId: number;
  categoryName: string;
  reportDate: string;
  interventionDate: string;
  isRecommended: boolean;
  recommendedAt: string | null;
}

export interface KnowledgeBaseResponse {
  message: string;
  data: KnowledgeBaseSolution[];
}

export interface KnowledgeBaseQuery {
  text?: string;
  location?: string;
  categoryId?: number | string;
}

interface InterventionsResult {
  items: InterventionListItem[];
}

function isInterventionListItem(payload: unknown): payload is InterventionListItem {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const maybe = payload as Record<string, unknown>;
  return (
    typeof maybe.id === 'string' &&
    typeof maybe.title === 'string' &&
    typeof maybe.name === 'string' &&
    typeof maybe.description === 'string' &&
    typeof maybe.location === 'string' &&
    typeof maybe.categoryId === 'number' &&
    typeof maybe.categoryName === 'string' &&
    typeof maybe.companyId === 'number' &&
    typeof maybe.companyName === 'string' &&
    typeof maybe.priority === 'string' &&
    typeof maybe.status === 'string' &&
    typeof maybe.type === 'string' &&
    typeof maybe.owner === 'string' &&
    (maybe.isOverdue === undefined || typeof maybe.isOverdue === 'boolean')
  );
}

export interface InterventionDetail {
  id: string;
  title: string;
  name: string;
  description: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  categoryId: number;
  categoryName: string;
  companyId: number;
  companyName: string;
  priority: Priority;
  status: InterventionStatus;
  type: string;
  owner: string;
  ownerId?: number;
  createdAt: string;
  startedAt: string | null;
  dueAt: string | null;
  faultReport: {
    id: number;
    description?: string;
    reportedAt?: string;
    reporterUser: { id: number; firstName: string; lastName: string; username: string } | null;
  } | null;
  recurringPeriod?: string | null;
  assignments?: Array<{
    id: number;
    userId: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      username: string;
      email: string;
    };
    assignedAt: string;
  }>;
  pauses?: InterventionPause[];
}

export type BulkActionType = 'STATUS_CHANGE' | 'ASSIGN_SERVICER' | 'ARCHIVE' | 'DEARCHIVE';
 
export interface BulkActionItemResult {
  id: number;
  success: boolean;
  reason?: string;
}
 
export interface BulkActionResponse {
  totalRequested: number;
  totalSucceeded: number;
  totalSkipped: number;
  results: BulkActionItemResult[];
}
 
type BulkStatusChangePayload = {
  action: 'STATUS_CHANGE';
  interventionIds: number[];
  payload: { status: InterventionStatus };
};
 
type BulkAssignServicerPayload = {
  action: 'ASSIGN_SERVICER';
  interventionIds: number[];
  payload: { userId: number };
};
 
type BulkArchivePayload = {
  action: 'ARCHIVE';
  interventionIds: number[];
  payload: Record<string, never>;
};

type BulkDearchivePayload = {
  action: 'DEARCHIVE';
  interventionIds: number[];
  payload: Record<string, never>;
};
 
export type BulkActionPayload =
  | BulkStatusChangePayload
  | BulkAssignServicerPayload
  | BulkArchivePayload
  | BulkDearchivePayload;
 

export async function getInterventionById(id: number): Promise<InterventionDetail> {
  return getResponseData(
    () => api.get<InterventionDetail>(API_ENDPOINTS.INTERVENTIONS.BY_ID(id)),
    'Failed to load intervention.',
  );
}

export async function getInterventions(): Promise<InterventionsResult> {
  return withServiceError(async () => {
    const response = await api.get<unknown>(API_ENDPOINTS.INTERVENTIONS.BASE);

    if (Array.isArray(response.data)) {
      const items = response.data.filter(isInterventionListItem);
      return {
        items,
      };
    }

    return { items: [] };
  }, 'Failed to load interventions.');
}

export async function downloadInterventionsPdf(language: LanguageCode = 'en'): Promise<void> {
  return withServiceError(async () => {
    const response = await api.get<Blob>(API_ENDPOINTS.INTERVENTIONS.EXPORT_PDF, {
      params: { language },
      responseType: 'blob',
    });

    const filePrefix = language === 'bs' ? 'intervencije' : 'interventions';
    const fileName = `${filePrefix}-${new Date().toISOString().slice(0, 10)}.pdf`;
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 'Failed to export interventions to PDF.');
}

export async function getInterventionOptions(): Promise<InterventionOptions> {
  return getResponseData(
    () => api.get<InterventionOptions>(`${API_ENDPOINTS.INTERVENTIONS.BASE}/options`),
    'Failed to load intervention options.',
  );
}

export async function getInterventionHistory(
  query: InterventionHistoryQuery = {},
): Promise<InterventionHistoryResponse> {
  const params = new URLSearchParams();

  if (query.location?.trim()) {
    params.set('location', query.location.trim());
  }

  if (query.categoryId !== undefined && query.categoryId !== '') {
    params.set('categoryId', String(query.categoryId));
  } else if (query.category?.trim()) {
    params.set('category', query.category.trim());
  }

  if (query.page) {
    params.set('page', String(query.page));
  }

  if (query.pageSize) {
    params.set('pageSize', String(query.pageSize));
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';

  return getResponseData(
    () => api.get<InterventionHistoryResponse>(
      `${API_ENDPOINTS.INTERVENTIONS.BASE}/history${suffix}`,
    ),
    'Failed to load intervention history.',
  );
}

export async function getInterventionKnowledgeBase(
  id: string | number,
  query: KnowledgeBaseQuery = {},
): Promise<KnowledgeBaseResponse> {
  const params = new URLSearchParams();
  if (query.text?.trim()) {
    params.set('text', query.text.trim());
  }
  if (query.location?.trim()) {
    params.set('location', query.location.trim());
  }
  if (query.categoryId !== undefined && query.categoryId !== '') {
    params.set('categoryId', String(query.categoryId));
  }
  const suffix = params.toString() ? `?${params.toString()}` : '';

  return getResponseData(
    () => api.get<KnowledgeBaseResponse>(
      `${API_ENDPOINTS.INTERVENTIONS.KNOWLEDGE_BASE(id)}${suffix}`,
    ),
    'Failed to load recommended solutions.',
  );
}

export async function createIntervention(payload: InterventionFormPayload): Promise<InterventionListItem> {
  return getResponseData(
    () => api.post<InterventionListItem>(API_ENDPOINTS.INTERVENTIONS.BASE, payload),
    'Failed to create intervention.',
  );
}

export async function updateIntervention(
  id: string,
  payload: InterventionFormPayload,
): Promise<InterventionListItem> {
  return getResponseData(
    () => api.patch<InterventionListItem>(
      `${API_ENDPOINTS.INTERVENTIONS.BASE}/${id}`,
      payload,
    ),
    'Failed to update intervention.',
  );
}

export async function updateInterventionStatus(
  id: string | number,
  status: InterventionStatus,
): Promise<InterventionDetail> {
  return getResponseData(
    () => api.patch<InterventionDetail>(
      `${API_ENDPOINTS.INTERVENTIONS.BY_ID(id)}/status`,
      { status },
    ),
    'Failed to update intervention status.',
  );
}

export async function pauseIntervention(
  id: string | number,
  payload: { reason: PauseReason; otherReason?: string | null; responsibleUserId?: number | null },
): Promise<InterventionDetail> {
  return getResponseData(
    () => api.post<InterventionDetail>(`${API_ENDPOINTS.INTERVENTIONS.BY_ID(id)}/pause`, payload),
    'Failed to pause intervention.',
  );
}

export async function resumeIntervention(
  id: string | number,
  payload: { note?: string | null } = {},
): Promise<InterventionDetail> {
  return getResponseData(
    () => api.post<InterventionDetail>(`${API_ENDPOINTS.INTERVENTIONS.BY_ID(id)}/resume`, payload),
    'Failed to resume intervention.',
  );
}

export async function updateRecurrence(
  id: string | number,
  recurringPeriod: string | null,
): Promise<InterventionDetail> {
  return getResponseData(
    () => api.patch<InterventionDetail>(
      `${API_ENDPOINTS.INTERVENTIONS.BASE}/${id}/recurrence`,
      { recurringPeriod },
    ),
    'Failed to update recurrence.',
  );
}
export async function executeBulkAction(
  payload: BulkActionPayload,
): Promise<BulkActionResponse> {
  try {
    const response = await api.post<BulkActionResponse>(
      API_ENDPOINTS.INTERVENTIONS.BULK_ACTIONS,
      payload,
    );

    return response.data;
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error
    ) {
      const axiosError = error as {
        response?: {
          status?: number;
          data?: BulkActionResponse;
        };
      };

      if (
        axiosError.response?.status === 422 &&
        axiosError.response.data
      ) {
        return axiosError.response.data;
      }
    }

    throw new Error('Bulk action failed. Please try again.');
  }
}
 
export function buildBulkStatusChange(
  interventionIds: number[],
  status: InterventionStatus,
): BulkStatusChangePayload {
  return { action: 'STATUS_CHANGE', interventionIds, payload: { status } };
}
 
export function buildBulkAssignServicer(
  interventionIds: number[],
  userId: number,
): BulkAssignServicerPayload {
  return { action: 'ASSIGN_SERVICER', interventionIds, payload: { userId } };
}
 
export function buildBulkArchive(interventionIds: number[]): BulkArchivePayload {
  return { action: 'ARCHIVE', interventionIds, payload: {} as Record<string, never> };
}

export function buildBulkDearchive(interventionIds: number[]): BulkDearchivePayload {
  return { action: 'DEARCHIVE', interventionIds, payload: {} as Record<string, never> };
}
 
export function formatBulkResultSummary(result: BulkActionResponse): string {
  if (result.totalSkipped === 0) {
    return `${result.totalSucceeded} of ${result.totalRequested} interventions successfully updated.`;
  }
  return `${result.totalSucceeded} of ${result.totalRequested} interventions updated. ${result.totalSkipped} skipped.`;
}

export interface CreateReopenRequestPayload {
  reason: string;
  comment?: string | null;
}

export async function createReopenRequest(
  interventionId: string | number,
  payload: CreateReopenRequestPayload,
): Promise<void> {
  return getResponseData(
    () =>
      api.post(
        `${API_ENDPOINTS.INTERVENTIONS.BY_ID(interventionId)}/reopen-request`,
        payload,
      ),
    'Failed to create reopen request.',
  );
}
  export async function getReopenRequests(): Promise<any[]> {
  return getResponseData(
    () => api.get<unknown[]>(`${API_ENDPOINTS.INTERVENTIONS.BASE}/reopen-requests`),
    'Failed to load reopen requests.',
  );
}

export async function approveReopenRequest(requestId: number): Promise<void> {
  return getResponseData(
    () => api.patch(`${API_ENDPOINTS.INTERVENTIONS.BASE}/reopen-requests/${requestId}/approve`),
    'Failed to approve reopen request.',
  );
}

export async function rejectReopenRequest(requestId: number, coordinatorComment: string): Promise<void> {
  return getResponseData(
    () => api.patch(`${API_ENDPOINTS.INTERVENTIONS.BASE}/reopen-requests/${requestId}/reject`, { coordinatorComment }),
    'Failed to reject reopen request.',
  );
}
