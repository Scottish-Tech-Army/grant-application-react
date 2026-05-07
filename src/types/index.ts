export interface FieldVersion {
  version: number;
  value: string;
  updatedAt: string;
}

export interface CommonField {
  id: string;
  group: string;
  label: string;
  description: string;
  versions: FieldVersion[];
}

export interface ApplicationField {
  id: string;
  label: string;
  description: string;
  value: string;
  createdAt: string;
}

export interface ApplicationFieldSelection {
  fieldId: string;
  versionUsed: number;
}

export interface GrantApplication {
  id: string;
  name: string;
  funder: string;
  createdAt: string;
  updatedAt: string;
  selectedCommonFields: ApplicationFieldSelection[];
  additionalFields: ApplicationField[];
  notes: string;
}
