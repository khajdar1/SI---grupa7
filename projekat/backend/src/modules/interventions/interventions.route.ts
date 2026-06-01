import {
  ExecutionConfirmationMethod,
  ExecutionConfirmationStatus,
  InterventionStatus,
  InterventionType,
  NotificationType,
  PauseReason,
  Priority,
  RecurringPeriod,
  ReportStatus,
} from "@prisma/client";
import { createHash, randomInt } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../config/database";
import { BULK_ACTIONS, HTTP_STATUS } from "../../constants";
import { authorizeRoles } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../shared/async-handler";
import { emitToUser } from "../../realtime/socket";
import { shouldNotifyUser } from "../../shared/notification-preferences";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors";
import { AuditService } from "../../shared/audit.service";
import { computeNextGenerationAt } from "../../services/recurring.service";
import { compactStoredLocation, resolvePersistableLocation } from "../../services/geocoding.service";
import {
  bulkActionSchema,
  type BulkActionInput,
  type BulkActionItemResult,
  type BulkActionResponse,
} from "./interventions.bulk.schema";
import { generateInterventionsPdf, InterventionPdfRow } from "../../shared/pdf.service";

const interventionsRouter = Router();
const COORDINATOR_ROLES = ["Koordinator", "Coordinator"];
const MANAGEMENT_ROLES = ["Menadzment", "Management"];
const ADMIN_ROLES = ["Administrator", "Admin", "administrator", "admin"];
const SERVICER_ROLES = ["Serviser"];
const SUPPORT_AGENT_ROLES = ["SupportAgent", "supportagent", "AgentPodrske", "agentpodrske"];
const COORDINATOR_ACTION_ROLES = [...COORDINATOR_ROLES, ...ADMIN_ROLES];

const INTERVENTION_VIEW_ROLES = [
  ...COORDINATOR_ROLES,
  ...MANAGEMENT_ROLES,
  ...ADMIN_ROLES,
  ...SUPPORT_AGENT_ROLES,
];

const INTERVENTION_HISTORY_ROLES = [
  ...COORDINATOR_ROLES,
  ...MANAGEMENT_ROLES,
  ...ADMIN_ROLES,
  ...SERVICER_ROLES,
  ...SUPPORT_AGENT_ROLES,
];
const INTERVENTION_STATUS_ROLES = [...COORDINATOR_ACTION_ROLES, ...SERVICER_ROLES];
const EDITABLE_STATUSES = new Set<InterventionStatus>([
  InterventionStatus.NEW,
  InterventionStatus.IN_PROGRESS,
]);
const PAUSABLE_STATUSES = new Set<InterventionStatus>([
  InterventionStatus.ASSIGNED,
  InterventionStatus.IN_PROGRESS,
]);
const ALLOWED_STATUS_TRANSITIONS: ReadonlyMap<
  InterventionStatus,
  ReadonlySet<InterventionStatus>
> = new Map<InterventionStatus, ReadonlySet<InterventionStatus>>([
  [
    InterventionStatus.NEW,
    new Set<InterventionStatus>([
      InterventionStatus.IN_PROGRESS,
      InterventionStatus.CANCELLED,
    ]),
  ],
  [
    InterventionStatus.ASSIGNED,
    new Set<InterventionStatus>([
      InterventionStatus.IN_PROGRESS,
      InterventionStatus.CANCELLED,
      InterventionStatus.ON_HOLD,
    ]),
  ],
  [
    InterventionStatus.IN_PROGRESS,
    new Set<InterventionStatus>([
      InterventionStatus.RESOLVED,
      InterventionStatus.CANCELLED,
      InterventionStatus.ON_HOLD,
    ]),
  ],
  [
    InterventionStatus.ON_HOLD,
    new Set<InterventionStatus>([
      InterventionStatus.ASSIGNED,
      InterventionStatus.IN_PROGRESS,
      InterventionStatus.CANCELLED,
    ]),
  ],
]);

const ARCHIVABLE_STATUSES = new Set<InterventionStatus>([
  InterventionStatus.RESOLVED,
  InterventionStatus.CANCELLED,
]);

const FEEDBACK_NOTIFICATION_COPY = {
  en: {
    title: "Intervention resolved",
    text: (name: string) =>
      `Intervention "${name}" has been resolved. Please leave feedback about the service.`,
  },
  bs: {
    title: "Intervencija zavrsena",
    text: (name: string) =>
      `Intervencija "${name}" je zavrsena. Molimo ostavite feedback o usluzi.`,
  },
} as const;

type FeedbackNotificationLanguage = keyof typeof FEEDBACK_NOTIFICATION_COPY;

const EXECUTION_CONFIRMATION_NOTIFICATION_COPY = {
  en: {
    title: "Digital confirmation requested",
    text: (name: string, pin: string) =>
      `Digital confirmation was requested for intervention "${name}". One-time PIN: ${pin}`,
  },
  bs: {
    title: "Zatražena digitalna potvrda",
    text: (name: string, pin: string) =>
      `Zatražena je digitalna potvrda za intervenciju "${name}". Jednokratni PIN: ${pin}`,
  },
} as const;

const EXECUTION_CONFIRMATION_RESPONSE_COPY = {
  CONFIRMED: {
    en: {
      title: "Digital confirmation completed",
      text: (name: string) => `The user confirmed execution for intervention "${name}".`,
    },
    bs: {
      title: "Digitalna potvrda završena",
      text: (name: string) => `Korisnik je potvrdio izvršenje intervencije "${name}".`,
    },
  },
  REJECTED: {
    en: {
      title: "Digital confirmation rejected",
      text: (name: string, reason: string | null) =>
        `The user rejected execution confirmation for intervention "${name}".${reason ? ` Reason: ${reason}` : ""}`,
    },
    bs: {
      title: "Digitalna potvrda odbijena",
      text: (name: string, reason: string | null) =>
        `Korisnik je odbio digitalnu potvrdu za intervenciju "${name}".${reason ? ` Razlog: ${reason}` : ""}`,
    },
  },
} as const;

function normalizeFeedbackNotificationLanguage(
  language: string | null | undefined,
): FeedbackNotificationLanguage {
  return language === "bs" ? "bs" : "en";
}

function getCurrentMinute(): Date {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
}

const interventionPayloadBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must contain at least 3 characters.")
    .max(150),
  description: z.string().trim().min(1, "Description is required.").max(2000),
  location: z
    .string()
    .trim()
    .min(3, "Location must contain at least 3 characters.")
    .max(500),
  latitude: z.coerce.number().finite().min(-90).max(90).nullable().optional(),
  longitude: z.coerce.number().finite().min(-180).max(180).nullable().optional(),
  startedAt: z.coerce.date().optional(),
  dueAt: z.coerce.date().optional(),
  faultReportId: z.coerce.number().int().positive().nullable().optional(),
  companyId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  priority: z.nativeEnum(Priority),
  recurringPeriod: z.nativeEnum(RecurringPeriod).nullable().optional(),
});

const interventionPayloadSchema = interventionPayloadBaseSchema
  .refine(
    (value) => !value.startedAt || value.startedAt >= getCurrentMinute(),
    {
      path: ["startedAt"],
      message: "Planned start date cannot be in the past.",
    }
  )
  .refine((value) => !value.dueAt || value.dueAt >= getCurrentMinute(), {
    path: ["dueAt"],
    message: "Due date cannot be in the past.",
  })
  .refine(
    (value) =>
      !value.dueAt || !value.startedAt || value.dueAt >= value.startedAt,
    {
      path: ["dueAt"],
      message: "Due date must be after or equal to the planned start date.",
    }
  );

const interventionUpdatePayloadSchema = interventionPayloadBaseSchema.refine(
  (value) => !value.dueAt || !value.startedAt || value.dueAt >= value.startedAt,
  {
    path: ["dueAt"],
    message: "Due date must be after or equal to the planned start date.",
  }
);

const interventionHistoryQuerySchema = z.object({
  location: z.string().trim().min(3).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  category: z.string().trim().min(2).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
  showArchived: z.preprocess(
    (val) => val === 'true' || val === '1' || val === true,
    z.boolean(),
  ).default(false),
});

const knowledgeBaseQuerySchema = z.object({
  text: z.string().trim().min(1).max(200).optional(),
  location: z.string().trim().min(1).max(200).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

const interventionStatusUpdateSchema = z.object({
  status: z.nativeEnum(InterventionStatus),
  confirmationBypassReason: z.string().trim().min(3).max(1000).optional(),
});

const confirmationRequestSchema = z.object({});

const confirmationConfirmSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal(ExecutionConfirmationMethod.PIN),
    pin: z.string().trim().regex(/^\d{6}$/, "PIN must contain 6 digits."),
  }),
  z.object({
    method: z.literal(ExecutionConfirmationMethod.SIGNATURE),
    signatureData: z.string().trim().min(10).max(500000),
  }),
]);

const confirmationRejectSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}

