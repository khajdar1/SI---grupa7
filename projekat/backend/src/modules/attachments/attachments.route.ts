import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';
import { authorizeRoles } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../shared/async-handler';
import { AuditService } from '../../shared/audit.service';
import { BadRequestError } from '../../shared/errors';
import {
  AttachmentService,
  AttachmentValidationError,
  DEFAULT_ATTACHMENT_CONFIG,
  ATTACHMENT_CONFIG_KEY,
  type AttachmentConfig,
  type IAttachmentRepository,
} from './attachments.service';

const attachmentsRouter = Router();

const ADMIN_ROLES = ['admin', 'administrator'];
const VIEW_ROLES = ['koordinator', 'admin', 'administrator', 'supportagent', 'agentpodrske'];
const DELETE_ROLES = ADMIN_ROLES;

const prismaAttachmentRepository: IAttachmentRepository = {
  findByInterventionId: async (interventionId: number) => {
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      select: {
        attachments: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            createdAt: true,
            storageKey: true,
            url: true,
          },
        },
        faultReport: {
          select: {
            attachments: {
              select: {
                id: true,
                fileName: true,
                mimeType: true,
                fileSize: true,
                createdAt: true,
                storageKey: true,
                url: true,
              },
            },
          },
        },
      },
    });

    if (!intervention) return [];

    const direct = intervention.attachments;
    const fromFaultReport = intervention.faultReport?.attachments ?? [];
    const seenIds = new Set<number>();

    return [...direct, ...fromFaultReport].filter((att) => {
      if (seenIds.has(att.id)) return false;
      seenIds.add(att.id);
      return true;
    });
  },

  findById: async (id: number) =>
    prisma.attachment.findUnique({
      where: { id },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        createdAt: true,
        storageKey: true,
        url: true,
      },
    }),

  deleteById: async (id: number) => {
    await prisma.attachment.delete({ where: { id } });
  },

  findInterventionById: async (id: number) =>
    prisma.intervention.findUnique({ where: { id }, select: { id: true } }),

  getConfig: async (): Promise<AttachmentConfig> => {
    const row = await prisma.systemConfig.findUnique({ where: { key: ATTACHMENT_CONFIG_KEY } });
    if (!row) return { ...DEFAULT_ATTACHMENT_CONFIG, allowedMimeTypes: [...DEFAULT_ATTACHMENT_CONFIG.allowedMimeTypes] };

    try {
      const parsed = JSON.parse(row.value) as unknown;
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        Array.isArray((parsed as Record<string, unknown>).allowedMimeTypes) &&
        typeof (parsed as Record<string, unknown>).maxFileSizeMb === 'number'
      ) {
        return parsed as AttachmentConfig;
      }
    } catch {
      // fall through to defaults
    }

    return { ...DEFAULT_ATTACHMENT_CONFIG, allowedMimeTypes: [...DEFAULT_ATTACHMENT_CONFIG.allowedMimeTypes] };
  },

  updateConfig: async (config: AttachmentConfig, actorId?: number): Promise<AttachmentConfig> => {
    await prisma.systemConfig.upsert({
      where: { key: ATTACHMENT_CONFIG_KEY },
      update: { value: JSON.stringify(config), updatedById: actorId ?? null },
      create: { key: ATTACHMENT_CONFIG_KEY, value: JSON.stringify(config), updatedById: actorId ?? null },
    });
    return config;
  },
};

const attachmentService = new AttachmentService(prismaAttachmentRepository);

const updateConfigSchema = z.object({
  allowedMimeTypes: z.array(z.string().trim().min(1)).min(1).max(50),
  maxFileSizeMb: z.number().int().positive().max(100),
});

function resolveUploadPath(storageKey: string): string | null {
  const uploadsRoot = path.resolve(__dirname, '../../../uploads');
  const resolved = path.resolve(uploadsRoot, storageKey);
  const relative = path.relative(uploadsRoot, resolved);


  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }

  return resolved;
}

function sanitizeFilenameForHeader(fileName: string): string {
  return fileName.replace(/[^\w\s.\-()]/g, '_');
}

attachmentsRouter.get(
  '/config',
  authorizeRoles(ADMIN_ROLES),
  asyncHandler(async (_req, res) => {
    const config = await attachmentService.getConfig();
    res.json(config);
  }),
);

attachmentsRouter.put(
  '/config',
  authorizeRoles(ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = updateConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      const fields = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'request',
        message: issue.message,
      }));
      throw new BadRequestError('Invalid configuration data.', fields);
    }

    const actorId = req.user?.localUserId;

    try {
      const updated = await attachmentService.updateConfig(parsed.data, actorId);

      AuditService.log({
        action: 'ATTACHMENT_CONFIG_UPDATED',
        entity: 'AttachmentConfig',
        userId: actorId,
        details: `Attachment config updated by ${req.user?.username ?? 'unknown'}: allowedMimeTypes=${parsed.data.allowedMimeTypes.length} types, maxFileSizeMb=${parsed.data.maxFileSizeMb}`,
      });

      res.json(updated);
    } catch (error) {
      if (error instanceof AttachmentValidationError) {
        throw new BadRequestError(error.message, error.fields ? [...error.fields] : undefined);
      }
      throw error;
    }
  }),
);

attachmentsRouter.get(
  '/:id/download',
  authorizeRoles(VIEW_ROLES),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid attachment identifier.');
    }

    const attachment = await attachmentService.getById(id);

    if (!attachment.storageKey) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Attachment file is not available for download.' });
      return;
    }

    const absolutePath = resolveUploadPath(attachment.storageKey);
    if (!absolutePath) {
      throw new BadRequestError('Invalid attachment path.');
    }

    try {
      await fs.access(absolutePath);
    } catch {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Attachment file not found on server.' });
      return;
    }

    const safeFileName = sanitizeFilenameForHeader(attachment.fileName);
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
    res.setHeader('Content-Length', attachment.fileSize);

    const fileStream = createReadStream(absolutePath);
    fileStream.pipe(res);
  }),
);

attachmentsRouter.delete(
  '/:id',
  authorizeRoles(DELETE_ROLES),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid attachment identifier.');
    }

    const actorUsername = req.user?.username ?? 'unknown';
    const deleted = await attachmentService.deleteAttachment(id);

    if (deleted.storageKey) {
      const absolutePath = resolveUploadPath(deleted.storageKey);
      if (absolutePath) {
        try {
          await fs.unlink(absolutePath);
        } catch {
          // File may not exist on disk; continue — DB record is the source of truth
        }
      }
    }

    AuditService.logAttachmentDeleted(id, deleted.fileName, actorUsername);

    res.status(HTTP_STATUS.NO_CONTENT).send();
  }),
);

export default attachmentsRouter;
