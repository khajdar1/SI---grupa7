export class ServiceError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
      return maybeMessage;
    }

    const directMessage = (error as { message?: unknown }).message;
    if (typeof directMessage === 'string' && directMessage.trim().length > 0) {
      return directMessage;
    }
  }

  return fallbackMessage;
}
