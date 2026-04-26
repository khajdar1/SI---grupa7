import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env';
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

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/fault-reports', faultReportsRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/companies', companiesRouter);
  app.use('/api/v1/categories', categoriesRouter);
  app.use('/api/v1/interventions', interventionsRouter);
  app.use('/api/v1/assignments', assignmentsRouter);
  app.use('/api/v1/reports', reportsRouter);
  app.use('/api/v1/attachments', attachmentsRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/sla', slaRouter);
  app.use('/api/v1/audit', auditRouter);
  app.use('/api/v1/comments', commentsRouter);
  app.use('/api/v1/feedback', feedbackRouter);
  app.use('/api/v1/history', historyRouter);
  app.use('/api/v1/tickets', ticketsRouter);
  app.use('/api/v1/messages', messagesRouter);
  app.use('/api/v1/profile', profileRouter);
  app.use('/api/v1/blocking', blockingRouter);
  app.use('/api/v1/system-config', systemConfigRouter);
  app.use('/api/v1/maps', mapsRouter);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);


  app.use((_req, res) => {
    res.status(404).json({
      message: 'Route not found',
    });
  });

  return app;
}