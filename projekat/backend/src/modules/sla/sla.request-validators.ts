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
  const fieldErrors: Record<string, string> = {};

  const arrayValidation = validateConfigurationsArray(configurations);
  if (!arrayValidation.valid) {
    res.status(400).json({
      message: arrayValidation.error,
      errors: {},
    });
    return;
  }

  // Collect all validation errors for all configurations
  for (let i = 0; i < configurations.length; i++) {
    const config = configurations[i];
    const singleValidation = validateSingleConfiguration(config);
    if (!singleValidation.valid) {
      fieldErrors[`config_${i}`] = singleValidation.error!;
    }
  }

  // Check for duplicate priorities
  const duplicateValidation = validateNoDuplicatePriorities(configurations);
  if (!duplicateValidation.valid) {
    res.status(400).json({
      message: duplicateValidation.error,
      errors: {},
    });
    return;
  }

  // If any individual config validation failed, return all errors
  if (Object.keys(fieldErrors).length > 0) {
    res.status(400).json({
      message: "SLA configuration validation failed",
      errors: fieldErrors,
    });
    return;
  }

  next();
}