function generatePin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function mapExecutionConfirmation(confirmation: {
  id?: number;
  status: ExecutionConfirmationStatus;
  method: ExecutionConfirmationMethod | null;
  requestedAt: Date | null;
  respondedAt: Date | null;
  rejectionReason: string | null;
  bypassReason: string | null;
  requestedBy?: { firstName: string; lastName: string; username: string } | null;
  confirmedBy?: { firstName: string; lastName: string; username: string } | null;
}) {
  return {
    id: confirmation.id,
    status: confirmation.status,
    method: confirmation.method,
    requestedAt: confirmation.requestedAt?.toISOString() ?? null,
    respondedAt: confirmation.respondedAt?.toISOString() ?? null,
    rejectionReason: confirmation.rejectionReason,
    bypassReason: confirmation.bypassReason,
    requestedBy: confirmation.requestedBy
      ? (`${confirmation.requestedBy.firstName} ${confirmation.requestedBy.lastName}`).trim() ||
        confirmation.requestedBy.username
      : null,
    confirmedBy: confirmation.confirmedBy
      ? (`${confirmation.confirmedBy.firstName} ${confirmation.confirmedBy.lastName}`).trim() ||
        confirmation.confirmedBy.username
      : null,
  };
}

const interventionPauseSchema = z.object({
  reason: z.nativeEnum(PauseReason),
  otherReason: z.string().trim().max(1000).optional().nullable(),
  responsibleUserId: z.coerce.number().int().positive().optional().nullable(),
}).refine((value) => value.reason !== PauseReason.OTHER || Boolean(value.otherReason?.trim()), {
  path: ["otherReason"],
  message: "Additional explanation is required when reason is Other.",
});

const interventionResumeSchema = z.object({
  note: z.string().trim().max(1000).optional().nullable(),
});

const reopenRequestSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Reason is required.")
    .max(2000),
  comment: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable(),
});

const rejectReopenRequestSchema = z.object({
  coordinatorComment: z
    .string()
    .trim()
    .min(5, "Comment is required.")
    .max(2000),
});

function parseInterventionId(rawId: string | string[] | undefined): number {
  if (typeof rawId !== "string") {
    throw new BadRequestError("Invalid intervention identifier.", [
      { field: "id", message: "Intervention id must be a positive integer." },
    ]);
  }

  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError("Invalid intervention identifier.", [
      { field: "id", message: "Intervention id must be a positive integer." },
    ]);
  }

  return id;
}

function hasAnyRole(req: Request, roles: string[]): boolean {
  const allowedRoles = new Set(roles.map((role) => role.toLowerCase()));
  return (req.user?.roles ?? []).some((role) =>
    allowedRoles.has(role.toLowerCase()),
  );
}

const authorizeInterventionAccess = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (hasAnyRole(req, INTERVENTION_VIEW_ROLES)) {
      return next();
    }

    const localUserId = req.user?.localUserId;

    if (!localUserId) {
      throw new ForbiddenError("You do not have permission to access this intervention.");
    }

    const id = parseInterventionId(req.params.id);
    const accessibleIntervention = await prisma.intervention.findFirst({
      where: {
        id,
        OR: [
          {
            faultReport: {
              is: {
                userId: localUserId,
              },
            },
          },
          {
            assignments: {
              some: {
                userId: localUserId,
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    if (!accessibleIntervention) {
      throw new ForbiddenError("You do not have permission to access this intervention.");
    }

    return next();
  },
);

async function resolveCreator(req: Request) {
  const username = req.user?.username?.trim();
  const providerSubject = req.user?.id?.trim();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(providerSubject
          ? [
              {
                externalIdentities: {
                  some: {
                    provider: "keycloak",
                    providerSubject,
                  },
                },
              },
            ]
          : []),
        ...(username ? [{ username }] : []),
      ],
    },
    select: { id: true, username: true },
  });

  if (!user) {
    throw new ForbiddenError(
      "Authenticated coordinator is not linked to a local user record.",
    );
  }

  return user;
}

async function ensurePausePermission(req: Request, interventionId: number) {
  if (hasAnyRole(req, COORDINATOR_ACTION_ROLES)) {
    return;
  }

  const localUserId = req.user?.localUserId;
  if (!localUserId) {
    throw new ForbiddenError("You do not have permission to pause this intervention.");
  }

  const assignment = await prisma.assignment.findFirst({
    where: { interventionId, userId: localUserId },
    select: { id: true },
  });

  if (!assignment) {
    throw new ForbiddenError("Only assigned servicers can pause this intervention.");
  }
}

function mapPauseReason(reason: PauseReason): string {
  const labels: Record<PauseReason, string> = {
    [PauseReason.WAITING_FOR_CUSTOMER]: "Waiting for customer",
    [PauseReason.WAITING_FOR_MATERIAL]: "Waiting for material",
    [PauseReason.WAITING_FOR_EXTERNAL_CONTRACTOR]: "Waiting for external contractor",
    [PauseReason.WAITING_FOR_APPROVAL]: "Waiting for approval",
    [PauseReason.OTHER]: "Other",
  };

  return labels[reason];
}

async function resolvePlanningContext(
  input: z.infer<typeof interventionPayloadSchema>,
) {
  if (input.faultReportId) {
    const faultReport = await prisma.faultReport.findUnique({
      where: { id: input.faultReportId },
      select: {
        id: true,
        companyId: true,
        categoryId: true,
        location: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!faultReport) {
      throw new NotFoundError("Fault report not found.");
    }

    return {
      companyId: faultReport.companyId,
      categoryId: faultReport.categoryId,
      latitude: faultReport.latitude,
      longitude: faultReport.longitude,
    };
  }

  if (!input.companyId) {
    throw new BadRequestError("Company is required for planned maintenance.", [
      {
        field: "companyId",
        message: "Company is required when no fault report is selected.",
      },
    ]);
  }

  if (!input.categoryId) {
    throw new BadRequestError("Category is required for planned maintenance.", [
      {
        field: "categoryId",
        message: "Category is required when no fault report is selected.",
      },
    ]);
  }

  const [company, category] = await Promise.all([
    prisma.company.findUnique({
      where: { id: input.companyId },
      select: { id: true },
    }),
    prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true, active: true },
    }),
  ]);

  if (!company) {
    throw new NotFoundError("Company not found.");
  }

  if (!category || !category.active) {
    throw new NotFoundError("Active category not found.");
  }

  return {
    companyId: input.companyId,
    categoryId: input.categoryId,
    latitude: null,
    longitude: null,
  };
}

async function calculateDueAt(
  priority: Priority,
  startedAt: Date | null | undefined,
): Promise<Date> {
  const baseDate = startedAt || new Date();
  const sla = await prisma.slaConfiguration.findUnique({
    where: { priority },
  });

  if (!sla) {
    const defaultHours = priority === Priority.CRITICAL ? 4 : 24;
    return new Date(baseDate.getTime() + defaultHours * 60 * 60 * 1000);
  }

  return new Date(baseDate.getTime() + sla.deadlineHours * 60 * 60 * 1000);
}

async function createFeedbackRequestNotificationOnce(input: {
  interventionId: number;
  interventionName: string;
  reporterUserId: number | null | undefined;
}) {
  if (!input.reporterUserId) {
    return;
  }

  if (!await shouldNotifyUser(input.reporterUserId, 'FEEDBACK_REQUEST')) {
    return;
  }

  const existingNotification = await prisma.notification.findFirst({
    where: {
      userId: input.reporterUserId,
      interventionId: input.interventionId,
      type: NotificationType.FEEDBACK_REQUEST,
    },
    select: { id: true },
  });

  if (existingNotification) {
    return;
  }

  const preferences = await prisma.userPreference.findUnique({
    where: { userId: input.reporterUserId },
    select: { language: true },
  });
  const language = normalizeFeedbackNotificationLanguage(preferences?.language);
  const copy = FEEDBACK_NOTIFICATION_COPY[language];

  await prisma.notification.create({
    data: {
      userId: input.reporterUserId,
      interventionId: input.interventionId,
      type: NotificationType.FEEDBACK_REQUEST,
      title: copy.title,
      text: copy.text(input.interventionName),
    },
  });
}

async function createExecutionConfirmationNotification(input: {
  interventionId: number;
  interventionName: string;
  reporterUserId: number | null | undefined;
  pin: string;
}): Promise<boolean> {
  if (!input.reporterUserId) {
    return false;
  }

  if (!await shouldNotifyUser(input.reporterUserId, 'EXECUTION_CONFIRMATION_REQUEST')) {
    return false;
  }

  const preferences = await prisma.userPreference.findUnique({
    where: { userId: input.reporterUserId },
    select: { language: true },
  });
  const language = normalizeFeedbackNotificationLanguage(preferences?.language);
  const copy = EXECUTION_CONFIRMATION_NOTIFICATION_COPY[language];

  const notification = await prisma.notification.create({
    data: {
      userId: input.reporterUserId,
      interventionId: input.interventionId,
      type: NotificationType.EXECUTION_CONFIRMATION_REQUEST,
      title: copy.title,
      text: copy.text(input.interventionName, input.pin),
    },
  });
  emitToUser(input.reporterUserId, "notification:new", notification);

  return true;
}

