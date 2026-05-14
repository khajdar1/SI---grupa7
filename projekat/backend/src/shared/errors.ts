import { HTTP_STATUS } from '../constants';

export type FieldError = {
  field: string;
  message: string;
};

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = 'APP_ERROR',
    public readonly fields?: FieldError[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request.', fields?: FieldError[]) {
    super(HTTP_STATUS.BAD_REQUEST, message, 'BAD_REQUEST', fields);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required.') {
    super(HTTP_STATUS.UNAUTHORIZED, message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to access this resource.') {
    super(HTTP_STATUS.FORBIDDEN, message, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists.') {
    super(HTTP_STATUS.CONFLICT, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(HTTP_STATUS.NOT_FOUND, message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}
