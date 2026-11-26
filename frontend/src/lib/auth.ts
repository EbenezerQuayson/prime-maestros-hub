import { apiFetch } from './api';

export interface AuthUser {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  status: 'INVITED' | 'ACTIVE' | 'LOCKED' | 'DISABLED';
}

const TOKEN_KEY = 'pmh_access_token';
const USER_KEY = 'pmh_auth_user';

export function saveSession(accessToken: string, user: AuthUser) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export async function refreshAccessToken(): Promise<AuthUser | null> {
  try {
    const res = await apiFetch<{ accessToken: string; user: AuthUser }>(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({}) },
    );
    saveSession(res.accessToken, res.user);
    return res.user;
  } catch {
    clearSession();
    return null;
  }
}

export async function authFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let token = getAccessToken();
  if (!token) {
    const refreshed = await refreshAccessToken();
    token = refreshed ? getAccessToken() : null;
  }

  const doRequest = (bearer: string | null) =>
    apiFetch<T>(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
    });

  try {
    return await doRequest(token);
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return await doRequest(getAccessToken());
      }
    }
    throw err;
  }
}

export async function logoutSession() {
  try {
    await authFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore errors when clearing local session
  } finally {
    clearSession();
  }
}
