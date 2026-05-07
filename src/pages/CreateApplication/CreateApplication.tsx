import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiErrorBanner, Section } from '../../components';
import { useApplicationsStore, useCommonFieldsStore } from '../../store';
import { saveApplicationFieldValues, saveApplicationSnapshot } from '../../utils';
import type { ApplicationField, FieldType } from '../../types/models';
import styles from './styles.module.css';

const FIELD_TYPES: FieldType[] = ['text', 'textarea', 'number'];

export function CreateApplication() {
  const navigate = useNavigate();
  const { commonFields } = useCommonFieldsStore();
  const { createApplication, addEmptyCustomField, error, clearError, reload } = useApplicationsStore();

  const [name, setName] = useState('');
  const [selectedCommon, setSelectedCommon] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<ApplicationField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('text');

  const groupedCommon = useMemo(() => {
    const map = new Map<string, typeof commonFields>();
    for (const field of commonFields) {
      if (!map.has(field.group)) map.set(field.group, []);
      map.get(field.group)?.push(field);
    }
    return map;
  }, [commonFields]);

  const toggleCommonField = (id: string) => {
    setSelectedCommon((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const updateCustomField = (id: string, patch: Partial<ApplicationField>) => {
    setCustomFields((prev) =>
      prev.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    );
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const emptyField = addEmptyCustomField();
    setCustomFields((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        ...emptyField,
        label: newFieldLabel.trim(),
        type: newFieldType,
      },
    ]);
    setNewFieldLabel('');
  };

  const handleSave = async () => {
    try {
      void createApplication({
        name,
        commonFieldIds: selectedCommon,
        customFields: customFields.map(({ label, type, value }) => ({
          label,
          type,
          value,
        })),
      })
        .then((created) => {
          saveApplicationFieldValues(created, commonFields);
          saveApplicationSnapshot(created, commonFields, 'Created');
          navigate(`/applications/${created.id}`);
        })
        .catch(() => undefined);
    } catch {
      // Error is shown via the shared API error banner.
    }
  };

  const removeCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.back}
          onClick={() => navigate('/')}
        >
          ← Back
        </button>
        <h1 className={styles.title}>Create New Application</h1>
      </header>

      {error ? <ApiErrorBanner message={error} onDismiss={clearError} onRetry={() => void reload()} /> : null}

      <Section title="Application Name">
        <input
          className={styles.input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Application name"
        />
      </Section>

      <Section title="Select Common Fields to Include">
        <div className={styles.checkboxGrid}>
          {[...groupedCommon.entries()].flatMap(([groupName, fields]) =>
            fields.map((field) => (
              <label key={field.id} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={selectedCommon.includes(field.id)}
                  onChange={() => toggleCommonField(field.id)}
                />
                <span className={styles.checkboxLabel}>{field.label}</span>
                <span className={styles.checkboxGroup}>{groupName}</span>
              </label>
            )),
          )}
        </div>
      </Section>

      <Section title="Add Application-Specific Field">
        <div className={styles.formRow}>
          <label className={styles.fieldLabel}>
            <span>Field Label:</span>
            <input
              className={styles.input}
              value={newFieldLabel}
              onChange={(event) => setNewFieldLabel(event.target.value)}
              placeholder="Field label"
            />
          </label>
          <label className={styles.fieldLabel}>
            <span>Type:</span>
            <select
              className={styles.input}
              value={newFieldType}
              onChange={(event) => setNewFieldType(event.target.value as FieldType)}
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
            onClick={addCustomField}
          >
            Add Field
          </button>
        </div>
      </Section>

      <Section title="Application-Specific Fields">
        {customFields.length === 0 ? (
          <div className={styles.empty}>No custom fields yet.</div>
        ) : (
          <div className={styles.list}>
            {customFields.map((field) => (
              <div key={field.id} className={styles.listRow}>
                <div className={styles.cellTitle}>{field.label}</div>
                <div className={styles.listActions}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() =>
                      updateCustomField(field.id, { label: `${field.label}` })
                    }
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.ghost}
                    onClick={() => removeCustomField(field.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <button type="button" className={styles.primary} onClick={() => void handleSave()}>
        Save Application
      </button>
    </main>
  );
}
