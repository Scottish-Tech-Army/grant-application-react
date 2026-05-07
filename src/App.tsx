import { useState, useEffect } from 'react';
import './App.css';
import CommonFieldsManager from './components/CommonFieldsManager';
import ApplicationsList from './components/ApplicationsList';
import ApplicationDetail from './components/ApplicationDetail';
import grantApplicationHero from './assets/grant-application-hero.svg';
import type { CommonField, GrantApplication } from './types';
import { loadCommonFields, saveCommonFields, loadApplications, saveApplications } from './data/store';

type ActiveTab = 'common' | 'applications';

function App() {
  const [commonFields, setCommonFields] = useState<CommonField[]>([]);
  const [applications, setApplications] = useState<GrantApplication[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('common');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  useEffect(() => {
    setCommonFields(loadCommonFields());
    setApplications(loadApplications());
  }, []);

  function handleUpdateCommonFields(fields: CommonField[]) {
    setCommonFields(fields);
    saveCommonFields(fields);
  }

  function handleUpdateApplications(apps: GrantApplication[]) {
    setApplications(apps);
    saveApplications(apps);
  }

  function handleCreateApplication() {
    const newApp: GrantApplication = {
      id: Date.now().toString(),
      name: 'New Application',
      funder: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      selectedCommonFields: [],
      additionalFields: [],
      notes: '',
    };
    handleUpdateApplications([...applications, newApp]);
    setSelectedAppId(newApp.id);
  }

  function handleUpdateApplication(app: GrantApplication) {
    handleUpdateApplications(applications.map((a) => (a.id === app.id ? app : a)));
  }

  function handleDeleteApplication(id: string) {
    handleUpdateApplications(applications.filter((app) => app.id !== id));
    if (selectedAppId === id) {
      setSelectedAppId(null);
    }
  }

  const selectedApp = applications.find((a) => a.id === selectedAppId) || null;
  const appsWithAdditionalFields = applications.filter((a) => a.additionalFields.length > 0).length;
  const populatedCommonFields = commonFields.filter(
    (field) => field.versions[field.versions.length - 1].value.trim() !== ''
  ).length;

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-copy">
          <span className="eyebrow">Grant Operations Workspace</span>
          <h1>Grant Application Manager</h1>
          <p className="header-subtitle">
            Prepare stronger submissions with reusable organisation data, clear application tracking,
            and a workspace designed around funding rounds.
          </p>
          <div className="header-metrics" aria-label="Grant application overview">
            <div className="metric-card">
              <strong>{populatedCommonFields}</strong>
              <span>Ready common fields</span>
            </div>
            <div className="metric-card">
              <strong>{applications.length}</strong>
              <span>Total applications</span>
            </div>
            <div className="metric-card">
              <strong>{appsWithAdditionalFields}</strong>
              <span>With additional fields</span>
            </div>
          </div>
        </div>
        <div className="header-visual">
          <img
            className="hero-image"
            src={grantApplicationHero}
            alt="Illustration of a grant application checklist and team collaboration"
          />
        </div>
      </header>
      <nav className="main-tabs">
        <button className={`main-tab ${activeTab === 'common' ? 'active' : ''}`} onClick={() => { setActiveTab('common'); setSelectedAppId(null); }}>Common Data</button>
        <button className={`main-tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => { setActiveTab('applications'); setSelectedAppId(null); }}>Applications ({applications.length})</button>
      </nav>
      <main className="main-content">
        {activeTab === 'common' && <CommonFieldsManager commonFields={commonFields} onUpdateFields={handleUpdateCommonFields} />}
        {activeTab === 'applications' && !selectedApp && <ApplicationsList applications={applications} onSelectApplication={(id) => setSelectedAppId(id)} onCreateApplication={handleCreateApplication} onDeleteApplication={handleDeleteApplication} />}
        {selectedApp && <ApplicationDetail application={selectedApp} commonFields={commonFields} onUpdateApplication={handleUpdateApplication} onBack={() => setSelectedAppId(null)} />}
      </main>
    </div>
  );
}

export default App;