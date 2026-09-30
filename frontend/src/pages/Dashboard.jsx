import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Package, Clock, AlertTriangle, Gauge, Activity,
  ArrowRight, TrendingUp, Shield, Zap, ChevronRight
} from 'lucide-react';
import { RiskBadge, PriorityBadge, LoadingState, LiveStreamBadge } from '../components/ui';
import api from '../services/api';

function KpiTile({ title, value, sub, icon: Icon, accent = '#2563eb', onClick }) {
  return (
    <button
      onClick={onClick}
      className="card text-left w-full hover:shadow-md transition-shadow"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: `${accent}14` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        {onClick && <ChevronRight className="w-3.5 h-3.5 mt-0.5" style={{ color: 'var(--text-faint)' }} />}
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{title}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{sub}</p>}
    </button>
  );
}

function HealthRing({ score }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 30;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="30" fill="none" stroke="var(--border-color)" strokeWidth="6" />
        <circle
          cx="36" cy="36" r="30" fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
        {score}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
    const iv = setInterval(() => {
      api.get('/dashboard').then(r => setData(r.data)).catch(() => {});
    }, 6000);
    return () => clearInterval(iv);
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: d } = await api.get('/dashboard');
      setData(d);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading overview..." />;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-sm mb-3" style={{ color: '#ef4444' }}>{error}</p>
      <button className="btn-primary" onClick={loadDashboard}>Retry</button>
    </div>
  );
  if (!data) return null;

  const { kpis, mobilityHealth, estimatedImpact, recentRecommendations, activeIncidents, highRiskTrips } = data;

  return (
    <div className="animate-fade-in max-w-6xl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Operations Overview</h1>
          <p className="page-subtitle">Real-time view of your fleet, deliveries, and risk status</p>
        </div>
        <LiveStreamBadge />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiTile title="Active Vehicles"    value={kpis.activeVehicles}         sub={`${kpis.totalVehicles} total`}        icon={Truck}         accent="#2563eb" onClick={() => navigate('/fleet')} />
        <KpiTile title="Active Deliveries"  value={kpis.activeDeliveries}        sub={`${kpis.totalDeliveries} total`}      icon={Package}       accent="#059669" onClick={() => navigate('/deliveries')} />
        <KpiTile title="On-Time Rate"       value={`${kpis.onTimeRate}%`}        sub="Current"                              icon={Clock}         accent={kpis.onTimeRate >= 85 ? '#059669' : '#d97706'} />
        <KpiTile title="At-Risk Trips"      value={kpis.atRiskTrips}            sub="Score ≥ 60"                           icon={AlertTriangle} accent={kpis.atRiskTrips > 3 ? '#dc2626' : '#d97706'} onClick={() => navigate('/operations')} />
        <KpiTile title="Fleet Utilization"  value={`${kpis.fleetUtilization}%`} sub={`${kpis.idleVehicles} idle`}          icon={Gauge}         accent="#7c3aed" />
        <KpiTile title="Active Incidents"   value={kpis.activeIncidents}        sub="Monitored"                            icon={Activity}      accent={kpis.activeIncidents > 5 ? '#dc2626' : '#f59e0b'} onClick={() => navigate('/incidents')} />
      </div>

      {/* Middle Row: Health + Impact + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Mobility Health */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Fleet Health</h2>
            <Shield className="w-4 h-4" style={{ color: 'var(--text-faint)' }} />
          </div>
          <div className="flex items-center gap-4">
            <HealthRing score={mobilityHealth.overall} />
            <div className="flex-1 space-y-2">
              {Object.entries(mobilityHealth.scores).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span style={{ color: 'var(--text-muted)' }} className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span style={{ color: 'var(--text-secondary)' }} className="font-medium">{val}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${val}%`,
                        background: val >= 70 ? '#22c55e' : val >= 50 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operational Impact */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Today's Impact</h2>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--text-faint)' }} />
          </div>
          <div className="space-y-4">
            <div className="card-inset">
              <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Time Saved</p>
              <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{estimatedImpact.timeSavedMin} <span className="text-sm font-medium">min</span></p>
            </div>
            <div className="flex gap-3">
              <div className="card-inset flex-1">
                <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Distance</p>
                <p className="text-lg font-bold" style={{ color: '#2563eb' }}>{estimatedImpact.distanceSavedKm} <span className="text-xs font-medium">km</span></p>
              </div>
              <div className="card-inset flex-1">
                <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Cost Saved</p>
                <p className="text-lg font-bold" style={{ color: '#7c3aed' }}>₹{estimatedImpact.costSavedInr}</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">AI Actions</h2>
            <button
              onClick={() => navigate('/optimizer')}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: 'var(--accent)' }}
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentRecommendations?.slice(0, 3).map(rec => (
              <div
                key={rec.id}
                className="list-row border rounded-lg"
                style={{ border: '1px solid var(--border-subtle)' }}
                onClick={() => navigate('/optimizer')}
              >
                <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{rec.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <PriorityBadge priority={rec.priority} />
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-faint)' }} />
              </div>
            ))}
            {(!recentRecommendations || recentRecommendations.length === 0) && (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No pending actions</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: High-Risk Trips + Active Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* High-Risk Trips */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">High-Risk Trips</h2>
            <button
              onClick={() => navigate('/operations')}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: 'var(--accent)' }}
            >
              View map <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5">
            {highRiskTrips?.map(trip => (
              <div
                key={trip.id}
                className="list-row"
                onClick={() => navigate('/operations')}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{trip.trip_id}</span>
                    <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {trip.origin_name} → {trip.destination_name}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                    Predicted delay: {trip.predicted_delay_min} min
                  </p>
                </div>
                <RiskBadge score={trip.risk_score} />
              </div>
            ))}
            {(!highRiskTrips || highRiskTrips.length === 0) && (
              <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>No high-risk trips</p>
            )}
          </div>
        </div>

        {/* Active Incidents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Active Incidents</h2>
            <button
              onClick={() => navigate('/incidents')}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: 'var(--accent)' }}
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5">
            {activeIncidents?.map(inc => (
              <div
                key={inc.id}
                className="list-row"
                onClick={() => navigate('/incidents')}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={inc.severity} />
                    <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{inc.title}</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                    {inc.location_name} · +{inc.predicted_delay_min} min delay
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-faint)' }} />
              </div>
            ))}
            {(!activeIncidents || activeIncidents.length === 0) && (
              <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>No active incidents</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
