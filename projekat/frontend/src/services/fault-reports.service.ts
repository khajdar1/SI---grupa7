import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import type {
  FaultReportOptionsResponse,
  FaultReportSubmissionPayload,
  FaultReportSubmissionResponse,
  DuplicateCheckPayload,
  DuplicateCheckResponse,
  FaultReportListItem,
} from '@/models/FaultReport';

import { getResponseData } from './errors';

export async function getFaultReportOptions(): Promise<FaultReportOptionsResponse> {
  return getResponseData(
    () => api.get<FaultReportOptionsResponse>(API_ENDPOINTS.FAULT_REPORTS.OPTIONS),
    'Failed to load fault report options.',
  );
}

export async function getFaultReports(): Promise<FaultReportListItem[]> {
  return getResponseData(
    () => api.get<FaultReportListItem[]>(API_ENDPOINTS.FAULT_REPORTS.BASE),
    'Failed to load fault reports.',
  );
}

export async function submitFaultReport(
  payload: FaultReportSubmissionPayload,
): Promise<FaultReportSubmissionResponse> {
  return getResponseData(
    () => api.post<FaultReportSubmissionResponse>(
      API_ENDPOINTS.FAULT_REPORTS.BASE,
      payload,
    ),
    'Failed to submit fault report.',
  );
}

export async function checkFaultReportDuplicates(
  payload: DuplicateCheckPayload,
): Promise<DuplicateCheckResponse> {
  return getResponseData(
    () => api.post<DuplicateCheckResponse>(
      API_ENDPOINTS.FAULT_REPORTS.CHECK_DUPLICATES,
      payload,
    ),
    'Failed to check for duplicates.',
  );
}
