import type { Application, ApplicationField, CommonField } from '../types/models';

export type ApplicationFieldValues = {
  applicationId: string;
  updatedAt: string;
  commonFields: CommonField[];
  customFields: ApplicationField[];
};

const FIELD_VALUES_KEY = 'grant-manager.application-field-values.v1';

type FieldValuesState = Record<string, ApplicationFieldValues>;

const readState = (): FieldValuesState => {
  try {
    const raw = globalThis.localStorage?.getItem(FIELD_VALUES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as FieldValuesState;
  } catch {
    return {};
  }
};

const writeState = (state: FieldValuesState) => {
  try {
    globalThis.localStorage?.setItem(FIELD_VALUES_KEY, JSON.stringify(state));
  } catch {
    return;
  }
};

const buildSelectedCommonFields = (application: Application, commonFields: CommonField[]) => {
  const byId = new Map(commonFields.map((field) => [field.id, field] as const));
  return application.commonFieldIds
    .map((id) => byId.get(id))
    .filter(Boolean) as CommonField[];
};

export const getApplicationFieldValues = (applicationId: string) => {
  const state = readState();
  return state[applicationId] ?? null;
};

export const saveApplicationFieldValues = (
  application: Application,
  commonFields: CommonField[],
) => {
  const entry: ApplicationFieldValues = {
    applicationId: application.id,
    updatedAt: new Date().toISOString(),
    commonFields: buildSelectedCommonFields(application, commonFields),
    customFields: application.customFields,
  };

  const state = readState();
  const next: FieldValuesState = {
    ...state,
    [application.id]: entry,
  };
  writeState(next);
  return entry;
};

export const saveApplicationFieldValuesFromSnapshot = (
  applicationId: string,
  commonFields: CommonField[],
  customFields: ApplicationField[],
) => {
  const entry: ApplicationFieldValues = {
    applicationId,
    updatedAt: new Date().toISOString(),
    commonFields,
    customFields,
  };

  const state = readState();
  const next: FieldValuesState = {
    ...state,
    [applicationId]: entry,
  };
  writeState(next);
  return entry;
};

export const removeApplicationFieldValues = (applicationId: string) => {
  const state = readState();
  if (!state[applicationId]) return;
  const next = { ...state };
  delete next[applicationId];
  writeState(next);
};

export const resolveApplicationCommonFields = (
  application: Application,
  commonFields: CommonField[],
) => {
  const entry = getApplicationFieldValues(application.id);
  if (entry?.commonFields?.length) {
    return entry.commonFields;
  }
  return buildSelectedCommonFields(application, commonFields);
};
