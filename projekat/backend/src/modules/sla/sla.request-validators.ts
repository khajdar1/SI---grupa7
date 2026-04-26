import { Request, Response, NextFunction } from "express";
import {
  validateConfigurationsArray,
  validateNoDuplicatePriorities,
  validateSingleConfiguration,
} from "./sla.validators";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUpdateSlaRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { configurations } = req.body;

  const arrayValidation = validateConfigurationsArray(configurations);
  if (!arrayValidation.valid) {
    res.status(400).json({
      message: arrayValidation.error,
    });
    return;
  }

  for (let i = 0; i < configurations.length; i++) {
    const config = configurations[i];
    const singleValidation = validateSingleConfiguration(config);
    if (!singleValidation.valid) {
      res.status(400).json({
        message: `Configuration at index ${i}: ${singleValidation.error}`,
      });
      return;
    }
  }

  const duplicateValidation = validateNoDuplicatePriorities(configurations);
  if (!duplicateValidation.valid) {
    res.status(400).json({
      message: duplicateValidation.error,
    });
    return;
  }

  next();
}
