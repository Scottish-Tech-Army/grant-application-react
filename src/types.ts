export interface User {
  id: number;
  username: string;
  role: 'SUPERUSER' | 'ADMIN' | 'USER';
  charityId: number;
  charityName?: string;
  token?: string;
}

export interface TemplateField {
  id: number;
  key: string;
  value: string;
  comment?: string;
  comments?: string;
}

export interface Template {
  id: number | string;
  charityId?: number;
  charity_id?: number;
  templateTitle?: string;
  title?: string;
  description: string;
  version: string;
  createdAt?: string;
  created_at?: string;
  dataJson?: TemplateField[];
  data_json?: string; // fallback if needed
  is_active?: boolean;
}

export interface Application {
  id?: number | string;
  charity_id?: number;
  applicationNumber: string;
  projectName: string;
  projectFund?: string;
  funderName: string;
  funder_name?: string;
  securedFund?: string;
  status: string;
  modifiedAt: string;
  application_data_json?: string;
  selected_common_keys?: string;
  common_data_id?: number;
  created_at?: string;
}
