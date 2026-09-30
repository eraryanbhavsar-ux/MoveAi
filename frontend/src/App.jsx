import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ui';
import Sidebar from './components/Sidebar';
import AIChat from './components/AIChat';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveOperations from './pages/LiveOperations';
import DigitalTwin from './pages/DigitalTwin';
import AIOptimizer from './pages/AIOptimizer';
import DataIngestion from './pages/DataIngestion';
import AlertsCenter from './pages/AlertsCenter';
import Fleet from './pages/Fleet';
import Deliveries from './pages/Deliveries';
import Incidents from './pages/Incidents';
import Analytics from './pages/Analytics';
import { Bell } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent) transparent var(--accent) var(--accent)' }} />
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

const PAGE_TITLES = {
  '/': 'Overview',
  '/operations': 'Live Operations',
  '/optimizer': 'AI Recommendations',
  '/digital-twin': 'Simulator',
  '/ingestion': 'Data & Telematics',
  '/alerts': 'Alerts',
  '/fleet': 'Fleet',
  '/deliveries': 'Deliveries',
  '/incidents': 'Incidents',
  '/analytics': 'Analytics',
};

function MainLayout({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const title = PAGE_TITLES[location.pathname] || 'MOVA';

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      <Sidebar />

      <div className="flex-1 ml-56 flex flex-col min-w-0">
        {/* Slim Top Bar */}
        <header
          className="h-12 px-6 flex items-center justify-between sticky top-0 z-30"
          style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>MOVA</span>
            <span style={{ color: 'var(--border-color)' }}>/</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Live badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>

            {/* Alerts link */}
            <Link
              to="/alerts"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <Bell className="w-3 h-3" />
              Alerts
            </Link>

            {/* User avatar */}
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'var(--accent)' }}>
              {user?.name?.[0] || 'M'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 pb-20 min-h-0">
          {children}
        </main>
      </div>

      <AIChat />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
            <Route path="/operations" element={<ProtectedRoute><MainLayout><LiveOperations /></MainLayout></ProtectedRoute>} />
            <Route path="/optimizer" element={<ProtectedRoute><MainLayout><AIOptimizer /></MainLayout></ProtectedRoute>} />
            <Route path="/digital-twin" element={<ProtectedRoute><MainLayout><DigitalTwin /></MainLayout></ProtectedRoute>} />
            <Route path="/ingestion" element={<ProtectedRoute><MainLayout><DataIngestion /></MainLayout></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><MainLayout><AlertsCenter /></MainLayout></ProtectedRoute>} />
            <Route path="/fleet" element={<ProtectedRoute><MainLayout><Fleet /></MainLayout></ProtectedRoute>} />
            <Route path="/deliveries" element={<ProtectedRoute><MainLayout><Deliveries /></MainLayout></ProtectedRoute>} />
            <Route path="/incidents" element={<ProtectedRoute><MainLayout><Incidents /></MainLayout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><MainLayout><Analytics /></MainLayout></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
