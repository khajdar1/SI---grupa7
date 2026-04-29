import { describe, it, expect } from 'vitest';

import { FaultReportService, type FaultReportRepository } from './fault-reports.service';

const baseInput = {
  companyId: 7,
  categoryId: 4,
  location: 'Glavni ulaz, prizemlje',
  description: 'Ulazno osvjetljenje ne radi nakon prekida napajanja.',
  reporterName: 'Lejla Korisnik',
  reporterEmail: 'lejla@example.com',
  reporterPhone: '+38761111222',
  templateId: 'power-outage',
  templateName: 'Hitna intervencija: nestanak struje',
  isAuthenticated: true,
  latitude: 43.8563,
  longitude: 18.4131,
  attachments: [
    {
      fileName: 'evidence.pdf',
      mimeType: 'application/pdf',
      fileSize: 42_000,
    },
  ],
};

function createRepository(overrides: Partial<FaultReportRepository> = {}): FaultReportRepository {
  return {
    listCompanies: async () => [],
    listActiveCategories: async () => [],
    listActiveInterventions: async () => [],
    findCompanyById: async () => ({ id: 7, name: 'Servis Alfa d.o.o.' }),
    findCategoryById: async () => ({ id: 4, name: 'Elektricni kvar', active: true }),
    findSystemUser: async () => ({ id: 99 }),
    createSubmission: async () => ({
      faultReportId: 12,
      interventionId: 34,
      referenceNumber: 'INT-00034',
      receivedAt: new Date('2026-04-28T10:00:00.000Z'),
    }),
    ...overrides,
  };
}

describe('FaultReportService', () => {
  it('should create a fault report and auto-generated intervention for a valid submission', async () => {
    const repository = createRepository();
    const service = new FaultReportService(repository);

    const result = await service.submitFaultReport(baseInput);

    expect(result.faultReportId).toBe(12);
    expect(result.interventionId).toBe(34);
    expect(result.referenceNumber).toBe('INT-00034');
  });

  it('should allow submission without attachments', async () => {
    const repository = createRepository();
    const service = new FaultReportService(repository);

    const result = await service.submitFaultReport({ ...baseInput, attachments: [] });
    expect(result.interventionId).toBe(34);
  });

  it('should reject regular report submission from guests', async () => {
    const repository = createRepository({
      findCompanyById: async () => ({ id: 7, name: 'Servis Alfa d.o.o.' }),
      findCategoryById: async () => ({ id: 4, name: 'Elektricni kvar', active: true }),
    });
    const service = new FaultReportService(repository);

    await expect(
      service.submitFaultReport({
        ...baseInput,
        templateId: 'regular-report',
        templateName: 'Redovna prijava',
        isAuthenticated: false,
        attachments: [
          {
            fileName: 'slika.png',
            mimeType: 'image/png',
            fileSize: 2048,
          },
        ],
      }),
    ).rejects.toThrow('Regular reports are allowed only for authenticated users.');
  });

  it('should reject attachments for unauthenticated submissions', async () => {
    const repository = createRepository();
    const service = new FaultReportService(repository);

    await expect(service.submitFaultReport({ ...baseInput, isAuthenticated: false })).rejects.toThrow('Invalid attachment data.');
  });

  it('should reject submission when the selected company does not exist', async () => {
    const repository = createRepository({
      findCompanyById: async () => null,
    });
    const service = new FaultReportService(repository);

    await expect(service.submitFaultReport(baseInput)).rejects.toThrow('Selected company is not available.');
  });

  it('should reject submission when the selected category is inactive', async () => {
    const repository = createRepository({
      findCategoryById: async () => ({ id: 4, name: 'Elektricni kvar', active: false }),
    });
    const service = new FaultReportService(repository);

    await expect(service.submitFaultReport(baseInput)).rejects.toThrow('Selected category is inactive.');
  });

  it('should assign the dedicated system user as intervention creator', async () => {
    let capturedCreatorId = 0;
    const repository = createRepository({
      createSubmission: async (input) => {
        capturedCreatorId = input.creatorId;
        return {
          faultReportId: 12,
          interventionId: 34,
          referenceNumber: 'INT-00034',
          receivedAt: new Date('2026-04-28T10:00:00.000Z'),
        };
      },
    });
    const service = new FaultReportService(repository);

    await service.submitFaultReport(baseInput);

    expect(capturedCreatorId).toBe(99);
  });
});