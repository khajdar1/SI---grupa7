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

interface DataResponse<T> {
  data: T;
}

export async function withServiceError<T>(
  action: () => Promise<T>,
  fallbackMessage: string,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, fallbackMessage), error);
  }
}

export async function getResponseData<T>(
  request: () => Promise<DataResponse<T>>,
  fallbackMessage: string,
): Promise<T> {
  return withServiceError(async () => {
    const response = await request();
    return response.data;
  }, fallbackMessage);
}
