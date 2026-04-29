import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env';
import { BACKEND_ROUTES } from './constants';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import healthRouter from './routes/health.route';
import faultReportsRouter from './modules/fault-reports/fault-reports.route';
import authRouter from './modules/auth/auth.route';
import usersRouter from './modules/users/users.route';
import companiesRouter from './modules/companies/companies.route';
import categoriesRouter from './modules/categories/categories.route';
import interventionsRouter from './modules/interventions/interventions.route';
import assignmentsRouter from './modules/assignments/assignments.route';
import reportsRouter from './modules/reports/reports.route';
import attachmentsRouter from './modules/attachments/attachments.route';
import notificationsRouter from './modules/notifications/notifications.route';
import slaRouter from './modules/sla/sla.route';
import auditRouter from './modules/audit/audit.route';
import commentsRouter from './modules/comments/comments.route';
import feedbackRouter from './modules/feedback/feedback.route';
import historyRouter from './modules/history/history.route';
import ticketsRouter from './modules/tickets/tickets.route';
import messagesRouter from './modules/messages/messages.route';
import profileRouter from './modules/profile/profile.route';
import blockingRouter from './modules/blocking/blocking.route';
import systemConfigRouter from './modules/system-config/system-config.route';
import mapsRouter from './modules/maps/maps.route';

export function createApp() {
  const app = express();
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLoggerMiddleware);

  app.use(BACKEND_ROUTES.HEALTH, healthRouter);
  app.use(BACKEND_ROUTES.FAULT_REPORTS, faultReportsRouter);
  app.use(BACKEND_ROUTES.AUTH, authRouter);
  app.use(BACKEND_ROUTES.USERS, usersRouter);
  app.use(BACKEND_ROUTES.COMPANIES, companiesRouter);
  app.use(BACKEND_ROUTES.CATEGORIES, categoriesRouter);
  app.use(BACKEND_ROUTES.INTERVENTIONS, interventionsRouter);
  app.use(BACKEND_ROUTES.ASSIGNMENTS, assignmentsRouter);
  app.use(BACKEND_ROUTES.REPORTS, reportsRouter);
  app.use(BACKEND_ROUTES.ATTACHMENTS, attachmentsRouter);
  app.use(BACKEND_ROUTES.NOTIFICATIONS, notificationsRouter);
  app.use(BACKEND_ROUTES.SLA, slaRouter);
  app.use(BACKEND_ROUTES.AUDIT, auditRouter);
  app.use(BACKEND_ROUTES.COMMENTS, commentsRouter);
  app.use(BACKEND_ROUTES.FEEDBACK, feedbackRouter);
  app.use(BACKEND_ROUTES.HISTORY, historyRouter);
  app.use(BACKEND_ROUTES.TICKETS, ticketsRouter);
  app.use(BACKEND_ROUTES.MESSAGES, messagesRouter);
  app.use(BACKEND_ROUTES.PROFILE, profileRouter);
  app.use(BACKEND_ROUTES.BLOCKING, blockingRouter);
  app.use(BACKEND_ROUTES.SYSTEM_CONFIG, systemConfigRouter);
  app.use(BACKEND_ROUTES.MAPS, mapsRouter);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);



  return app;
}
