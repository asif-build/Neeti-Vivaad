export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    if (hostname) {
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//localhost:8000`;
      }
      return window.location.origin;
    }
  }
  return 'http://localhost:8000';
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';


export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

export function setTokens(access: string, refresh?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
  localStorage.removeItem('user_role');
}

export function getSavedUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user_info');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSavedUser(user: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_info', JSON.stringify(user));
  if (user.role) localStorage.setItem('user_role', user.role);
}

export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const base = getApiBaseUrl();
  let url = endpoint;
  if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    url = base ? `${base}${cleanEndpoint}` : cleanEndpoint;
  }
  const token = getAccessToken();

  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const role = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
  if (role && !headers.has('X-User-Role')) {
    headers.set('X-User-Role', role);
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  return res;
}

export async function safeJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      // JSON syntax error, fallback to text parsing
    }
  }

  const text = await res.text();
  const trimmed = text.trim();
  if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE')) {
    if (!res.ok) {
      throw new Error(`Server returned error (${res.status}). Please try again.`);
    }
    throw new Error('Server returned an unexpected response format. Please try again.');
  }

  try {
    return JSON.parse(text);
  } catch {
    if (!res.ok) {
      throw new Error(trimmed || `Request failed with status ${res.status}`);
    }
    return { detail: trimmed };
  }
}

