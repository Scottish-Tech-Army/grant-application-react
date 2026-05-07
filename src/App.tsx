import { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import UserPanel from './components/UserPanel';
import SuperadminPanel from './components/SuperadminPanel';
import Analytics from './components/Analytics';
import ApplicationReports from './components/ApplicationReports';
import RegisterMember from './components/RegisterMember';
import OfficialReport from './components/OfficialReport';
import { User } from './types';
import { clearGlobalAuthToken, hydrateGlobalAuthToken, setGlobalAuthToken } from './utils/auth';

// Basic SVG Icons mapping
const icons = {
  superuser: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>,
  config: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>,
  templates: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>,
  applications: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25A2.25 2.25 0 0 1 6 3h4.5a2.25 2.25 0 0 1 1.59.66l.66.66a2.25 2.25 0 0 0 1.59.66H18A2.25 2.25 0 0 1 20.25 7.2v11.55A2.25 2.25 0 0 1 18 21H6a2.25 2.25 0 0 1-2.25-2.25V5.25Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 10.5h7.5M8.25 14.25h7.5" /></svg>,
  reports: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>,
  analytics: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 19.5h16.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 16.5 9 12.75l2.625 2.625L18.75 8.25" /><circle cx="9" cy="12.75" r="1" /><circle cx="11.625" cy="15.375" r="1" /><circle cx="18.75" cy="8.25" r="1" /></svg>,
  register: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>,
  logout: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" /></svg>
};


function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeRoute, setActiveRoute] = useState('applications');
  const [printApp, setPrintApp] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // --- Print Interceptor ---
    // If we're in print mode, trigger standard browser print
    if (printApp) {
      setTimeout(() => {
        const element = document.getElementById('printable-area');
        if (element && (window as any).html2pdf) {
          const opt = {
            margin: 0,
            filename: `${printApp.applicationNumber || 'charity_report'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
          };
          (window as any).html2pdf().set(opt).from(element).save().then(() => {
            setPrintApp(null);
          });
        } else {
          window.print();
          setPrintApp(null);
        }
      }, 500);
    }
  }, [printApp]);

  useEffect(() => {
    // --- Global Clipboard Interceptor ---
    // Allows PDF links to trigger copy actions via URL parameters
    const params = new URLSearchParams(window.location.search);
    const copyText = params.get('copy');
    if (copyText) {
      navigator.clipboard.writeText(decodeURIComponent(copyText)).then(() => {
        // Try to close window if it's the only command
        setTimeout(() => {
          if (window.opener) window.close();
          else window.history.replaceState({}, document.title, "/");
        }, 300);
      });
    }

    const savedUser = localStorage.getItem('charity_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!showUserMenu) return;
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserMenu]);



  const handleLogin = (loggedInUser: User) => {
    // Global persistence of user identity including charityId
    localStorage.setItem('charity_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);

    // fetchApplications is now called on-demand via the route watcher useEffect

    // Auto map default routes based on role
    if (loggedInUser.role === 'SUPERUSER') setActiveRoute('superuser');
    if (loggedInUser.role === 'ADMIN') setActiveRoute('templates');
    if (loggedInUser.role === 'USER') setActiveRoute('applications');
  };

  const handleLogout = () => {
    localStorage.removeItem('charity_user');
    setUser(null);
    setShowUserMenu(false);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeLabel = today.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const userInitials = (user.username || 'U').slice(0, 2).toUpperCase();
  const roleLabel = user.role === 'SUPERUSER' ? 'Superuser' : user.role === 'ADMIN' ? 'Admin' : 'User';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Grant Hub Portal</h2>
          <p>Manage. Apply. Track.</p>
        </div>

        <nav className="sidebar-nav">
          {user.role === 'ADMIN' && (
            <div className={`nav-item ${activeRoute === 'register' ? 'active' : ''}`} onClick={() => setActiveRoute('register')}>
              {icons.register} Member Registration
            </div>
          )}

          {user.role === 'SUPERUSER' && (
            <div className={`nav-item ${activeRoute === 'superuser' ? 'active' : ''}`} onClick={() => setActiveRoute('superuser')}>
              {icons.superuser} Superuser Hub
            </div>
          )}

          {(user.role === 'SUPERUSER' || user.role === 'ADMIN') && (
            <div className={`nav-item ${activeRoute === 'templates' ? 'active' : ''}`} onClick={() => setActiveRoute('templates')}>
              {icons.templates} Charity Data Templates
            </div>
          )}

          <div className={`nav-item ${activeRoute === 'applications' ? 'active' : ''}`} onClick={() => setActiveRoute('applications')}>
            {icons.applications} Applications
          </div>

          <div className={`nav-item ${activeRoute === 'reports' ? 'active' : ''}`} onClick={() => setActiveRoute('reports')}>
            {icons.reports} Reports
          </div>

          <div className={`nav-item ${activeRoute === 'insights' ? 'active' : ''}`} onClick={() => setActiveRoute('insights')}>
            {icons.analytics} Analytics & Insights
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="nav-item" onClick={handleLogout} style={{ padding: 0 }}>
            {icons.logout} Logout ({user.username})
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-brand">
            {/* Brand or title goes here */}
          </div>
          <div className="topbar-right" style={{ position: 'relative' }} ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(prev => !prev)}
              title="User menu"
              style={{
                height: '40px',
                borderRadius: '999px',
                background: '#f8fafc',
                border: '1px solid #dbe5ef',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                padding: '4px 10px 4px 4px'
              }}
            >
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0c1f3d 0%, #0f766e 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.02em'
              }}>
                {userInitials}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.05 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', maxWidth: '95px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{roleLabel}</div>
              </div>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#64748b' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '44px',
                width: '250px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 16px 28px rgba(15, 23, 42, 0.14)',
                padding: '12px',
                zIndex: 30
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0c1f3d 0%, #0f766e 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    {userInitials}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{user.username}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{roleLabel}</div>
                  </div>
                </div>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '12px 0 10px' }} />
                <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', fontWeight: 700 }}>
                  Session
                </div>
                <div style={{ fontSize: '0.8rem', color: '#334155', display: 'flex', justifyContent: 'space-between' }}><span>Date</span><strong>{dateLabel}</strong></div>
                <div style={{ fontSize: '0.8rem', color: '#334155', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}><span>Time</span><strong>{timeLabel}</strong></div>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    border: '1px solid #fecaca',
                    background: '#fff1f2',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontWeight: 600,
                    color: '#9f1239',
                    cursor: 'pointer'
                  }}
                >
                  Logout Account
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="content-area">
          {activeRoute === 'superuser' && <SuperadminPanel />}
          {activeRoute === 'register' && <RegisterMember user={user} />}
          {activeRoute === 'templates' && <AdminPanel user={user} />}
          {activeRoute === 'applications' && <UserPanel user={user} onPrint={(app: any) => setPrintApp(app)} />}
          {activeRoute === 'reports' && <ApplicationReports user={user} onPrint={(app: any) => setPrintApp(app)} />}
          {activeRoute === 'insights' && <Analytics user={user} />}
        </div>
      </main>

      {/* HIDDEN PRINT CONTAINER */}
      {printApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#fff', zIndex: 999999 }}>
          <OfficialReport app={printApp} user={user!} />
        </div>
      )}
    </div>
  );
}

export default App;
