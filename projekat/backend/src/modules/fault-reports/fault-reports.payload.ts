import type { FaultReportSubmissionInput } from './fault-reports.service';

export function buildFaultReportSubmissionPayload(
  parsed: FaultReportSubmissionInput,
  rawBody: Record<string, unknown>,
): FaultReportSubmissionInput {
  return { ...parsed };
}