import { useState, useEffect } from 'react';
import { User, Application } from '../types';
import { exportApplicationToPDF, exportApplicationToWord, exportApplicationToExcel } from '../utils/ExportUtils';
import styles from './UserPanel.module.css'; // Reuse table and search styles
import { authFetch } from '../utils/auth';

interface ApplicationReportsProps {
  user: User;
  onPrint: (app: any) => void;
}

export default function ApplicationReports({ user, onPrint }: ApplicationReportsProps) {
  const [apps, setApps] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | any>(null);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'word' | 'excel'>('pdf');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      setIsLoading(true);
      try {
        const response = await authFetch(`http://localhost:8081/app/applications?charityId=${user.charityId}`, {
          method: 'GET'
        });
        const data = await response.json();
        setApps(data);
      } catch (err) {
        console.warn("Using sample data for reports");
      } finally {
        setIsLoading(false);
      }
    };
    fetchApps();
  }, [user.charityId]);

  const handleSelectApp = async (app: Application) => {
    setIsLoading(true);
    try {
      const response = await authFetch(`http://localhost:8081/app/applications/${app.id}`);
      const fullApp = await response.json();
      setSelectedApp(fullApp);
    } catch (err) {
      console.warn("Failed to fetch full application details, using basic info for display.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    if (!selectedApp) return;
    switch (format) {
      case 'pdf':
        exportApplicationToPDF(selectedApp, user);
        break;
      case 'word':
        exportApplicationToWord(selectedApp, user);
        break;
      case 'excel':
        exportApplicationToExcel(selectedApp, user);
        break;
    }
    setShowExportMenu(false);
  };

  const filteredApps = apps.filter(a => 
    a.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.funderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.applicationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="mb-8">
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>Reports</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem', fontWeight: 600 }}>
          Search for applications and export in PDF, Word, or Excel format
        </p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: '2rem', alignItems: 'start', marginTop: '1.5rem' }}>
        {/* Left Col: Search & List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="🔍 Search Project, Funder or Ref..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filteredApps.map(a => (
              <div 
                key={a.id || a.applicationNumber} 
                className={`flex justify-between items-center`}
                style={{ 
                  padding: '1rem 1.25rem', 
                  borderBottom: '1px solid #f1f5f9', 
                  cursor: 'pointer',
                  backgroundColor: selectedApp?.applicationNumber === a.applicationNumber ? '#e6f1ef' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => handleSelectApp(a)}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedApp?.applicationNumber === a.applicationNumber ? 'var(--primary)' : 'var(--primary)' }}>{a.applicationNumber}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: selectedApp?.applicationNumber === a.applicationNumber ? '#334155' : '#f1f5f9' }}>{a.projectName}</div>
                  <div style={{ fontSize: '0.75rem', color: selectedApp?.applicationNumber === a.applicationNumber ? '#64748b' : '#cbd5e1' }}>{a.funderName}</div>
                </div>
                <div className={`badge ${a.status === 'FUNDED' ? 'badge-success' : 'badge-gray'}`} style={{ 
                  fontSize: '0.65rem',
                  backgroundColor: selectedApp?.applicationNumber === a.applicationNumber 
                    ? (a.status === 'FUNDED' ? '#059669' : '#475569')
                    : undefined,
                  color: selectedApp?.applicationNumber === a.applicationNumber ? '#fff' : undefined
                }}>{a.status}</div>
              </div>
            ))}
            {filteredApps.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>No applications found.</div>
            )}
          </div>
        </div>

        {/* Right Col: Details & Actions */}
        <div className="card">
          {!selectedApp ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>📄</div>
              <p>Select an application from the list to view details and export.</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start mb-6 pb-6 border-b">
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--primary)' }}>{selectedApp.projectName}</h3>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>Ref: {selectedApp.applicationNumber} | Funder: {selectedApp.funderName}</p>
                </div>
                <div style={{ position: 'relative' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    style={{ gap: '0.5rem', display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    Export Report
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  </button>
                  {showExportMenu && (
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: '8px', 
                      background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10,
                      minWidth: '180px', overflow: 'hidden'
                    }}>
                      <button 
                        onClick={() => handleExport('pdf')}
                        style={{
                          width: '100%', padding: '12px 16px', textAlign: 'left',
                          border: 'none', background: 'transparent', cursor: 'pointer',
                          fontSize: '0.9rem', color: '#334155', fontWeight: 500,
                          borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        📄 PDF Document
                      </button>
                      <button 
                        onClick={() => handleExport('word')}
                        style={{
                          width: '100%', padding: '12px 16px', textAlign: 'left',
                          border: 'none', background: 'transparent', cursor: 'pointer',
                          fontSize: '0.9rem', color: '#334155', fontWeight: 500,
                          borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        📝 Word Document
                      </button>
                      <button 
                        onClick={() => handleExport('excel')}
                        style={{
                          width: '100%', padding: '12px 16px', textAlign: 'left',
                          border: 'none', background: 'transparent', cursor: 'pointer',
                          fontSize: '0.9rem', color: '#334155', fontWeight: 500,
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        📊 Excel Spreadsheet
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ padding: '1.5rem', background: '#89a8c6', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem' }}>Summary</h4>
                  <table style={{ width: '100%', fontSize: '0.9rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.5rem 0', fontWeight: 600, color: '#334155', width: '40%' }}>Application Ref</td>
                        <td style={{ padding: '0.5rem 0', color: '#1f2937' }}>{selectedApp.applicationNumber}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.5rem 0', fontWeight: 600, color: '#334155' }}>Project</td>
                        <td style={{ padding: '0.5rem 0', color: '#1f2937' }}>{selectedApp.projectName}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.5rem 0', fontWeight: 600, color: '#334155' }}>Funder</td>
                        <td style={{ padding: '0.5rem 0', color: '#1f2937' }}>{selectedApp.funderName}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.5rem 0', fontWeight: 600, color: '#334155' }}>Status</td>
                        <td style={{ padding: '0.5rem 0', color: '#1f2937' }}>
                          <span className={`badge ${selectedApp.status === 'DRAFT' ? 'badge-gray' : selectedApp.status === 'REJECTED' ? 'badge-danger' : selectedApp.status === 'FUNDED' ? 'badge-success' : 'badge-green'}`}>{selectedApp.status}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.5rem 0', fontWeight: 600, color: '#334155' }}>Modified</td>
                        <td style={{ padding: '0.5rem 0', color: '#1f2937', fontSize: '0.85rem' }}>{selectedApp.modifiedAt ? new Date(selectedApp.modifiedAt).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
