const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'chitz_access_token';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  query?: Record<string, unknown>;
  auth?: boolean; // attach Authorization header if true
}

export interface ApiErrorShape {
  message: string;
  status?: number;
  details?: unknown;
}

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage errors in restricted environments
  }
};

export const buildUrl = (path: string, query?: Record<string, unknown>) => {
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  if (!query || Object.keys(query).length === 0) {
    return `${API_BASE_URL}${trimmedPath}`;
  }

  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`).join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .filter(Boolean)
    .join('&');

  return params ? `${API_BASE_URL}${trimmedPath}?${params}` : `${API_BASE_URL}${trimmedPath}`;
};

export async function request<TResponse = unknown, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const {
    method = 'GET',
    body,
    headers = {},
    signal,
    query,
    auth = true
  } = options;

  const url = buildUrl(path, query);
  const token = auth ? getAuthToken() : null;

  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: mergedHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => undefined) : await response.text();

  if (!response.ok) {
    const message = (payload as ApiErrorShape)?.message || response.statusText || 'Request failed';
    throw new ApiError(message, response.status, (payload as ApiErrorShape)?.details ?? payload);
  }

  return (payload as TResponse) ?? ({} as TResponse);
}

export const apiClient = {
  get: <T>(path: string, query?: Record<string, unknown>, opts?: RequestOptions) =>
    request<T>(path, { ...(opts || {}), method: 'GET', query }),
  post: <T, B = unknown>(path: string, body?: B, opts?: RequestOptions<B>) =>
    request<T, B>(path, { ...(opts || {}), method: 'POST', body }),
  put: <T, B = unknown>(path: string, body?: B, opts?: RequestOptions<B>) =>
    request<T, B>(path, { ...(opts || {}), method: 'PUT', body }),
  patch: <T, B = unknown>(path: string, body?: B, opts?: RequestOptions<B>) =>
    request<T, B>(path, { ...(opts || {}), method: 'PATCH', body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...(opts || {}), method: 'DELETE' })
};
