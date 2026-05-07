import { useCallback, useEffect, useMemo, useState } from 'react';

import { uiApi } from '../api';
import type { Application, ApplicationField, FieldType, HistoryEntry } from '../types/models';
import { removeApplicationFieldValues } from '../utils/applicationFieldValues';
import { createId } from '../utils/id';

type ApplicationDraft = {
  name: string;
  commonFieldIds: string[];
  customFields: Array<Omit<ApplicationField, 'id'>>;
};

type ApplicationHistoryState = Record<string, HistoryEntry<Application>[]>;

const HISTORY_KEY = 'grant-manager.history.applications.v1';

const readHistory = (): ApplicationHistoryState => {
  try {
    const raw = globalThis.localStorage?.getItem(HISTORY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ApplicationHistoryState;
  } catch {
    return {};
  }
};

const writeHistory = (state: ApplicationHistoryState) => {
  try {
    globalThis.localStorage?.setItem(HISTORY_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
};

export function useApplicationsStore() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ApplicationHistoryState>(() => readHistory());

  const toErrorMessage = (value: unknown) =>
    value instanceof Error ? value.message : 'Something went wrong while calling the API.';

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const fromApi = await uiApi.listApplications();
      setApplications(fromApi);
      setError(null);
    } catch (err) {
      setApplications([]);
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const pushHistory = useCallback(
    (app: Application, note?: string) => {
      setHistory((prev) => {
        const existing = prev[app.id] ?? [];
        const entry: HistoryEntry<Application> = {
          id: createId('apphist'),
          timestamp: new Date().toISOString(),
          snapshot: app,
          note,
        };
        const next: ApplicationHistoryState = {
          ...prev,
          [app.id]: [entry, ...existing].slice(0, 25),
        };
        writeHistory(next);
        return next;
      });
    },
    [setHistory],
  );

  const createApplication = useCallback(
    async (draft: ApplicationDraft) => {
      try {
        const app = await uiApi.createApplication({
          name: draft.name.trim() || 'Untitled Application',
          commonFieldIds: draft.commonFieldIds,
          customFields: draft.customFields.map(({ label, type, value }) => ({
            label,
            type,
            value,
          })),
        });
        setApplications((prev) => [app, ...prev]);
        pushHistory(app, 'Created');
        setError(null);
        return app;
      } catch (err) {
        setError(toErrorMessage(err));
        throw err;
      }
    },
    [setApplications, pushHistory],
  );

  const updateApplication = useCallback(
    async (id: string, patch: Partial<Omit<Application, 'id' | 'createdAt'>>) => {
      try {
        const updated = await uiApi.updateApplication(id, patch);
        setApplications((prev) => prev.map((app) => (app.id === id ? updated : app)));
        pushHistory(updated, 'Updated');
        setError(null);
        return updated;
      } catch (err) {
        setError(toErrorMessage(err));
        throw err;
      }
    },
    [setApplications, pushHistory],
  );

  const deleteApplication = useCallback(
    async (id: string) => {
      try {
        await uiApi.deleteApplication(id);
        setApplications((prev) => prev.filter((app) => app.id !== id));
        removeApplicationFieldValues(id);
        setHistory((prev) => {
          const next = { ...prev };
          delete next[id];
          writeHistory(next);
          return next;
        });
        setError(null);
      } catch (err) {
        setError(toErrorMessage(err));
        throw err;
      }
    },
    [setApplications],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const applicationsById = useMemo(() => {
    return new Map(applications.map((a) => [a.id, a] as const));
  }, [applications]);

  const getApplicationById = useCallback(
    (id: string) => applicationsById.get(id) ?? null,
    [applicationsById],
  );

  const getApplicationHistory = useCallback(
    (id: string) => history[id] ?? [],
    [history],
  );

  const restoreApplicationVersion = useCallback(
    async (id: string, versionId: string) => {
      const entry = (history[id] ?? []).find((item) => item.id === versionId);
      if (!entry) return null;
      const snapshot = entry.snapshot;
      return updateApplication(id, {
        name: snapshot.name,
        commonFieldIds: snapshot.commonFieldIds,
        customFields: snapshot.customFields,
      });
    },
    [history, updateApplication],
  );

  const addEmptyCustomField = useCallback(() => {
    return {
      label: 'New Field',
      type: 'text' as FieldType,
      value: '',
    };
  }, []);

  return {
    applications,
    isLoading,
    error,
    reload,
    clearError,
    applicationsById,
    getApplicationById,
    getApplicationHistory,
    restoreApplicationVersion,
    createApplication,
    updateApplication,
    deleteApplication,
    addEmptyCustomField,
  };
}

export type { ApplicationDraft };
