export type FieldErrors = Record<string, string>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getTrimmedValue(value: string) {
  return value.trim();
}

export function validateRequired(value: string, message: string) {
  return getTrimmedValue(value) ? "" : message;
}

export function validateEmail(value: string, requiredMessage: string, invalidMessage: string) {
  const trimmed = getTrimmedValue(value);

  if (!trimmed) {
    return requiredMessage;
  }

  return EMAIL_REGEX.test(trimmed) ? "" : invalidMessage;
}

export function validateCalendarDate(value: string, requiredMessage: string, invalidMessage: string) {
  const trimmed = getTrimmedValue(value);

  if (!trimmed) {
    return requiredMessage;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return invalidMessage;
  }

  const [year, month, day] = trimmed.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  const isExactMatch =
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day;

  return isExactMatch ? "" : invalidMessage;
}

export function getApiFieldErrors(error: any): FieldErrors {
  const responseErrors = error?.response?.data?.errors;

  if (!responseErrors || typeof responseErrors !== "object") {
    return {};
  }

  return Object.entries(responseErrors).reduce<FieldErrors>((acc, [key, value]) => {
    if (typeof value === "string" && value.trim()) {
      acc[key] = value;
      return acc;
    }

    if (Array.isArray(value)) {
      const firstMessage = value.find(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      );

      if (firstMessage) {
        acc[key] = firstMessage;
      }
    }

    return acc;
  }, {});
}
