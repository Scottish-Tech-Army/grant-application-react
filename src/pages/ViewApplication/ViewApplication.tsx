import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ApiErrorBanner, Section } from '../../components';
import { useClipboard, useDownloadTextFile } from '../../hooks';
import { useApplicationsStore, useCommonFieldsStore } from '../../store';
import {
  buildApplicationExport,
  exportFileName,
  formatDateTime,
  getApplicationSnapshots,
  resolveApplicationCommonFields,
  saveApplicationFieldValuesFromSnapshot,
} from '../../utils';
import styles from './styles.module.css';

export function ViewApplication() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { commonFields, updateCommonField, isLoading: isCommonFieldsLoading, error: commonFieldsError, clearError: clearCommonFieldsError, reload: reloadCommonFields } = useCommonFieldsStore();
  const { getApplicationById, updateApplication, getApplicationHistory, restoreApplicationVersion, isLoading: isApplicationsLoading, error: applicationsError, clearError: clearApplicationsError, reload: reloadApplications } = useApplicationsStore();
  const { copy, lastError } = useClipboard();
  const download = useDownloadTextFile();

  const isLoading = isCommonFieldsLoading || isApplicationsLoading;

  const application = id ? getApplicationById(id) : null;

  const resolvedCommonFields = useMemo(() => {
    if (!application) return [];
    return resolveApplicationCommonFields(application, commonFields);
  }, [application, commonFields]);

  const exportText = useMemo(() => {
    if (!application) return '';
    return buildApplicationExport(application, resolvedCommonFields);
  }, [application, resolvedCommonFields]);

  const snapshots = useMemo(() => {
    if (!application) return [];
    return getApplicationSnapshots(application.id);
  }, [application]);

  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);

  const activeSnapshot = useMemo(() => {
    if (selectedSnapshotId) {
      const match = snapshots.find((snap) => snap.id === selectedSnapshotId);
      if (match) return match;
    }
    return snapshots[0] ?? null;
  }, [selectedSnapshotId, snapshots]);

  const [applyCommonOnRestore, setApplyCommonOnRestore] = useState(true);

  const applyCommonFieldValues = (fields: typeof commonFields) => {
    return Promise.all(
      fields.map((field) => updateCommonField(field.id, { value: field.value }))
    );
  };

  const handleRestoreSnapshot = (snapshot: (typeof snapshots)[number]) => {
    if (!application) return;
    const commonFieldIds = snapshot.commonFields.map((field) => field.id);
    void updateApplication(application.id, {
      name: snapshot.name,
      commonFieldIds,
      customFields: snapshot.customFields,
    })
      .then(() => {
        saveApplicationFieldValuesFromSnapshot(
          application.id,
          snapshot.commonFields,
          snapshot.customFields,
        );
        if (!applyCommonOnRestore) return;
        void applyCommonFieldValues(snapshot.commonFields).catch(() => undefined);
      })
      .catch(() => undefined);
  };

  const history = useMemo(() => {
    if (!application) return [];
    return getApplicationHistory(application.id);
  }, [application, getApplicationHistory]);

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
    <main className={styles.container}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={() => navigate('/')}
        >
          ← Back
        </button>
        <h1 className={styles.title}>Application: {application.name}</h1>
      </header>

      {commonFieldsError ? <ApiErrorBanner message={commonFieldsError} onDismiss={clearCommonFieldsError} onRetry={() => void reloadCommonFields()} /> : null}
      {applicationsError ? <ApiErrorBanner message={applicationsError} onDismiss={clearApplicationsError} onRetry={() => void reloadApplications()} /> : null}

      <Section title="Common Fields Included">
        <div className={styles.fieldList}>
          {resolvedCommonFields.map((field) => {
            if (!field) return null;
            return (
              <div key={field.id} className={styles.fieldItem}>
                <div className={styles.fieldLabel}>{field.label}</div>
                <div className={styles.fieldValue}>{field.value || '—'}</div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Application-Specific Fields">
        <div className={styles.fieldList}>
          {application.customFields.length === 0 ? (
            <div className={styles.empty}>No application fields.</div>
          ) : (
            application.customFields.map((field) => (
              <div key={field.id} className={styles.fieldItem}>
                <div className={styles.fieldLabel}>{field.label}</div>
                <div className={styles.fieldValue}>{field.value || '—'}</div>
              </div>
            ))
          )}
        </div>
      </Section>

      <Section title="Version History">
        {history.length === 0 ? (
          <div className={styles.empty}>No saved versions yet.</div>
        ) : (
          <div className={styles.historyList}>
            {history.map((entry) => (
              <div key={entry.id} className={styles.historyRow}>
                <div>
                  <div className={styles.historyTitle}>{entry.note ?? 'Saved'}</div>
                  <div className={styles.historyMeta}>{formatDateTime(entry.timestamp)}</div>
                </div>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => restoreApplicationVersion(application.id, entry.id)}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="FINAL EXPORT">
        <div className={styles.exportActions}>
          <button type="button" className={styles.primary} onClick={() => copy(exportText)}
          >
            Copy All
          </button>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => download(exportFileName(application), exportText)}
          >
            Download TXT
          </button>
        </div>
        {lastError ? <p className={styles.error}>Copy failed: {lastError}</p> : null}
      </Section>

      <Section title="Saved Snapshots">
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={applyCommonOnRestore}
            onChange={(event) => setApplyCommonOnRestore(event.target.checked)}
          />
          <span>Also restore common field values</span>
        </label>
        {snapshots.length === 0 ? (
          <div className={styles.empty}>No saved snapshots yet.</div>
        ) : (
          <div className={styles.historyList}>
            {snapshots.map((snapshot) => (
              <div key={snapshot.id} className={styles.historyRow}>
                <div>
                  <div className={styles.historyTitle}>{snapshot.note ?? 'Saved'}</div>
                  <div className={styles.historyMeta}>{formatDateTime(snapshot.timestamp)}</div>
                </div>
                <div className={styles.historyActions}>
                  <button
                    type="button"
                    className={styles.ghost}
                    onClick={() => setSelectedSnapshotId(snapshot.id)}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={() => handleRestoreSnapshot(snapshot)}
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Export Preview (Read Only)">
        <textarea
          className={styles.preview}
          value={activeSnapshot ? activeSnapshot.exportText : exportText}
          readOnly
          rows={12}
        />
      </Section>
    </main>
  );
}