async function notifyServicersAboutExecutionConfirmationResponse(input: {
  interventionId: number;
  interventionName: string;
  status: "CONFIRMED" | "REJECTED";
  rejectionReason?: string | null;
}) {
  const assignments = await prisma.assignment.findMany({
    where: { interventionId: input.interventionId },
    select: { userId: true },
  });
  const userIds = [...new Set(assignments.map((assignment) => assignment.userId))];

  await Promise.all(userIds.map(async (userId) => {
    if (!await shouldNotifyUser(userId, 'EXECUTION_CONFIRMATION_RESPONSE')) {
      return;
    }

    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
      select: { language: true },
    });
    const language = normalizeFeedbackNotificationLanguage(preferences?.language);
    const copy = EXECUTION_CONFIRMATION_RESPONSE_COPY[input.status][language];
    const text = input.status === "REJECTED"
      ? EXECUTION_CONFIRMATION_RESPONSE_COPY.REJECTED[language].text(
          input.interventionName,
          input.rejectionReason ?? null,
        )
      : EXECUTION_CONFIRMATION_RESPONSE_COPY.CONFIRMED[language].text(input.interventionName);

    const notification = await prisma.notification.create({
      data: {
        userId,
        interventionId: input.interventionId,
        type: NotificationType.EXECUTION_CONFIRMATION_RESPONSE,
        title: copy.title,
        text,
      },
    });
    emitToUser(userId, "notification:new", notification);
  }));
}

function isOverdue(intervention: { status: InterventionStatus; dueAt: Date | null }): boolean {
  if (
    !intervention.dueAt ||
    intervention.status === InterventionStatus.RESOLVED ||
    intervention.status === InterventionStatus.CANCELLED
  ) {
    return false;
  }
  return new Date() > intervention.dueAt;
}

function mapIntervention(intervention: {
  id: number;
  name: string;
  description: string;
  location: string;
  latitude?: any;
  longitude?: any;
  priority: Priority;
  status: InterventionStatus;
  type: InterventionType;
  createdAt: Date;
  startedAt: Date | null;
  dueAt: Date | null;
  recurringPeriod?: RecurringPeriod | null;
  category: { id: number; name: string };
  company: { id: number; name: string };
  creator: { username: string; id: number; firstName: string; lastName: string };
  faultReport: {
    id: number;
    description: string;
    reportedAt: Date;
    user: { id: number; firstName: string; lastName: string; username: string } | null;
  } | null;
  assignments?: Array<{
    id: number;
    userId: number;
    assignedAt: Date;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      username: string;
      email: string;
    };
  }>;
  dispatchedAt?: Date | null;
  arrivedAt?: Date | null;
  fieldWorkEndedAt?: Date | null;
  executionConfirmation?: {
    id: number;
    status: ExecutionConfirmationStatus;
    method: ExecutionConfirmationMethod | null;
    requestedAt: Date;
    respondedAt: Date | null;
    rejectionReason: string | null;
    bypassReason: string | null;
    requestedBy: { firstName: string; lastName: string; username: string } | null;
    confirmedBy: { firstName: string; lastName: string; username: string } | null;
  } | null;
  pauses?: Array<{
    id: number;
    reason: PauseReason;
    otherReason: string | null;
    previousStatus: InterventionStatus;
    pausedAt: Date;
    resumedAt: Date | null;
    resumeNote: string | null;
    pausedBy: { id: number; firstName: string; lastName: string; username: string };
    responsibleUser: { id: number; firstName: string; lastName: string; username: string } | null;
  }>;
}) {
  const overdue = isOverdue({ status: intervention.status, dueAt: intervention.dueAt });
  return {
    id: String(intervention.id),
    title: intervention.name,
    name: intervention.name,
    description: intervention.description,
    location: compactStoredLocation(intervention.location),
    latitude: intervention.latitude === null || intervention.latitude === undefined ? null : Number(intervention.latitude),
    longitude: intervention.longitude === null || intervention.longitude === undefined ? null : Number(intervention.longitude),
    categoryId: intervention.category.id,
    categoryName: intervention.category.name,
    companyId: intervention.company.id,
    companyName: intervention.company.name,
    priority: intervention.priority,
    status: intervention.status,
    type: intervention.type,
    owner: (`${intervention.creator.firstName ?? ''} ${intervention.creator.lastName ?? ''}`).trim() || intervention.creator.username,
    ownerId: intervention.creator.id,
    createdAt: intervention.createdAt.toISOString(),
    startedAt: intervention.startedAt?.toISOString() ?? null,
    dueAt: intervention.dueAt?.toISOString() ?? null,
    isOverdue: overdue,
    faultReport: intervention.faultReport
      ? {
          id: intervention.faultReport.id,
          description: intervention.faultReport.description,
          reportedAt: intervention.faultReport.reportedAt.toISOString(),
          reporterUser: intervention.faultReport.user
            ? {
                id: intervention.faultReport.user.id,
                firstName: intervention.faultReport.user.firstName,
                lastName: intervention.faultReport.user.lastName,
                username: intervention.faultReport.user.username,
              }
            : null,
        }
      : null,
    recurringPeriod: intervention.recurringPeriod ?? null,
    dispatchedAt: intervention.dispatchedAt?.toISOString() ?? null,
    arrivedAt: intervention.arrivedAt?.toISOString() ?? null,
    fieldWorkEndedAt: intervention.fieldWorkEndedAt?.toISOString() ?? null,
    assignments:
      intervention.assignments?.map((assignment) => ({
        id: assignment.id,
        userId: assignment.userId,
        user: {
          id: assignment.user.id,
          firstName: assignment.user.firstName,
          lastName: assignment.user.lastName,
          username: assignment.user.username,
          email: assignment.user.email,
        },
        assignedAt: assignment.assignedAt.toISOString(),
      })) ?? [],
    executionConfirmation: intervention.executionConfirmation
      ? mapExecutionConfirmation(intervention.executionConfirmation)
      : mapExecutionConfirmation({
          status: ExecutionConfirmationStatus.NOT_REQUESTED,
          method: null,
          requestedAt: null,
          respondedAt: null,
          rejectionReason: null,
          bypassReason: null,
          requestedBy: null,
          confirmedBy: null,
        }),
    pauses:
      intervention.pauses?.map((pause) => ({
        id: pause.id,
        reason: pause.reason,
        otherReason: pause.otherReason,
        previousStatus: pause.previousStatus,
        pausedAt: pause.pausedAt.toISOString(),
        resumedAt: pause.resumedAt?.toISOString() ?? null,
        resumeNote: pause.resumeNote,
        pausedBy: pause.pausedBy,
        responsibleUser: pause.responsibleUser,
      })) ?? [],
  };
}

function buildLocationSearchTerm(location: string): string | null {
  const compact = compactStoredLocation(location).trim();
  if (compact.length < 3) {
    return null;
  }
  return compact.length > 80 ? compact.slice(0, 80) : compact;
}

function mapKnowledgeSolution(report: {
  id: number;
  description: string;
  material: string | null;
  notes: string | null;
  reportDate: Date;
  isRecommended: boolean;
  recommendedAt: Date | null;
  intervention: {
    id: number;
    name: string;
    description: string;
    location: string;
    createdAt: Date;
    category: { id: number; name: string };
  };
}) {
  return {
    reportId: report.id,
    title: report.intervention.name,
    problemDescription: report.intervention.description,
    solution: report.description,
    material: report.material,
    notes: report.notes,
    locationHint: compactStoredLocation(report.intervention.location),
    categoryId: report.intervention.category.id,
    categoryName: report.intervention.category.name,
    reportDate: report.reportDate.toISOString(),
    interventionDate: report.intervention.createdAt.toISOString(),
    isRecommended: report.isRecommended,
    recommendedAt: report.recommendedAt?.toISOString() ?? null,
  };
}

