import type { Application, ApplicationField, CommonField } from '../types/models';

const BASE = '/api/v1/ui';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const mergedHeaders = {
    'Content-Type': 'application/json',
    ...init?.headers,
  };

  const response = await fetch(url, {
    headers: mergedHeaders,
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text || response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const uiApi = {
  listCommonFields: () => request<CommonField[]>(`${BASE}/common-fields`),

  createCommonField: (payload: Omit<CommonField, 'id'>) =>
    request<CommonField>(`${BASE}/common-fields`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCommonField: (id: string, patch: Partial<Omit<CommonField, 'id'>>) =>
    request<CommonField>(`${BASE}/common-fields/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteCommonField: (id: string) =>
    request<void>(`${BASE}/common-fields/${id}`, {
      method: 'DELETE',
    }),

  listApplications: () => request<Application[]>(`${BASE}/applications`),

  getApplication: (id: string) => request<Application>(`${BASE}/applications/${id}`),

  createApplication: (payload: {
    name: string;
    commonFieldIds: string[];
    customFields: Array<Omit<ApplicationField, 'id'>>;
  }) =>
    request<Application>(`${BASE}/applications`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateApplication: (
    id: string,
    patch: Partial<Pick<Application, 'name' | 'commonFieldIds' | 'customFields'>>,
  ) =>
    request<Application>(`${BASE}/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteApplication: (id: string) =>
    request<void>(`${BASE}/applications/${id}`, {
      method: 'DELETE',
    }),
};
