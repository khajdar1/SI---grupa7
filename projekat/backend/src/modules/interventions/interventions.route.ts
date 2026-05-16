import { InterventionStatus, InterventionType, Priority, RecurringPeriod } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../config/database";
import { HTTP_STATUS } from "../../constants";
import { authorizeRoles } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../shared/async-handler";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors";
import { AuditService } from "../../shared/audit.service";
import { computeNextGenerationAt } from "../../services/recurring.service";

const interventionsRouter = Router();
const COORDINATOR_ROLES = ["Koordinator", "Coordinator"];
const MANAGEMENT_ROLES = ["Menadzment", "Management"];
const ADMIN_ROLES = ["Administrator", "Admin", "administrator", "admin"];
const SERVICER_ROLES = ["Serviser"];
const COORDINATOR_ACTION_ROLES = [...COORDINATOR_ROLES, ...ADMIN_ROLES];

const INTERVENTION_VIEW_ROLES = [...COORDINATOR_ROLES, ...MANAGEMENT_ROLES, ...ADMIN_ROLES];

const INTERVENTION_HISTORY_ROLES = [
  ...COORDINATOR_ROLES,
  ...MANAGEMENT_ROLES,
  ...ADMIN_ROLES,
  ...SERVICER_ROLES,
];
const INTERVENTION_STATUS_ROLES = [...COORDINATOR_ACTION_ROLES, ...SERVICER_ROLES];
const EDITABLE_STATUSES = new Set<InterventionStatus>([
  InterventionStatus.NEW,
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
    ]),
  ],
  [
    InterventionStatus.IN_PROGRESS,
    new Set<InterventionStatus>([
      InterventionStatus.RESOLVED,
      InterventionStatus.CANCELLED,
    ]),
  ],
]);

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
    .max(255),
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
});

const interventionStatusUpdateSchema = z.object({
  status: z.nativeEnum(InterventionStatus),
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
    // Default fallback if SLA is not configured
    const defaultHours = priority === Priority.CRITICAL ? 4 : 24;
    return new Date(baseDate.getTime() + defaultHours * 60 * 60 * 1000);
  }

  return new Date(baseDate.getTime() + sla.deadlineHours * 60 * 60 * 1000);
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
  priority: Priority;
  status: InterventionStatus;
  type: InterventionType;
  createdAt: Date;
  startedAt: Date | null;
  dueAt: Date | null;
  recurringPeriod?: RecurringPeriod | null;
  category: { id: number; name: string };
  company: { id: number; name: string };
  creator: { username: string; id: number };
  faultReport: { id: number; description: string; reportedAt: Date } | null;
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
  
}) {
  const overdue = isOverdue({ status: intervention.status, dueAt: intervention.dueAt });
  return {
    id: String(intervention.id),
    title: intervention.name,
    name: intervention.name,
    description: intervention.description,
    location: intervention.location,
    categoryId: intervention.category.id,
    categoryName: intervention.category.name,
    companyId: intervention.company.id,
    companyName: intervention.company.name,
    priority: intervention.priority,
    status: intervention.status,
    type: intervention.type,
    owner: intervention.creator.username,
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
        }
      : null,
    recurringPeriod: intervention.recurringPeriod ?? null,
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
    },
  },
  faultReport: {
    select: {
      id: true,
      description: true,
      reportedAt: true,
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
} as const;

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
        return rankB - rankA; // Priority descending
      }
      
      // Secondary sort: createdAt ascending
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    res.json(sortedInterventions.map(mapIntervention));
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
            { archived: true },
          ],
        },
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
        location: intervention.location,
        categoryId: intervention.category.id,
        categoryName: intervention.category.name,
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

    const recurringPeriod = input.recurringPeriod ?? null;
    const startedAt = input.startedAt ?? new Date();
    const nextGenerationAt = recurringPeriod
      ? computeNextGenerationAt(startedAt, recurringPeriod)
      : null;

const intervention = await prisma.intervention.create({
      data: {
        name: input.name,
        description: input.description,
        location: input.location,
        latitude: context.latitude,
        longitude: context.longitude,
        priority: input.priority,
        status: InterventionStatus.NEW,
        type: InterventionType.PREVENTIVE,
        startedAt,
        dueAt: input.dueAt ?? await calculateDueAt(input.priority, input.startedAt),
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

interventionsRouter.patch(
  "/:id/status",
  authorizeRoles(INTERVENTION_STATUS_ROLES),
  validate(interventionStatusUpdateSchema),
  asyncHandler(async (req, res) => {
    const id = parseInterventionId(req.params.id);
    const input = req.body as z.infer<typeof interventionStatusUpdateSchema>;

    const existing = await prisma.intervention.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundError("Intervention not found.");
    }

    const allowedTargets = ALLOWED_STATUS_TRANSITIONS.get(existing.status);

    if (!allowedTargets?.has(input.status)) {
      throw new ForbiddenError(
        "Intervention status cannot be changed in the requested direction.",
      );
    }

    const actor = await resolveCreator(req);

    const [intervention] = await prisma.$transaction([
      prisma.intervention.update({
        where: { id },
        data: {
          status: input.status,
        },
        include: interventionInclude,
      }),
      prisma.statusHistory.create({
        data: {
          interventionId: id,
          authorId: actor.id,
          oldStatus: existing.status,
          newStatus: input.status,
        },
      }),
    ]);

    res.json(mapIntervention(intervention));
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
    const intervention = await prisma.intervention.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        location: input.location,
        latitude: context.latitude,
        longitude: context.longitude,
        priority: input.priority,
        type: input.faultReportId
          ? InterventionType.ISSUE
          : InterventionType.PREVENTIVE,
        startedAt: input.startedAt,
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

    res.json({
      ...mapIntervention(intervention),
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

    // Combine direct attachments with fault-report attachments, deduplicating by id
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

const recurrenceUpdateSchema = z.object({
  recurringPeriod: z.nativeEnum(RecurringPeriod).nullable(),
});

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

export default interventionsRouter;
