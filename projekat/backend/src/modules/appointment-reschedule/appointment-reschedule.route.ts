import { NotificationType, RescheduleRequestStatus } from "@prisma/client";
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
import { emitToUser } from "../../realtime/socket";
import { shouldNotifyUser } from "../../shared/notification-preferences";
import { AuditService } from "../../shared/audit.service";

const COORDINATOR_ROLES = ["Koordinator", "Coordinator"];
const ADMIN_ROLES = ["Administrator", "Admin", "administrator", "admin"];
const COORDINATOR_ACTION_ROLES = [...COORDINATOR_ROLES, ...ADMIN_ROLES];

const rescheduleRequestSchema = z.object({
  proposedStartedAt: z.coerce.date(),
  comment: z.string().trim().min(3, "Comment must contain at least 3 characters.").max(1000),
});

const rescheduleResponseSchema = z.object({
  status: z.nativeEnum(RescheduleRequestStatus),
  responseComment: z.string().trim().max(1000).optional(),
  proposedStartedAt: z.coerce.date().optional(),
});

function normalizeLanguage(language: string | null | undefined): "en" | "bs" {
  return language === "bs" ? "bs" : "en";
}

const RESCHEDULE_REQUEST_NOTIFICATION_COPY = {
  en: {
    title: "Appointment change requested",
    text: (name: string) =>
      `User requested an appointment change for intervention "${name}".`,
  },
  bs: {
    title: "Zahtjev za promjenu termina",
    text: (name: string) =>
      `Korisnik je zatražio promjenu termina za intervenciju "${name}".`,
  },
} as const;

const RESCHEDULE_RESPONSE_NOTIFICATION_COPY = {
  APPROVED: {
    en: {
      title: "Appointment change approved",
      text: (name: string) =>
        `Your appointment change request for intervention "${name}" has been approved.`,
    },
    bs: {
      title: "Promjena termina odobrena",
      text: (name: string) =>
        `Vaš zahtjev za promjenu termina za intervenciju "${name}" je odobren.`,
    },
  },
  REJECTED: {
    en: {
      title: "Appointment change rejected",
      text: (name: string, comment: string | null) =>
        `Your appointment change request for intervention "${name}" was rejected.${comment ? ` Comment: ${comment}` : ""}`,
    },
    bs: {
      title: "Promjena termina odbijena",
      text: (name: string, comment: string | null) =>
        `Vaš zahtjev za promjenu termina za intervenciju "${name}" je odbijen.${comment ? ` Komentar: ${comment}` : ""}`,
    },
  },
  PROPOSED: {
    en: {
      title: "Alternative appointment proposed",
      text: (name: string) =>
        `A coordinator proposed an alternative appointment time for intervention "${name}". Please review and confirm.`,
    },
    bs: {
      title: "Predložen alternativni termin",
      text: (name: string) =>
        `Koordinator je predložio alternativni termin za intervenciju "${name}". Molimo pregledajte i potvrdite.`,
    },
  },
} as const;

function canAccessIntervention(
  req: Request,
  intervention: { faultReport?: { userId: number | null } | null },
): boolean {
  const userRoles = (req.user?.roles ?? []).map((r) => r.toLowerCase());
  const isCoordinator = COORDINATOR_ACTION_ROLES.some((r) =>
    userRoles.includes(r.toLowerCase()),
  );
  if (isCoordinator) return true;

  const localUserId = req.user?.localUserId;
  if (!localUserId) return false;

  return intervention.faultReport?.userId === localUserId;
}

const appointmentRescheduleRouter = Router();

appointmentRescheduleRouter.post(
  "/:id/confirm",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError("Invalid intervention identifier.");
    }

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        startedAt: true,
        appointmentConfirmedAt: true,
        faultReport: { select: { userId: true } },
      },
    });

    if (!intervention) {
      throw new NotFoundError("Intervention not found.");
    }

    if (!canAccessIntervention(req, intervention)) {
      throw new ForbiddenError("You do not have permission to confirm this appointment.");
    }

    if (!intervention.startedAt) {
      throw new BadRequestError("No appointment has been scheduled yet.");
    }

    if (intervention.appointmentConfirmedAt) {
      throw new BadRequestError("Appointment has already been confirmed.");
    }

    const updated = await prisma.intervention.update({
      where: { id },
      data: { appointmentConfirmedAt: new Date() },
    });

    await AuditService.record({
      action: "APPOINTMENT_CONFIRMED",
      entity: "Intervention",
      entityId: id,
      actorId: req.user?.localUserId ?? undefined,
      actorUsername: req.user?.username ?? undefined,
      details: `Appointment confirmed by user for intervention "${intervention.name}"`,
    });

    res.json({ appointmentConfirmedAt: updated.appointmentConfirmedAt?.toISOString() ?? null });
  }),
);

