import { Priority } from "@prisma/client";

const VALID_PRIORITIES = Object.values(Priority);

export function validateConfigurationsArray(configurations: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(configurations)) {
    return {
      valid: false,
      error: "Invalid request format. Expected array of configurations.",
    };
  }

  if (configurations.length === 0) {
    return {
      valid: false,
      error: "Invalid request format. Expected array of configurations.",
    };
  }

  return { valid: true };
}

export function validateSingleConfiguration(config: unknown): {
  valid: boolean;
  error?: string;
} {
  if (typeof config !== "object" || config === null) {
    return {
      valid: false,
      error: "Configuration must be an object.",
    };
  }

  const typedConfig = config as Record<string, unknown>;

  if (!("priority" in typedConfig)) {
    return {
      valid: false,
      error: "Configuration must contain a priority field.",
    };
  }

  if (typeof typedConfig.priority !== "string") {
    return {
      valid: false,
      error: "Priority must be a string.",
    };
  }

  if (!VALID_PRIORITIES.includes(typedConfig.priority as Priority)) {
    return {
      valid: false,
      error: `Invalid priority "${typedConfig.priority}". Must be one of: ${VALID_PRIORITIES.join(", ")}.`,
    };
  }

  if (!("deadlineHours" in typedConfig)) {
    return {
      valid: false,
      error: "Configuration must contain a deadlineHours field.",
    };
  }

  if (typeof typedConfig.deadlineHours !== "number") {
    return {
      valid: false,
      error: "deadlineHours must be a number.",
    };
  }

  if (!Number.isInteger(typedConfig.deadlineHours)) {
    return {
      valid: false,
      error: "deadlineHours must be an integer.",
    };
  }

  if (typedConfig.deadlineHours <= 0) {
    return {
      valid: false,
      error: "deadlineHours must be a positive number.",
    };
  }

  return { valid: true };
}

export function validateNoDuplicatePriorities(configurations: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(configurations)) {
    return { valid: true };
  }

  const priorities = new Set<string>();

  for (const config of configurations) {
    if (typeof config === "object" && config !== null) {
      const priority = (config as Record<string, unknown>).priority;
      if (typeof priority === "string") {
        if (priorities.has(priority)) {
          return {
            valid: false,
            error: `Duplicate priority "${priority}" in request payload.`,
          };
        }
        priorities.add(priority);
      }
    }
  }

  return { valid: true };
}
