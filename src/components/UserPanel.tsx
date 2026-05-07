import { useState, useEffect } from 'react';
import ApplicationForm from './ApplicationForm';
import CharityBot from './CharityBot';
import { User, Application } from '../types';
import styles from './UserPanel.module.css';
import { authFetch } from '../utils/auth';
import { exportApplicationToPDF } from '../utils/ExportUtils';

export interface UserPanelProps {
  user: User;
  onPrint: (app: any) => void;
}

export default function UserPanel({ user, onPrint }: UserPanelProps) {
  const [view, setView] = useState('list'); // 'list' | 'create' | 'view_only' | 'edit'
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'reports'
  const [apps, setApps] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [id, setId] = useState('');
  const [activeApp, setActiveApp] = useState<Application | any>(null);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [isBotEnabled, setIsBotEnabled] = useState(true);

  // Form State
  const [projectName, setProjectName] = useState('');
  const [funderName, setFunderName] = useState('');
  const [projectFund, setProjectFund] = useState('');
  const [securedFund, setSecuredFund] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const handleSetProjectName = (val: string) => {
    setProjectName(val);
    if (val.trim()) setValidationErrors(prev => prev.filter(e => e !== 'Project Title'));
  };

  const handleSetFunderName = (val: string) => {
    setFunderName(val);
    if (val.trim()) setValidationErrors(prev => prev.filter(e => e !== 'Funder Name'));
  };

  const handleSetTemplateId = (val: string) => {
    setSelectedTemplateId(val);
    if (val) setValidationErrors(prev => prev.filter(e => e !== 'Linked Template'));
  };
  const [availableCommonFields, setAvailableCommonFields] = useState<any[]>([]);
  const [selectedCommonKeys, setSelectedCommonKeys] = useState<any[]>([]);
  const [appSpecificFields, setAppSpecificFields] = useState<any[]>([]);
  const [status, setStatus] = useState('DRAFT');
  const [outcomeComments, setOutcomeComments] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApps = async () => {
      setIsLoading(true);
      try {
        const response = await authFetch(`http://localhost:8081/app/applications?charityId=${user.charityId}`, {
          method: 'GET'
        });
        if (!response.ok) throw new Error('API Sync Failed');
        const data = await response.json();
        setApps(data);
      } catch (err) {
        console.warn("API Ledger Sync Failed, restoring High-Fidelity Mock Repository.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchApps();
  }, [user.charityId]);

  useEffect(() => {
    const fetchTemplateFields = async () => {
      if (!selectedTemplateId) {
        setAvailableCommonFields([]);
        if (view === 'create') setSelectedCommonKeys([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await authFetch(`http://localhost:8081/app/common-data/${selectedTemplateId}`);
        if (!response.ok) throw new Error('Schema Fetch Failed');
        const data = await response.json();
        const fields = JSON.parse(data.dataJson) || [];
        setAvailableCommonFields(fields);
        // By default select all fields for new applications
        if (view === 'create') setSelectedCommonKeys(fields.map((f: any) => f.id));
      } catch (err) {
        console.warn("Template Schema Sync Failed, restoring High-Fidelity Schema Mock.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplateFields();
  }, [selectedTemplateId, view]);

  const handleCreateNew = async () => {
    resetForm();
    setActiveApp(null);
    setView('create');

    setIsLoading(true);
    try {
      const response = await authFetch(`http://localhost:8081/app/common-data/charity/${user.charityId}`);
      if (!response.ok) throw new Error('Template Directory Sync Failed');
      const data = await response.json();
      setAvailableTemplates(data);
    } catch (err) {
      console.warn("Template Directory Sync Failed, using baseline mock data.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAppData = async (app: Application | any, setActiveForView: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await authFetch(`http://localhost:8081/app/applications/${app.id}`);
      if (!response.ok) throw new Error('Detail Fetch Failed');
       let responseJson = await response.json();
      if(responseJson.errorCode) {
        throw new Error("Something went wrong. Please check with application support team");
      }
      const fullApp = responseJson;

      if (setActiveForView) {
        setActiveApp(fullApp);
      }else{
        setActiveApp(null);
        setId(fullApp.id || '');
      }
      setProjectName(fullApp.projectName || "");
      setFunderName(fullApp.funderName || "");
      setProjectFund(fullApp.projectFund || '');
      setSecuredFund(fullApp.securedFund || '');
      setSelectedTemplateId(fullApp.commonDataId || "");
      setStatus(fullApp.status || 'DRAFT');
      setOutcomeComments(fullApp.comments || '');

      // Parse stringified JSON fields into arrays safely
      let appSpecific: any[] = [];
      let commonFields: any[] = [];
      let commonKeys: any[] = [];

      try {
        if (typeof fullApp.applicationDataJson === 'string') {
          const normalized = fullApp.applicationDataJson
            .replace(/\u00A0/g, ' ')
            .replace(/\r\n|\n\r|\r|\n/g, '')
            .trim();
          const parsed = JSON.parse(normalized);
          appSpecific = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.applicationFields)
              ? parsed.applicationFields
              : [];
        } else {
          const raw = fullApp.applicationDataJson || [];
          appSpecific = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.applicationFields)
              ? raw.applicationFields
              : [];
        }
      } catch (e) {
        console.warn("Failed to parse applicationDataJson:", e);
        appSpecific = [];
      }

      try {
        commonFields = typeof fullApp.dataJson === 'string' 
          ? JSON.parse(fullApp.dataJson) 
          : fullApp.dataJson || [];
      } catch (e) {
        console.warn("Failed to parse dataJson:", e);
        commonFields = [];
      }

      try {
        commonKeys = typeof fullApp.selectedCommonKeys === 'string' 
          ? JSON.parse(fullApp.selectedCommonKeys) 
          : fullApp.selectedCommonKeys || [];
      } catch (e) {
        console.warn("Failed to parse selectedCommonKeys:", e);
        commonKeys = [];
      }
      setAppSpecificFields(appSpecific);
      setAvailableCommonFields(commonFields);
      setSelectedCommonKeys(commonKeys);
      return true;

    } catch (err: any) {
      console.warn("Detail Sync Failed, restoring High-Fidelity Project Mock.");
      setLoadError(err?.message || 'Failed to load application details. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (app: Application) => {
    try{
     const response = await authFetch(`http://localhost:8081/app/common-data/charity/${user.charityId}`);
      if (!response.ok) throw new Error('Template Directory Sync Failed');
      const data = await response.json();
      setAvailableTemplates(data);
      const loaded = await loadAppData(app, false);
    if (loaded) {
      setView('edit');
    }
    }catch(err){
      console.warn("Fetching template directory failed, but proceeding to load application details.");
    }
   
  };

  const handleView = async (app: Application) => {
    const loaded = await loadAppData(app, true);
    if (loaded) {
      setView('view_only');
    }
  };
  const handleExportPDF = (app: Application) => { exportApplicationToPDF(app as any, user); };

  const resetForm = () => {
    setProjectName(''); setFunderName(''); setProjectFund(''); setSecuredFund(''); setSelectedTemplateId('');
    setSelectedCommonKeys([]); setAppSpecificFields([]);
    setStatus('DRAFT'); setOutcomeComments('');
    setValidationErrors([]);
    setLoadError(null);
  };

  const toggleCommonField = (id: any) => {
    if (selectedCommonKeys.includes(id)) {
      const newKeys = selectedCommonKeys.filter(k => k !== id);
      setSelectedCommonKeys(newKeys);
    } else {
      const newKeys = [...selectedCommonKeys, id];
      setSelectedCommonKeys(newKeys);
      setValidationErrors(prev => prev.filter(e => e !== 'Charity Fields'));
    }
  };

  const saveApplication = async () => {
    // --- Validation Guard ---
    const errors: string[] = [];
    if (!projectName.trim()) errors.push('Project Title');
    if (!funderName.trim()) errors.push('Funder Name');
    if (!selectedTemplateId) errors.push('Linked Template');
    if (availableCommonFields.length > 0 && selectedCommonKeys.length === 0) errors.push('Charity Fields');
    const invalidSpecific = appSpecificFields.some((f: any) => !f.key.trim() || !f.value.trim());
    if (invalidSpecific) errors.push('App Specific Data (key & value required)');

    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setValidationErrors([]);
    const now = new Date();
    const timestamp = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const payload: any = {
      applicationNumber: activeApp ? activeApp.applicationNumber : `APP-${timestamp}`,
      projectName: projectName,
      funderName: funderName,
      projectFund: projectFund,
      securedFund: securedFund,
      status: status,
      comments: outcomeComments,
      charityId: user.charityId,
      commonDataId: parseInt(selectedTemplateId),
      selectedCommonKeys: JSON.stringify(selectedCommonKeys),
      ...(view === 'edit' ? { id: id } : {}),
      applicationDataJson: JSON.stringify(
        appSpecificFields
          .filter((f: any) => f.key.trim() !== '')
          .map(({ key, value, comment, comments }: any) => ({ key, value, comments: comment || comments }))
      )
    };

    setIsLoading(true);
    try {
      const response = await authFetch('http://localhost:8081/app/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const savedRecord = await response.text();
      const finalData = { ...payload, id: savedRecord, modifiedAt: new Date().toISOString() };

      if (id == savedRecord) {
        setApps(apps.map((a: any) => (a.id === id) ? finalData : a));
      } else {
        setApps([finalData, ...apps]);
      }
    } catch (err) {
      console.warn("Persistence sync failed, using local optimistic update.");
      const optimisticData = { ...payload, id: activeApp ? activeApp.id : Date.now(), modifiedAt: new Date().toISOString() };
      if (activeApp) {
        setApps(apps.map((a: any) => (a.id === activeApp.id || a.applicationNumber === activeApp.applicationNumber) ? optimisticData : a));
      } else {
        setApps([optimisticData, ...apps]);
      }
    } finally {
      setIsLoading(false);
      resetForm();
      setView('list');
    }
  };

  // --- Memoized Filtered List ---
  const filteredApps = apps.filter(a => {
    const term = searchTerm.toLowerCase();
    return (
      (a.projectName || "").toLowerCase().includes(term) ||
      (a.funderName || "").toLowerCase().includes(term) ||
      (a.applicationNumber || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className={`animate-fade-in ${styles.root}`}>
      {loadError && (
        <div className="alert alert-error mb-6" role="alert">
          {loadError}
        </div>
      )}

      {/* --- FORM VIEW --- */}
      {(view === 'create' || view === 'edit' || view === 'view_only') && (
        <div className={styles.formWrapper}>
          <div className="flex justify-between items-center mb-6" style={{ marginBottom: '2rem' }}>
            <div>
              <h2 className={styles.pageTitle}>
                {view === 'create' ? 'Create Application' : view === 'edit' ? 'Edit Application Record' : 'Application Summary'}
              </h2>
              <p className={styles.pageSubtitle}>Organization: {user.charityName}</p>
            </div>
          </div>

          <ApplicationForm
            view={view} user={user}
            projectName={projectName} setProjectName={handleSetProjectName}
            funderName={funderName} setFunderName={handleSetFunderName}
            projectFund={projectFund} setProjectFund={setProjectFund}
            securedFund={securedFund} setSecuredFund={setSecuredFund}
            status={status} setStatus={setStatus}
            outcomeComments={outcomeComments} setOutcomeComments={setOutcomeComments}
            selectedTemplateId={selectedTemplateId} setSelectedTemplateId={handleSetTemplateId}
            availableTemplates={availableTemplates}
            availableCommonFields={availableCommonFields}
            selectedCommonKeys={selectedCommonKeys} toggleCommonField={toggleCommonField}
            appSpecificFields={appSpecificFields} setAppSpecificFields={(fields) => {
              setAppSpecificFields(fields);
              setValidationErrors(prev => prev.filter(e => !e.includes('Data')));
            }}
            saveApplication={saveApplication}
            handleExportPDF={handleExportPDF}
            activeApp={activeApp}
            validationErrors={validationErrors}
          />

          <div className={styles.formActions}>
            <button className={`btn btn-outline ${styles.btnReturn}`} style={{margin:'0.75rem'}} onClick={() => { setView('list'); resetForm(); }}>Return to Ledger</button>
            {view !== 'view_only' && <button className={`btn btn-primary ${styles.btnSave}`} onClick={saveApplication}>{activeApp ? 'Update Application' : 'Finalize & Submit'}</button>}
            {view === 'view_only' && <button className={`btn btn-primary ${styles.btnPdf}`} onClick={() => handleExportPDF(activeApp)}>Generate PDF Copy</button>}
          </div>

          <CharityBot isEnabled={isBotEnabled} />
        </div>
      )}

      {/* --- LIST VIEW --- */}
      {view === 'list' && (
        <>
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className={styles.ledgerTitle}>Application Ledger</h2>
              <p className={styles.pageSubtitle}>HISTORY OVERVIEW FOR: {user.charityName}</p>
            </div>
            <div className="flex items-center" style={{ gap: '1rem' }}>
              <div className={styles.voiceAssistantBadge}>
                <span className={styles.voiceAssistantLabel}>VOICE ASSISTANT</span>
                <input type="checkbox" checked={isBotEnabled} onChange={e => setIsBotEnabled(e.target.checked)} className={styles.voiceAssistantCheckbox} />
              </div>
              <button className="btn btn-primary" onClick={handleCreateNew}>+ New Project Application</button>
            </div>
          </div>

          <div className={`card ${styles.tableCard}`} style={{ marginTop: '1.5rem' }}>
            <div className={styles.ledgerActionRow}>
              <h3 className={styles.tableHeader}>Submissions Directory</h3>
              <div className={styles.searchWrapper}>
                <svg className={styles.searchIcon} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" className={styles.searchInput} placeholder="Search by Project, Funder or Ref ID..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr style={{ background: 'rgba(34, 211, 238, 0.12)' }}>
                    <th className={styles.th}>REF #</th>
                    <th className={styles.th}>PROJECT</th>
                    <th className={styles.th}>FUNDER</th>
                    <th className={styles.th}>MODIFIED DATE</th>
                    <th className={styles.th}>STATUS</th>
                    <th className={styles.th}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={`text-center ${styles.tdEmpty}`}>
                        <div className={styles.emptyStateContainer}>
                          <div className={styles.emptyStateIcon}>🔍</div>
                          <p>{isLoading ? 'Synchronizing with Ledger...' : 'No application history matching your search.'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map(a => (
                      <tr key={(a as any).id || a.applicationNumber}>
                        <td><strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{a.applicationNumber}</strong></td>
                        <td className={styles.tdProject}>{a.projectName}</td>
                        <td className={styles.tdFunder}>{a.funderName}</td>
                        <td className={styles.tdDate}>
                          {a.modifiedAt ? new Date(a.modifiedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </td>
                        <td>
                          <span className={`badge ${a.status === 'DRAFT' ? 'badge-gray' : a.status === 'REJECTED' ? 'badge-danger' : a.status === 'FUNDED' ? 'badge-success' : 'badge-green'}`}>{a.status}</span>
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button onClick={() => handleView(a)} title="Full Overview"><svg width="18" height="18" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h4" /></svg></button>
                            <button onClick={() => handleEdit(a)} title="Update Content & Status"><svg width="18" height="18" fill="none" stroke="#006a4d" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