appointmentRescheduleRouter.post(
  "/:id/reschedule-request",
  validate(rescheduleRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError("Invalid intervention identifier.");
    }

    const input = req.body as z.infer<typeof rescheduleRequestSchema>;

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        startedAt: true,
        faultReport: { select: { userId: true } },
      },
    });

    if (!intervention) {
      throw new NotFoundError("Intervention not found.");
    }

    if (!canAccessIntervention(req, intervention)) {
      throw new ForbiddenError("You do not have permission to request appointment changes.");
    }

    if (!intervention.startedAt) {
      throw new BadRequestError("No appointment has been scheduled yet.");
    }

    const existingPending = await prisma.appointmentRescheduleRequest.findFirst({
      where: { interventionId: id, status: RescheduleRequestStatus.PENDING },
      select: { id: true },
    });

    if (existingPending) {
      throw new BadRequestError("There is already a pending reschedule request for this intervention.");
    }

    const localUserId = req.user?.localUserId;
    if (!localUserId) {
      throw new ForbiddenError("User not found.");
    }

    const request = await prisma.appointmentRescheduleRequest.create({
      data: {
        interventionId: id,
        requestedById: localUserId,
        proposedStartedAt: input.proposedStartedAt,
        comment: input.comment,
      },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true, username: true } },
      },
    });

    await AuditService.record({
      action: "APPOINTMENT_RESCHEDULE_REQUESTED",
      entity: "AppointmentRescheduleRequest",
      entityId: request.id,
      actorId: localUserId,
      actorUsername: req.user?.username ?? undefined,
      details: `Reschedule requested for intervention "${intervention.name}": proposed ${input.proposedStartedAt.toISOString()}, reason: ${input.comment}`,
    });

    const coordinatorUserIds = await getCoordinatorUserIds();
    await Promise.all(coordinatorUserIds.map(async (userId) => {
      if (!await shouldNotifyUser(userId, 'APPOINTMENT_RESCHEDULE_REQUEST')) return;

      const prefs = await prisma.userPreference.findUnique({
        where: { userId },
        select: { language: true },
      });
      const language = normalizeLanguage(prefs?.language);
      const copy = RESCHEDULE_REQUEST_NOTIFICATION_COPY[language];

      const notification = await prisma.notification.create({
        data: {
          userId,
          interventionId: id,
          type: NotificationType.APPOINTMENT_RESCHEDULE_REQUEST,
          title: copy.title,
          text: copy.text(intervention.name),
        },
      });
      emitToUser(userId, "notification:new", notification);
    }));

    res.status(HTTP_STATUS.CREATED).json({
      id: request.id,
      interventionId: request.interventionId,
      proposedStartedAt: request.proposedStartedAt.toISOString(),
      comment: request.comment,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      requestedBy: request.requestedBy,
    });
  }),
);

