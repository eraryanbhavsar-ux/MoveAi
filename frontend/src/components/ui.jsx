import { isValidElement } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Database } from 'lucide-react';

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
        isDark
          ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
      } ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-500" />
          <span>Dark</span>
        </>
      )}
    </button>
  );
}

export function SeedDataBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${className}`}
      title="This dataset is development/seed test data"
    >
      <Database className="w-3 h-3 text-emerald-500" />
      <span>Seed Data / Development Mode</span>
    </span>
  );
}

export function RiskBadge({ score, size = 'sm' }) {
  const numScore = Number(score) || 0;
  const level = numScore >= 80 ? 'critical' : numScore >= 60 ? 'high' : numScore >= 30 ? 'medium' : 'low';

  const styles = {
    critical: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25',
    high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/25',
    medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
    low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  };

  const dotColors = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3.5 py-1.5',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${styles[level]} ${sizes[size]}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${numScore >= 60 ? 'animate-pulse' : ''}`}
        style={{ background: dotColors[level] }}
      />
      {numScore}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const p = (priority || 'normal').toLowerCase();
  const styles = {
    critical: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25',
    high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/25',
    medium: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25',
    normal: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25',
    low: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/25',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${styles[p] || styles.normal}`}>
      {p}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = (status || 'pending').toLowerCase();
  const styles = {
    active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    in_transit: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25',
    in_progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25',
    completed: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/25',
    delivered: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
    available: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    idle: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/25',
    maintenance: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/25',
    at_risk: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25',
    applied: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    dismissed: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/25',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${styles[s] || styles.idle}`}>
      {s.replace(/_/g, ' ')}
    </span>
  );
}

export function KpiCard({ title, label, value, subtitle, icon, color = 'blue' }) {
  const displayTitle = title || label;

  const colorStyles = {
    blue: 'border-l-blue-500 text-blue-600 dark:text-blue-400',
    green: 'border-l-emerald-500 text-emerald-600 dark:text-emerald-400',
    yellow: 'border-l-amber-500 text-amber-600 dark:text-amber-400',
    orange: 'border-l-orange-500 text-orange-600 dark:text-orange-400',
    red: 'border-l-red-500 text-red-600 dark:text-red-400',
    purple: 'border-l-purple-500 text-purple-600 dark:text-purple-400',
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      const IconComponent = icon;
      return <IconComponent className="w-5 h-5" />;
    }
    return icon;
  };

  return (
    <div className={`card border-l-4 ${colorStyles[color] || 'border-l-blue-500'} bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{displayTitle}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {renderIcon()}
          </div>
        )}
      </div>
    </div>
  );
}

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
      <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function EmptyState({ title = 'No data', message = 'Nothing to display' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
      <p className="text-base font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}

export function LiveStreamBadge({ label = 'LIVE TELEMATICS ACTIVE' }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      {label}
    </span>
  );
}

export function DataOriginBadge({ origin }) {
  const norm = (origin || 'SEED').toUpperCase();
  const isSeed = norm.includes('SEED') || norm.includes('SYNTHETIC');

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${
        isSeed
          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25'
          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {isSeed ? 'DEV SEED DATA' : 'REAL TELEMATICS'}
    </span>
  );
}

export function ModelEstimatedTag({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/25 ${className}`}
      title="Estimated by MOVA AI Physics & Traffic Model"
    >
      <span>AI Estimated</span>
    </span>
  );
}

export function SimulationTag({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/25 ${className}`}
      title="Digital Twin What-If Sandbox (Non-Destructive)"
    >
      <span>Digital Twin Simulation</span>
    </span>
  );
}

