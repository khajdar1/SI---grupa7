import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { HTTP_STATUS } from '../constants';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }

    req.body = result.data;
    next();
  };
