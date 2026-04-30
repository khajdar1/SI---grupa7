import { describe, expect, it } from 'vitest';

import { buildFaultReportSubmissionPayload } from './fault-reports.payload';

describe('buildFaultReportSubmissionPayload', () => {
  it('keeps isAuthenticated from the request body for emergency submissions', () => {
    const payload = buildFaultReportSubmissionPayload(
      {
        companyId: undefined,
        categoryId: undefined,
        location: undefined,
        description: '',
        reporterName: 'Ana Example',
        reporterEmail: '',
        reporterPhone: '+38761111222',
        templateId: 'power-outage',
        templateName: 'Nestanak struje',
        isAuthenticated: true,
        latitude: null,
        longitude: null,
        attachments: [],
      },
      { isAuthenticated: true },
    );

    expect(payload.isAuthenticated).toBe(true);
  });
});