import { useMemo, useState } from "react";
import type { CommonField } from "../types/grants";

// UK Charity-focused suggested fields
const SUGGESTED_FIELDS = [
  { label: "Charity Registration Number", hint: "e.g., 1234567 (England & Wales) or SC012345 (Scotland)" },
  { label: "Organisation Mission Statement", hint: "Your charity's core purpose in 2-3 sentences" },
  { label: "Safeguarding Policy Summary", hint: "How you protect vulnerable beneficiaries" },
  { label: "Annual Income/Turnover", hint: "e.g., £150,000 (last financial year)" },
  { label: "Number of Beneficiaries Served", hint: "e.g., 500 individuals annually" },
  { label: "Geographic Area of Benefit", hint: "e.g., Greater Manchester, UK-wide" },
];

interface CommonFieldsPageProps {
  commonFields: CommonField[];
  onCreate: (input: { label: string; value: string }) => void | Promise<void>;
  onUpdate: (
    id: string,
    input: { label: string; value: string }
  ) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function CommonFieldsPage({
  commonFields,
  onCreate,
  onUpdate,
  onDelete,
}: CommonFieldsPageProps) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(
    null
  );

  const resetCreateForm = () => {
    setLabel("");
    setValue("");
  };

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!label.trim() || !value.trim()) return;
    onCreate({ label, value });
    resetCreateForm();
  };

  const startEdit = (field: CommonField) => {
    setEditingId(field.id);
    setEditingLabel(field.label);
    setEditingValue(field.value);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingLabel("");
    setEditingValue("");
  };

  const handleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId || !editingLabel.trim() || !editingValue.trim()) return;
    onUpdate(editingId, { label: editingLabel, value: editingValue });
    cancelEdit();
  };

  const groups = Array.from(new Set(commonFields.map((f) => f.group))).sort();

  const visibleFields = useMemo(() => {
    let filtered = commonFields;
    if (filterGroup) {
      filtered = filtered.filter((f) => f.group === filterGroup);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.label.toLowerCase().includes(q) ||
          f.value.toLowerCase().includes(q) ||
          f.group.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [commonFields, filterGroup, searchQuery]);

  const groupCount = groups.length;

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <h2>Common Information Library</h2>
          <p className="muted">
            Enter information once, reuse across all grant applications. Updates here will be available in all linked applications.
          </p>
        </div>
      </div>

      {/* ── Quick stats with impact messaging ── */}
      <div className="dash-stats">
        <div className="dash-stat dash-stat--blue">
          <span className="dash-stat__number">{commonFields.length}</span>
          <span className="dash-stat__label">Total Fields</span>
        </div>
        <div className="dash-stat dash-stat--green">
          <span className="dash-stat__number">{groupCount}</span>
          <span className="dash-stat__label">Categories</span>
        </div>
        <div className="dash-stat dash-stat--slate">
          <span className="dash-stat__number">~{commonFields.length * 5}</span>
          <span className="dash-stat__label">Minutes Saved Per App</span>
        </div>
      </div>

      {/* ── Suggested Fields for UK Charities ── */}
      {commonFields.length < 6 && (
        <div className="suggested-fields-card">
          <h4>💡 Suggested Fields for UK Charities</h4>
          <p className="muted small">Click to quickly add common grant application fields:</p>
          <div className="suggested-fields-list">
            {SUGGESTED_FIELDS.filter(sf => 
              !commonFields.some(cf => cf.label.toLowerCase().includes(sf.label.toLowerCase().split(' ')[0]))
            ).slice(0, 4).map((sf, idx) => (
              <button 
                key={idx}
                type="button" 
                className="suggested-field-btn"
                onClick={() => {
                  setLabel(sf.label);
                  setValue(`[${sf.hint}]`);
                }}
              >
                + {sf.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Create form ── */}
      <form className="card form-grid" onSubmit={handleCreate}>
        <h3>Add Common Field</h3>
        <label>
          Label
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="e.g. Mission statement"
            required
          />
        </label>
        <label>
          Value
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Enter reusable content"
            rows={4}
            required
          />
        </label>
        <div className="row-actions">
          <button type="submit">Save field</button>
        </div>
      </form>

      {/* ── Saved list ── */}
      <div className="card">
        <div className="common-fields-header">
          <h3>Saved Fields ({commonFields.length})</h3>
          <div className="common-search" aria-label="Search fields">
            <button
              type="button"
              className="icon-button common-search__toggle"
              aria-label="Search fields"
            >
              🔍
            </button>
            <input
              type="search"
              className="common-search__input"
              placeholder="Search fields…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {groups.length > 1 ? (
          <div className="cf-filter-row">
            <label className="cf-filter-label">
              Filter by group
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
              >
                <option value="">All groups</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {visibleFields.length === 0 ? (
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            {searchQuery
              ? `No fields matching "${searchQuery}".`
              : "No common fields yet."}
          </p>
        ) : (
          <ul className="item-list" style={{ marginTop: "0.75rem" }}>
            {visibleFields.map((field) => (
              <li key={field.id} className="item">
                {editingId === field.id ? (
                  <form className="form-grid" onSubmit={handleUpdate}>
                    <label>
                      Label
                      <input
                        type="text"
                        value={editingLabel}
                        onChange={(event) =>
                          setEditingLabel(event.target.value)
                        }
                        required
                      />
                    </label>
                    <label>
                      Value
                      <textarea
                        value={editingValue}
                        onChange={(event) =>
                          setEditingValue(event.target.value)
                        }
                        rows={4}
                        required
                      />
                    </label>
                    <div className="row-actions row-actions--tight">
                      <button type="submit">Update (new version)</button>
                      <button
                        type="button"
                        className="button-secondary button-sm"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="item-header">
                      <h4>{field.label}</h4>
                      <span className="badge">v{field.version}</span>
                    </div>
                    {field.group ? (
                      <span className="badge badge--subtle">{field.group}</span>
                    ) : null}
                    <p className="value-block">{field.value}</p>
                    <p className="muted small item-meta">
                      Updated: {new Date(field.updatedAt).toLocaleString()}
                    </p>
                    <div className="row-actions row-actions--tight">
                      <button
                        type="button"
                        className="button-secondary button-sm"
                        onClick={() => startEdit(field)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button-danger button-sm"
                        onClick={() => onDelete(field.id)}
                      >
                        Delete
                      </button>
                      {field.versions.length > 1 ? (
                        <button
                          type="button"
                          className="button-quiet button-sm"
                          onClick={() =>
                            setExpandedHistoryId(
                              expandedHistoryId === field.id ? null : field.id
                            )
                          }
                        >
                          {expandedHistoryId === field.id
                            ? "Hide history"
                            : `History (${field.versions.length})`}
                        </button>
                      ) : null}
                    </div>

                    {expandedHistoryId === field.id ? (
                      <div className="version-history">
                        <p className="version-history__title">
                          Version History
                        </p>
                        <ul className="version-history__list">
                          {[...field.versions]
                            .sort((a, b) => b.version - a.version)
                            .map((v) => (
                              <li
                                key={v.version}
                                className={`version-history__item ${
                                  v.version === field.version
                                    ? "version-history__item--current"
                                    : ""
                                }`}
                              >
                                <div className="version-history__header">
                                  <span className="badge">
                                    v{v.version}
                                    {v.version === field.version
                                      ? " (current)"
                                      : ""}
                                  </span>
                                  <span className="muted small">
                                    {new Date(v.updatedAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="version-history__label">
                                  {v.label}
                                </p>
                                <p className="version-history__value">
                                  {v.value}
                                </p>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : null}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
