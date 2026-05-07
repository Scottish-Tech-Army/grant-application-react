import { mockTemplates } from './MockData';
import { User, Application, TemplateField } from '../types';
import styles from './ApplicationForm.module.css';

interface ApplicationFormProps {
  view: string;
  user: User;
  projectName: string;
  setProjectName: (val: string) => void;
  funderName: string;
  setFunderName: (val: string) => void;
  projectFund: string;
  setProjectFund: (val: string) => void;
  securedFund: string;
  setSecuredFund: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  outcomeComments: string;
  setOutcomeComments: (val: string) => void;
  selectedTemplateId: string;
  setSelectedTemplateId: (val: string) => void;
  availableTemplates?: any[];
  availableCommonFields: TemplateField[];
  selectedCommonKeys: (number | string)[];
  toggleCommonField: (id: any) => void;
  appSpecificFields: TemplateField[];
  setAppSpecificFields: (fields: TemplateField[]) => void;
  saveApplication: () => void;
  handleExportPDF: (app: Application) => void;
  activeApp: Application | null | any;
  validationErrors?: string[];
}

export default function ApplicationForm({
  view,
  projectName, setProjectName,
  funderName, setFunderName,
  projectFund, setProjectFund,
  securedFund, setSecuredFund,
  status, setStatus,
  outcomeComments, setOutcomeComments,
  selectedTemplateId, setSelectedTemplateId,
  availableTemplates,
  availableCommonFields,
  selectedCommonKeys, toggleCommonField,
  appSpecificFields, setAppSpecificFields,
  activeApp,
  validationErrors
}: ApplicationFormProps) {
  const isReadOnly = view === 'view_only';
  const hasError = (field: string) => !isReadOnly && (validationErrors || []).includes(field);

  const reqStar = <span className={styles.reqStar}>*</span>;

  // Helper: pick field-row class based on selection and read-only state
  const fieldRowClass = (selected: boolean) => {
    if (selected && isReadOnly) return styles.fieldRowSelectedReadOnly;
    if (selected) return styles.fieldRowSelected;
    if (isReadOnly) return styles.fieldRowReadOnly;
    return styles.fieldRow;
  };

  return (
    <div className={`card mb-4 ${styles.formCard}`}>

      {/* Validation error banner */}
      {validationErrors && validationErrors.length > 0 && !isReadOnly && (
        <div className={styles.errorBanner}>
          <h4 className={styles.errorTitle}>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
            Mandatory Data Required
          </h4>
          <ul className={styles.errorList}>
            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {/* ── Section 1: Essential Project Information ── */}
      <h3 className={styles.sectionHeader}>1. Essential Project Information</h3>
      <div className={`grid-2 mb-6 ${styles.gridGap}`}>
        <div className="form-group mb-0">
          <label className={`form-label ${styles.labelStrong}`}>
            PROJECT TITLE{!isReadOnly && reqStar}
          </label>
          <input
            type="text"
            className={`form-control${hasError('Project Title') ? ` ${styles.inputError}` : ''}`}
            placeholder="Enter high-level project name"
            disabled={isReadOnly}
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            aria-label="Project Title"
          />
        </div>
        <div className="form-group mb-0">
          <label className={`form-label ${styles.labelStrong}`}>
            GRANT FUNDER NAME{!isReadOnly && reqStar}
          </label>
          <input
            type="text"
            className={`form-control${hasError('Funder Name') ? ` ${styles.inputError}` : ''}`}
            placeholder="Target funder (e.g. ABC Foundation)"
            disabled={isReadOnly}
            value={funderName}
            onChange={e => setFunderName(e.target.value)}
            aria-label="Grant Funder Name"
          />
        </div>
      </div>

      {(view === 'create' || view === 'edit') ? (
        <>
          <div className="mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1.25rem' }}>
            <div className="form-group mb-0">
              <label className={`form-label ${styles.labelMedium}`}>APPLICATION STATUS</label>
              <select className="form-control" disabled={isReadOnly} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="DRAFT">DRAFT</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="FUNDED">FUNDED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <div className="form-group mb-0">
              <label className={`form-label ${styles.labelMedium}`}>PROJECT FUND</label>
              <input
                type="text"
                className="form-control"
                disabled={isReadOnly}
                placeholder="Enter project fund"
                value={projectFund}
                onChange={e => setProjectFund(e.target.value)}
              />
            </div>
            <div className="form-group mb-0">
              <label className={`form-label ${styles.labelMedium}`}>SECURED FUND</label>
              <input
                type="text"
                className="form-control"
                disabled={isReadOnly}
                placeholder="Enter secured fund"
                value={securedFund}
                onChange={e => setSecuredFund(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group mb-6">
            <label className={`form-label ${styles.labelMedium}`}>STATUS COMMENTS</label>
            <textarea
              className="form-control"
              disabled={isReadOnly}
              placeholder="Brief result or review notes..."
              value={outcomeComments}
              onChange={e => setOutcomeComments(e.target.value)}
            />
          </div>
        </>
      ) : (
        <div className={`grid-2 mb-6 ${styles.gridGap}`}>
          <div className="form-group mb-0">
            <label className={`form-label ${styles.labelMedium}`}>APPLICATION STATUS</label>
            <select className="form-control" disabled={isReadOnly} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="FUNDED">FUNDED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div className="form-group mb-0">
            <label className={`form-label ${styles.labelMedium}`}>STATUS COMMENTS</label>
            <textarea
              className="form-control"
              disabled={isReadOnly}
              placeholder="Brief result or review notes..."
              value={outcomeComments}
              onChange={e => setOutcomeComments(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── Section 2: Integrated Charity Data ── */}
      <h3 className={styles.sectionHeaderSpaced}>2. Integrated Charity Data</h3>
      <div className="form-group mb-6">
        <label className={`form-label ${styles.labelStrong}`}>
          LINKED CHARITY DATA TEMPLATE{!isReadOnly && reqStar}
        </label>
        <select
          className={`form-control${hasError('Linked Template') ? ` ${styles.inputError}` : ''}`}
          disabled={isReadOnly}
          value={selectedTemplateId}
          onChange={e => setSelectedTemplateId(e.target.value)}
          aria-label="Linked Charity Data Template"
        >
          <option value="">-- Choose Data Source --</option>
          {activeApp && activeApp.templateTitle && (
            <option value={selectedTemplateId}>{activeApp.templateTitle} ({activeApp.version || 'v1'})</option>
          )}
          {(availableTemplates || []).map((t: any) => (
            <option key={t.id} value={t.id}>{t.templateTitle} ({t.version})</option>
          ))}
        </select>
      </div>
      {availableCommonFields.length > 0 && (
        <div className={hasError('Charity Fields') ? styles.templateFieldsBoxError : styles.templateFieldsBox}>
          <p className={hasError('Charity Fields') ? styles.templateFieldsLabelError : styles.templateFieldsLabel}>
            Select Template Fields to Populate{!isReadOnly && reqStar}
          </p>
          <div className={styles.fieldsList}>
            {availableCommonFields.map(f => {
              const isSelected = selectedCommonKeys.includes(f.id);
              return (
                <div
                  key={f.id}
                  className={fieldRowClass(isSelected)}
                  onClick={() => !isReadOnly && toggleCommonField(f.id)}
                >
                  <div className={isSelected ? styles.checkboxChecked : styles.checkbox}>
                    {isSelected && '✓'}
                  </div>
                  <div className={styles.fieldName}>
                    <label className={styles.miniLabel}>FIELD NAME</label>
                    <div className={styles.fieldNameValue}>{f.key}</div>
                  </div>
                  <div className={styles.fieldContent}>
                    <label className={styles.miniLabel}>Value</label>
                    <div className={styles.fieldContentValue}>{f.value}</div>
                  </div>
                  {f.comments && (
                    <div className={styles.internalNotes}>
                      <label className={styles.miniLabel}>INTERNAL NOTES</label>
                      <div>{f.comments}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section 3: Application Specific Data ── */}
      <h3 className={styles.sectionHeaderSpaced}>3. Application Specific Data</h3>
      <div className={styles.specificFieldsList}>
        {appSpecificFields.length === 0 && !isReadOnly && (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>No specific application fields defined.</p>
            <button
              className="btn btn-primary"
              onClick={() => setAppSpecificFields([{ id: Date.now(), key: '', value: '' }])}
            >
              + Start Adding Application Data
            </button>
          </div>
        )}
        {appSpecificFields.map((f, i) => (
          <div key={f.id} className={`flex gap-4 items-stretch ${styles.specificFieldRow}`}>
            <div className={styles.fieldCol}>
              <label className={styles.specificFieldLabel}>FIELD NAME</label>
              <textarea
                className={`form-control ${styles.textareaBase}`}
                disabled={isReadOnly}
                value={f.key}
                onChange={e => {
                  const updated = [...appSpecificFields]; updated[i].key = e.target.value; setAppSpecificFields(updated);
                }}
              />
            </div>
            <div className={styles.valueCol} style={{ marginLeft: '0.75rem' }}>
              <label className={styles.specificFieldLabel}>VALUE</label>
              <textarea
                className={`form-control ${styles.textareaBase}`}
                disabled={isReadOnly}
                value={f.value}
                onChange={e => {
                  const updated = [...appSpecificFields]; updated[i].value = e.target.value; setAppSpecificFields(updated);
                }}
              />
            </div>
            <div className={styles.commentCol} style={{ marginLeft: '0.75rem' }}>
              <label className={styles.specificFieldLabel}>INTERNAL NOTES</label>
              <textarea
                className={`form-control ${styles.textareaComment}`}
                disabled={isReadOnly}
                placeholder="Notes..."
                value={(f as any).comments || ''}
                onChange={e => {
                  const updated = [...appSpecificFields]; (updated[i] as any).comments = e.target.value; setAppSpecificFields(updated);
                }}
              />
            </div>
            {!isReadOnly && (
              <div className={styles.actionCol}>
                {i === appSpecificFields.length - 1 && (
                  <>
                    <button
                      className={styles.btnAdd}
                      onClick={() => setAppSpecificFields([...appSpecificFields, { id: Date.now() + Math.random(), key: '', value: '', comment: '' } as any])}
                      title="Add Field"
                    >+</button>
                    <button
                      className={styles.btnRemove}
                      onClick={() => setAppSpecificFields(appSpecificFields.filter((_, idx) => idx !== i))}
                      title="Delete Field"
                    >−</button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
