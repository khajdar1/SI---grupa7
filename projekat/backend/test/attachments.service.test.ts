import { describe, expect, it } from 'vitest';

import {
  AttachmentService,
  AttachmentValidationError,
  DEFAULT_ATTACHMENT_CONFIG,
  type AttachmentConfig,
  type AttachmentRecord,
  type IAttachmentRepository,
} from '../src/modules/attachments/attachments.service';

const MOCK_ATTACHMENT: AttachmentRecord = {
  id: 1,
  fileName: 'report.pdf',
  mimeType: 'application/pdf',
  fileSize: 512_000,
  createdAt: new Date('2026-05-01T10:00:00.000Z'),
  storageKey: 'fault-reports/1/1-report.pdf',
  url: 'fault-reports/1/1-report.pdf',
};

function createRepository(overrides: Partial<IAttachmentRepository> = {}): IAttachmentRepository {
  const store = new Map<number, AttachmentRecord>([[MOCK_ATTACHMENT.id, MOCK_ATTACHMENT]]);

  return {
    findByInterventionId: async () => Array.from(store.values()),
    findById: async (id: number) => store.get(id) ?? null,
    deleteById: async (id: number) => { store.delete(id); },
    findInterventionById: async (id: number) => (id === 1 ? { id: 1 } : null),
    getConfig: async () => ({ ...DEFAULT_ATTACHMENT_CONFIG, allowedMimeTypes: [...DEFAULT_ATTACHMENT_CONFIG.allowedMimeTypes] }),
    updateConfig: async (config: AttachmentConfig) => config,
    ...overrides,
  };
}

// ─── getInterventionAttachments ───────────────────────────────────────────────

describe('AttachmentService.getInterventionAttachments', () => {
  it('should return attachments for an existing intervention', async () => {
    const service = new AttachmentService(createRepository());
    const result = await service.getInterventionAttachments(1);
    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe('report.pdf');
  });

  it('should return an empty array when the intervention has no attachments', async () => {
    const service = new AttachmentService(
      createRepository({ findByInterventionId: async () => [] }),
    );
    const result = await service.getInterventionAttachments(1);
    expect(result).toHaveLength(0);
  });

  it('should throw NotFoundError when the intervention does not exist', async () => {
    const service = new AttachmentService(createRepository());
    await expect(service.getInterventionAttachments(999)).rejects.toThrow('Intervention not found.');
  });
});

// ─── getById ─────────────────────────────────────────────────────────────────

describe('AttachmentService.getById', () => {
  it('should return the attachment record when found', async () => {
    const service = new AttachmentService(createRepository());
    const result = await service.getById(1);
    expect(result.id).toBe(1);
    expect(result.mimeType).toBe('application/pdf');
  });

  it('should throw NotFoundError when attachment does not exist', async () => {
    const service = new AttachmentService(createRepository());
    await expect(service.getById(999)).rejects.toThrow('Attachment not found.');
  });
});

// ─── deleteAttachment ─────────────────────────────────────────────────────────

describe('AttachmentService.deleteAttachment', () => {
  it('should return the deleted attachment record', async () => {
    const service = new AttachmentService(createRepository());
    const deleted = await service.deleteAttachment(1);
    expect(deleted.id).toBe(1);
    expect(deleted.fileName).toBe('report.pdf');
  });

  it('should call repository.deleteById with the correct id', async () => {
    let capturedId: number | null = null;
    const service = new AttachmentService(
      createRepository({
        deleteById: async (id: number) => { capturedId = id; },
      }),
    );
    await service.deleteAttachment(1);
    expect(capturedId).toBe(1);
  });

  it('should throw NotFoundError when attachment does not exist', async () => {
    const service = new AttachmentService(createRepository());
    await expect(service.deleteAttachment(999)).rejects.toThrow('Attachment not found.');
  });
});

// ─── getConfig ────────────────────────────────────────────────────────────────

describe('AttachmentService.getConfig', () => {
  it('should delegate to repository.getConfig and return the result', async () => {
    const customConfig: AttachmentConfig = { allowedMimeTypes: ['image/png'], maxFileSizeMb: 5 };
    const service = new AttachmentService(
      createRepository({ getConfig: async () => customConfig }),
    );
    const result = await service.getConfig();
    expect(result.allowedMimeTypes).toEqual(['image/png']);
    expect(result.maxFileSizeMb).toBe(5);
  });
});

// ─── updateConfig ─────────────────────────────────────────────────────────────

