const TOKEN_STORAGE_KEY = 'charity_auth_token';

let globalAuthToken: string | null = null;

export function setGlobalAuthToken(token: string | null): void {
  globalAuthToken = token;

  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return;
  }

  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getGlobalAuthToken(): string | null {
  if (globalAuthToken !== null) {
    return globalAuthToken;
  }

  globalAuthToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  return globalAuthToken;
}

export function hydrateGlobalAuthToken(): void {
  globalAuthToken = localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearGlobalAuthToken(): void {
  setGlobalAuthToken(null);
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getGlobalAuthToken();
  const headers = new Headers(init.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers
  });
}