import { User, Application } from '../types';

interface OfficialReportProps {
  app: Application | any;
  user: User;
  onCopy?: (text: string) => void;
}

export default function OfficialReport({ app, user, onCopy }: OfficialReportProps) {
  const LBG_PRIMARY = '#006a4d';
  const TEXT_DARK = '#1a1a1a';

  const handleCopy = (text: string) => {
    if (onCopy) onCopy(text);
    else {
      navigator.clipboard.writeText(text);
      // Optional: Visual confirmation in UI
    }
  };

  const CopyButton = ({ text, label }: { text: string, label: string }) => (
    <button 
      onClick={() => handleCopy(text)}
      className="no-print"
      title={`Copy ${label}`}
      style={{ 
        border: 'none', cursor: 'pointer', color: LBG_PRIMARY, 
        fontSize: '9px', marginLeft: '8px', 
        padding: '2px 6px', borderRadius: '4px', background: '#e6f1ef', fontWeight: 700 
      }}
    >
      Copy
    </button>
  );

  return (
    <div id="printable-area" style={{ 
      padding: '40px', 
      fontFamily: 'Helvetica, Arial, sans-serif', 
      maxWidth: '800px', 
      margin: '0 auto',
      background: '#fff',
      color: TEXT_DARK,
      lineHeight: '1.6'
    }}>
      {/* BRAND HEADER */}
      <div style={{ 
        background: LBG_PRIMARY, 
        padding: '30px', 
        color: '#fff', 
        borderRadius: '8px', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>GRANT APPLICATION REPORT</h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '12px' }}>
            REF #: {app.applicationNumber || app.application_number} | STATUS: {String(app.status || 'DRAFT').toUpperCase()}
          </p>
        </div>
        <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>{user.charityName || `Charity #${user.charityId}`}</div>
          <div style={{ fontSize: '10px', opacity: 0.7 }}>UNAUTHORIZED COPYING PROHIBITED</div>
        </div>
      </div>

      {/* QUICK COPY BANNER */}
      <div style={{ 
        background: '#f1f5f9', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '30px', 
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }} className="no-print">
        <span style={{ fontSize: '20px' }}>⚡</span>
        <div style={{ fontSize: '12px', fontWeight: 600 }}>
          This is an interactive report! You can use the buttons in the portal to quickly copy each field to your clipboard.
        </div>
      </div>

      {/* OVERVIEW */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ borderBottom: `2px solid ${LBG_PRIMARY}`, paddingBottom: '5px', fontSize: '16px', color: LBG_PRIMARY, textTransform: 'uppercase' }}>1. Project Overview</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 0', fontWeight: 700, width: '220px' }}>
                Project Title 
                <a href={`http://localhost:5174/?copy=${encodeURIComponent('Project Title')}`} target="_blank" rel="noreferrer" style={{ fontSize: '9px', marginLeft: '5px', color: LBG_PRIMARY, textDecoration: 'none' }}>📋</a>
                <CopyButton text="Project Title" label="Key" />
              </td>
              <td style={{ padding: '10px 0' }}>
                {app.projectName || app.project_name}
                <a href={`http://localhost:5174/?copy=${encodeURIComponent(app.projectName || app.project_name || "")}`} target="_blank" rel="noreferrer" style={{ fontSize: '9px', marginLeft: '5px', color: LBG_PRIMARY, textDecoration: 'none' }}>📋</a>
                <CopyButton text={app.projectName || app.project_name || ""} label="Value" />
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 0', fontWeight: 700 }}>
                Legal Funder
                <a href={`http://localhost:5174/?copy=${encodeURIComponent('Legal Funder')}`} target="_blank" rel="noreferrer" style={{ fontSize: '9px', marginLeft: '5px', color: LBG_PRIMARY, textDecoration: 'none' }}>📋</a>
                <CopyButton text="Legal Funder" label="Key" />
              </td>
              <td style={{ padding: '10px 0' }}>
                {app.funderName || app.funder_name}
                <a href={`http://localhost:5174/?copy=${encodeURIComponent(app.funderName || app.funder_name || "")}`} target="_blank" rel="noreferrer" style={{ fontSize: '9px', marginLeft: '5px', color: LBG_PRIMARY, textDecoration: 'none' }}>📋</a>
                <CopyButton text={app.funderName || app.funder_name || ""} label="Value" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* CHARITY DATA */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ borderBottom: `2px solid ${LBG_PRIMARY}`, paddingBottom: '5px', fontSize: '16px', color: LBG_PRIMARY, textTransform: 'uppercase' }}>2. Integrated Charity Data</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginTop: '15px' }}>
          {(app.dataJson || []).map((f: any) => (
            <div key={f.id} style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', borderLeft: `3px solid #cbd5e1` }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {f.key}
                  <a href={`http://localhost:5174/?copy=${encodeURIComponent(f.key)}`} target="_blank" rel="noreferrer" style={{ fontSize: '9px', marginLeft: '4px', color: LBG_PRIMARY, textDecoration: 'none' }}>📋</a>
                </span>
                <CopyButton text={f.key} label="Key" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span>
                  {f.value}
                  <a href={`http://localhost:5174/?copy=${encodeURIComponent(f.value)}`} target="_blank" rel="noreferrer" style={{ fontSize: '9px', marginLeft: '4px', color: LBG_PRIMARY, textDecoration: 'none' }}>📋</a>
                </span>
                <CopyButton text={f.value} label="Value" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* APP SPECIFIC */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ borderBottom: `2px solid ${LBG_PRIMARY}`, paddingBottom: '5px', fontSize: '16px', color: LBG_PRIMARY, textTransform: 'uppercase' }}>3. Application Details</h2>
        {(app.applicationDataJson || []).map((f: any) => (
          <div key={f.id} style={{ padding: '15px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: LBG_PRIMARY, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {f.key}
              <a href={`http://localhost:5174/?copy=${encodeURIComponent(f.key)}`} target="_blank" rel="noreferrer" style={{ fontSize: '9px', color: LBG_PRIMARY, textDecoration: 'none' }}>📋</a>
              <CopyButton text={f.key} label="Key" />
            </div>
            <div style={{ fontSize: '14px', marginTop: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span>
                {f.value}
                <a href={`http://localhost:5174/?copy=${encodeURIComponent(f.value || "")}`} target="_blank" rel="noreferrer" style={{ fontSize: '10px', marginLeft: '6px', color: LBG_PRIMARY, textDecoration: 'none' }}>📋</a>
              </span>
              <CopyButton text={f.value} label="Value" />
            </div>
            {f.comment && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '5px', fontStyle: 'italic' }}>Note: {f.comment}</div>}
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div style={{ 
        marginTop: '60px', 
        borderTop: '1px solid #f1f5f9', 
        paddingTop: '20px', 
        textAlign: 'center', 
        fontSize: '10px', 
        color: '#94a3b8' 
      }}>
        Generated officially by {user.charityName || 'Authorized User'}. For verification, use the original portal link.
      </div>

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
