import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import type {
  FaultReportOptionsResponse,
  FaultReportSubmissionPayload,
  FaultReportSubmissionResponse,
} from '@/models/FaultReport';

import { ServiceError, getErrorMessage } from './errors';

export async function getFaultReportOptions(): Promise<FaultReportOptionsResponse> {
  try {
    const response = await api.get<FaultReportOptionsResponse>(API_ENDPOINTS.FAULT_REPORTS.OPTIONS);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to load fault report options.'), error);
  }
}

export async function submitFaultReport(
  payload: FaultReportSubmissionPayload,
): Promise<FaultReportSubmissionResponse> {
  try {
    const response = await api.post<FaultReportSubmissionResponse>(
      API_ENDPOINTS.FAULT_REPORTS.BASE,
      payload,
    );
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to submit fault report.'), error);
  }
}