appointmentRescheduleRouter.get(
  "/requests",
  authorizeRoles(COORDINATOR_ACTION_ROLES),
  asyncHandler(async (_req: Request, res: Response) => {
    const requests = await prisma.appointmentRescheduleRequest.findMany({
      where: { status: RescheduleRequestStatus.PENDING },
      orderBy: { createdAt: "desc" },
      include: {
        intervention: {
          select: {
            id: true,
            name: true,
            startedAt: true,
            location: true,
            status: true,
            company: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
          },
        },
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
    });

    res.json({
      data: requests.map((r) => ({
        id: r.id,
        interventionId: r.interventionId,
        proposedStartedAt: r.proposedStartedAt.toISOString(),
        comment: r.comment,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        requestedBy: r.requestedBy,
        intervention: r.intervention
          ? {
              id: r.intervention.id,
              name: r.intervention.name,
              startedAt: r.intervention.startedAt?.toISOString() ?? null,
              location: r.intervention.location,
              status: r.intervention.status,
              company: r.intervention.company,
              category: r.intervention.category,
            }
          : null,
      })),
    });
  }),
);

appointmentRescheduleRouter.patch(
  "/:id/reschedule-request/:requestId/respond",
  authorizeRoles(COORDINATOR_ACTION_ROLES),
  validate(rescheduleResponseSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const requestId = Number(req.params.requestId);

    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(requestId) || requestId <= 0) {
      throw new BadRequestError("Invalid identifier.");
    }

    const input = req.body as z.infer<typeof rescheduleResponseSchema>;

    const existing = await prisma.appointmentRescheduleRequest.findUnique({
      where: { id: requestId },
      include: {
        intervention: { select: { id: true, name: true, startedAt: true } },
      },
    });

    if (!existing || existing.interventionId !== id) {
      throw new NotFoundError("Reschedule request not found.");
    }

    if (existing.status !== RescheduleRequestStatus.PENDING) {
      throw new BadRequestError("Reschedule request has already been responded to.");
    }

    const actorId = req.user?.localUserId;
    if (!actorId) {
      throw new ForbiddenError("User not found.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const request = await tx.appointmentRescheduleRequest.update({
        where: { id: requestId },
        data: {
          status: input.status,
          respondedById: actorId,
          responseComment: input.responseComment?.trim() ?? null,
          respondedAt: new Date(),
        },
      });

      if (input.status === RescheduleRequestStatus.APPROVED) {
        const newStartedAt = input.proposedStartedAt ?? existing.proposedStartedAt;
        await tx.intervention.update({
          where: { id },
          data: { startedAt: newStartedAt },
        });
      }

      return request;
    });

    await AuditService.record({
      action: input.status === RescheduleRequestStatus.APPROVED
        ? "APPOINTMENT_RESCHEDULE_APPROVED"
        : "APPOINTMENT_RESCHEDULE_REJECTED",
      entity: "AppointmentRescheduleRequest",
      entityId: requestId,
      actorId,
      actorUsername: req.user?.username ?? undefined,
      details: `Reschedule request ${input.status === RescheduleRequestStatus.APPROVED ? "approved" : "rejected"} for intervention "${existing.intervention.name}"`,
    });

    const requesterId = existing.requestedById;
    const isCoordinatorProposal = input.status === RescheduleRequestStatus.APPROVED && input.proposedStartedAt != null;
    const notifyType = isCoordinatorProposal
      ? 'APPOINTMENT_RESCHEDULE_PROPOSED'
      : 'APPOINTMENT_RESCHEDULE_RESPONSE';

    if (await shouldNotifyUser(requesterId, notifyType)) {
      const prefs = await prisma.userPreference.findUnique({
        where: { userId: requesterId },
        select: { language: true },
      });
      const language = normalizeLanguage(prefs?.language);

      if (isCoordinatorProposal) {
        const copy = RESCHEDULE_RESPONSE_NOTIFICATION_COPY.PROPOSED[language];
        const notification = await prisma.notification.create({
          data: {
            userId: requesterId,
            interventionId: id,
            type: NotificationType.APPOINTMENT_RESCHEDULE_PROPOSED,
            title: copy.title,
            text: copy.text(existing.intervention.name),
          },
        });
        emitToUser(requesterId, "notification:new", notification);
      } else if (input.status === RescheduleRequestStatus.APPROVED) {
        const copy = RESCHEDULE_RESPONSE_NOTIFICATION_COPY.APPROVED[language];
        const notification = await prisma.notification.create({
          data: {
            userId: requesterId,
            interventionId: id,
            type: NotificationType.APPOINTMENT_RESCHEDULE_RESPONSE,
            title: copy.title,
            text: copy.text(existing.intervention.name),
          },
        });
        emitToUser(requesterId, "notification:new", notification);
      } else {
        const copy = RESCHEDULE_RESPONSE_NOTIFICATION_COPY.REJECTED[language];
        const notification = await prisma.notification.create({
          data: {
            userId: requesterId,
            interventionId: id,
            type: NotificationType.APPOINTMENT_RESCHEDULE_RESPONSE,
            title: copy.title,
            text: copy.text(existing.intervention.name, input.responseComment ?? null),
          },
        });
        emitToUser(requesterId, "notification:new", notification);
      }
    }

    res.json({
      id: updated.id,
      interventionId: updated.interventionId,
      status: updated.status,
      respondedById: updated.respondedById,
      responseComment: updated.responseComment,
      respondedAt: updated.respondedAt?.toISOString() ?? null,
    });
  }),
);

async function getCoordinatorUserIds(): Promise<number[]> {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export default appointmentRescheduleRouter;
