import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError, type FieldError } from '../shared/errors';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fields: FieldError[] = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'request',
        message: issue.message,
      }));
      return next(new BadRequestError('Validation failed.', fields));
    }

    req.body = result.data;
    next();
  };
