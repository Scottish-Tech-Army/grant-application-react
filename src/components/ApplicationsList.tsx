import { useState } from 'react';
import type { GrantApplication } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  applications: GrantApplication[];
  onSelectApplication: (id: string) => void;
  onCreateApplication: () => void;
  onDeleteApplication: (id: string) => void;
}

export default function ApplicationsList({
  applications,
  onSelectApplication,
  onCreateApplication,
  onDeleteApplication,
}: Props) {
  const [pendingDeleteApp, setPendingDeleteApp] = useState<GrantApplication | null>(null);

  const sorted = [...applications].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="applications-list">
      <div className="section-header">
        <div>
          <h2>Funding Applications</h2>
          <p className="subtitle">
            Create and manage your grant applications. Select common fields and add application-specific information.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onCreateApplication}>
          + New Application
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state card">
          <h3>No applications yet</h3>
          <p>Create your first funding application to get started.</p>
          <button className="btn btn-primary" onClick={onCreateApplication}>
            Create Application
          </button>
        </div>
      ) : (
        <div className="applications-grid">
          {sorted.map((app) => (
            <div
              key={app.id}
              className="application-card card"
              onClick={() => onSelectApplication(app.id)}
            >
              <div className="app-card-header">
                <h3>{app.name}</h3>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDeleteApp(app);
                  }}
                >
                  Delete
                </button>
              </div>
              <p className="app-funder">{app.funder}</p>
              <div className="app-card-meta">
                <span>{app.selectedCommonFields.length} common fields</span>
                <span>{app.additionalFields.length} additional fields</span>
              </div>
              <div className="app-card-dates">
                <span>Created: {new Date(app.createdAt).toLocaleDateString('en-GB')}</span>
                <span>Updated: {new Date(app.updatedAt).toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteApp !== null}
        title="Delete application"
        message={pendingDeleteApp ? `Are you sure you want to delete "${pendingDeleteApp.name}"?` : ''}
        confirmLabel="Delete application"
        onCancel={() => setPendingDeleteApp(null)}
        onConfirm={() => {
          if (!pendingDeleteApp) return;
          onDeleteApplication(pendingDeleteApp.id);
          setPendingDeleteApp(null);
        }}
      />
    </div>
  );
}