const interventionInclude = {
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  company: {
    select: {
      id: true,
      name: true,
    },
  },
  creator: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
    },
  },
  faultReport: {
    select: {
      id: true,
      description: true,
      reportedAt: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
    },
  },
  assignments: {
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
        },
      },
    },
  },
  executionConfirmation: {
    select: {
      id: true,
      status: true,
      method: true,
      requestedAt: true,
      respondedAt: true,
      rejectionReason: true,
      bypassReason: true,
      requestedBy: {
        select: {
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      confirmedBy: {
        select: {
          firstName: true,
          lastName: true,
          username: true,
        },
      },
    },
  },
  pauses: {
    orderBy: { pausedAt: "desc" },
    include: {
      pausedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      responsibleUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
    },
  },
} as const;

// ─── ROUTES ──────────────────────────────────────────────────────────────────

interventionsRouter.get(
  "/options",
  authorizeRoles(COORDINATOR_ACTION_ROLES),
  asyncHandler(async (_req, res) => {
    const [companies, categories, faultReports] = await Promise.all([
      prisma.company.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.category.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.faultReport.findMany({
        orderBy: { reportedAt: "desc" },
        select: {
          id: true,
          description: true,
          location: true,
          reportedAt: true,
          company: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      }),
    ]);

    res.json({
      companies,
      categories,
      faultReports: faultReports.map((faultReport) => ({
        ...faultReport,
        reportedAt: faultReport.reportedAt.toISOString(),
      })),
    });
  }),
);

interventionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const localUserId = req.user?.localUserId;
    const hasOperationalView = hasAnyRole(req, INTERVENTION_VIEW_ROLES);

    if (!hasOperationalView && !localUserId) {
      throw new ForbiddenError("You do not have permission to access interventions.");
    }

    const interventions = await prisma.intervention.findMany({
      where: {
        archived: false,
        status: {
          in: [
            InterventionStatus.NEW,
            InterventionStatus.ASSIGNED,
            InterventionStatus.IN_PROGRESS,
            InterventionStatus.ON_HOLD,
          ],
        },
        ...(hasOperationalView
          ? {}
          : {
              OR: [
                {
                  faultReport: {
                    is: {
                      userId: localUserId,
                    },
                  },
                },
                {
                  assignments: {
                    some: {
                      userId: localUserId,
                    },
                  },
                },
              ],
            }),
      },
      include: interventionInclude,
    });

    const priorityRank: Record<Priority, number> = {
      [Priority.CRITICAL]: 4,
      [Priority.HIGH]: 3,
      [Priority.MEDIUM]: 2,
      [Priority.LOW]: 1,
    };

    const sortedInterventions = [...interventions].sort((a, b) => {
      const rankA = priorityRank[a.priority] || 0;
      const rankB = priorityRank[b.priority] || 0;
      if (rankA !== rankB) {
        return rankB - rankA;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    res.json(sortedInterventions.map(mapIntervention));
  }),
);

interventionsRouter.get(
  '/export/pdf',
  asyncHandler(async (req, res) => {
    const localUserId = req.user?.localUserId;
    const hasOperationalView = hasAnyRole(req, INTERVENTION_VIEW_ROLES);

    if (!hasOperationalView && !localUserId) {
      throw new ForbiddenError('You do not have permission to export interventions.');
    }

    const where = {
      archived: false,
      status: {
        in: [
          InterventionStatus.NEW,
          InterventionStatus.ASSIGNED,
          InterventionStatus.IN_PROGRESS,
        ],
      },
      ...(hasOperationalView
        ? {}
        : {
            OR: [
              { faultReport: { is: { userId: localUserId } } },
              { assignments: { some: { userId: localUserId } } },
            ],
          }),
    };

    const interventions = await prisma.intervention.findMany({
      where,
      select: {
        id: true,
        name: true,
        priority: true,
        status: true,
        location: true,
        createdAt: true,
        startedAt: true,
        dueAt: true,
        assignments: {
          select: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    const language = req.query.language === 'bs' ? 'bs' : 'en';

    const rows: InterventionPdfRow[] = interventions.map((i) => ({
      name: i.name,
      priority: String(i.priority),
      status: String(i.status),
      location: compactStoredLocation(i.location),
      servicers:
        i.assignments && i.assignments.length > 0
          ? i.assignments
              .map((a) => `${a.user.firstName} ${a.user.lastName}`.trim())
              .join(', ')
          : language === 'bs' ? 'Nedodijeljeno' : 'Unassigned',
      createdAt: i.createdAt?.toISOString() ?? null,
      startedAt: i.startedAt?.toISOString() ?? null,
      dueAt: i.dueAt?.toISOString() ?? null,
    }));

    const pdfBuffer = await generateInterventionsPdf(rows, { language });

    res.setHeader('Content-Type', 'application/pdf');
    const filenamePrefix = language === 'bs' ? 'intervencije' : 'interventions';
    const filename = `${filenamePrefix}-${new Date().toISOString().slice(0,10)}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(pdfBuffer);
  }),
);

interventionsRouter.get(
  "/history",
  authorizeRoles(INTERVENTION_HISTORY_ROLES),
  asyncHandler(async (req, res) => {
    const query = interventionHistoryQuerySchema.parse(req.query);
    const page = query.page;
    const pageSize = query.pageSize;
    const where = {
      AND: [
        {
          OR: [
            { status: InterventionStatus.RESOLVED },
            { status: InterventionStatus.CANCELLED },
          ],
        },
        query.showArchived ? {} : { archived: false },
        query.location
          ? {
              location: {
                contains: query.location,
              },
            }
          : {},
        query.categoryId ? { categoryId: query.categoryId } : {},
        query.category
          ? {
              category: {
                is: {
                  name: {
                    contains: query.category,
                  },
                },
              },
            }
          : {},
      ],
    };

    const [history, total] = await Promise.all([
      prisma.intervention.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          description: true,
          location: true,
          status: true,
          priority: true,
          createdAt: true,
          archived: true,
          executionConfirmation: {
            select: {
              status: true,
              method: true,
              respondedAt: true,
              rejectionReason: true,
              bypassReason: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          assignments: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      prisma.intervention.count({ where }),
    ]);

    res.json({
      message:
        history.length === 0
          ? "No previous interventions match the selected location or category."
          : "Intervention history loaded successfully.",
      data: history.map((intervention) => ({
        id: String(intervention.id),
        date: intervention.createdAt.toISOString(),
        status: intervention.status,
        priority: intervention.priority,
        location: compactStoredLocation(intervention.location),
        categoryId: intervention.category.id,
        categoryName: intervention.category.name,
        archived: intervention.archived,
        summary:
          intervention.description.length > 120
            ? `${intervention.description.slice(0, 120)}...`
            : intervention.description,
        servicer:
          intervention.assignments.length > 0
            ? intervention.assignments
                .map(
                  (assignment) =>
                    `${assignment.user.firstName} ${assignment.user.lastName}`,
                )
                .join(", ")
            : "Unassigned",
        executionConfirmation: intervention.executionConfirmation
          ? {
              status: intervention.executionConfirmation.status,
              method: intervention.executionConfirmation.method,
              respondedAt: intervention.executionConfirmation.respondedAt?.toISOString() ?? null,
              rejectionReason: intervention.executionConfirmation.rejectionReason,
              bypassReason: intervention.executionConfirmation.bypassReason,
            }
          : {
              status: ExecutionConfirmationStatus.NOT_REQUESTED,
              method: null,
              respondedAt: null,
              rejectionReason: null,
              bypassReason: null,
            },
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  }),
);

interventionsRouter.post(
  "/",
  authorizeRoles(COORDINATOR_ACTION_ROLES),
  validate(interventionPayloadSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof interventionPayloadSchema>;

    if (input.faultReportId !== null && input.faultReportId !== undefined) {
      throw new BadRequestError(
        "Interventions linked to fault reports are created automatically.",
        [
          {
            field: "faultReportId",
            message: "Fault report interventions are created automatically.",
          },
        ],
      );
    }

    const creator = await resolveCreator(req);
    const context = await resolvePlanningContext(input);
    const resolvedLocation = await resolvePersistableLocation({
      location: input.location,
      latitude: input.latitude ?? (context.latitude === null ? null : Number(context.latitude)),
      longitude: input.longitude ?? (context.longitude === null ? null : Number(context.longitude)),
      required: true,
    });

    const recurringPeriod = input.recurringPeriod ?? null;
    const plannedStart = input.startedAt ?? null;
    const nextGenerationAt = recurringPeriod
      ? computeNextGenerationAt(plannedStart ?? new Date(), recurringPeriod)
      : null;

    const intervention = await prisma.intervention.create({
      data: {
        name: input.name,
        description: input.description,
        location: resolvedLocation.location,
        latitude: resolvedLocation.latitude,
        longitude: resolvedLocation.longitude,
        priority: input.priority,
        status: InterventionStatus.NEW,
        type: InterventionType.PREVENTIVE,
        startedAt: plannedStart,
        dueAt: input.dueAt ?? await calculateDueAt(input.priority, plannedStart),
        recurringPeriod,
        nextGenerationAt,
        categoryId: context.categoryId,
        companyId: context.companyId,
        creatorId: creator.id,
        faultReportId: null,
      },
      include: interventionInclude,
    });

    res.status(HTTP_STATUS.CREATED).json(mapIntervention(intervention));
  }),
);

// ─── REOPEN REQUESTS (mora biti PRIJE /:id ruta) ──────────────────────────────

interventionsRouter.get(
  "/reopen-requests",
  authorizeRoles(COORDINATOR_ACTION_ROLES),
  asyncHandler(async (_req, res) => {
    const requests = await prisma.interventionReopenRequest.findMany({
      include: {
        intervention: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(requests);
  }),
);

interventionsRouter.patch(
  "/reopen-requests/:requestId/approve",
  authorizeRoles(COORDINATOR_ACTION_ROLES),
  asyncHandler(async (req, res) => {
    const requestId = Number(req.params.requestId);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      throw new BadRequestError("Invalid request identifier.");
    }

    const actor = await resolveCreator(req);

    const request = await prisma.interventionReopenRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError("Reopen request not found.");
    }

    if (request.status !== "PENDING") {
      throw new BadRequestError("Request has already been processed.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.interventionReopenRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          resolvedAt: new Date(),
        },
      });

      await tx.intervention.update({
        where: { id: request.interventionId },
        data: { status: InterventionStatus.ASSIGNED },
      });

      await tx.statusHistory.create({
        data: {
          interventionId: request.interventionId,
          authorId: actor.id,
          oldStatus: InterventionStatus.RESOLVED,
          newStatus: InterventionStatus.ASSIGNED,
        },
      });
    });

    const assignments = await prisma.assignment.findMany({
      where: { interventionId: request.interventionId },
      select: { userId: true },
    });

    for (const assignment of assignments) {
      await prisma.notification.create({
        data: {
          userId: assignment.userId,
          interventionId: request.interventionId,
          type: NotificationType.REOPEN_APPROVED,
          title: "Intervention reopened",
          text: "The intervention has been reopened and requires further work.",
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: request.requesterId,
        interventionId: request.interventionId,
        type: NotificationType.REOPEN_APPROVED,
        title: "Reopen request approved",
        text: "Your request for reopening has been approved.",
      },
    });

    await AuditService.record({
      action: "REOPEN_REQUEST_APPROVED",
      entity: "Intervention",
      entityId: String(request.interventionId),
      actorId: actor.id,
      actorUsername: actor.username,
      details: `Reopen request approved for intervention ${request.interventionId}`,
    });

    res.json({ message: "Reopen request approved." });
  }),
);

interventionsRouter.patch(
  "/reopen-requests/:requestId/reject",
  authorizeRoles(COORDINATOR_ACTION_ROLES),
  validate(rejectReopenRequestSchema),
  asyncHandler(async (req, res) => {
    const requestId = Number(req.params.requestId);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      throw new BadRequestError("Invalid request identifier.");
    }

    const request = await prisma.interventionReopenRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError("Reopen request not found.");
    }

    if (request.status !== "PENDING") {
      throw new BadRequestError("Request has already been processed.");
    }

    await prisma.interventionReopenRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        coordinatorComment: req.body.coordinatorComment,
        resolvedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: request.requesterId,
        interventionId: request.interventionId,
        type: NotificationType.REOPEN_REJECTED,
        title: "Reopen request rejected",
        text: req.body.coordinatorComment,
      },
    });

    const actor = await resolveCreator(req);

    await AuditService.record({
      action: "REOPEN_REQUEST_REJECTED",
      entity: "Intervention",
      entityId: String(request.interventionId),
      actorId: actor.id,
      actorUsername: actor.username,
      details: req.body.coordinatorComment,
    });

    res.json({ message: "Reopen request rejected." });
  }),
);

// ─── /:id ROUTES ──────────────────────────────────────────────────────────────

interventionsRouter.post(
  "/:id/pause",
  authorizeRoles(INTERVENTION_STATUS_ROLES),
  validate(interventionPauseSchema),
  asyncHandler(async (req, res) => {
    const id = parseInterventionId(req.params.id);
    await ensurePausePermission(req, id);
    const actor = await resolveCreator(req);
    const input = req.body as z.infer<typeof interventionPauseSchema>;

    const existing = await prisma.intervention.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        startedAt: true,
        archived: true,
        faultReport: {
          select: { userId: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError("Intervention not found.");
    }

    if (existing.archived) {
      throw new ForbiddenError("Archived interventions cannot be paused.");
    }

    if (!PAUSABLE_STATUSES.has(existing.status)) {
      throw new ForbiddenError("Only assigned or in-progress interventions can be paused.");
    }

    const activePause = await prisma.interventionPause.findFirst({
      where: { interventionId: id, resumedAt: null },
      select: { id: true },
    });

    if (activePause) {
      throw new BadRequestError("Intervention is already paused.");
    }

    const { intervention, pause } = await prisma.$transaction(async (tx) => {
      const pauseRecord = await tx.interventionPause.create({
        data: {
          interventionId: id,
          pausedById: actor.id,
          responsibleUserId: input.responsibleUserId ?? actor.id,
          reason: input.reason,
          otherReason: input.reason === PauseReason.OTHER ? input.otherReason?.trim() ?? null : null,
          previousStatus: existing.status,
        },
      });
      await tx.statusHistory.create({
        data: {
          interventionId: id,
          authorId: actor.id,
          oldStatus: existing.status,
          newStatus: InterventionStatus.ON_HOLD,
        },
      });
      const updatedIntervention = await tx.intervention.update({
        where: { id },
        data: { status: InterventionStatus.ON_HOLD },
        include: interventionInclude,
      });

      return { intervention: updatedIntervention, pause: pauseRecord };
    });

    await AuditService.record({
      action: "INTERVENTION_PAUSED",
      entity: "Intervention",
      entityId: id,
      actorId: actor.id,
      actorUsername: actor.username,
      details: `Intervention #${id} paused. Reason: ${mapPauseReason(input.reason)}.`,
      newValues: {
        pauseId: pause.id,
        reason: input.reason,
        otherReason: input.otherReason ?? null,
        previousStatus: existing.status,
      },
    });

    if (input.reason === PauseReason.WAITING_FOR_CUSTOMER && existing.faultReport?.userId) {
      if (await shouldNotifyUser(existing.faultReport.userId, 'INTERVENTION_PAUSED')) {
        await prisma.notification.create({
          data: {
            userId: existing.faultReport.userId,
            title: "Intervention paused",
            text: `Intervention "${existing.name}" is waiting for your input before work can continue.`,
            type: NotificationType.INTERVENTION_PAUSED,
            interventionId: id,
          },
        });
      }
    }

    res.json(mapIntervention(intervention));
  }),
);

interventionsRouter.post(
  "/:id/resume",
  authorizeRoles(INTERVENTION_STATUS_ROLES),
  validate(interventionResumeSchema),
  asyncHandler(async (req, res) => {
    const id = parseInterventionId(req.params.id);
    await ensurePausePermission(req, id);
    const actor = await resolveCreator(req);
    const input = req.body as z.infer<typeof interventionResumeSchema>;

    const existing = await prisma.intervention.findUnique({
      where: { id },
      select: { id: true, status: true, archived: true },
    });

    if (!existing) {
      throw new NotFoundError("Intervention not found.");
    }

    if (existing.archived) {
      throw new ForbiddenError("Archived interventions cannot be resumed.");
    }

    if (existing.status !== InterventionStatus.ON_HOLD) {
      throw new ForbiddenError("Only paused interventions can be resumed.");
    }

    const activePause = await prisma.interventionPause.findFirst({
      where: { interventionId: id, resumedAt: null },
      select: { id: true, previousStatus: true },
      orderBy: { pausedAt: "desc" },
    });

    if (!activePause) {
      throw new BadRequestError("Active pause record was not found.");
    }

    const nextStatus =
      activePause.previousStatus === InterventionStatus.ASSIGNED ||
      activePause.previousStatus === InterventionStatus.IN_PROGRESS
        ? activePause.previousStatus
        : InterventionStatus.IN_PROGRESS;

    const intervention = await prisma.$transaction(async (tx) => {
      await tx.interventionPause.update({
        where: { id: activePause.id },
        data: {
          resumedAt: new Date(),
          resumedById: actor.id,
          resumeNote: input.note?.trim() || null,
        },
      });
      await tx.statusHistory.create({
        data: {
          interventionId: id,
          authorId: actor.id,
          oldStatus: InterventionStatus.ON_HOLD,
          newStatus: nextStatus,
        },
      });
      return tx.intervention.update({
        where: { id },
        data: { status: nextStatus },
        include: interventionInclude,
      });
    });

    await AuditService.record({
      action: "INTERVENTION_RESUMED",
      entity: "Intervention",
      entityId: id,
      actorId: actor.id,
      actorUsername: actor.username,
      details: `Intervention #${id} resumed.`,
      newValues: {
        pauseId: activePause.id,
        status: nextStatus,
        note: input.note ?? null,
      },
    });

    res.json(mapIntervention(intervention));
  }),
);

interventionsRouter.patch(
  "/:id/status",
  authorizeRoles(INTERVENTION_STATUS_ROLES),
  validate(interventionStatusUpdateSchema),
  asyncHandler(async (req, res) => {
    const id = parseInterventionId(req.params.id);
    const input = req.body as z.infer<typeof interventionStatusUpdateSchema>;

    const existing = await prisma.intervention.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        startedAt: true,
        archived: true,
        executionConfirmation: {
          select: {
            status: true,
          },
        },
        faultReport: {
          select: { userId: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError("Intervention not found.");
    }

    if (existing.archived) {
      throw new ForbiddenError("Archived interventions cannot have their status changed.");
    }

    if (input.status === InterventionStatus.ON_HOLD) {
      throw new BadRequestError("Use the pause action to put an intervention on hold.");
    }

    const allowedTargets = ALLOWED_STATUS_TRANSITIONS.get(existing.status);

    if (!allowedTargets?.has(input.status)) {
      throw new ForbiddenError(
        "Intervention status cannot be changed in the requested direction.",
      );
    }

    const actor = await resolveCreator(req);
    const closesIntervention = input.status === InterventionStatus.RESOLVED;
    const hasUserConfirmation =
      existing.executionConfirmation?.status === ExecutionConfirmationStatus.CONFIRMED;

    if (closesIntervention && !hasUserConfirmation && !input.confirmationBypassReason?.trim()) {
      throw new BadRequestError(
        "Closing an intervention without user confirmation requires a comment.",
        [
          {
            field: "confirmationBypassReason",
            message: "Comment is required when closing without digital confirmation.",
          },
        ],
      );
    }

    const intervention = await prisma.$transaction(async (tx) => {
      if (closesIntervention && !hasUserConfirmation) {
        await tx.executionConfirmation.upsert({
          where: { interventionId: id },
          create: {
            interventionId: id,
            requestedById: actor.id,
            status: ExecutionConfirmationStatus.CLOSED_WITHOUT_CONFIRMATION,
            method: ExecutionConfirmationMethod.NONE,
            bypassReason: input.confirmationBypassReason!.trim(),
            respondedAt: new Date(),
          },
          update: {
            status: ExecutionConfirmationStatus.CLOSED_WITHOUT_CONFIRMATION,
            method: ExecutionConfirmationMethod.NONE,
            pinHash: null,
            signatureData: null,
            rejectionReason: null,
            bypassReason: input.confirmationBypassReason!.trim(),
            respondedAt: new Date(),
          },
        });
      }

      const updatedIntervention = await tx.intervention.update({
        where: { id },
        data: {
          status: input.status,
          ...(input.status === InterventionStatus.IN_PROGRESS && !existing.startedAt
            ? { startedAt: new Date() }
            : {}),
        },
        include: interventionInclude,
      });

      await tx.statusHistory.create({
        data: {
          interventionId: id,
          authorId: actor.id,
          oldStatus: existing.status,
          newStatus: input.status,
        },
      });

      return updatedIntervention;
    });

    if (input.status === InterventionStatus.RESOLVED) {
      await createFeedbackRequestNotificationOnce({
        interventionId: id,
        interventionName: existing.name,
        reporterUserId: existing.faultReport?.userId,
      });
    }

    res.json(mapIntervention(intervention));
  }),
);

interventionsRouter.post(
  "/:id/reopen-request",
  validate(reopenRequestSchema),
  asyncHandler(async (req, res) => {
    const id = parseInterventionId(req.params.id);

    const userId = req.user?.localUserId;

    if (!userId) {
      throw new ForbiddenError("User not found.");
    }

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      include: {
        faultReport: {
          select: { userId: true },
        },
      },
    });

    if (!intervention) {
      throw new NotFoundError("Intervention not found.");
    }

    if (intervention.faultReport?.userId !== userId) {
      throw new ForbiddenError("Only the reporting user can request reopening.");
    }

    if (intervention.status !== InterventionStatus.RESOLVED) {
      throw new ForbiddenError("Only resolved interventions can be reopened.");
    }

    const existingRequest = await prisma.interventionReopenRequest.findFirst({
      where: {
        interventionId: id,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      throw new BadRequestError("An active reopen request already exists.");
    }

    const request = await prisma.interventionReopenRequest.create({
      data: {
        interventionId: id,
        requesterId: userId,
        reason: req.body.reason,
        comment: req.body.comment ?? null,
      },
    });

    const actor = await resolveCreator(req);

    await AuditService.record({
      action: "REOPEN_REQUEST_CREATED",
      entity: "Intervention",
      entityId: String(id),
      actorId: actor.id,
      actorUsername: actor.username,
      details: req.body.reason,
    });

    res.status(201).json(request);
  }),
);

interventionsRouter.patch(
  "/:id/recurrence",
  authorizeRoles(COORDINATOR_ACTION_ROLES),
  validate(z.object({ recurringPeriod: z.nativeEnum(RecurringPeriod).nullable() })),
  asyncHandler(async (req, res) => {
    const id = parseInterventionId(req.params.id);
    const input = req.body as { recurringPeriod: RecurringPeriod | null };

    const existing = await prisma.intervention.findUnique({
      where: { id },
      select: { id: true, startedAt: true },
    });

    if (!existing) {
      throw new NotFoundError("Intervention not found.");
    }

    const nextGenerationAt =
      input.recurringPeriod && existing.startedAt
        ? computeNextGenerationAt(existing.startedAt, input.recurringPeriod)
        : null;

    const intervention = await prisma.intervention.update({
      where: { id },
      data: {
        recurringPeriod: input.recurringPeriod,
        nextGenerationAt,
      },
      include: interventionInclude,
    });

    res.json(mapIntervention(intervention));
  }),
);

interventionsRouter.post(
  "/:id/confirmation/request",
  authorizeRoles(INTERVENTION_STATUS_ROLES),
  validate(confirmationRequestSchema),
  asyncHandler(async (req, res) => {
    const id = parseInterventionId(req.params.id);

    const existing = await prisma.intervention.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        archived: true,
        faultReport: {
          select: {
            userId: true,
          },
        },
        executionConfirmation: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError("Intervention not found.");
    }

    if (existing.archived) {
      throw new ForbiddenError("Archived interventions cannot request execution confirmation.");
    }

    if (existing.status !== InterventionStatus.IN_PROGRESS) {
      throw new ForbiddenError(
        "Execution confirmation can be requested only while the intervention is in progress.",
      );
    }

    if (existing.executionConfirmation?.status === ExecutionConfirmationStatus.CONFIRMED) {
      throw new ForbiddenError("Execution confirmation has already been confirmed.");
    }

    const actor = await resolveCreator(req);
    const pin = generatePin();
    const confirmation = await prisma.executionConfirmation.upsert({
      where: { interventionId: id },
      create: {
        interventionId: id,
        requestedById: actor.id,
        status: ExecutionConfirmationStatus.PENDING,
        pinHash: hashPin(pin),
        requestedAt: new Date(),
      },
      update: {
        requestedById: actor.id,
        confirmedById: null,
        status: ExecutionConfirmationStatus.PENDING,
        method: null,
        pinHash: hashPin(pin),
        signatureData: null,
        rejectionReason: null,
        bypassReason: null,
        requestedAt: new Date(),
        respondedAt: null,
      },
      select: interventionInclude.executionConfirmation.select,
    });

    const deliveredToUser = await createExecutionConfirmationNotification({
      interventionId: id,
      interventionName: existing.name,
      reporterUserId: existing.faultReport?.userId,
      pin,
    });

    res.status(HTTP_STATUS.CREATED).json({
      confirmation: mapExecutionConfirmation(confirmation),
      pin: deliveredToUser ? null : pin,
      pinDelivery: deliveredToUser ? "NOTIFICATION" : "REQUESTER",
    });
  }),
);

interventionsRouter.post(
  "/:id/confirmation/confirm",
  authorizeInterventionAccess,
  validate(confirmationConfirmSchema),
  asyncHandler(async (req, res) => {
    const id = parseInterventionId(req.params.id);
    const input = req.body as z.infer<typeof confirmationConfirmSchema>;

    const existing = await prisma.executionConfirmation.findUnique({
      where: { interventionId: id },
      select: {
        id: true,
        status: true,
        pinHash: true,
        intervention: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError("Execution confirmation request not found.");
    }

    if (existing.status !== ExecutionConfirmationStatus.PENDING) {
      throw new ForbiddenError("Execution confirmation is not pending.");
    }

    if (
      input.method === ExecutionConfirmationMethod.PIN &&
      existing.pinHash !== hashPin(input.pin)
    ) {
      throw new BadRequestError("Invalid confirmation PIN.", [
        { field: "pin", message: "PIN is not valid for this confirmation request." },
      ]);
    }

    const confirmation = await prisma.executionConfirmation.update({
      where: { interventionId: id },
      data: {
        confirmedById: req.user?.localUserId ?? null,
        status: ExecutionConfirmationStatus.CONFIRMED,
        method: input.method,
        pinHash: null,
        signatureData:
          input.method === ExecutionConfirmationMethod.SIGNATURE
            ? input.signatureData
            : null,
        rejectionReason: null,
        bypassReason: null,
        respondedAt: new Date(),
      },
      select: interventionInclude.executionConfirmation.select,
    });

    await notifyServicersAboutExecutionConfirmationResponse({
      interventionId: id,
      interventionName: existing.intervention.name,
      status: "CONFIRMED",
    });

    res.json(mapExecutionConfirmation(confirmation));
  }),
);

interventionsRouter.post(
  "/:id/confirmation/reject",
  authorizeInterventionAccess,
  validate(confirmationRejectSchema),
  asyncHandler(async (req, res) => {
    const id = parseInterventionId(req.params.id);
    const input = req.body as z.infer<typeof confirmationRejectSchema>;

    const existing = await prisma.executionConfirmation.findUnique({
      where: { interventionId: id },
      select: {
        id: true,
        status: true,
        intervention: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError("Execution confirmation request not found.");
    }

    if (existing.status !== ExecutionConfirmationStatus.PENDING) {
      throw new ForbiddenError("Execution confirmation is not pending.");
    }

    const confirmation = await prisma.executionConfirmation.update({
      where: { interventionId: id },
      data: {
        confirmedById: req.user?.localUserId ?? null,
        status: ExecutionConfirmationStatus.REJECTED,
        method: ExecutionConfirmationMethod.NONE,
        pinHash: null,
        signatureData: null,
        rejectionReason: input.reason,
        bypassReason: null,
        respondedAt: new Date(),
      },
      select: interventionInclude.executionConfirmation.select,
    });

    await notifyServicersAboutExecutionConfirmationResponse({
      interventionId: id,
      interventionName: existing.intervention.name,
      status: "REJECTED",
      rejectionReason: input.reason,
    });

    res.json(mapExecutionConfirmation(confirmation));
  }),
);

interventionsRouter.patch(
  "/:id",
  authorizeRoles(COORDINATOR_ACTION_ROLES),
  validate(interventionUpdatePayloadSchema),
  asyncHandler(async (req, res) => {
    const id = parseInterventionId(req.params.id);
    const input = req.body as z.infer<typeof interventionPayloadSchema>;

    const existing = await prisma.intervention.findUnique({
      where: { id },
      select: { id: true, status: true, priority: true, startedAt: true, dueAt: true },
    });

    if (!existing) {
      throw new NotFoundError("Intervention not found.");
    }

    if (!EDITABLE_STATUSES.has(existing.status)) {
      throw new ForbiddenError(
        "Intervention can only be edited while open or in progress.",
      );
    }

    const context = await resolvePlanningContext(input);
    const resolvedLocation = await resolvePersistableLocation({
      location: input.location,
      latitude: input.latitude ?? (context.latitude === null ? null : Number(context.latitude)),
      longitude: input.longitude ?? (context.longitude === null ? null : Number(context.longitude)),
      required: true,
    });

    const intervention = await prisma.intervention.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        location: resolvedLocation.location,
        latitude: resolvedLocation.latitude,
        longitude: resolvedLocation.longitude,
        priority: input.priority,
        startedAt: input.startedAt ?? existing.startedAt,
        type: input.faultReportId
          ? InterventionType.ISSUE
          : InterventionType.PREVENTIVE,
        dueAt:
          input.dueAt ??
          await calculateDueAt(input.priority, input.startedAt || existing.startedAt),
        categoryId: context.categoryId,
        companyId: context.companyId,
        faultReportId: input.faultReportId ?? null,
      },
      include: interventionInclude,
    });

    if (existing.priority !== input.priority) {
      const actor = await resolveCreator(req);
      AuditService.logInterventionPriorityChange(
        id,
        existing.priority,
        input.priority,
        actor.id,
        actor.username
      );
    }

    res.json(mapIntervention(intervention));
  }),
);

interventionsRouter.get(
  "/:id",
  authorizeInterventionAccess,
  asyncHandler(async (req, res) => {
    const id = parseInterventionId(req.params.id);

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      include: interventionInclude,
    });

    if (!intervention) {
      throw new NotFoundError("Intervention not found.");
    }

    res.json({ ...mapIntervention(intervention) });
  }),
);

interventionsRouter.get(
  "/:id/knowledge-base",
  authorizeRoles(INTERVENTION_HISTORY_ROLES),
  asyncHandler(async (req, res) => {
    const id = parseInterventionId(req.params.id);
    const parsedQuery = knowledgeBaseQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      throw new BadRequestError(
        "Invalid knowledge base filters.",
        parsedQuery.error.issues.map((issue) => ({
          field: issue.path.join(".") || "query",
          message: issue.message,
        })),
      );
    }
    const query = parsedQuery.data;

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      select: {
        id: true,
        categoryId: true,
        location: true,
      },
    });

    if (!intervention) {
      throw new NotFoundError("Intervention not found.");
    }

    const locationTerm = query.location
      ? buildLocationSearchTerm(query.location)
      : null;
    const textTerm = query.text?.trim();
    const categoryId = query.categoryId ?? intervention.categoryId;
    const textFilters = textTerm
      ? [
          { description: { contains: textTerm } },
          { material: { contains: textTerm } },
          { notes: { contains: textTerm } },
          { intervention: { description: { contains: textTerm } } },
          { intervention: { name: { contains: textTerm } } },
        ]
      : [];

    const reports = await prisma.report.findMany({
      where: {
        status: ReportStatus.FINALIZED,
        isRecommended: true,
        interventionId: { not: intervention.id },
        AND: [
          { intervention: { categoryId } },
          ...(locationTerm
            ? [{ intervention: { location: { contains: locationTerm } } }]
            : []),
          ...(textFilters.length > 0 ? [{ OR: textFilters }] : []),
        ],
      },
      orderBy: [
        { isRecommended: "desc" },
        { recommendedAt: "desc" },
        { reportDate: "desc" },
      ],
      take: 8,
      select: {
        id: true,
        description: true,
        material: true,
        notes: true,
        reportDate: true,
        isRecommended: true,
        recommendedAt: true,
        intervention: {
          select: {
            id: true,
            name: true,
            description: true,
            location: true,
            createdAt: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.json({
      message: "Knowledge base solutions loaded successfully.",
      data: reports.map(mapKnowledgeSolution),
    });
  }),
);

interventionsRouter.get(
  '/:id/attachments',
  authorizeInterventionAccess,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid intervention identifier.');
    }

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      select: {
        id: true,
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

    if (!intervention) {
      throw new NotFoundError('Intervention not found.');
    }

    const direct = intervention.attachments;
    const fromFaultReport = intervention.faultReport?.attachments ?? [];
    const seenIds = new Set<number>();

    const combined = [...direct, ...fromFaultReport].filter((att) => {
      if (seenIds.has(att.id)) return false;
      seenIds.add(att.id);
      return true;
    });

    res.json(combined);
  }),
);

// ─── BULK ACTIONS ─────────────────────────────────────────────────────────────
const recurrenceUpdateSchema = z.object({
  recurringPeriod: z.nativeEnum(RecurringPeriod).nullable(),
});

const fieldTrackingSchema = z.object({
  action: z.enum(["DISPATCH", "ARRIVE", "END"]),
});

interventionsRouter.patch(
  "/:id/field-tracking",
  authorizeRoles(SERVICER_ROLES),
  validate(fieldTrackingSchema),
  asyncHandler(async (req, res) => {
    const id = parseInterventionId(req.params.id);
    const input = req.body as z.infer<typeof fieldTrackingSchema>;
    const actor = await resolveCreator(req);

    const existing = await prisma.intervention.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        archived: true,
        dispatchedAt: true,
        arrivedAt: true,
        fieldWorkEndedAt: true,
        assignments: { select: { userId: true } },
      },
    });

    if (!existing) {
      throw new NotFoundError("Intervention not found.");
    }

    if (existing.archived) {
      throw new ForbiddenError("Archived interventions cannot be updated.");
    }

    const isAssigned = existing.assignments.some((a) => a.userId === actor.id);
    if (!isAssigned) {
      throw new ForbiddenError("Only assigned servicers can update field tracking.");
    }

    if (
      existing.status !== "ASSIGNED" &&
      existing.status !== "IN_PROGRESS"
    ) {
      throw new ForbiddenError("Field tracking is only available for assigned or in-progress interventions.");
    }

    const now = new Date();
    let updateData: Record<string, Date> = {};
    let notificationType: "SERVICER_DISPATCHED" | "SERVICER_ARRIVED" | null = null;
    let notificationTitle = "";
    let notificationText = "";

    if (input.action === "DISPATCH") {
      if (existing.dispatchedAt) {
        throw new BadRequestError("Dispatch time already recorded.");
      }
      updateData = { dispatchedAt: now };
      notificationType = "SERVICER_DISPATCHED";
      notificationTitle = "Serviser je na putu";
      notificationText = "Serviser je krenuo prema lokaciji intervencije.";
    } else if (input.action === "ARRIVE") {
      if (!existing.dispatchedAt) {
        throw new BadRequestError("Cannot mark arrival before dispatch.");
      }
      if (existing.arrivedAt) {
        throw new BadRequestError("Arrival time already recorded.");
      }
      updateData = { arrivedAt: now };
      notificationType = "SERVICER_ARRIVED";
      notificationTitle = "Serviser je stigao";
      notificationText = "Serviser je stigao na lokaciju intervencije.";
    } else if (input.action === "END") {
      if (!existing.arrivedAt) {
        throw new BadRequestError("Cannot mark end before arrival.");
      }
      if (existing.fieldWorkEndedAt) {
        throw new BadRequestError("Field work end time already recorded.");
      }
      updateData = { fieldWorkEndedAt: now };
    }

    const intervention = await prisma.intervention.update({
      where: { id },
      data: updateData,
      include: interventionInclude,
    });

    if (notificationType) {
      const faultReportUserId = await prisma.intervention.findUnique({
        where: { id },
        select: { faultReport: { select: { userId: true } } },
      });
      const reporterUserId = faultReportUserId?.faultReport?.userId;

      if (reporterUserId && await shouldNotifyUser(reporterUserId, notificationType)) {
        await prisma.notification.create({
          data: {
            userId: reporterUserId,
            title: notificationTitle,
            text: notificationText,
            type: notificationType,
            interventionId: id,
          },
        });
      }
    }

    res.json(mapIntervention(intervention));
  }),
);

