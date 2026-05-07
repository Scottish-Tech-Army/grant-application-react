export type FieldType = "text" | "textarea" | "number";

export interface HistoryEntry<T> {
  id: string;
  timestamp: string;
  snapshot: T;
  note?: string;
}

export interface CommonField {
  id: string;
  label: string;
  group: string;
  type: FieldType;
  value: string;
}

export interface ApplicationField {
  id: string;
  label: string;
  type: FieldType;
  value: string;
}

export interface Application {
  id: string;
  name: string;
  createdAt: string;
  commonFieldIds: string[];
  customFields: ApplicationField[];
}

export interface ApplicationSnapshot {
  id: string;
  applicationId: string;
  timestamp: string;
  name: string;
  commonFields: CommonField[];
  customFields: ApplicationField[];
  exportText: string;
  note?: string;
}