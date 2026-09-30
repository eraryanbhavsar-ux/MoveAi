import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Map,
  Brain,
  FlaskConical,
  Truck,
  Package,
  AlertTriangle,
  BarChart3,
  Database,
  Bell,
  LogOut,
  Activity,
  Shield
} from 'lucide-react';

const NAV_PRIMARY = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/operations', icon: Map, label: 'Live Operations' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/optimizer', icon: Brain, label: 'AI Recommendations' },
  { to: '/digital-twin', icon: FlaskConical, label: 'Simulator' },
];

const NAV_SECONDARY = [
  { to: '/fleet', icon: Truck, label: 'Fleet' },
  { to: '/deliveries', icon: Package, label: 'Deliveries' },
  { to: '/incidents', icon: Shield, label: 'Incidents' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/ingestion', icon: Database, label: 'Data & Telematics' },
];

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'nav-active'
            : 'nav-inactive'
        }`
      }
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-56 flex flex-col z-40"
      style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Logo */}
      <div className="h-12 flex items-center px-4 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>MOVA</span>
            <p className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>Mobility Platform</p>
          </div>
        </div>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 px-2 pt-3 overflow-y-auto space-y-0.5">
        {NAV_PRIMARY.map(item => <NavItem key={item.to} {...item} />)}

        <div className="my-3 mx-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Management
        </p>

        {NAV_SECONDARY.map(item => <NavItem key={item.to} {...item} />)}
      </nav>

      {/* User Profile */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2.5 px-2 mb-1.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            {user?.name?.[0] || 'M'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.name || 'Operator'}
            </p>
            <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
              {user?.role || 'ADMIN'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs w-full transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
