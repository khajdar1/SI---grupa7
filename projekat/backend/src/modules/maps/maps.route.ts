import { InterventionStatus, Priority } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../config/database';
import { authorizeRoles } from '../../middleware/auth.middleware';
import { compactStoredLocation } from '../../services/geocoding.service';
import { asyncHandler } from '../../shared/async-handler';

const mapsRouter = Router();

const MAP_VIEW_ROLES = [
  'Koordinator',
  'Coordinator',
  'Menadzment',
  'Management',
  'Administrator',
  'Admin',
  'administrator',
  'admin',
];

const mapQuerySchema = z.object({
  status: z.nativeEnum(InterventionStatus).optional(),
  servicerId: z.union([z.coerce.number().int().positive(), z.literal('UNASSIGNED')]).optional(),
});

function mapPriorityColor(priority: Priority): string {
  switch (priority) {
    case Priority.CRITICAL:
      return '#dc2626';
    case Priority.HIGH:
      return '#ea580c';
    case Priority.MEDIUM:
      return '#2563eb';
    case Priority.LOW:
      return '#16a34a';
    default:
      return '#475569';
  }
}

mapsRouter.get(
  '/interventions',
  authorizeRoles(MAP_VIEW_ROLES),
  asyncHandler(async (req, res) => {
    const query = mapQuerySchema.parse(req.query);

    const interventions = await prisma.intervention.findMany({
      where: {
        archived: false,
        latitude: { not: null },
        longitude: { not: null },
        ...(query.status ? { status: query.status } : {}),
        ...(query.servicerId === 'UNASSIGNED'
          ? { assignments: { none: {} } }
          : typeof query.servicerId === 'number'
            ? { assignments: { some: { userId: query.servicerId } } }
            : {}),
      },
      orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        location: true,
        latitude: true,
        longitude: true,
        priority: true,
        status: true,
        startedAt: true,
        dueAt: true,
        category: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        assignments: {
          select: {
            id: true,
            userId: true,
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
      },
    });

    res.json({
      items: interventions.map((intervention) => ({
        id: String(intervention.id),
        name: intervention.name,
        location: compactStoredLocation(intervention.location),
        latitude: Number(intervention.latitude),
        longitude: Number(intervention.longitude),
        priority: intervention.priority,
        priorityColor: mapPriorityColor(intervention.priority),
        status: intervention.status,
        startedAt: intervention.startedAt?.toISOString() ?? null,
        dueAt: intervention.dueAt?.toISOString() ?? null,
        categoryId: intervention.category.id,
        categoryName: intervention.category.name,
        companyId: intervention.company.id,
        companyName: intervention.company.name,
        assignments: intervention.assignments.map((assignment) => ({
          id: assignment.id,
          userId: assignment.userId,
          label: `${assignment.user.firstName} ${assignment.user.lastName}`.trim() || assignment.user.username,
          username: assignment.user.username,
        })),
      })),
    });
  }),
);

export default mapsRouter;
