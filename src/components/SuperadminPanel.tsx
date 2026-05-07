import { useState, useEffect } from 'react';

// DB Mock
const fetchCharities = async () => {
  return [
    { id: 1, name: 'Helping Hands Trust', reg_id: 'REG-2024-001', tier: 'ENTERPRISE', grants: '£4.2M', is_active: true },
    { id: 2, name: 'Green Earth Trust', reg_id: 'REG-2024-118', tier: 'NON-PROFIT', grants: '£890K', is_active: true },
    { id: 3, name: 'Urban Waterways', reg_id: 'REG-2023-452', tier: 'NON-PROFIT', grants: '£2.1M', is_active: false }
  ];
};

export default function SuperadminPanel() {
  const [charities, setCharities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newCharName, setNewCharName] = useState('');

  useEffect(() => {
    fetchCharities().then(setCharities);
  }, []);

  const handleRegister = () => {
    if (!newCharName) return;
    setCharities([...charities, {
      id: Date.now(),
      name: newCharName,
      reg_id: `REG-2024-${Math.floor(Math.random()*999)}`,
      tier: 'NON-PROFIT',
      grants: '£0',
      is_active: true
    }]);
    setNewCharName('');
    setShowModal(false);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>Superuser Hub</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem', fontWeight: 600 }}>
            GLOBAL SYSTEM OVERSIGHT & CHARITY GOVERNANCE
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" style={{ background: '#fff' }}>Edit Charity Config</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Register Charity</button>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="flex gap-4">
          <div className="card" style={{ flex: 1 }}>
            <div className="flex justify-between items-center mb-2">
              <div style={{ background: '#eff6ff', padding: '0.5rem', borderRadius: '8px', color: 'var(--primary)' }}>🏛️</div>
              <span className="badge badge-blue">+12%</span>
            </div>
            <div className="stat-title text-muted" style={{ marginBottom: '0.25rem' }}>TOTAL CHARITIES</div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>1,284</div>
            <div style={{ marginTop: '1rem', height: '4px', background: 'var(--border-color)', borderRadius: '2px' }}>
              <div style={{ width: '70%', height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div>
            </div>
          </div>
          
          <div className="card" style={{ flex: 1 }}>
            <div className="flex justify-between items-center mb-2">
              <div style={{ background: '#f5f3ff', padding: '0.5rem', borderRadius: '8px', color: '#8b5cf6' }}>👥</div>
              <span className="text-success" style={{ fontSize: '0.75rem', fontWeight: 600 }}>8 LIVE</span>
            </div>
            <div className="stat-title text-muted" style={{ marginBottom: '0.25rem' }}>ACTIVE USERS</div>
            <div className="stat-value">428</div>
            <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Across 80 registered entities</div>
          </div>
        </div>

        <div className="card">
          <div className="stat-title text-muted">SYSTEM HEALTH</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Operational</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Latency: 42ms. All nodes synchronized with central ledger.</p>
          <div className="flex gap-2">
            <span style={{ color: 'var(--success)', background: '#ecfdf5', padding: '0.2rem', borderRadius: '50%' }}>✔️</span>
            <span style={{ color: 'var(--success)', background: '#ecfdf5', padding: '0.2rem', borderRadius: '50%' }}>✔️</span>
            <span style={{ color: 'var(--success)', background: '#ecfdf5', padding: '0.2rem', borderRadius: '50%' }}>✔️</span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem 0' }}>
          <div className="flex justify-between items-center" style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>REGISTERED CHARITIES LEDGER</h3>
          </div>
          <div className="table-container" style={{ border: 'none', borderTop: '1px solid var(--border-color)', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>ORGANIZATION</th>
                  <th>REGISTRY ID</th>
                  <th>TIER</th>
                  <th>GRANTS AWARDED</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {charities.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {c.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>London, UK</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{c.reg_id}</td>
                    <td><span className={c.tier === 'ENTERPRISE' ? 'badge badge-blue' : 'badge badge-gray'}>{c.tier}</span></td>
                    <td style={{ fontWeight: 500 }}>{c.grants}</td>
                    <td className={c.is_active ? 'text-success' : 'text-danger'}>
                      ● {c.is_active ? 'Active' : 'Pending Audit'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card mb-4" style={{ background: '#f8fafc' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--text-muted)' }}>RECENT ACTIVITY</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex gap-2">
                <div style={{ color: 'var(--primary)', paddingTop: '2px' }}>📄</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>New Charity Registered</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Global Education Initiative has been onboarded to the system.</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.4rem', fontWeight: 600 }}>2 MINUTES AGO</div>
                </div>
              </div>
              <div className="flex gap-2">
                <div style={{ color: 'var(--danger)', paddingTop: '2px' }}>⚠️</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Audit Triggered</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>System flagged discrepancies in Urban Waterways Q3 financial reporting.</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.4rem', fontWeight: 600 }}>45 MINUTES AGO</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card" style={{ background: '#0f172a', color: '#fff' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>SECURITY PROTOCOL</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Active Sentinel Scan</h3>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginBottom: '0.5rem' }}>
              <div style={{ width: '67%', height: '100%', background: '#3b82f6', borderRadius: '2px' }}></div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1.5rem' }}>67%</div>
            <button className="btn" style={{ width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>VIEW AUDIT LOGS</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px' }}>
            <h3 className="mb-4">Register Charity</h3>
            <input type="text" className="form-control mb-4" placeholder="Charity Name" value={newCharName} onChange={e => setNewCharName(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRegister}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
