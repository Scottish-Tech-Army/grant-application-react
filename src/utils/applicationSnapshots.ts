import type { Application, ApplicationSnapshot, CommonField } from '../types/models';
import { createId } from './id';
import { buildApplicationExport } from './exportText';
import { resolveApplicationCommonFields } from './applicationFieldValues';

const SNAPSHOT_KEY = 'grant-manager.snapshots.v1';

type SnapshotState = Record<string, ApplicationSnapshot[]>;

const readState = (): SnapshotState => {
  try {
    const raw = globalThis.localStorage?.getItem(SNAPSHOT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SnapshotState;
  } catch {
    return {};
  }
};

const writeState = (state: SnapshotState) => {
  try {
    globalThis.localStorage?.setItem(SNAPSHOT_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
};

export function saveApplicationSnapshot(
  application: Application,
  commonFields: CommonField[],
  note?: string,
) {
  const selectedCommon = resolveApplicationCommonFields(application, commonFields);

  const snapshot: ApplicationSnapshot = {
    id: createId('appsnap'),
    applicationId: application.id,
    timestamp: new Date().toISOString(),
    name: application.name,
    commonFields: selectedCommon,
    customFields: application.customFields,
    exportText: buildApplicationExport(application, selectedCommon),
    note,
  };

  const state = readState();
  const existing = state[application.id] ?? [];
  const next: SnapshotState = {
    ...state,
    [application.id]: [snapshot, ...existing].slice(0, 25),
  };

  writeState(next);
  return snapshot;
}

export function getApplicationSnapshots(applicationId: string) {
  const state = readState();
  return state[applicationId] ?? [];
}
