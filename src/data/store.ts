import type { CommonField, GrantApplication } from '../types';
import { seedCommonFields } from './seedFields';

const COMMON_FIELDS_KEY = 'grant_app_common_fields';
const APPLICATIONS_KEY = 'grant_app_applications';

export function loadCommonFields(): CommonField[] {
  const stored = localStorage.getItem(COMMON_FIELDS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // First run — seed with default fields
  saveCommonFields(seedCommonFields);
  return seedCommonFields;
}

export function saveCommonFields(fields: CommonField[]): void {
  localStorage.setItem(COMMON_FIELDS_KEY, JSON.stringify(fields));
}

export function loadApplications(): GrantApplication[] {
  const stored = localStorage.getItem(APPLICATIONS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

export function saveApplications(apps: GrantApplication[]): void {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
}
