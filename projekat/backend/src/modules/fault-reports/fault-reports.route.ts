import { InterventionStatus, InterventionType, Priority } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../config/database";
import { authRateLimiter } from "../../middleware/rateLimit.middleware";
import { asyncHandler } from "../../shared/async-handler";
import { BadRequestError, NotFoundError } from "../../shared/errors";
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  FaultReportService,
  type FaultReportRepository,
  type FaultReportSubmissionInput,
} from "./fault-reports.service";
import { buildFaultReportSubmissionPayload } from "./fault-reports.payload";
import fs from "node:fs/promises";
import path from "node:path";

const faultReportsRouter = Router();

const SYSTEM_USER_EMAIL = "system.fault-reports@si-grupa7.local";
const SYSTEM_USER_USERNAME = "system.fault-reports";

const faultReportSubmissionSchema = z.object({
  companyId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  location: z
    .string()
    .trim()
    .refine((val) => val.length === 0 || val.length >= 3, {
      message: "String must contain at least 3 character(s)",
    })
    .optional()
    .default(""),
  description: z.string().trim().optional().default(""),
  reporterName: z
    .union([z.string().trim().min(2), z.literal("")])
    .optional()
    .default(""),
  reporterEmail: z
    .union([z.string().trim().email(), z.literal("")])
    .optional()
    .default(""),
  reporterPhone: z
    .union([z.string().trim().min(5), z.literal("")])
    .optional()
    .default(""),
  templateId: z.string().trim().min(1),
  templateName: z.string().trim().min(1),
  isAuthenticated: z.boolean().optional().default(false),
  latitude: z.coerce.number().finite().nullable().optional(),
  longitude: z.coerce.number().finite().nullable().optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string().trim().min(1),
        mimeType: z
          .string()
          .trim()
          .min(1)
          .refine((value) => ALLOWED_ATTACHMENT_MIME_TYPES.has(value), {
            message: "Unsupported attachment type",
          }),
        fileSize: z.coerce.number().int().positive(),
        // Optional base64 payload of the file to persist on the server
        fileContent: z
          .string()
          .optional()
          .refine((val) => !val || /^[A-Za-z0-9+/=\s]+$/.test(val), {
            message: "Invalid file content encoding",
          }),
      }),
    )
    .default([]),
  // Note: no devTest helper — regular reports require authenticated users
});

function sanitizeAttachmentName(fileName: string): string {
  return (
    fileName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "attachment"
  );
}

const faultReportsRepository: FaultReportRepository = {
  listCompanies: async () =>
    prisma.company.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        contact: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  listActiveCategories: async () =>
    prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  listActiveInterventions: async () =>
    prisma.intervention.findMany({
      where: { archived: false },
      orderBy: [{ createdAt: "desc" }],
      include: {
        category: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    }),
  findCompanyById: async (companyId: number) =>
    prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    }),
  findCategoryById: async (categoryId: number) =>
    prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, active: true },
    }),
  findSystemUser: async () =>
    prisma.user.upsert({
      where: { email: SYSTEM_USER_EMAIL },
      create: {
        firstName: "System",
        lastName: "Reporter",
        username: SYSTEM_USER_USERNAME,
        email: SYSTEM_USER_EMAIL,
        active: true,
        companyId: null,
      },
      update: {
        firstName: "System",
        lastName: "Reporter",
        username: SYSTEM_USER_USERNAME,
        active: true,
        companyId: null,
      },
      select: { id: true },
    }),

  getConfig: async () => {
    const ATTACHMENT_CONFIG_KEY = 'attachment.config';
    const row = await prisma.systemConfig.findUnique({ where: { key: ATTACHMENT_CONFIG_KEY } });
    if (!row) return { allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
      'application/pdf', 'text/plain', 'text/csv', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ], maxFileSizeMb: 10 };

    try {
      return JSON.parse(row.value);
    } catch {
      return { allowedMimeTypes: [], maxFileSizeMb: 10 };
    }
  },

  createSubmission: async (input) =>
    prisma.$transaction(async (transaction) => {
      const faultReport = await transaction.faultReport.create({
        data: {
          description: input.description ?? "",
          location: input.location ?? "",
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          userId: null,
          categoryId: input.categoryId!,
          companyId: input.companyId!,
        },
      });

      const intervention = await transaction.intervention.create({
        data: {
          name: input.templateName,
          description: input.description ?? "",
          location: input.location ?? "",
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          priority: Priority.NORMAL,
          status: InterventionStatus.OPEN,
          type: InterventionType.ISSUE,
          archived: false,
          categoryId: input.categoryId!,
          creatorId: input.creatorId,
          companyId: input.companyId!,
          faultReportId: faultReport.id,
        },
      });

      // Persist file contents if provided and create attachment records
      const uploadsRoot = path.resolve(__dirname, "../../../uploads");
      await fs.mkdir(uploadsRoot, { recursive: true });

      await Promise.all(
        input.attachments.map(async (attachment, index) => {
          const storageKey = `fault-reports/${faultReport.id}/${index + 1}-${sanitizeAttachmentName(
            attachment.fileName,
          )}`;
          const absolutePath = path.join(uploadsRoot, storageKey);

          if (attachment.fileContent) {
            // ensure directory exists
            await fs.mkdir(path.dirname(absolutePath), { recursive: true });
            // write file (base64 -> buffer)
            const buffer = Buffer.from(attachment.fileContent, "base64");
            await fs.writeFile(absolutePath, buffer);
          }

          await transaction.attachment.create({
            data: {
              url: storageKey,
              storageKey,
              fileName: attachment.fileName,
              mimeType: attachment.mimeType,
              fileSize: attachment.fileSize,
              faultReportId: faultReport.id,
            },
          });
        }),
      );

      return {
        faultReportId: faultReport.id,
        interventionId: intervention.id,
        referenceNumber: `INT-${String(intervention.id).padStart(5, "0")}`,
        receivedAt: faultReport.reportedAt,
      };
    }),
};

const faultReportService = new FaultReportService(faultReportsRepository);

faultReportsRouter.get(
  "/options",
  asyncHandler(async (_req, res) => {
    const [companies, categories] = await Promise.all([
      faultReportService.listCompanies(),
      faultReportService.listActiveCategories(),
    ]);

    res.json({ companies, categories });
  }),
);

faultReportsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const faultReports = await prisma.faultReport.findMany({
      orderBy: [{ reportedAt: "desc" }],
      include: {
        category: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        attachments: {
          select: {
            id: true,
            url: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            createdAt: true,
          },
        },
        interventions: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        },
      },
    });

    res.json(faultReports);
  }),
);

faultReportsRouter.post(
  "/",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const parsed = faultReportSubmissionSchema.parse(req.body);

    const payload = buildFaultReportSubmissionPayload(
      parsed,
      req.body as Record<string, unknown>,
    );
    const result = await faultReportService.submitFaultReport(payload);

    res.status(201).json(result);
  }),
);

faultReportsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError("Invalid fault report identifier.");
    }

    const faultReport = await prisma.faultReport.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        attachments: true,
        interventions: true,
      },
    });

    if (!faultReport) {
      throw new NotFoundError("Fault report not found.");
    }

    res.json(faultReport);
  }),
);

export default faultReportsRouter;