interventionsRouter.patch(
  "/:id/recurrence",
  authorizeRoles(COORDINATOR_ACTION_ROLES),
  validate(recurrenceUpdateSchema),
  asyncHandler(async (req, res) => {
    const id = parseInterventionId(req.params.id);
    const input = req.body as z.infer<typeof recurrenceUpdateSchema>;

    const existing = await prisma.intervention.findUnique({
      where: { id },
      select: { id: true, startedAt: true },
    });

    if (!existing) {
      throw new NotFoundError("Intervention not found.");
    }

    const nextGenerationAt =
      input.recurringPeriod && existing.startedAt
        ? computeNextGenerationAt(existing.startedAt, input.recurringPeriod)
        : null;

    const intervention = await prisma.intervention.update({
      where: { id },
      data: {
        recurringPeriod: input.recurringPeriod,
        nextGenerationAt,
      },
      include: interventionInclude,
    });

    res.json(mapIntervention(intervention));
  }),
);

async function applyBulkStatusChange(
  id: number,
  targetStatus: InterventionStatus,
  actorId: number,
  existing: {
    status: InterventionStatus;
    archived: boolean;
    startedAt?: Date | null;
    name?: string;
    faultReport?: { userId: number | null } | null;
    executionConfirmation?: { status: ExecutionConfirmationStatus } | null;
  },
): Promise<BulkActionItemResult> {
  if (existing.archived) {
    return { id, success: false, reason: "Intervention is archived and cannot have its status changed." };
  }

  if (targetStatus === InterventionStatus.ON_HOLD) {
    return { id, success: false, reason: "Use the pause action to put an intervention on hold." };
  }

  const allowedTargets = ALLOWED_STATUS_TRANSITIONS.get(existing.status);

  if (!allowedTargets?.has(targetStatus)) {
    return {
      id,
      success: false,
      reason: `Status transition from ${existing.status} to ${targetStatus} is not allowed.`,
    };
  }

  if (
    targetStatus === InterventionStatus.RESOLVED &&
    existing.executionConfirmation?.status !== ExecutionConfirmationStatus.CONFIRMED
  ) {
    return {
      id,
      success: false,
      reason: "Cannot close intervention without digital confirmation or a closing comment.",
    };
  }

  await prisma.$transaction([
    prisma.intervention.update({
      where: { id },
      data: {
        status: targetStatus,
        ...(targetStatus === InterventionStatus.IN_PROGRESS && !existing.startedAt
          ? { startedAt: new Date() }
          : {}),
      },
    }),
    prisma.statusHistory.create({
      data: {
        interventionId: id,
        authorId: actorId,
        oldStatus: existing.status,
        newStatus: targetStatus,
      },
    }),
  ]);

  if (targetStatus === InterventionStatus.RESOLVED) {
    await createFeedbackRequestNotificationOnce({
      interventionId: id,
      interventionName: existing.name ?? `#${id}`,
      reporterUserId: existing.faultReport?.userId,
    });
  }

  return { id, success: true };
}

