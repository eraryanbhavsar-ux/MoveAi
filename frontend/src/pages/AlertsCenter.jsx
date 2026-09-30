import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  Check,
  Plus,
  RefreshCw,
  XCircle,
  ShieldAlert,
  Send
} from 'lucide-react';
import { LoadingState } from '../components/ui';

export default function AlertsCenter() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('active'); // 'all' | 'active' | 'acknowledged' | 'resolved'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // New alert form state
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newSeverity, setNewSeverity] = useState('warning');
  const [newType, setNewType] = useState('ROAD_HAZARD');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [filterStatus]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('mova_token');
      const url = filterStatus === 'all' ? '/api/alerts' : `/api/alerts?status=${filterStatus}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      setActionLoading(id);
      const token = localStorage.getItem('mova_token');
      const res = await fetch(`/api/alerts/${id}/acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (id) => {
    try {
      setActionLoading(id);
      const token = localStorage.getItem('mova_token');
      const res = await fetch(`/api/alerts/${id}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('mova_token');
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          message: newMessage,
          severity: newSeverity,
          alert_type: newType,
          entity_type: 'manual_broadcast',
        })
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewTitle('');
        setNewMessage('');
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const severityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
            WARNING
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-mova-800/80 border border-border backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">Operational Alerts & Incidents</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
              {alerts.filter(a => a.status === 'active').length} Active
            </span>
          </div>
          <p className="text-xs text-mova-300">
            Deterministic risk escalations, SLA breaches, vehicle faults, and operational alerts stored in PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-accent/20"
          >
            <Plus className="w-4 h-4" /> Broadcast Alert
          </button>
          <button
            onClick={fetchAlerts}
            className="p-2 rounded-xl bg-mova-700/60 hover:bg-mova-700 border border-border text-mova-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 text-xs">
        {['active', 'acknowledged', 'resolved', 'all'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
              filterStatus === st
                ? 'bg-accent/15 text-accent border border-accent/30 shadow'
                : 'text-mova-400 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <LoadingState message="Loading operational alerts..." />
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-mova-800/40 border border-border space-y-2">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-sm font-bold text-white">No {filterStatus !== 'all' ? filterStatus : ''} alerts found</p>
          <p className="text-xs text-mova-400">All fleet operations and SLA timelines are running within normal parameters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border transition-all ${
                alert.status === 'resolved'
                  ? 'bg-mova-800/30 border-border opacity-70'
                  : alert.severity === 'critical'
                  ? 'bg-red-500/5 border-red-500/30'
                  : 'bg-mova-800/70 border-border'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    {severityBadge(alert.severity)}
                    <span className="font-mono text-[11px] text-mova-400 uppercase font-semibold">
                      {alert.alert_type?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-mova-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{alert.title}</h3>
                  <p className="text-xs text-mova-300 leading-relaxed">{alert.message}</p>

                  {alert.entity_type && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-mova-400">
                      <span>Affected Resource:</span>
                      <span className="font-mono text-accent uppercase font-bold">
                        {alert.entity_type} {alert.entity_id ? `#${alert.entity_id}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Operator Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={actionLoading === alert.id}
                      className="px-3 py-1.5 rounded-lg bg-mova-700 hover:bg-mova-600 text-mova-200 border border-border text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      Acknowledge
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      disabled={actionLoading === alert.id}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark Resolved
                    </button>
                  )}
                  {alert.status === 'resolved' && (
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Resolved
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Broadcast Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg rounded-2xl bg-mova-800 border border-border p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-accent" />
                Broadcast Operational Alert
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-mova-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-mova-300">Alert Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flash Flooding Alert on Kasara Ghat"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 bg-mova-900 border border-border rounded-xl px-3 py-2 text-xs text-white focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-mova-300">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full mt-1 bg-mova-900 border border-border rounded-xl px-3 py-2 text-xs text-white focus:border-accent focus:outline-none"
                  >
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Informational</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-mova-300">Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full mt-1 bg-mova-900 border border-border rounded-xl px-3 py-2 text-xs text-white focus:border-accent focus:outline-none"
                  >
                    <option value="ROAD_HAZARD">Road Hazard / Obstruction</option>
                    <option value="WEATHER_WARNING">Severe Weather IMD Alert</option>
                    <option value="VEHICLE_BREAKDOWN">Vehicle Fleet Breakdown</option>
                    <option value="SLA_DEADLINE_BREACH">Delivery SLA Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-mova-300">Message & Context</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe location, estimated delay, and affected vehicle corridors..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full mt-1 bg-mova-900 border border-border rounded-xl p-3 text-xs text-white focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-mova-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50"
                >
                  {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Broadcast Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
