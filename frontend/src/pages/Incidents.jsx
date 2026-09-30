import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Clock, MapPin, Search, Filter, Plus, Zap, CheckCircle2, CloudRain, Car, Wrench, ShieldCheck } from 'lucide-react';
import { PriorityBadge, LoadingState, KpiCard } from '../components/ui';
import api from '../services/api';

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mitigatingId, setMitigatingId] = useState(null);
  const [mitigatedIds, setMitigatedIds] = useState(new Set());
  const [showInjectModal, setShowInjectModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: 'Severe Waterlogging on Western Express Highway',
    type: 'weather',
    severity: 'critical',
    location_name: 'Bandra, Mumbai',
    predicted_delay_min: 45,
    description: 'Flash flooding causing 3-lane closure. Vehicles moving at under 5 km/h.',
  });

  useEffect(() => {
    loadIncidents();
  }, []);

  async function loadIncidents() {
    setLoading(true);
    try {
      const res = await api.get('/incidents');
      setIncidents(res.data);
    } catch (err) {
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMitigate(inc) {
    setMitigatingId(inc.id);
    setTimeout(() => {
      setMitigatingId(null);
      setMitigatedIds(prev => new Set([...prev, inc.id]));
    }, 1200);
  }

  function handleInjectIncident(e) {
    e.preventDefault();
    const created = {
      id: Date.now(),
      incident_id: `INC-${Math.floor(100 + Math.random() * 900)}`,
      ...newIncident,
      status: 'active',
      affected_vehicle_ids: ['V-01', 'V-04'],
      affected_trip_ids: ['T-001', 'T-002'],
      created_at: new Date().toISOString(),
    };
    setIncidents([created, ...incidents]);
    setShowInjectModal(false);
  }

  const filteredIncidents = incidents.filter(i => {
    const q = search.toLowerCase();
    const matchesSearch =
      i.title.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.location_name?.toLowerCase().includes(q) ||
      i.incident_id.toLowerCase().includes(q);
    const matchesType = typeFilter === 'all' || i.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity;
  });

  const criticalCount = incidents.filter(i => i.severity === 'critical').length;
  const totalDelayMin = incidents.reduce((s, i) => s + (i.predicted_delay_min || 0), 0);

  const typeIcons = {
    traffic: Car,
    road_closure: ShieldAlert,
    vehicle_breakdown: Wrench,
    accident: AlertTriangle,
    weather: CloudRain,
    delivery_delay: Clock,
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Disruptions & Incident Command
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              Live Telemetry Monitoring
            </span>
          </h1>
          <p className="text-sm text-mova-400">
            Real-time geospatial hazard detection, corridor bottleneck telemetry, and automated mitigation
          </p>
        </div>
        <button
          onClick={() => setShowInjectModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-bold transition-all shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4" /> Inject Disruption Simulation
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Active Incidents"
          value={incidents.length}
          subtitle="Monitored across corridors"
          icon={AlertTriangle}
        />
        <KpiCard
          label="Critical Severity"
          value={criticalCount}
          subtitle="Immediate dispatch intervention"
          icon={ShieldAlert}
        />
        <KpiCard
          label="Cumulative Delay"
          value={`+${totalDelayMin}m`}
          subtitle="Potential delay if unmitigated"
          icon={Clock}
        />
        <KpiCard
          label="Corridors Clear"
          value="72%"
          subtitle="Real-time traffic flow index"
          icon={ShieldCheck}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-mova-800/80 backdrop-blur-md p-4 rounded-2xl border border-border">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-mova-400" />
          <input
            type="text"
            placeholder="Search incident, location, road..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-mova-900 border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-mova-400 focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-mova-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Type:
          </span>
          {['all', 'traffic', 'road_closure', 'vehicle_breakdown', 'weather'].map(tp => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                typeFilter === tp
                  ? 'bg-accent text-white'
                  : 'bg-mova-900/60 text-mova-300 hover:bg-mova-700 hover:text-white border border-border/40'
              }`}
            >
              {tp.replace('_', ' ')}
            </button>
          ))}

          <span className="text-xs text-mova-400 ml-2 mr-1">Severity:</span>
          {['all', 'critical', 'high', 'medium'].map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                severityFilter === sev
                  ? 'bg-red-500 text-white'
                  : 'bg-mova-900/60 text-mova-300 hover:bg-mova-700 hover:text-white border border-border/40'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Grid */}
      {loading ? (
        <LoadingState message="Scanning live route disruption feeds..." />
      ) : filteredIncidents.length === 0 ? (
        <div className="bg-mova-800/80 rounded-2xl border border-border p-12 text-center text-mova-400">
          No active incidents matching the selected criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredIncidents.map(inc => {
            const Icon = typeIcons[inc.type] || AlertTriangle;
            const isMitigated = mitigatedIds.has(inc.id);
            const isMitigating = mitigatingId === inc.id;

            return (
              <div
                key={inc.id}
                className="bg-mova-800/80 backdrop-blur-md rounded-2xl border border-border p-6 shadow-xl hover:border-accent/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-mova-400 tracking-wider">{inc.incident_id}</span>
                          <PriorityBadge priority={inc.severity} />
                        </div>
                        <h3 className="text-base font-bold text-white mt-0.5">{inc.title}</h3>
                      </div>
                    </div>
                    {inc.predicted_delay_min > 0 && (
                      <span className="text-xs font-bold text-orange-400 px-2 py-1 rounded bg-orange-500/10 border border-orange-500/20 shrink-0">
                        +{inc.predicted_delay_min}m Delay
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-mova-300 leading-relaxed mb-4">{inc.description}</p>

                  {/* Location & Impacted entities */}
                  <div className="space-y-2 mb-4 text-xs">
                    <div className="flex items-center gap-1.5 text-mova-300">
                      <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="text-mova-400">Location:</span>
                      <span className="text-white font-medium">{inc.location_name}</span>
                    </div>

                    {inc.affected_vehicle_ids && inc.affected_vehicle_ids.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-mova-400">Impacted Vehicles:</span>
                        {inc.affected_vehicle_ids.map(v => (
                          <span key={v} className="px-2 py-0.5 rounded bg-mova-900 border border-border text-white text-[11px] font-semibold">
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mitigation Action */}
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-mova-400">
                    Detected: {new Date(inc.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => handleMitigate(inc)}
                    disabled={isMitigated || isMitigating}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isMitigated
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isMitigating
                        ? 'bg-accent/40 text-white cursor-wait'
                        : 'bg-mova-700 hover:bg-accent text-white border border-border hover:border-accent'
                    }`}
                  >
                    {isMitigated ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mitigation Dispatched
                      </>
                    ) : isMitigating ? (
                      'Optimizing Fleet...'
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-accent" /> Auto-Mitigate Disruption
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disruption Injection Modal */}
      {showInjectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-mova-800 border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Inject Disruption Simulation</h2>
            <p className="text-xs text-mova-400 mb-6">
              Simulate an unplanned traffic, weather, or mechanical roadblock to test the AI risk engine's dynamic response.
            </p>

            <form onSubmit={handleInjectIncident} className="space-y-4 text-xs">
              <div>
                <label className="block text-mova-300 font-semibold mb-1">Incident Headline</label>
                <input
                  type="text"
                  value={newIncident.title}
                  onChange={e => setNewIncident({ ...newIncident, title: e.target.value })}
                  className="w-full bg-mova-900 border border-border rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-mova-300 font-semibold mb-1">Disruption Type</label>
                  <select
                    value={newIncident.type}
                    onChange={e => setNewIncident({ ...newIncident, type: e.target.value })}
                    className="w-full bg-mova-900 border border-border rounded-xl p-2.5 text-white"
                  >
                    <option value="traffic">Traffic Jam / Congestion</option>
                    <option value="road_closure">Road Closure / Blockade</option>
                    <option value="vehicle_breakdown">Vehicle Breakdown</option>
                    <option value="weather">Weather Alert (Flood/Fog)</option>
                    <option value="accident">Accident</option>
                  </select>
                </div>
                <div>
                  <label className="block text-mova-300 font-semibold mb-1">Severity Level</label>
                  <select
                    value={newIncident.severity}
                    onChange={e => setNewIncident({ ...newIncident, severity: e.target.value })}
                    className="w-full bg-mova-900 border border-border rounded-xl p-2.5 text-white"
                  >
                    <option value="critical">Critical (Immediate Stop)</option>
                    <option value="high">High (&gt;30m delay)</option>
                    <option value="medium">Medium (15-30m delay)</option>
                    <option value="low">Low (&lt;15m delay)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-mova-300 font-semibold mb-1">Location / Corridor</label>
                  <input
                    type="text"
                    value={newIncident.location_name}
                    onChange={e => setNewIncident({ ...newIncident, location_name: e.target.value })}
                    className="w-full bg-mova-900 border border-border rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-mova-300 font-semibold mb-1">Predicted Delay (mins)</label>
                  <input
                    type="number"
                    value={newIncident.predicted_delay_min}
                    onChange={e => setNewIncident({ ...newIncident, predicted_delay_min: Number(e.target.value) })}
                    className="w-full bg-mova-900 border border-border rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-mova-300 font-semibold mb-1">Telemetry Description</label>
                <textarea
                  value={newIncident.description}
                  onChange={e => setNewIncident({ ...newIncident, description: e.target.value })}
                  rows={3}
                  className="w-full bg-mova-900 border border-border rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowInjectModal(false)}
                  className="px-4 py-2 rounded-xl text-mova-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold hover:bg-accent/90"
                >
                  Inject Incident Telemetry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
