import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import type {
  FaultReportOptionsResponse,
  FaultReportSubmissionPayload,
  FaultReportSubmissionResponse,
} from '@/models/FaultReport';

import { getResponseData } from './errors';

export async function getFaultReportOptions(): Promise<FaultReportOptionsResponse> {
  return getResponseData(
    () => api.get<FaultReportOptionsResponse>(API_ENDPOINTS.FAULT_REPORTS.OPTIONS),
    'Failed to load fault report options.',
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
