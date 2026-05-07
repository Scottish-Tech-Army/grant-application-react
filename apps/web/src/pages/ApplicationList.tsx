import React, { useEffect, useState } from "react";
import { api, Application } from "../api";
import { Link } from "react-router-dom";
import Toast from "../components/Toast";

export default function ApplicationList(): JSX.Element {
  const [apps, setApps] = useState<Application[]>([]);
  const [name, setName] = useState<string>("");
  const [funder, setFunder] = useState<string>("");
  const [toast, setToast] = useState<string>("");

  async function load(): Promise<void> {
    setApps(await api.applications());
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(): Promise<void> {
    if (!name.trim()) return;
    await api.createApplication({ name, funder });
    setName("");
    setFunder("");
    setToast("Created application");
    await load();
  }

  return (
    <div>
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Applications</h3>
        <div className="row">
          <input placeholder="Application name" value={name} onChange={(e) => setName(e.target.value)} style={{ minWidth: 240 }} />
          <input placeholder="Funder (optional)" value={funder} onChange={(e) => setFunder(e.target.value)} style={{ minWidth: 240 }} />
          <button className="primary" onClick={() => void create()}>
            Create
          </button>
        </div>
      </div>

      {apps.map((a) => (
        <div key={a.id} className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700 }}>
                <Link to={`/applications/${a.id}`}>{a.name}</Link>
              </div>
              <div className="small">
                {a.funder ? `Funder: ${a.funder} • ` : ""}Status: {a.status} • Created: {new Date(a.createdAt).toLocaleString()}
              </div>
            </div>
            <span className="badge">{(a.selectedCommon || []).length} common fields</span>
          </div>
        </div>
      ))}
    </div>
  );
}
