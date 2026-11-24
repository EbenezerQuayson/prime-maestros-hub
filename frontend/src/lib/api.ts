const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = (await response.json().catch(() => null)) as
    | { message?: string | string[] }
    | null;

  if (!response.ok) {
    const rawMsg = data?.message;
    const message = Array.isArray(rawMsg)
      ? rawMsg.join(', ')
      : rawMsg || `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}
