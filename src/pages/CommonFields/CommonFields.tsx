import { useMemo, useState } from 'react';

import { ApiErrorBanner, FieldEditor, Section } from '../../components';
import { COMMON_FIELD_GROUPS } from '../../constants/commonFieldGroups';
import { useCommonFieldsStore } from '../../store';
import type { CommonField, FieldType } from '../../types/models';
import { formatDateTime } from '../../utils';
import styles from './styles.module.css';

const FIELD_TYPES: FieldType[] = ['text', 'textarea', 'number'];

export function CommonFields() {
  const {
    commonFields,
    isLoading,
    error,
    reload,
    clearError,
    addCommonField,
    updateCommonField,
    deleteCommonField,
    resetCommonFields,
    getCommonFieldHistory,
    restoreCommonFieldVersion,
  } = useCommonFieldsStore();
  const [label, setLabel] = useState('');
  const [group, setGroup] = useState(COMMON_FIELD_GROUPS[0]);
  const [type, setType] = useState<FieldType>('text');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set([COMMON_FIELD_GROUPS[0]]),
  );
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(() => new Set());

  const grouped = useMemo(() => {
    const map = new Map<string, typeof commonFields>();
    for (const field of commonFields) {
      if (!map.has(field.group)) map.set(field.group, []);
      map.get(field.group)?.push(field);
    }
    return map;
  }, [commonFields]);

  const orderedGroups = useMemo(() => {
    const existingGroups = new Set(grouped.keys());
    return [
      ...COMMON_FIELD_GROUPS,
      ...[...existingGroups].filter((item) => !COMMON_FIELD_GROUPS.includes(item)),
    ];
  }, [grouped]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const toggleHistory = (id: string) => {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const runSafe = (promise: Promise<unknown>) => {
    void promise.catch(() => undefined);
  };

  const onEditField = (id: string, fieldLabel: string) => {
    runSafe(updateCommonField(id, { label: fieldLabel }));
  };

  const onDeleteField = (id: string) => {
    runSafe(deleteCommonField(id));
  };

  const onFieldValueChange = (id: string, patch: Partial<Omit<CommonField, 'id'>>) => {
    runSafe(updateCommonField(id, patch));
  };

  const onRestoreHistory = (fieldId: string, entryId: string) => {
    runSafe(restoreCommonFieldVersion(fieldId, entryId));
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.back}
          onClick={() => globalThis.history.back()}
        >
          ← Back
        </button>
        <h1 className={styles.title}>Common Information Fields</h1>
        <button
          type="button"
          className={styles.ghost}
          onClick={() => {
            void resetCommonFields().catch(() => undefined);
          }}
        >
          Reset Defaults
        </button>
      </header>

      {error ? <ApiErrorBanner message={error} onDismiss={clearError} onRetry={() => void reload()} /> : null}

      <Section title="Common Field Groups (auto-loaded from TAG research)">
        <div className={styles.groupList}>
          {orderedGroups.map((groupName) => {
            const isOpen = expandedGroups.has(groupName);
            const fields = grouped.get(groupName) ?? [];
            return (
              <div key={groupName} className={styles.groupBlock}>
                <button
                  type="button"
                  className={styles.groupHeader}
                  onClick={() => toggleGroup(groupName)}
                >
                  <span className={styles.caret}>{isOpen ? '▼' : '►'}</span>
                  <span>{groupName}</span>
                </button>
                {isOpen ? (
                  <div className={styles.groupContent}>
                    {fields.length === 0 ? (
                      <div className={styles.empty}>No fields yet.</div>
                    ) : (
                      fields.map((field) => (
                        <div key={field.id} className={styles.fieldRow}>
                          <div className={styles.fieldName}>• {field.label}</div>
                          <div className={styles.fieldActions}>
                            <button
                              type="button"
                              className={styles.actionButton}
                              onClick={() => onEditField(field.id, field.label)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className={styles.ghost}
                              onClick={() => onDeleteField(field.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Add New Field">
        <div className={styles.formRow}>
          <label className={styles.fieldLabel}>
            <span>Label:</span>
            <input
              className={styles.input}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Field label"
            />
          </label>
          <label className={styles.fieldLabel}>
            <span>Group:</span>
            <select
              className={styles.input}
              value={group}
              onChange={(event) => setGroup(event.target.value)}
            >
              {orderedGroups.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.fieldLabel}>
            <span>Type:</span>
            <select
              className={styles.input}
              value={type}
              onChange={(event) => setType(event.target.value as FieldType)}
            >
              {FIELD_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={styles.primary}
            onClick={() => {
              if (!label.trim()) return;
              void addCommonField({ label: label.trim(), group: group.trim(), type, value: '' }).catch(() => undefined);
              setLabel('');
            }}
          >
            Add Field
          </button>
        </div>
      </Section>

      <Section title="Edit Field Values">
        <div className={styles.list}>
          {commonFields.map((field) => {
            const history = getCommonFieldHistory(field.id);
            return (
              <div key={field.id} className={styles.historyBlock}>
                <FieldEditor
                  label={field.label}
                  group={field.group}
                  type={field.type}
                  value={field.value}
                  onChange={(patch) => onFieldValueChange(field.id, patch)}
                  onRemove={() => onDeleteField(field.id)}
                />
                <button
                  type="button"
                  className={styles.historyToggle}
                  onClick={() => toggleHistory(field.id)}
                >
                  {expandedHistory.has(field.id) ? 'Hide History' : 'Show History'}
                </button>
                {expandedHistory.has(field.id) ? (
                  <div className={styles.historyList}>
                    {history.length === 0 ? (
                      <div className={styles.empty}>No history yet.</div>
                    ) : (
                      history.map((entry) => (
                        <div key={entry.id} className={styles.historyRow}>
                          <div>
                            <div className={styles.historyTitle}>{entry.note ?? 'Saved'}</div>
                            <div className={styles.historyMeta}>
                              {formatDateTime(entry.timestamp)}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.ghost}
                            onClick={() => onRestoreHistory(field.id, entry.id)}
                          >
                            Restore
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Section>

      {isLoading ? <div className={styles.empty}>Loading...</div> : null}
    </main>
  );
}
