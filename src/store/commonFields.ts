import { useCallback, useEffect, useMemo, useState } from 'react';

import { uiApi } from '../api';
import type { CommonField, FieldType, HistoryEntry } from '../types/models';
import { createId } from '../utils/id';

type CommonFieldDraft = {
	label: string;
	group: string;
	type: FieldType;
	value: string;
};

const DEFAULT_FIELDS: CommonField[] = [
	{
		id: createId('cf'),
		label: 'Organisation Name',
		group: 'Organisation',
		type: 'text',
		value: '',
	},
	{
		id: createId('cf'),
		label: 'Organisation Address',
		group: 'Organisation',
		type: 'textarea',
		value: '',
	},
	{
		id: createId('cf'),
		label: 'Contact Email',
		group: 'Contact',
		type: 'text',
		value: '',
	},
];

type CommonFieldHistoryState = Record<string, HistoryEntry<CommonField>[]>;

const HISTORY_KEY = 'grant-manager.history.common-fields.v1';

const readHistory = (): CommonFieldHistoryState => {
	try {
		const raw = globalThis.localStorage?.getItem(HISTORY_KEY);
		if (!raw) return {};
		return JSON.parse(raw) as CommonFieldHistoryState;
	} catch {
		return {};
	}
};

const writeHistory = (state: CommonFieldHistoryState) => {
	try {
		globalThis.localStorage?.setItem(HISTORY_KEY, JSON.stringify(state));
	} catch {
		// ignore storage failures
	}
};

export function useCommonFieldsStore() {
	const [commonFields, setCommonFields] = useState<CommonField[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [history, setHistory] = useState<CommonFieldHistoryState>(() => readHistory());

	const toErrorMessage = (value: unknown) =>
		value instanceof Error ? value.message : 'Something went wrong while calling the API.';

	const reload = useCallback(async () => {
		setIsLoading(true);
		try {
			const fromApi = await uiApi.listCommonFields();
			setCommonFields(fromApi);
			setError(null);
		} catch (err) {
			setCommonFields([]);
			setError(toErrorMessage(err));
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void reload();
	}, [reload]);

	const pushHistory = useCallback(
		(field: CommonField, note?: string) => {
			setHistory((prev) => {
				const existing = prev[field.id] ?? [];
				const entry: HistoryEntry<CommonField> = {
					id: createId('cfhist'),
					timestamp: new Date().toISOString(),
					snapshot: field,
					note,
				};
				const next: CommonFieldHistoryState = {
					...prev,
					[field.id]: [entry, ...existing].slice(0, 25),
				};
				writeHistory(next);
				return next;
			});
		},
		[setHistory],
	);

	const addCommonField = useCallback(
		async (draft: CommonFieldDraft) => {
			try {
				const newField = await uiApi.createCommonField(draft);
				setCommonFields((prev) => [newField, ...prev]);
				pushHistory(newField, 'Created');
				setError(null);
				return newField;
			} catch (err) {
				setError(toErrorMessage(err));
				throw err;
			}
		},
		[setCommonFields, pushHistory],
	);

	const updateCommonField = useCallback(
		async (id: string, patch: Partial<Omit<CommonField, 'id'>>) => {
			try {
				const updated = await uiApi.updateCommonField(id, patch);
				setCommonFields((prev) => prev.map((field) => (field.id === id ? updated : field)));
				pushHistory(updated, 'Updated');
				setError(null);
				return updated;
			} catch (err) {
				setError(toErrorMessage(err));
				throw err;
			}
		},
		[setCommonFields, pushHistory],
	);

	const deleteCommonField = useCallback(
		async (id: string) => {
			try {
				await uiApi.deleteCommonField(id);
				setCommonFields((prev) => prev.filter((field) => field.id !== id));
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
		[setCommonFields],
	);

	const resetCommonFields = useCallback(async () => {
		try {
			await Promise.all(commonFields.map((field) => uiApi.deleteCommonField(field.id)));
			const created = await Promise.all(DEFAULT_FIELDS.map((field) => uiApi.createCommonField({
				label: field.label,
				group: field.group,
				type: field.type,
				value: field.value,
			})));
			setCommonFields(created);
			setHistory(() => {
				const next: CommonFieldHistoryState = {};
				for (const field of created) {
					next[field.id] = [
						{
							id: createId('cfhist'),
							timestamp: new Date().toISOString(),
							snapshot: field,
							note: 'Reset Defaults',
						},
					];
				}
				writeHistory(next);
				return next;
			});
			setError(null);
		} catch (err) {
			setError(toErrorMessage(err));
			throw err;
		}
	}, [commonFields]);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const commonFieldsById = useMemo(() => {
		return new Map(commonFields.map((field) => [field.id, field] as const));
	}, [commonFields]);

	const getCommonFieldHistory = useCallback(
		(id: string) => history[id] ?? [],
		[history],
	);

	const restoreCommonFieldVersion = useCallback(
		async (id: string, versionId: string) => {
			const entry = (history[id] ?? []).find((item) => item.id === versionId);
			if (!entry) return null;
			const snapshot = entry.snapshot;
			return updateCommonField(id, {
				label: snapshot.label,
				group: snapshot.group,
				type: snapshot.type,
				value: snapshot.value,
			});
		},
		[history, updateCommonField],
	);

	return {
		commonFields,
		isLoading,
		error,
		commonFieldsById,
		reload,
		clearError,
		addCommonField,
		updateCommonField,
		deleteCommonField,
		resetCommonFields,
		getCommonFieldHistory,
		restoreCommonFieldVersion,
	};
}

export type { CommonFieldDraft };
