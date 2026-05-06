import { NotFoundError } from '../../shared/errors';

export const ATTACHMENT_CONFIG_KEY = 'attachment.config';

export interface AttachmentConfig {
  allowedMimeTypes: string[];
  maxFileSizeMb: number;
}

export const DEFAULT_ATTACHMENT_CONFIG: AttachmentConfig = {
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  maxFileSizeMb: 10,
};

const MAX_ALLOWED_MIME_TYPES = 50;
const MAX_FILE_SIZE_MB_CEILING = 100;

export interface AttachmentRecord {
  id: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;
  storageKey: string | null;
  url: string;
}

export interface IAttachmentRepository {
  findByInterventionId(interventionId: number): Promise<AttachmentRecord[]>;
  findById(id: number): Promise<AttachmentRecord | null>;
  deleteById(id: number): Promise<void>;
  findInterventionById(id: number): Promise<{ id: number } | null>;
  getConfig(): Promise<AttachmentConfig>;
  updateConfig(config: AttachmentConfig, actorId?: number): Promise<AttachmentConfig>;
}

export class AttachmentValidationError extends Error {
  constructor(
    message: string,
    public readonly fields?: ReadonlyArray<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'AttachmentValidationError';
  }
}

export class AttachmentService {
  constructor(private readonly repository: IAttachmentRepository) {}

  async getInterventionAttachments(interventionId: number): Promise<AttachmentRecord[]> {
    const intervention = await this.repository.findInterventionById(interventionId);
    if (!intervention) {
      throw new NotFoundError('Intervention not found.');
    }
    return this.repository.findByInterventionId(interventionId);
  }

  async getById(id: number): Promise<AttachmentRecord> {
    const attachment = await this.repository.findById(id);
    if (!attachment) {
      throw new NotFoundError('Attachment not found.');
    }
    return attachment;
  }

  async deleteAttachment(id: number): Promise<AttachmentRecord> {
    const attachment = await this.repository.findById(id);
    if (!attachment) {
      throw new NotFoundError('Attachment not found.');
    }
    await this.repository.deleteById(id);
    return attachment;
  }

  async getConfig(): Promise<AttachmentConfig> {
    return this.repository.getConfig();
  }

  async updateConfig(config: AttachmentConfig, actorId?: number): Promise<AttachmentConfig> {
    const errors: Array<{ field: string; message: string }> = [];

    if (!Array.isArray(config.allowedMimeTypes) || config.allowedMimeTypes.length === 0) {
      errors.push({ field: 'allowedMimeTypes', message: 'At least one MIME type must be allowed.' });
    } else if (config.allowedMimeTypes.length > MAX_ALLOWED_MIME_TYPES) {
      errors.push({
        field: 'allowedMimeTypes',
        message: `Cannot configure more than ${MAX_ALLOWED_MIME_TYPES} allowed MIME types.`,
      });
    }

    if (!Number.isInteger(config.maxFileSizeMb) || config.maxFileSizeMb <= 0) {
      errors.push({ field: 'maxFileSizeMb', message: 'Maximum file size must be a positive whole number.' });
    } else if (config.maxFileSizeMb > MAX_FILE_SIZE_MB_CEILING) {
      errors.push({
        field: 'maxFileSizeMb',
        message: `Maximum file size cannot exceed ${MAX_FILE_SIZE_MB_CEILING} MB.`,
      });
    }

    if (errors.length > 0) {
      throw new AttachmentValidationError('Invalid attachment configuration.', errors);
    }

    return this.repository.updateConfig(config, actorId);
  }

  validateUploadAgainstConfig(
    attachments: ReadonlyArray<{ fileName: string; mimeType: string; fileSize: number }>,
    config: AttachmentConfig,
  ): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];
    const maxFileSizeBytes = config.maxFileSizeMb * 1024 * 1024;
    const allowedSet = new Set(config.allowedMimeTypes);

    for (const attachment of attachments) {
      if (!allowedSet.has(attachment.mimeType)) {
        errors.push({
          field: 'attachments',
          message: `File type '${attachment.mimeType}' is not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}.`,
        });
      }

      if (attachment.fileSize > maxFileSizeBytes) {
        errors.push({
          field: 'attachments',
          message: `File '${attachment.fileName}' exceeds the maximum allowed size of ${config.maxFileSizeMb} MB.`,
        });
      }
    }

    return errors;
  }
}
