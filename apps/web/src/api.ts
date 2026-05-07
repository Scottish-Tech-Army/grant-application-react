const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) throw data;
  return data as T;
}

export type FieldType = "text" | "textarea" | "number" | "url";

export interface FieldVersion {
  id: string;
  fieldId: string;
  version: number;
  value: string;
  createdAt: string;
}

export interface CommonField {
  id: string;
  key: string;
  label: string;
  group: string;
  type: FieldType;
  helpText: string;
  createdAt: string;
  latestVersion?: FieldVersion | null;
}

export interface ApplicationSpecificFieldVersion {
  id: string;
  version: number;
  value: string;
  createdAt: string;
}

export interface ApplicationSpecificField {
  id: string;
  label: string;
  type: FieldType;
  versions: ApplicationSpecificFieldVersion[];
}

export interface ApplicationSelectedCommon {
  fieldId: string;
  versionId: string;
}

export interface Application {
  id: string;
  name: string;
  funder: string;
  status: "draft" | "submitted";
  createdAt: string;
  selectedCommon: ApplicationSelectedCommon[];
  specificFields: ApplicationSpecificField[];
}

export interface BackupModel {
  meta: { id: string; createdAt: string };
  commonFields: Array<Omit<CommonField, "latestVersion">>;
  fieldVersions: FieldVersion[];
  applications: Application[];
}

export const api = {
  health: () => request<{ ok: boolean }>("/api/health"),

  commonFields: () => request<CommonField[]>("/api/common-fields"),
  fieldVersions: (id: string) => request<FieldVersion[]>(`/api/common-fields/${id}/versions`),
  createCommonField: (body: { key: string; label: string; group: string; type: FieldType; helpText?: string }) =>
    request<{ field: unknown; v1: unknown }>("/api/common-fields", { method: "POST", body: JSON.stringify(body) }),
  createFieldVersion: (id: string, value: string) =>
    request<FieldVersion>(`/api/common-fields/${id}/versions`, { method: "POST", body: JSON.stringify({ value }) }),

  applications: () => request<Application[]>("/api/applications"),
  application: (id: string) => request<Application>(`/api/applications/${id}`),
  createApplication: (body: { name: string; funder?: string }) =>
    request<Application>("/api/applications", { method: "POST", body: JSON.stringify(body) }),
  setSelectedCommon: (id: string, selectedCommon: ApplicationSelectedCommon[]) =>
    request<Application>(`/api/applications/${id}/selected-common`, { method: "PUT", body: JSON.stringify({ selectedCommon }) }),

  addSpecificField: (id: string, body: { label: string; type: FieldType }) =>
    request<ApplicationSpecificField>(`/api/applications/${id}/specific-fields`, { method: "POST", body: JSON.stringify(body) }),
  addSpecificFieldVersion: (id: string, sfid: string, value: string) =>
    request<ApplicationSpecificFieldVersion>(`/api/applications/${id}/specific-fields/${sfid}/versions`, {
      method: "POST",
      body: JSON.stringify({ value })
    }),

  exportApp: (id: string, format: "plain" | "markdown" = "plain") =>
    fetch(`${BASE}/api/applications/${id}/export?format=${format}`).then((r) => r.text()),

  backup: () => request<BackupModel>("/api/backup"),
  restore: (payload: BackupModel) => request<{ ok: boolean }>("/api/restore", { method: "POST", body: JSON.stringify(payload) })
};
