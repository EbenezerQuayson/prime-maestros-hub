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

export function formatGhsFromPesewas(amountPesewas: number): string {
  const ghs = amountPesewas / 100;
  return `GH₵${ghs.toFixed(2)}`;
}

export interface InstrumentDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  programs: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    durationWeeks: number | null;
  }>;
}

export interface ProgramListDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  durationWeeks: number | null;
  instrument: {
    id: string;
    name: string;
    slug: string;
  };
  courses: Array<{
    id: string;
    level: string;
    title: string;
    sequence: number;
  }>;
}

export interface ProgramDetailDto extends ProgramListDto {
  instrument: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
  courses: Array<{
    id: string;
    level: string;
    title: string;
    description: string | null;
    sequence: number;
    modules: Array<{
      id: string;
      title: string;
      description: string | null;
      sequence: number;
      lessons: Array<{
        id: string;
        title: string;
        durationMinutes: number | null;
        sequence: number;
      }>;
    }>;
  }>;
}

export interface PublicInstructorDto {
  id: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  qualifications: string | null;
  instruments: Array<{
    instrument: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}
