import { useEffect, useState } from 'react';
import type { CommonField, GrantApplication, ApplicationField } from '../types';
import { v4 as uuidv4 } from 'uuid';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  application: GrantApplication;
  commonFields: CommonField[];
  onUpdateApplication: (app: GrantApplication) => void;
  onBack: () => void;
}

export default function ApplicationDetail({ application, commonFields, onUpdateApplication, onBack }: Props) {
  const [editingApp, setEditingApp] = useState(false);
  const [appName, setAppName] = useState(application.name);
  const [appFunder, setAppFunder] = useState(application.funder);
  const [appNotes, setAppNotes] = useState(application.notes);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [newAdditionalField, setNewAdditionalField] = useState({ label: '', description: '', value: '' });
  const [showAddAdditional, setShowAddAdditional] = useState(false);
  const [editingAdditionalId, setEditingAdditionalId] = useState<string | null>(null);
  const [editAdditionalValue, setEditAdditionalValue] = useState('');
  const [exportCopied, setExportCopied] = useState(false);
  const [pendingDeleteAdditionalField, setPendingDeleteAdditionalField] = useState<ApplicationField | null>(null);

  useEffect(() => {
    if (editingApp) return;
    setValidationErrors({});
  }, [editingApp]);

  function validateFields(): boolean {
    const errors: Record<string, string> = {};
    if (!appName.trim()) errors.appName = 'Application name is required';
    if (!appFunder.trim()) errors.appFunder = 'Funder is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const groups = [...new Set(commonFields.map((f) => f.group))];

  function isFieldSelected(fieldId: string) {
    return application.selectedCommonFields.some((s) => s.fieldId === fieldId);
  }

  function getSelectedVersion(fieldId: string): number | undefined {
    return application.selectedCommonFields.find((s) => s.fieldId === fieldId)?.versionUsed;
  }

  function handleToggleField(fieldId: string) {
    const field = commonFields.find((f) => f.id === fieldId);
    if (!field) return;

    let updatedSelections;
    if (isFieldSelected(fieldId)) {
      updatedSelections = application.selectedCommonFields.filter((s) => s.fieldId !== fieldId);
    } else {
      const latestVersion = field.versions[field.versions.length - 1].version;
      updatedSelections = [
        ...application.selectedCommonFields,
        { fieldId, versionUsed: latestVersion },
      ];
    }

    onUpdateApplication({
      ...application,
      selectedCommonFields: updatedSelections,
      updatedAt: new Date().toISOString(),
    });
  }

  function handleUpdateFieldVersion(fieldId: string, version: number) {
    const updatedSelections = application.selectedCommonFields.map((s) =>
      s.fieldId === fieldId ? { ...s, versionUsed: version } : s
    );
    onUpdateApplication({
      ...application,
      selectedCommonFields: updatedSelections,
      updatedAt: new Date().toISOString(),
    });
  }

  function handleSelectAll() {
    const allSelections = commonFields.map((f) => ({
      fieldId: f.id,
      versionUsed: f.versions[f.versions.length - 1].version,
    }));
    onUpdateApplication({
      ...application,
      selectedCommonFields: allSelections,
      updatedAt: new Date().toISOString(),
    });
  }

  function handleDeselectAll() {
    onUpdateApplication({
      ...application,
      selectedCommonFields: [],
      updatedAt: new Date().toISOString(),
    });
  }

  function handleSaveAppDetails() {
    if (!validateFields()) return;
    onUpdateApplication({
      ...application,
      name: appName,
      funder: appFunder,
      notes: appNotes,
      updatedAt: new Date().toISOString(),
    });
    setEditingApp(false);
  }

  function handleAddAdditionalField() {
    if (!newAdditionalField.label.trim()) return;
    const field: ApplicationField = {
      id: uuidv4(),
      label: newAdditionalField.label,
      description: newAdditionalField.description,
      value: newAdditionalField.value,
      createdAt: new Date().toISOString(),
    };
    onUpdateApplication({
      ...application,
      additionalFields: [...application.additionalFields, field],
      updatedAt: new Date().toISOString(),
    });
    setNewAdditionalField({ label: '', description: '', value: '' });
    setShowAddAdditional(false);
  }

  function handleSaveAdditionalField(fieldId: string) {
    const updated = application.additionalFields.map((f) =>
      f.id === fieldId ? { ...f, value: editAdditionalValue } : f
    );
    onUpdateApplication({
      ...application,
      additionalFields: updated,
      updatedAt: new Date().toISOString(),
    });
    setEditingAdditionalId(null);
  }

  function handleDeleteAdditionalField(fieldId: string) {
    onUpdateApplication({
      ...application,
      additionalFields: application.additionalFields.filter((f) => f.id !== fieldId),
      updatedAt: new Date().toISOString(),
    });
  }

  function generateExportText(): string {
    const lines: string[] = [];
    lines.push(`APPLICATION: ${application.name}`);
    lines.push(`Funder: ${application.funder}`);
    lines.push(`Date: ${new Date(application.updatedAt).toLocaleDateString('en-GB')}`);
    lines.push('');
    lines.push('═'.repeat(60));
    lines.push('COMMON INFORMATION');
    lines.push('═'.repeat(60));

    const selectedByGroup: Record<string, { label: string; value: string; version: number }[]> = {};

    application.selectedCommonFields.forEach((sel) => {
      const field = commonFields.find((f) => f.id === sel.fieldId);
      if (!field) return;
      const ver = field.versions.find((v) => v.version === sel.versionUsed);
      if (!ver) return;
      if (!selectedByGroup[field.group]) selectedByGroup[field.group] = [];
      selectedByGroup[field.group].push({
        label: field.label,
        value: ver.value || '(Not yet filled in)',
        version: ver.version,
      });
    });

    Object.entries(selectedByGroup).forEach(([group, fields]) => {
      lines.push('');
      lines.push(`--- ${group} ---`);
      fields.forEach((f) => {
        lines.push('');
        lines.push(`${f.label} (v${f.version}):`);
        lines.push(f.value);
      });
    });

    if (application.additionalFields.length > 0) {
      lines.push('');
      lines.push('═'.repeat(60));
      lines.push('APPLICATION-SPECIFIC INFORMATION');
      lines.push('═'.repeat(60));
      application.additionalFields.forEach((f) => {
        lines.push('');
        lines.push(`${f.label}:`);
        lines.push(f.value || '(Not yet filled in)');
      });
    }

    if (application.notes) {
      lines.push('');
      lines.push('═'.repeat(60));
      lines.push('NOTES');
      lines.push('═'.repeat(60));
      lines.push(application.notes);
    }

    return lines.join('\n');
  }

  async function handleCopyExport() {
    const text = generateExportText();
    await navigator.clipboard.writeText(text);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  }

  function handleDownloadExport() {
    const text = generateExportText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${application.name.replace(/\s+/g, '_')}_export.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="application-detail">
      <button className="btn btn-link back-btn" onClick={onBack}>
        ← Back to Applications
      </button>

      {/* APPLICATION HEADER SECTION */}
      <div className="app-detail-header card">
        {editingApp ? (
          <div className="app-edit-form">
            <div className="app-edit-form-header">
              <div>
                <h2 className="app-edit-title">Edit Application Details</h2>
                <p className="app-edit-subtitle">Fields marked * are required</p>
              </div>
            </div>

            <div className="app-edit-fields">
              <div className="form-row">
                <label htmlFor="app-name">Application Name *</label>
                <input
                  id="app-name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className={validationErrors.appName ? 'error' : ''}
                  placeholder="e.g. Community Grant 2026"
                />
                {validationErrors.appName && (
                  <span className="error-message">{validationErrors.appName}</span>
                )}
              </div>

              <div className="form-row">
                <label htmlFor="app-funder">Funder *</label>
                <input
                  id="app-funder"
                  value={appFunder}
                  onChange={(e) => setAppFunder(e.target.value)}
                  className={validationErrors.appFunder ? 'error' : ''}
                  placeholder="e.g. National Lottery"
                />
                {validationErrors.appFunder && (
                  <span className="error-message">{validationErrors.appFunder}</span>
                )}
              </div>

              <div className="form-row">
                <label htmlFor="app-notes">Notes</label>
                <textarea
                  id="app-notes"
                  value={appNotes}
                  onChange={(e) => setAppNotes(e.target.value)}
                  rows={4}
                  placeholder="Any internal notes about this application…"
                />
              </div>
            </div>

            <div className="app-edit-form-actions">
              <button className="btn btn-primary" onClick={handleSaveAppDetails}>
                Save Details
              </button>
              <button className="btn btn-secondary" onClick={() => { setEditingApp(false); setValidationErrors({}); }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="app-detail-info">
            <div className="app-detail-title-row">
              <h2>{application.name}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingApp(true)}>
                ✏ Edit Details
              </button>
            </div>

            <div className="app-detail-meta">
              <div className="detail-meta-row">
                <span className="detail-meta-label">Funder</span>
                <span className="detail-meta-value">{application.funder}</span>
              </div>
              {application.notes && (
                <div className="detail-meta-row">
                  <span className="detail-meta-label">Notes</span>
                  <span className="detail-meta-value">{application.notes}</span>
                </div>
              )}
              <div className="detail-meta-row detail-meta-dates">
                <span className="detail-meta-date">
                  <span className="detail-meta-label">Created</span>
                  {new Date(application.createdAt).toLocaleDateString('en-GB')}
                </span>
                <span className="detail-meta-date">
                  <span className="detail-meta-label">Last updated</span>
                  {new Date(application.updatedAt).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* UNIFIED FIELDS SECTION */}
      <div className="unified-fields-section">

        {editingApp ? (
          <>
            {/* EDIT MODE — Common Fields: all fields with checkboxes */}
            <div className="fields-group">
              <div className="fields-group-header">
                <h3>Common Information</h3>
                <span className="fields-count">
                  {application.selectedCommonFields.length} of {commonFields.length} selected
                </span>
              </div>
              <div className="fields-group-actions">
                <button className="btn btn-secondary btn-sm" onClick={handleSelectAll}>Select All</button>
                <button className="btn btn-secondary btn-sm" onClick={handleDeselectAll}>Deselect All</button>
              </div>
              {groups.length === 0 ? (
                <div className="empty-state">
                  <p>No common fields available yet.</p>
                </div>
              ) : (
                <div className="fields-container">
                  {groups.map((group) => {
                    const fields = commonFields.filter((f) => f.group === group);
                    const selectedCount = fields.filter((f) => isFieldSelected(f.id)).length;
                    return (
                      <div key={group} className="fields-subsection">
                        <h4 className="fields-subsection-title">
                          {group}
                          <span className="selected-count">{selectedCount}/{fields.length}</span>
                        </h4>
                        <div className="fields-list">
                          {fields.map((field) => {
                            const selected = isFieldSelected(field.id);
                            const selectedVersion = getSelectedVersion(field.id);
                            const latest = field.versions[field.versions.length - 1];
                            const isOutdated = selected && selectedVersion !== undefined && selectedVersion < latest.version;
                            return (
                              <div key={field.id} className={`field-entry ${selected ? 'selected' : ''}`}>
                                <div className="field-checkbox-group">
                                  <label className="checkbox-label">
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => handleToggleField(field.id)}
                                    />
                                    <strong>{field.label}</strong>
                                  </label>
                                  {field.description && (
                                    <p className="field-description">{field.description}</p>
                                  )}
                                </div>
                                {selected && (
                                  <div className="field-details">
                                    <div className="version-selector">
                                      <label>Version</label>
                                      <select
                                        value={selectedVersion}
                                        onChange={(e) =>
                                          handleUpdateFieldVersion(field.id, parseInt(e.target.value))
                                        }
                                      >
                                        {field.versions.map((v) => (
                                          <option key={v.version} value={v.version}>
                                            v{v.version} ({new Date(v.updatedAt).toLocaleDateString('en-GB')})
                                          </option>
                                        ))}
                                      </select>
                                      {isOutdated && (
                                        <span className="outdated-badge" title="A newer version is available">
                                          ⚠ Update available
                                        </span>
                                      )}
                                    </div>
                                    {latest.value && (
                                      <div className="field-current-value">
                                        <label>Current Value</label>
                                        <p className="value-text">{latest.value}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* EDIT MODE — Additional Fields: full edit controls */}
            <div className="fields-group">
              <div className="fields-group-header">
                <h3>Application-Specific Fields</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddAdditional(true)}>
                  + Add Field
                </button>
              </div>

              {showAddAdditional && (
                <div className="add-field-form card">
                  <h4>New Application-Specific Field</h4>
                  <div className="form-row">
                    <label htmlFor="new-field-label">Field Label *</label>
                    <input
                      id="new-field-label"
                      value={newAdditionalField.label}
                      onChange={(e) => setNewAdditionalField({ ...newAdditionalField, label: e.target.value })}
                      placeholder="e.g. Project milestones"
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="new-field-desc">Description</label>
                    <input
                      id="new-field-desc"
                      value={newAdditionalField.description}
                      onChange={(e) => setNewAdditionalField({ ...newAdditionalField, description: e.target.value })}
                      placeholder="What information does this field need?"
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="new-field-value">Value</label>
                    <textarea
                      id="new-field-value"
                      value={newAdditionalField.value}
                      onChange={(e) => setNewAdditionalField({ ...newAdditionalField, value: e.target.value })}
                      rows={4}
                      placeholder="Enter the information"
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary btn-sm" onClick={handleAddAdditionalField}>Add Field</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddAdditional(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {application.additionalFields.length === 0 && !showAddAdditional ? (
                <div className="empty-state">
                  <p>No application-specific fields yet. Click "+ Add Field" to add one.</p>
                </div>
              ) : (
                <div className="fields-list">
                  {application.additionalFields.map((field) => {
                    const isEditing = editingAdditionalId === field.id;
                    return (
                      <div key={field.id} className="field-entry additional">
                        <div className="field-header-group">
                          <div>
                            <strong>{field.label}</strong>
                            {field.description && <p className="field-description">{field.description}</p>}
                          </div>
                          <div className="field-actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => { setEditingAdditionalId(field.id); setEditAdditionalValue(field.value); }}
                              disabled={isEditing}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setPendingDeleteAdditionalField(field)}
                              disabled={isEditing}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {isEditing ? (
                          <div className="field-edit-form">
                            <textarea
                              value={editAdditionalValue}
                              onChange={(e) => setEditAdditionalValue(e.target.value)}
                              rows={4}
                              autoFocus
                            />
                            <div className="form-actions">
                              <button className="btn btn-primary btn-sm" onClick={() => handleSaveAdditionalField(field.id)}>Save</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => setEditingAdditionalId(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="field-value">
                            {field.value
                              ? <p className="value-text">{field.value}</p>
                              : <p className="value-empty">Not yet filled in</p>
                            }
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* VIEW MODE — Common Fields: only selected, label + value only */}
            <div className="fields-group">
              <div className="fields-group-header">
                <h3>Common Information</h3>
                <span className="fields-count">
                  {application.selectedCommonFields.length} field{application.selectedCommonFields.length !== 1 ? 's' : ''}
                </span>
              </div>

              {application.selectedCommonFields.length === 0 ? (
                <div className="empty-state">
                  <p>No common fields selected. Click <strong>Edit Details</strong> to add fields.</p>
                </div>
              ) : (
                (() => {
                  const selectedGroups = [...new Set(
                    application.selectedCommonFields
                      .map((sel) => commonFields.find((f) => f.id === sel.fieldId))
                      .filter(Boolean)
                      .map((f) => f!.group)
                  )];
                  return (
                    <div className="fields-container">
                      {selectedGroups.map((group) => {
                        const groupSelectedFields = application.selectedCommonFields
                          .map((sel) => {
                            const field = commonFields.find((f) => f.id === sel.fieldId);
                            if (!field || field.group !== group) return null;
                            const ver = field.versions.find((v) => v.version === sel.versionUsed)
                              ?? field.versions[field.versions.length - 1];
                            return { label: field.label, value: ver.value };
                          })
                          .filter(Boolean) as { label: string; value: string }[];

                        return (
                          <div key={group} className="fields-subsection">
                            <h4 className="fields-subsection-title">{group}</h4>
                            <div className="view-fields-table">
                              {groupSelectedFields.map((f) => (
                                <div key={f.label} className="view-field-row">
                                  <span className="view-field-label">{f.label}</span>
                                  <span className="view-field-value">
                                    {f.value || <em className="value-empty">Not yet filled in</em>}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            {/* VIEW MODE — Additional Fields: label + value only */}
            <div className="fields-group">
              <div className="fields-group-header">
                <h3>Application-Specific Fields</h3>
                <span className="fields-count">
                  {application.additionalFields.length} field{application.additionalFields.length !== 1 ? 's' : ''}
                </span>
              </div>

              {application.additionalFields.length === 0 ? (
                <div className="empty-state">
                  <p>No application-specific fields. Click <strong>Edit Details</strong> to add fields.</p>
                </div>
              ) : (
                <div className="view-fields-table">
                  {application.additionalFields.map((field) => (
                    <div key={field.id} className="view-field-row">
                      <span className="view-field-label">{field.label}</span>
                      <span className="view-field-value">
                        {field.value || <em className="value-empty">Not yet filled in</em>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* VIEW MODE — Export */}
            <div className="fields-group view-export-group">
              <div className="fields-group-header">
                <h3>Export Application</h3>
              </div>
              <div className="export-actions">
                <button className="btn btn-primary" onClick={handleCopyExport}>
                  {exportCopied ? '✓ Copied to clipboard!' : 'Copy to Clipboard'}
                </button>
                <button className="btn btn-secondary" onClick={handleDownloadExport}>
                  Download as Text File
                </button>
              </div>
              <div className="export-preview card">
                <h4>Export Preview</h4>
                <pre className="export-text">{generateExportText()}</pre>
              </div>
            </div>
          </>
        )}

      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmDialog
        open={pendingDeleteAdditionalField !== null}
        title="Delete additional field"
        message={
          pendingDeleteAdditionalField
            ? `Delete "${pendingDeleteAdditionalField.label}" from this application?`
            : ''
        }
        confirmLabel="Delete field"
        onCancel={() => setPendingDeleteAdditionalField(null)}
        onConfirm={() => {
          if (!pendingDeleteAdditionalField) return;
          handleDeleteAdditionalField(pendingDeleteAdditionalField.id);
          setPendingDeleteAdditionalField(null);
        }}
      />
    </div>
  );
}
