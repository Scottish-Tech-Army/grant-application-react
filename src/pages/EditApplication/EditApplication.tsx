import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ApiErrorBanner, Section } from '../../components';
import { useApplicationsStore, useCommonFieldsStore } from '../../store';
import type { ApplicationField, CommonField, FieldType } from '../../types/models';
import { saveApplicationFieldValues, saveApplicationSnapshot } from '../../utils';
import styles from './styles.module.css';

const FIELD_TYPES: FieldType[] = ['text', 'textarea', 'number'];

type EditApplicationFormProps = {
  applicationName: string;
  initialCommonFieldIds: string[];
  initialCustomFields: ApplicationField[];
  commonFields: CommonField[];
  onSave: (payload: {
    name: string;
    commonFieldIds: string[];
    customFields: ApplicationField[];
  }) => void;
  onBack: () => void;
};

function EditApplicationForm({
  applicationName,
  initialCommonFieldIds,
  initialCustomFields,
  commonFields,
  onSave,
  onBack,
}: Readonly<EditApplicationFormProps>) {
  const [name, setName] = useState(applicationName);
  const [selectedCommon, setSelectedCommon] = useState<string[]>(initialCommonFieldIds);
  const [customFields, setCustomFields] = useState<ApplicationField[]>(initialCustomFields);

  const groupedCommon = useMemo(() => {
    const map = new Map<string, typeof commonFields>();
    for (const field of commonFields) {
      if (!map.has(field.group)) map.set(field.group, []);
      map.get(field.group)?.push(field);
    }
    return map;
  }, [commonFields]);

  const toggleCommonField = (fieldId: string) => {
    setSelectedCommon((prev) =>
      prev.includes(fieldId) ? prev.filter((idItem) => idItem !== fieldId) : [...prev, fieldId],
    );
  };

  const updateCustomField = (fieldId: string, patch: Partial<ApplicationField>) => {
    setCustomFields((prev) =>
      prev.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)),
    );
  };

  const addCustomField = () => {
    setCustomFields((prev) => [
      ...prev,
      { id: Date.now().toString(), label: 'New Field', type: 'text', value: '' },
    ]);
  };

  const removeCustomField = (fieldId: string) => {
    setCustomFields((prev) => prev.filter((field) => field.id !== fieldId));
  };

  const handleSave = () => {
    onSave({ name, commonFieldIds: selectedCommon, customFields });
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={onBack}>
          ← Back
        </button>
        <h1 className={styles.title}>Edit Application</h1>
      </header>

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

      <Section
        title="Application-Specific Fields"
        actions={
          <button type="button" className={styles.ghost} onClick={addCustomField}>
            Add Field
          </button>
        }
      >
        {customFields.length === 0 ? (
          <div className={styles.empty}>No custom fields yet.</div>
        ) : (
          <div className={styles.list}>
            {customFields.map((field) => (
              <div key={field.id} className={styles.customRow}>
                <div className={styles.inputs}>
                  <input
                    className={styles.input}
                    value={field.label}
                    onChange={(event) =>
                      updateCustomField(field.id, { label: event.target.value })
                    }
                    placeholder="Field label"
                  />
                  <select
                    className={styles.input}
                    value={field.type}
                    onChange={(event) =>
                      updateCustomField(field.id, {
                        type: event.target.value as FieldType,
                      })
                    }
                  >
                    {FIELD_TYPES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  className={styles.textarea}
                  value={field.value}
                  onChange={(event) =>
                    updateCustomField(field.id, { value: event.target.value })
                  }
                  rows={3}
                />
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => removeCustomField(field.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <button type="button" className={styles.primary} onClick={handleSave}>
        Save Changes
      </button>
    </main>
  );
}

export function EditApplication() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    getApplicationById,
    updateApplication,
    isLoading: isApplicationsLoading,
    error: applicationsError,
    clearError: clearApplicationsError,
    reload: reloadApplications,
  } = useApplicationsStore();

  const {
    commonFields,
    isLoading: isCommonLoading,
    error: commonFieldsError,
    clearError: clearCommonFieldsError,
    reload: reloadCommonFields,
  } = useCommonFieldsStore();

  const isLoading = isApplicationsLoading || isCommonLoading;
  const application = id ? getApplicationById(id) : null;

  if (isLoading) {
    return (
      <main className={styles.container}>
        <Section title="Loading application">
          <p className={styles.subtitle}>Please wait...</p>
        </Section>
      </main>
    );
  }

  if (!application) {
    return (
      <main className={styles.container}>
        <Section title="Application not found">
          <p className={styles.subtitle}>We could not find that application.</p>
          <button type="button" className={styles.primary} onClick={() => navigate('/')}
          >
            Return to Dashboard
          </button>
        </Section>
      </main>
    );
  }

  return (
    <>
      {applicationsError ? (
        <ApiErrorBanner
          message={applicationsError}
          onDismiss={clearApplicationsError}
          onRetry={() => reloadApplications().catch(() => undefined)}
        />
      ) : null}
      {commonFieldsError ? (
        <ApiErrorBanner
          message={commonFieldsError}
          onDismiss={clearCommonFieldsError}
          onRetry={() => reloadCommonFields().catch(() => undefined)}
        />
      ) : null}
      <EditApplicationForm
        key={application.id}
        applicationName={application.name}
        initialCommonFieldIds={application.commonFieldIds}
        initialCustomFields={application.customFields}
        commonFields={commonFields}
        onBack={() => navigate(-1)}
        onSave={(payload) => {
          void updateApplication(application.id, payload)
            .then((updated) => {
              if (updated) {
                saveApplicationFieldValues(updated, commonFields);
                saveApplicationSnapshot(updated, commonFields, 'Edited');
              }
              navigate(`/applications/${application.id}`);
            })
            .catch(() => undefined);
        }}
      />
    </>
  );
}
