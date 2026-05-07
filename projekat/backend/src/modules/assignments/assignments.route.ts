import { Router } from 'express';
import { authorizeRoles } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../shared/async-handler';
import { AssignmentController } from './assignment.controller';

const assignmentsRouter = Router();

const COORDINATOR_ROLES = ['Koordinator', 'Coordinator'];
const MANAGEMENT_ROLES = ['Menadzment', 'Management'];
const ADMIN_ROLES = ['Administrator', 'Admin', 'administrator', 'admin'];
const ASSIGNMENT_MANAGEMENT_ROLES = [
  ...COORDINATOR_ROLES,
  ...MANAGEMENT_ROLES,
  ...ADMIN_ROLES,
];

/**
 * GET /assignments
 * Module shell endpoint — lists available assignment endpoints
 */
assignmentsRouter.get('/', (_req, res) => {
  res.json({
    module: 'assignments',
    endpoints: [
      'GET /interventions/:interventionId/assignments',
      'GET /interventions/:interventionId/assignments/available',
      'POST /interventions/:interventionId/assignments',
      'DELETE /interventions/:interventionId/assignments/:userId',
    ],
  });
});

/**
 * GET /interventions/:interventionId/assignments
 * Retrieve all assignments for an intervention
 * No role restriction — any authenticated user can view
 */
assignmentsRouter.get(
  '/interventions/:interventionId/assignments',
  asyncHandler((req, res) => AssignmentController.getAssignments(req, res)),
);

/**
 * GET /interventions/:interventionId/assignments/available
 * Retrieve available servicers with their current load (active intervention count)
 * Sorted by load — least burdened first
 * No role restriction — any authenticated user can view
 */
assignmentsRouter.get(
  '/interventions/:interventionId/assignments/available',
  asyncHandler((req, res) =>
    AssignmentController.getAvailableServicers(req, res),
  ),
);

/**
 * POST /interventions/:interventionId/assignments
 * Assign one or more servicers to an intervention
 * Requires coordinator or management role
 */
assignmentsRouter.post(
  '/interventions/:interventionId/assignments',
  authorizeRoles(ASSIGNMENT_MANAGEMENT_ROLES),
  asyncHandler((req, res) => AssignmentController.assignServicers(req, res)),
);

/**
 * DELETE /interventions/:interventionId/assignments/:userId
 * Remove a servicer from an intervention
 * Requires coordinator or management role
 */
assignmentsRouter.delete(
  '/interventions/:interventionId/assignments/:userId',
  authorizeRoles(ASSIGNMENT_MANAGEMENT_ROLES),
  asyncHandler((req, res) => AssignmentController.removeServicer(req, res)),
);

export default assignmentsRouter;
