import React, { useEffect, useMemo, useState } from "react";
import { api, Application, CommonField, FieldVersion } from "../api";
import { useParams } from "react-router-dom";
import FieldCard from "../components/FieldCard";
import Toast from "../components/Toast";

export default function ApplicationEditor(): JSX.Element {
  const { id } = useParams();
  const appId = id || "";

  const [app, setApp] = useState<Application | null>(null);
  const [fields, setFields] = useState<CommonField[]>([]);
  const [versionsByField, setVersionsByField] = useState<Record<string, FieldVersion[]>>({});
  const [toast, setToast] = useState<string>("");
  const [exportText, setExportText] = useState<string>("");

  async function load(): Promise<void> {
    const [a, f] = await Promise.all([api.application(appId), api.commonFields()]);
    setApp(a);
    setFields(f);
  }

  useEffect(() => {
    if (appId) void load();
  }, [appId]);

  const selectedMap = useMemo(() => {
    const m = new Map<string, string>();
    (app?.selectedCommon || []).forEach((x) => m.set(x.fieldId, x.versionId));
    return m;
  }, [app]);

  async function ensureVersions(fieldId: string): Promise<void> {
    if (versionsByField[fieldId]) return;
    const vs = await api.fieldVersions(fieldId);
    setVersionsByField((prev) => ({ ...prev, [fieldId]: vs }));
  }

  async function toggleCommon(fieldId: string): Promise<void> {
    if (!app) return;
    const next = [...(app.selectedCommon || [])];
    const idx = next.findIndex((x) => x.fieldId === fieldId);

    if (idx >= 0) {
      next.splice(idx, 1);
    } else {
      const vs = await api.fieldVersions(fieldId);
      const latest = [...vs].sort((a, b) => b.version - a.version)[0];
      next.push({ fieldId, versionId: latest.id });
      setVersionsByField((prev) => ({ ...prev, [fieldId]: vs }));
    }

    const updated = await api.setSelectedCommon(appId, next);
    setApp(updated);
    setToast("Updated selection");
  }

  async function setVersion(fieldId: string, versionId: string): Promise<void> {
    if (!app) return;
    const next = [...(app.selectedCommon || [])];
    const idx = next.findIndex((x) => x.fieldId === fieldId);
    if (idx < 0) return;
    next[idx] = { fieldId, versionId };
    const updated = await api.setSelectedCommon(appId, next);
    setApp(updated);
    setToast("Locked version updated");
  }

  async function addSpecificField(): Promise<void> {
    const label = window.prompt("Application-specific field label:");
    if (!label) return;
    await api.addSpecificField(appId, { label, type: "textarea" });
    setToast("Added specific field");
    await load();
  }

  async function newSpecificVersion(sfid: string): Promise<void> {
    const value = window.prompt("New value (creates a new version):");
    if (value === null) return;
    await api.addSpecificFieldVersion(appId, sfid, value);
    setToast("Saved new version");
    await load();
  }

  async function doExport(format: "plain" | "markdown"): Promise<void> {
    const txt = await api.exportApp(appId, format);
    setExportText(txt);
    setToast(`Exported (${format})`);
  }

  async function copyExport(): Promise<void> {
    await navigator.clipboard.writeText(exportText);
    setToast("Copied to clipboard");
  }

  if (!app) return <div className="card">Loading...</div>;

  return (
    <div>
      <Toast message={toast} onClose={() => setToast("")} />

      <div className="card">
        <h3 style={{ marginTop: 0 }}>{app.name}</h3>
        <div className="small">
          {app.funder ? `Funder: ${app.funder} • ` : ""}Status: {app.status} • Created: {new Date(app.createdAt).toLocaleString()}
        </div>
      </div>

      <div className="split">
        <div>
          <div className="card">
            <h4 style={{ marginTop: 0 }}>1) Select common fields</h4>
            <div className="small">Tick fields and lock the version used by this application.</div>
          </div>

          {fields.map((f) => {
            const checked = selectedMap.has(f.id);
            return (
              <FieldCard
                key={f.id}
                title={f.label}
                subtitle={`${f.group} • key: ${f.key}`}
                actions={
                  <label className="row">
                    <input type="checkbox" checked={checked} onChange={() => void toggleCommon(f.id)} />
                    <span className="small">Include</span>
                  </label>
                }
              >
                {checked && (
                  <div className="row">
                    <button onClick={() => void ensureVersions(f.id)}>Load versions</button>
                    <select
                      value={selectedMap.get(f.id)}
                      onMouseDown={() => void ensureVersions(f.id)}
                      onChange={(e) => void setVersion(f.id, e.target.value)}
                    >
                      {(versionsByField[f.id] || []).map((v) => (
                        <option key={v.id} value={v.id}>
                          v{v.version} — {new Date(v.createdAt).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="small" style={{ marginTop: 8 }}>
                  Latest: v{f.latestVersion?.version || 0}
                </div>
              </FieldCard>
            );
          })}
        </div>

        <div>
          <div className="card">
            <h4 style={{ marginTop: 0 }}>2) Application-specific fields</h4>
            <button className="primary" onClick={() => void addSpecificField()}>
              Add specific field
            </button>
          </div>

          {(app.specificFields || []).map((sf) => {
            const latest = [...sf.versions].sort((a, b) => b.version - a.version)[0];
            return (
              <FieldCard
                key={sf.id}
                title={sf.label}
                subtitle={`type: ${sf.type} • latest: v${latest?.version || 0}`}
                actions={<button onClick={() => void newSpecificVersion(sf.id)}>New version</button>}
              >
                <div style={{ whiteSpace: "pre-wrap" }}>{latest?.value || <span className="small">(empty)</span>}</div>
              </FieldCard>
            );
          })}

          <div className="card">
            <h4 style={{ marginTop: 0 }}>3) Export (copy/paste)</h4>
            <div className="row">
              <button onClick={() => void doExport("plain")}>Export Plain</button>
              <button onClick={() => void doExport("markdown")}>Export Markdown</button>
              <button className="primary" disabled={!exportText} onClick={() => void copyExport()}>
                Copy
              </button>
            </div>
            <textarea readOnly value={exportText} placeholder="Export output appears here…" />
          </div>
        </div>
      </div>
    </div>
  );
}