async function applyBulkAssignServicer(
  id: number,
  userId: number,
  existing: { status: InterventionStatus; archived: boolean },
): Promise<BulkActionItemResult> {
  if (existing.archived) {
    return { id, success: false, reason: "Intervention is archived and cannot be modified." };
  }

  if (
    existing.status === InterventionStatus.RESOLVED ||
    existing.status === InterventionStatus.CANCELLED
  ) {
    return {
      id,
      success: false,
      reason: `Cannot assign servicer to an intervention with status ${existing.status}.`,
    };
  }

  const existingAssignment = await prisma.assignment.findFirst({
    where: { interventionId: id, userId },
    select: { id: true },
  });

  if (existingAssignment) {
    return { id, success: false, reason: "Servicer is already assigned to this intervention." };
  }

  await prisma.$transaction([
    prisma.assignment.create({
      data: { interventionId: id, userId },
    }),
    ...(existing.status === InterventionStatus.NEW
      ? [
          prisma.intervention.update({
            where: { id },
            data: { status: InterventionStatus.ASSIGNED },
          }),
        ]
      : []),
  ]);

  return { id, success: true };
}

async function applyBulkArchive(
  id: number,
  existing: { status: InterventionStatus; archived: boolean },
): Promise<BulkActionItemResult> {
  if (existing.archived) {
    return { id, success: false, reason: "Intervention is already archived." };
  }

  if (!ARCHIVABLE_STATUSES.has(existing.status)) {
    return {
      id,
      success: false,
      reason: `Only resolved or cancelled interventions can be archived. Current status: ${existing.status}.`,
    };
  }

  await prisma.intervention.update({
    where: { id },
    data: { archived: true },
  });

  return { id, success: true };
}

