export type FieldErrors = Record<string, string>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTML_LIKE_PATTERN = /<[^>]+>/;

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

export function containsUnsafeMarkup(value: string) {
  return HTML_LIKE_PATTERN.test(value);
}

export function validateSafeText(
  value: string,
  options: {
    requiredMessage?: string;
    minLength?: number;
    minLengthMessage?: string;
    maxLength?: number;
    maxLengthMessage?: string;
    unsafeMessage?: string;
  } = {},
) {
  const trimmed = getTrimmedValue(value);

  if (options.requiredMessage && !trimmed) {
    return options.requiredMessage;
  }

  if (!trimmed) {
    return "";
  }

  if (typeof options.minLength === "number" && trimmed.length < options.minLength) {
    return options.minLengthMessage ?? `Must be at least ${options.minLength} characters.`;
  }

  if (typeof options.maxLength === "number" && trimmed.length > options.maxLength) {
    return options.maxLengthMessage ?? `Must be at most ${options.maxLength} characters.`;
  }

  if (containsUnsafeMarkup(trimmed)) {
    return options.unsafeMessage ?? "HTML and script content are not allowed.";
  }

  return "";
}

export function validateRequiredSelection(value: string, message: string) {
  return getTrimmedValue(value) ? "" : message;
}

export function clearFieldError<T extends FieldErrors>(errors: T, field: string) {
  if (!errors[field]) {
    return errors;
  }

  const nextErrors = { ...errors };
  delete nextErrors[field];
  return nextErrors;
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
  const responseData = error?.response?.data;
  const responseErrors = responseData?.errors;
  const responseFields = responseData?.error?.fields;

  if (responseErrors && typeof responseErrors === "object") {
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

  if (!Array.isArray(responseFields)) {
    return {};
  }

  return responseFields.reduce<FieldErrors>((acc, field) => {
    if (
      field &&
      typeof field === "object" &&
      typeof field.field === "string" &&
      typeof field.message === "string" &&
      field.field.trim() &&
      field.message.trim()
    ) {
      acc[field.field] = field.message;
    }

    return acc;
  }, {});
}
