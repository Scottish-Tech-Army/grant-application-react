import React, { useEffect, useMemo, useState } from "react";
import { api, CommonField, FieldType } from "../api";
import FieldCard from "../components/FieldCard";
import Toast from "../components/Toast";

export default function CommonLibrary(): JSX.Element {
  const [fields, setFields] = useState<CommonField[]>([]);
  const [query, setQuery] = useState<string>("");
  const [toast, setToast] = useState<string>("");

  const [newField, setNewField] = useState<{ key: string; label: string; group: string; type: FieldType; helpText: string }>({
    key: "",
    label: "",
    group: "General",
    type: "textarea",
    helpText: ""
  });

  async function load(): Promise<void> {
    setFields(await api.commonFields());
  }

  useEffect(() => {
    void load();
  }, []);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = fields.filter(
      (f) => !q || f.label.toLowerCase().includes(q) || f.group.toLowerCase().includes(q) || f.key.toLowerCase().includes(q)
    );

    const map = new Map<string, CommonField[]>();
    for (const f of filtered) {
      if (!map.has(f.group)) map.set(f.group, []);
      map.get(f.group)!.push(f);
    }

    for (const [g, arr] of map.entries()) arr.sort((a, b) => a.label.localeCompare(b.label));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [fields, query]);

  async function addVersion(fieldId: string): Promise<void> {
    const value = window.prompt("Enter new answer (creates a new version):");
    if (value === null) return;
    await api.createFieldVersion(fieldId, value);
    setToast("Saved new version");
    await load();
  }

  async function addField(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!newField.key || !newField.label) return;

    await api.createCommonField(newField);
    setToast("Added field");
    setNewField({ key: "", label: "", group: "General", type: "textarea", helpText: "" });
    await load();
  }

  return (
    <div>
      <Toast message={toast} onClose={() => setToast("")} />

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Common Library</h3>
        <div className="row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fields (label/group/key)…"
            style={{ minWidth: 320 }}
          />
          <span className="small">Grouped by category</span>
        </div>
      </div>

      <div className="card">
        <h4 style={{ marginTop: 0 }}>Add new common field</h4>
        <form className="row" onSubmit={addField}>
          <input placeholder="key" value={newField.key} onChange={(e) => setNewField({ ...newField, key: e.target.value })} />
          <input
            placeholder="label"
            value={newField.label}
            onChange={(e) => setNewField({ ...newField, label: e.target.value })}
            style={{ minWidth: 260 }}
          />
          <input
            placeholder="group"
            value={newField.group}
            onChange={(e) => setNewField({ ...newField, group: e.target.value })}
            style={{ minWidth: 260 }}
          />
          <select value={newField.type} onChange={(e) => setNewField({ ...newField, type: e.target.value as FieldType })}>
            <option value="text">text</option>
            <option value="textarea">textarea</option>
            <option value="number">number</option>
            <option value="url">url</option>
          </select>
          <button className="primary">Add</button>
        </form>
      </div>

      {grouped.map(([group, items]) => (
        <div key={group}>
          <h3>{group}</h3>
          {items.map((f) => (
            <FieldCard
              key={f.id}
              title={f.label}
              subtitle={`key: ${f.key} • type: ${f.type}`}
              actions={<button onClick={() => void addVersion(f.id)}>New version</button>}
            >
              <div className="small">
                Latest version: <b>v{f.latestVersion?.version || 0}</b> •{" "}
                {f.latestVersion?.createdAt ? new Date(f.latestVersion.createdAt).toLocaleString() : "—"}
              </div>
              <div style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{f.latestVersion?.value || <span className="small">(empty)</span>}</div>
            </FieldCard>
          ))}
        </div>
      ))}
    </div>
  );
}
