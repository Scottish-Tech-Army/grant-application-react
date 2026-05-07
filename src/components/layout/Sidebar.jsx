import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Zap, LayoutDashboard, Database, FileText, Clock, LogOut, User } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

const NAV_ITEMS = [
  { label: 'Dashboard',     to: '/dashboard',     icon: LayoutDashboard },
  { label: 'Common Fields', to: '/common-fields',  icon: Database        },
  { label: 'Applications',  to: '/applications',   icon: FileText        },
  { label: 'History',       to: '/history',        icon: Clock           },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isActive = (to) => pathname === to || pathname.startsWith(to + '/');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 h-screen flex flex-col bg-slate-900 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-900/30 flex-shrink-0">
          <Zap size={18} className="text-white" fill="currentColor" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-base leading-tight tracking-tight">
            FundSight
          </p>
          <p className="text-slate-400 text-xs leading-tight mt-0.5">
            Smart Grant Manager
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={clsx('sidebar-link', { active: isActive(to) })}
          >
            <Icon size={17} className="flex-shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="px-3 py-3 border-t border-white/10">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-primary-600/30 flex items-center justify-center flex-shrink-0">
              <User size={13} className="text-primary-300" />
            </div>
            <span className="text-sm text-slate-300 font-medium truncate">{user.username}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 text-sm font-medium cursor-pointer"
        >
          <LogOut size={17} className="flex-shrink-0" />
          <span>Sign out</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
        <span className="text-slate-600 text-xs font-medium">v1.1.0</span>
        <span className="text-slate-600 text-xs">FundSight</span>
      </div>
    </aside>
  );
}