describe('AttachmentService.updateConfig', () => {
  it('should save and return valid configuration', async () => {
    const service = new AttachmentService(createRepository());
    const config: AttachmentConfig = { allowedMimeTypes: ['image/jpeg', 'application/pdf'], maxFileSizeMb: 20 };
    const result = await service.updateConfig(config);
    expect(result.allowedMimeTypes).toEqual(['image/jpeg', 'application/pdf']);
    expect(result.maxFileSizeMb).toBe(20);
  });

  it('should throw AttachmentValidationError when allowedMimeTypes is empty', async () => {
    const service = new AttachmentService(createRepository());
    await expect(
      service.updateConfig({ allowedMimeTypes: [], maxFileSizeMb: 10 }),
    ).rejects.toThrow(AttachmentValidationError);
  });

  it('should throw AttachmentValidationError when allowedMimeTypes exceeds 50 entries', async () => {
    const service = new AttachmentService(createRepository());
    const tooManyTypes = Array.from({ length: 51 }, (_, i) => `type/t${i}`);
    try {
      await service.updateConfig({ allowedMimeTypes: tooManyTypes, maxFileSizeMb: 10 });
      expect.fail('Expected AttachmentValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(AttachmentValidationError);
      const e = error as AttachmentValidationError;
      expect(e.fields?.some((f) => f.message.includes('50'))).toBe(true);
    }
  });

  it('should throw AttachmentValidationError when maxFileSizeMb is zero', async () => {
    const service = new AttachmentService(createRepository());
    try {
      await service.updateConfig({ allowedMimeTypes: ['image/jpeg'], maxFileSizeMb: 0 });
      expect.fail('Expected AttachmentValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(AttachmentValidationError);
      const e = error as AttachmentValidationError;
      expect(e.fields?.some((f) => f.field === 'maxFileSizeMb')).toBe(true);
    }
  });

  it('should throw AttachmentValidationError when maxFileSizeMb is negative', async () => {
    const service = new AttachmentService(createRepository());
    try {
      await service.updateConfig({ allowedMimeTypes: ['image/jpeg'], maxFileSizeMb: -5 });
      expect.fail('Expected AttachmentValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(AttachmentValidationError);
      const e = error as AttachmentValidationError;
      expect(e.fields?.some((f) => f.field === 'maxFileSizeMb')).toBe(true);
    }
  });

  it('should throw AttachmentValidationError when maxFileSizeMb exceeds 100', async () => {
    const service = new AttachmentService(createRepository());
    try {
      await service.updateConfig({ allowedMimeTypes: ['image/jpeg'], maxFileSizeMb: 101 });
      expect.fail('Expected AttachmentValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(AttachmentValidationError);
      const e = error as AttachmentValidationError;
      expect(e.fields?.some((f) => f.message.includes('100 MB'))).toBe(true);
    }
  });

  it('should throw AttachmentValidationError when maxFileSizeMb is a non-integer', async () => {
    const service = new AttachmentService(createRepository());
    try {
      await service.updateConfig({ allowedMimeTypes: ['image/jpeg'], maxFileSizeMb: 5.5 });
      expect.fail('Expected AttachmentValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(AttachmentValidationError);
      const e = error as AttachmentValidationError;
      expect(e.fields?.some((f) => f.field === 'maxFileSizeMb')).toBe(true);
    }
  });

  it('should collect both allowedMimeTypes and maxFileSizeMb errors at once', async () => {
    const service = new AttachmentService(createRepository());
    try {
      await service.updateConfig({ allowedMimeTypes: [], maxFileSizeMb: 0 });
      expect.fail('Expected AttachmentValidationError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(AttachmentValidationError);
      const validationError = error as AttachmentValidationError;
      expect(validationError.fields).toHaveLength(2);
    }
  });
});

// ─── validateUploadAgainstConfig ─────────────────────────────────────────────

describe('AttachmentService.validateUploadAgainstConfig', () => {
  const config: AttachmentConfig = {
    allowedMimeTypes: ['image/jpeg', 'application/pdf'],
    maxFileSizeMb: 5,
  };

  it('should return no errors when all attachments are valid', () => {
    const service = new AttachmentService(createRepository());
    const errors = service.validateUploadAgainstConfig(
      [
        { fileName: 'photo.jpg', mimeType: 'image/jpeg', fileSize: 1_000_000 },
        { fileName: 'doc.pdf', mimeType: 'application/pdf', fileSize: 2_000_000 },
      ],
      config,
    );
    expect(errors).toHaveLength(0);
  });

  it('should return an error when MIME type is not in the allowed list', () => {
    const service = new AttachmentService(createRepository());
    const errors = service.validateUploadAgainstConfig(
      [{ fileName: 'file.exe', mimeType: 'application/octet-stream', fileSize: 1_000 }],
      config,
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('attachments');
    expect(errors[0].message).toContain('application/octet-stream');
  });

  it('should return an error when file size exceeds the configured maximum', () => {
    const service = new AttachmentService(createRepository());
    const errors = service.validateUploadAgainstConfig(
      [{ fileName: 'large.pdf', mimeType: 'application/pdf', fileSize: 6 * 1024 * 1024 }],
      config,
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('large.pdf');
    expect(errors[0].message).toContain('5 MB');
  });

  it('should return errors for both type and size violations in the same attachment', () => {
    const service = new AttachmentService(createRepository());
    const errors = service.validateUploadAgainstConfig(
      [{ fileName: 'bad.exe', mimeType: 'application/octet-stream', fileSize: 10 * 1024 * 1024 }],
      config,
    );
    expect(errors).toHaveLength(2);
  });

  it('should return no errors for an empty attachments array', () => {
    const service = new AttachmentService(createRepository());
    const errors = service.validateUploadAgainstConfig([], config);
    expect(errors).toHaveLength(0);
  });

  it('should accept a file exactly at the maximum size boundary', () => {
    const service = new AttachmentService(createRepository());
    const maxBytes = config.maxFileSizeMb * 1024 * 1024;
    const errors = service.validateUploadAgainstConfig(
      [{ fileName: 'exact.pdf', mimeType: 'application/pdf', fileSize: maxBytes }],
      config,
    );
    expect(errors).toHaveLength(0);
  });

  it('should reject a file one byte over the maximum size boundary', () => {
    const service = new AttachmentService(createRepository());
    const overLimit = config.maxFileSizeMb * 1024 * 1024 + 1;
    const errors = service.validateUploadAgainstConfig(
      [{ fileName: 'over.pdf', mimeType: 'application/pdf', fileSize: overLimit }],
      config,
    );
    expect(errors).toHaveLength(1);
  });
});
