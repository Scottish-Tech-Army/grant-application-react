import React, { useState } from "react";
import { api, BackupModel } from "../api";
import Toast from "../components/Toast";

export default function BackupRestore(): JSX.Element {
  const [toast, setToast] = useState<string>("");
  const [payload, setPayload] = useState<string>("");

  async function backup(): Promise<void> {
    const db = await api.backup();
    setPayload(JSON.stringify(db, null, 2));
    setToast("Backup generated");
  }

  async function restore(): Promise<void> {
    try {
      const parsed = JSON.parse(payload) as BackupModel;
      await api.restore(parsed);
      setToast("Restore completed");
    } catch {
      setToast("Restore failed (invalid JSON)");
    }
  }

  async function copy(): Promise<void> {
    await navigator.clipboard.writeText(payload);
    setToast("Copied backup JSON");
  }

  return (
    <div>
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Backup & Restore</h3>
        <div className="row">
          <button className="primary" onClick={() => void backup()}>
            Generate Backup
          </button>
          <button onClick={() => void restore()} disabled={!payload}>
            Restore
          </button>
          <button onClick={() => void copy()} disabled={!payload}>
            Copy
          </button>
        </div>
        <textarea value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="Backup JSON will appear here…" />
      </div>
    </div>
  );
}
