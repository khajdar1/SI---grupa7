import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env';
import { BACKEND_ROUTES } from './constants';
import { authenticate } from './middleware/auth.middleware';
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
  app.use(BACKEND_ROUTES.USERS, authenticate, usersRouter);
  app.use(BACKEND_ROUTES.COMPANIES, companiesRouter);
  app.use(BACKEND_ROUTES.CATEGORIES, categoriesRouter);
  app.use(BACKEND_ROUTES.INTERVENTIONS, authenticate, interventionsRouter);
  app.use(BACKEND_ROUTES.ASSIGNMENTS, authenticate, assignmentsRouter);
  app.use(BACKEND_ROUTES.REPORTS, authenticate, reportsRouter);
  app.use(BACKEND_ROUTES.ATTACHMENTS, authenticate, attachmentsRouter);
  app.use(BACKEND_ROUTES.NOTIFICATIONS, authenticate, notificationsRouter);
  app.use(BACKEND_ROUTES.SLA, authenticate, slaRouter);
  app.use(BACKEND_ROUTES.AUDIT, authenticate, auditRouter);
  app.use(BACKEND_ROUTES.COMMENTS, authenticate, commentsRouter);
  app.use(BACKEND_ROUTES.FEEDBACK, authenticate, feedbackRouter);
  app.use(BACKEND_ROUTES.HISTORY, authenticate, historyRouter);
  app.use(BACKEND_ROUTES.TICKETS, authenticate, ticketsRouter);
  app.use(BACKEND_ROUTES.MESSAGES, authenticate, messagesRouter);
  app.use(BACKEND_ROUTES.PROFILE, authenticate, profileRouter);
  app.use(BACKEND_ROUTES.BLOCKING, authenticate, blockingRouter);
  app.use(BACKEND_ROUTES.SYSTEM_CONFIG, authenticate, systemConfigRouter);
  app.use(BACKEND_ROUTES.MAPS, authenticate, mapsRouter);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);



  return app;
}
