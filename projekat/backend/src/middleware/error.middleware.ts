import type { ErrorRequestHandler, Request, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError, PrismaClientInitializationError } from '@prisma/client/runtime/library';
import { ZodError } from 'zod';

import { env } from '../config/env';
import { AppError } from '../shared/errors';
import { logger } from '../shared/logger';

function getRequestId(req: Request) {
  return req.headers['x-request-id'];
}

function mapPrismaError(error: PrismaClientKnownRequestError) {
  if (error.code === 'P2002') {
    return {
      statusCode: 400,
      code: 'DATABASE_CONSTRAINT_ERROR',
      message: 'Request violates a database constraint.',
    };
  }

  if (error.code === 'P2025') {
    return {
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND',
      message: 'Requested resource was not found.',
    };
  }

  return {
    statusCode: 500,
    code: 'DATABASE_ERROR',
    message: 'Database operation failed.',
  };
}

export const notFoundMiddleware: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'Route not found.',
    },
    path: req.originalUrl,
  });
};

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected server error occurred.';
  let fields: unknown;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    fields = error.fields;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed.';
    fields = error.issues.map((issue) => ({
      field: issue.path.join('.') || 'request',
      message: issue.message,
    }));
  } else if (error instanceof PrismaClientKnownRequestError) {
    const mappedError = mapPrismaError(error);
    statusCode = mappedError.statusCode;
    code = mappedError.code;
    message = mappedError.message;
  } else if (error instanceof PrismaClientInitializationError) {
    statusCode = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = 'Database is currently unavailable.';
  }

  logger.error('Request failed', {
    requestId: getRequestId(req),
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
    errorName: error instanceof Error ? error.name : 'UnknownError',
    errorMessage: error instanceof Error ? error.message : String(error),
    stack: env.NODE_ENV === 'production' || !(error instanceof Error) ? undefined : error.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(fields ? { fields } : {}),
      ...(env.NODE_ENV !== 'production' && error instanceof Error ? { stack: error.stack } : {}),
    },
    path: req.originalUrl,
  });
};
