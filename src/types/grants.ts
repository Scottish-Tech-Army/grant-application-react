export type Id = string;

export interface CommonFieldVersion {
  version: number;
  label: string;
  value: string;
  updatedAt: string;
}

export interface CommonField {
  id: Id;
  group: string;
  label: string;
  value: string;
  version: number;
  versions: CommonFieldVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaAttachment {
  id: Id;
  name: string;
  type: "image" | "video";
  mimeType: string;
  dataUrl: string;
  size: number;
  addedAt: string;
  caption: string;
}

export interface ApplicationSpecificField {
  id: Id;
  label: string;
  value: string;
}

export interface ApplicationCommonFieldSnapshot {
  fieldId: Id;
  label: string;
  value: string;
  version: number;
  selectedAt: string;
}

export interface GrantApplication {
  id: Id;
  name: string;
  notes: string;
  funderName: string;
  projectOrService: string;
  outcomeStatus: "Draft" | "Successful" | "Unsuccessful";
  commonFieldSnapshots: ApplicationCommonFieldSnapshot[];
  specificFields: ApplicationSpecificField[];
  attachedMediaIds: string[];
  createdAt: string;
  updatedAt: string;
}
export interface CharityProfile {
  id: Id;
  name: string;
  mission: string;
  registrationNumber: string;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  mediaAttachments: MediaAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface GrantsData {
  commonFields: CommonField[];
  applications: GrantApplication[];
  charityProfile?: CharityProfile;
}
