import { useState } from 'react';
import type { CommonField } from '../types';
import { v4 as uuidv4 } from 'uuid';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  commonFields: CommonField[];
  onUpdateFields: (fields: CommonField[]) => void;
}

export default function CommonFieldsManager({ commonFields, onUpdateFields }: Props) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddField, setShowAddField] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newField, setNewField] = useState({ group: '', label: '', description: '', value: '' });
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null);
  const [pendingDeleteField, setPendingDeleteField] = useState<CommonField | null>(null);

  const groups = [...new Set(commonFields.map((f) => f.group))];

  const filteredFields = filterGroup === 'all'
    ? commonFields
    : commonFields.filter((f) => f.group === filterGroup);

  const groupedFields: Record<string, CommonField[]> = {};
  filteredFields.forEach((f) => {
    if (!groupedFields[f.group]) groupedFields[f.group] = [];
    groupedFields[f.group].push(f);
  });

  function handleStartEdit(field: CommonField) {
    setEditingFieldId(field.id);
    const latest = field.versions[field.versions.length - 1];
    setEditValue(latest.value);
  }

  function handleSaveEdit(fieldId: string) {
    const updated = commonFields.map((f) => {
      if (f.id !== fieldId) return f;
      const latestVersion = f.versions[f.versions.length - 1];
      if (latestVersion.value === editValue) return f; // no change
      return {
        ...f,
        versions: [
          ...f.versions,
          {
            version: latestVersion.version + 1,
            value: editValue,
            updatedAt: new Date().toISOString(),
          },
        ],
      };
    });
    onUpdateFields(updated);
    setEditingFieldId(null);
    setEditValue('');
  }

  function handleAddField() {
    if (!newField.label.trim() || !newField.group.trim()) return;
    const field: CommonField = {
      id: uuidv4(),
      group: newField.group,
      label: newField.label,
      description: newField.description,
      versions: [{ version: 1, value: newField.value, updatedAt: new Date().toISOString() }],
    };
    onUpdateFields([...commonFields, field]);
    setNewField({ group: '', label: '', description: '', value: '' });
    setShowAddField(false);
  }

  function handleCreateSection() {
    const sectionName = newSectionName.trim();
    if (!sectionName) return;

    const sectionExists = groups.some((group) => group.toLowerCase() === sectionName.toLowerCase());
    if (sectionExists) {
      window.alert('That section already exists. Choose it from the Group field when adding a new field.');
      return;
    }

    setNewField({ group: sectionName, label: '', description: '', value: '' });
    setFilterGroup('all');
    setShowAddSection(false);
    setShowAddField(true);
    setNewSectionName('');
  }

  function handleDeleteField(fieldId: string) {
    onUpdateFields(commonFields.filter((f) => f.id !== fieldId));
  }

  const filledCount = commonFields.filter(
    (f) => f.versions[f.versions.length - 1].value.trim() !== ''
  ).length;

  return (
    <div className="common-fields-manager">
      <div className="section-header">
        <div>
          <h2>Common Information Fields</h2>
          <p className="subtitle">
            These fields are shared across multiple grant applications.
            Fill them in once and reuse across applications.
          </p>
          <p className="field-count">
            {filledCount} of {commonFields.length} fields populated
          </p>
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => setShowAddSection(true)}>
            + Add New Section
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddField(true)}>
            + Add New Field
          </button>
        </div>
      </div>

      {showAddSection && (
        <div className="add-field-form card">
          <h3>Add New Section</h3>
          <div className="form-row">
            <label>Section Name</label>
            <input
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="e.g. Governance and Leadership"
              autoFocus
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleCreateSection}>Continue to Add Field</button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowAddSection(false);
                setNewSectionName('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="filter-bar">
        <label>Filter by group:</label>
        <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
          <option value="all">All Groups</option>
          {groups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {showAddField && (
        <div className="add-field-form card">
          <h3>Add New Common Field</h3>
          <div className="form-row">
            <label>Group</label>
            <input
              list="group-suggestions"
              value={newField.group}
              onChange={(e) => setNewField({ ...newField, group: e.target.value })}
              placeholder="e.g. Organisational Biography & General Info"
            />
            <datalist id="group-suggestions">
              {groups.map((g) => <option key={g} value={g} />)}
            </datalist>
          </div>
          <div className="form-row">
            <label>Field Label</label>
            <input
              value={newField.label}
              onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              placeholder="e.g. Organisation Name"
            />
          </div>
          <div className="form-row">
            <label>Description</label>
            <input
              value={newField.description}
              onChange={(e) => setNewField({ ...newField, description: e.target.value })}
              placeholder="What information should this field contain?"
            />
          </div>
          <div className="form-row">
            <label>Initial Value</label>
            <textarea
              value={newField.value}
              onChange={(e) => setNewField({ ...newField, value: e.target.value })}
              placeholder="Enter the initial value (optional)"
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleAddField}>Add Field</button>
            <button className="btn btn-secondary" onClick={() => setShowAddField(false)}>Cancel</button>
          </div>
        </div>
      )}

      {Object.entries(groupedFields).map(([group, fields]) => (
        <div key={group} className="field-group">
          <div
            className="group-header"
            onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
          >
            <span className="group-toggle">{expandedGroup === group ? '▼' : '▶'}</span>
            <h3>{group}</h3>
            <span className="group-count">
              {fields.filter((f) => f.versions[f.versions.length - 1].value.trim() !== '').length}/{fields.length} filled
            </span>
          </div>

          {expandedGroup === group && (
            <div className="group-fields">
              {fields.map((field) => {
                const latest = field.versions[field.versions.length - 1];
                const isEditing = editingFieldId === field.id;

                return (
                  <div key={field.id} className="field-card card">
                    <div className="field-header">
                      <div>
                        <strong>{field.label}</strong>
                        <p className="field-description">{field.description}</p>
                      </div>
                      <div className="field-meta">
                        <span className="version-badge">v{latest.version}</span>
                        {field.versions.length > 1 && (
                          <button
                            className="btn btn-link"
                            onClick={() =>
                              setShowVersionHistory(
                                showVersionHistory === field.id ? null : field.id
                              )
                            }
                          >
                            History
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="field-edit">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          rows={4}
                          autoFocus
                        />
                        <div className="form-actions">
                          <button className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(field.id)}>
                            Save
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingFieldId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="field-value">
                        {latest.value ? (
                          <p className="value-text">{latest.value}</p>
                        ) : (
                          <p className="value-empty">Not yet filled in</p>
                        )}
                        <div className="form-actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => handleStartEdit(field)}>
                            {latest.value ? 'Edit' : 'Fill In'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setPendingDeleteField(field)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    )}

                    {showVersionHistory === field.id && (
                      <div className="version-history">
                        <h4>Version History</h4>
                        {[...field.versions].reverse().map((v) => (
                          <div key={v.version} className="version-entry">
                            <span className="version-badge">v{v.version}</span>
                            <span className="version-date">
                              {new Date(v.updatedAt).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                            <p>{v.value || <em>Empty</em>}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <ConfirmDialog
        open={pendingDeleteField !== null}
        title="Delete common field"
        message={
          pendingDeleteField
            ? `Delete "${pendingDeleteField.label}" from section "${pendingDeleteField.group}"?`
            : ''
        }
        confirmLabel="Delete field"
        onCancel={() => setPendingDeleteField(null)}
        onConfirm={() => {
          if (!pendingDeleteField) return;
          handleDeleteField(pendingDeleteField.id);
          setPendingDeleteField(null);
        }}
      />
    </div>
  );
}
