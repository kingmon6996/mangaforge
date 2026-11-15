import { API_BASE_URL, IS_PREVIEW_MODE } from '../config/api';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const SESSION_TOKEN_KEY = 'mangaforge_access_token';

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (IS_PREVIEW_MODE) {
    throw new ApiError(
      'Backend API URL is not configured; preview handler should intercept this call.',
      501,
      'PREVIEW_MODE'
    );
  }

  if (!API_BASE_URL) {
    throw new ApiError(
      'Unable to reach MangaForge API server. Configure VITE_API_BASE_URL to connect to your backend.',
      503,
      'API_UNAVAILABLE'
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      let errorCode = 'HTTP_ERROR';
      try {
        const body = (await response.json()) as { message?: string; code?: string };
        if (body.message) errorMessage = body.message;
        if (body.code) errorCode = body.code;
      } catch {
        // Non-JSON error response
      }
      throw new ApiError(errorMessage, response.status, errorCode);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out while contacting the MangaForge server.', 504, 'TIMEOUT');
    }
    throw new ApiError(
      'Network error: unable to connect to the MangaForge backend service.',
      503,
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeout);
  }
}