async function applyBulkDearchive(
  id: number,
  existing: { archived: boolean },
): Promise<BulkActionItemResult> {
  if (!existing.archived) {
    return { id, success: false, reason: "Intervention is not archived." };
  }

  await prisma.intervention.update({
    where: { id },
    data: { archived: false },
  });

  return { id, success: true };
}

interventionsRouter.post(
  "/bulk-actions",
  authorizeRoles(COORDINATOR_ACTION_ROLES),
  validate(bulkActionSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as BulkActionInput;
    const actor = await resolveCreator(req);

    const { interventionIds } = input;

    const existing = await prisma.intervention.findMany({
      where: { id: { in: interventionIds } },
      select: {
        id: true,
        name: true,
        status: true,
        archived: true,
        faultReport: {
          select: { userId: true },
        },
        executionConfirmation: {
          select: {
            status: true,
          },
        },
      },
    });

    const existingMap = new Map(existing.map((i) => [i.id, i]));

    if (input.action === "ASSIGN_SERVICER") {
      const servicer = await prisma.user.findUnique({
        where: { id: input.payload.userId },
        select: { id: true, active: true },
      });

      if (!servicer || !servicer.active) {
        throw new BadRequestError("Selected servicer does not exist or is inactive.", [
          { field: "payload.userId", message: "Servicer not found or inactive." },
        ]);
      }
    }

    const preflightResults: BulkActionItemResult[] = await Promise.all(
      interventionIds.map(async (id): Promise<BulkActionItemResult> => {
        const record = existingMap.get(id);

        if (!record) {
          return { id, success: false, reason: "Intervention not found." };
        }

        switch (input.action) {
          case "STATUS_CHANGE": {
            if (record.archived) {
              return { id, success: false, reason: "Intervention is archived and cannot have its status changed." };
            }
            const allowedTargets = ALLOWED_STATUS_TRANSITIONS.get(record.status);
            if (input.payload.status === InterventionStatus.ON_HOLD) {
              return { id, success: false, reason: "Use the pause action to put an intervention on hold." };
            }
            if (!allowedTargets?.has(input.payload.status)) {
              return {
                id,
                success: false,
                reason: `Status transition from ${record.status} to ${input.payload.status} is not allowed.`,
              };
            }
            if (
              input.payload.status === InterventionStatus.RESOLVED &&
              record.executionConfirmation?.status !== ExecutionConfirmationStatus.CONFIRMED
            ) {
              return {
                id,
                success: false,
                reason: "Cannot close intervention without digital confirmation or a closing comment.",
              };
            }
            return { id, success: true };
          }

          case "ASSIGN_SERVICER": {
            if (record.archived) {
              return { id, success: false, reason: "Intervention is archived and cannot be modified." };
            }
            if (
              record.status === InterventionStatus.RESOLVED ||
              record.status === InterventionStatus.CANCELLED
            ) {
              return {
                id,
                success: false,
                reason: `Cannot assign servicer to an intervention with status ${record.status}.`,
              };
            }
            const existingAssignment = await prisma.assignment.findFirst({
              where: { interventionId: id, userId: input.payload.userId },
              select: { id: true },
            });
            if (existingAssignment) {
              return { id, success: false, reason: "Servicer is already assigned to this intervention." };
            }
            return { id, success: true };
          }

          case "ARCHIVE": {
            if (record.archived) {
              return { id, success: false, reason: "Intervention is already archived." };
            }
            if (!ARCHIVABLE_STATUSES.has(record.status)) {
              return {
                id,
                success: false,
                reason: `Only resolved or cancelled interventions can be archived. Current status: ${record.status}.`,
              };
            }
            return { id, success: true };
          }

          case "DEARCHIVE": {
            if (!record.archived) {
              return { id, success: false, reason: "Intervention is not archived." };
            }
            return { id, success: true };
          }
        }
      }),
    );

    const preflightFailed = preflightResults.filter((r) => !r.success);
    if (preflightFailed.length > 0) {
      const atomicFailResponse: BulkActionResponse = {
        totalRequested: interventionIds.length,
        totalSucceeded: 0,
        totalSkipped: preflightFailed.length,
        results: preflightResults,
      };

      AuditService.log({
        action: `BULK_${input.action}`,
        entity: "Intervention",
        actorId: actor.id,
        actorUsername: actor.username,
        details: `Bulk action ${input.action} aborted (atomic): ${preflightFailed.length}/${interventionIds.length} failed pre-flight.`,
        newValues: {
          action: input.action,
          payload: input.payload,
          succeededIds: [],
          skippedIds: preflightFailed.map((r) => r.id),
        },
      });

      return res.status(422).json(atomicFailResponse);
    }

    const results: BulkActionItemResult[] = await Promise.all(
      interventionIds.map(async (id) => {
        const record = existingMap.get(id)!;

        switch (input.action) {
          case "STATUS_CHANGE":
            return applyBulkStatusChange(id, input.payload.status, actor.id, record);
          case "ASSIGN_SERVICER":
            return applyBulkAssignServicer(id, input.payload.userId, record);
          case "ARCHIVE":
            return applyBulkArchive(id, record);
          case "DEARCHIVE":
            return applyBulkDearchive(id, record);
        }
      }),
    );

    const succeeded = results.filter((r) => r.success);
    const skipped = results.filter((r) => !r.success);

    AuditService.log({
      action: `BULK_${input.action}`,
      entity: "Intervention",
      actorId: actor.id,
      actorUsername: actor.username,
      details: `Bulk action ${input.action}: ${succeeded.length}/${interventionIds.length} succeeded.`,
      newValues: {
        action: input.action,
        payload: input.payload,
        succeededIds: succeeded.map((r) => r.id),
        skippedIds: skipped.map((r) => r.id),
      },
    });

    const response: BulkActionResponse = {
      totalRequested: interventionIds.length,
      totalSucceeded: succeeded.length,
      totalSkipped: skipped.length,
      results,
    };

    res.status(HTTP_STATUS.OK).json(response);
  }),
);

export default interventionsRouter;