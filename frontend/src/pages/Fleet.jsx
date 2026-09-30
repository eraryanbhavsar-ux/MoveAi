import { useState, useEffect } from 'react';
import { Truck, Fuel, AlertTriangle, Search, X, CheckCircle, MapPin } from 'lucide-react';
import { RiskBadge, StatusBadge, LoadingState, DataOriginBadge } from '../components/ui';
import api from '../services/api';

function StatTile({ label, value, sub, color = 'var(--accent)' }) {
  return (
    <div className="card-sm">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{sub}</p>}
    </div>
  );
}

export default function Fleet() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadVehicles(true);
    const iv = setInterval(() => loadVehicles(false), 4000);
    return () => clearInterval(iv);
  }, [statusFilter, riskFilter]);

  async function loadVehicles(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      let url = '/vehicles?';
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      if (riskFilter === 'high') url += `risk=high&`;
      const res = await api.get(url);
      setVehicles(res.data);
    } catch {}
    finally { if (showLoading) setLoading(false); }
  }

  async function openVehicleModal(v) {
    setSelectedVehicle(v);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/vehicles/${v.id}`);
      setVehicleDetails(res.data);
    } catch {}
    finally { setLoadingDetails(false); }
  }

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    return !q || v.vehicle_id.toLowerCase().includes(q) || v.vehicle_type.toLowerCase().includes(q) ||
      (v.driver_name?.toLowerCase().includes(q)) || (v.current_location_name?.toLowerCase().includes(q));
  });

  const activeCount = vehicles.filter(v => v.status === 'active').length;
  const idleCount   = vehicles.filter(v => v.status === 'idle').length;
  const maintCount  = vehicles.filter(v => v.status === 'maintenance').length;
  const avgFuel     = vehicles.length ? Math.round(vehicles.reduce((s, v) => s + parseFloat(v.fuel_level || 0), 0) / vehicles.length) : 0;

  return (
    <div className="animate-fade-in space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Fleet</h1>
          <p className="page-subtitle">Real-time vehicle telemetry, driver assignments, and risk profiles</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Active Vehicles"   value={activeCount}  sub={`of ${vehicles.length} total`} color="var(--accent)" />
        <StatTile label="Utilization"        value={`${vehicles.length ? Math.round((activeCount/vehicles.length)*100) : 0}%`} sub={`${idleCount} idle · ${maintCount} maintenance`} color="#22c55e" />
        <StatTile label="Avg Fuel"           value={`${avgFuel}%`} sub="Fleet average" color="#f59e0b" />
        <StatTile label="High-Risk Assets"   value={vehicles.filter(v => v.risk_score >= 60).length} sub="Risk ≥ 60" color="#ef4444" />
      </div>

      {/* Filters */}
      <div className="card-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input
            type="text"
            placeholder="Search vehicle, driver, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 text-xs h-8"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['all','active','idle','maintenance'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-all"
              style={{
                background: statusFilter === st ? 'var(--accent)' : 'var(--bg-surface-subtle)',
                color: statusFilter === st ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${statusFilter === st ? 'transparent' : 'var(--border-color)'}`,
              }}
            >
              {st}
            </button>
          ))}
          <button
            onClick={() => setRiskFilter(riskFilter === 'high' ? 'all' : 'high')}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: riskFilter === 'high' ? '#ef4444' : 'var(--bg-surface-subtle)',
              color: riskFilter === 'high' ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${riskFilter === 'high' ? 'transparent' : 'var(--border-color)'}`,
            }}
          >
            High Risk
          </button>
        </div>
        <span className="text-xs ml-auto shrink-0" style={{ color: 'var(--text-muted)' }}>{filtered.length} vehicles</span>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingState message="Loading fleet telemetry..." />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>No vehicles match current filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(v => {
            const loadPercent = Math.min(100, Math.round((v.current_load_kg / v.capacity_kg) * 100));
            return (
              <div
                key={v.id}
                onClick={() => openVehicleModal(v)}
                className="card cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
                      <Truck className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{v.vehicle_id}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{v.vehicle_type}</p>
                    </div>
                  </div>
                  <RiskBadge score={v.risk_score} />
                </div>

                {/* Info rows */}
                <div className="space-y-1.5 mb-3 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Driver</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {v.driver_name || 'Unassigned'}
                      {v.driver_rating && <span className="ml-1 text-amber-500">★{v.driver_rating}</span>}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Location</span>
                    <span style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                      {v.current_location_name || '—'}
                    </span>
                  </div>
                  {v.current_trip_id && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>Active Trip</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{v.current_trip_id}</span>
                    </div>
                  )}
                </div>

                {/* Bars */}
                <div className="space-y-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
                      <span>Cargo Load</span>
                      <span>{v.current_load_kg}/{v.capacity_kg} kg</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                      <div style={{ width: `${loadPercent}%`, background: loadPercent > 90 ? '#ef4444' : loadPercent > 70 ? '#f97316' : 'var(--accent)' }} className="h-full rounded-full transition-all" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={v.status} />
                    <span className="text-xs flex items-center gap-1" style={{ color: '#22c55e' }}>
                      <Fuel className="w-3 h-3" /> {v.fuel_level}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card max-w-2xl w-full max-h-[85vh] overflow-y-auto relative" style={{ boxShadow: 'var(--shadow-md)' }}>
            <button
              onClick={() => { setSelectedVehicle(null); setVehicleDetails(null); }}
              className="absolute right-4 top-4 p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
                <Truck className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedVehicle.vehicle_id}</h2>
                  <StatusBadge status={selectedVehicle.status} />
                  <RiskBadge score={selectedVehicle.risk_score} />
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedVehicle.vehicle_type} · {selectedVehicle.current_location_name}</p>
              </div>
            </div>

            {loadingDetails ? (
              <LoadingState message="Loading vehicle details..." />
            ) : vehicleDetails ? (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ['Capacity', `${vehicleDetails.capacity_kg} kg`],
                    ['Current Load', `${vehicleDetails.current_load_kg} kg`],
                    ['Fuel Level', `${vehicleDetails.fuel_level}%`],
                  ].map(([label, val]) => (
                    <div key={label} className="card-inset text-center">
                      <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{val}</p>
                    </div>
                  ))}
                </div>

                <div className="card-inset flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--accent)' }}>Driver</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{vehicleDetails.driver_name || 'Unassigned'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{vehicleDetails.driver_phone || 'No contact'}</p>
                  </div>
                  {vehicleDetails.driver_rating && (
                    <span className="text-sm font-bold text-amber-500">★ {vehicleDetails.driver_rating}</span>
                  )}
                </div>

                {vehicleDetails.deliveries?.length > 0 && (
                  <div>
                    <h4 className="section-title">Deliveries ({vehicleDetails.deliveries.length})</h4>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {vehicleDetails.deliveries.map(d => (
                        <div key={d.id} className="card-inset flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{d.delivery_id} · {d.customer_name}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.description} ({d.weight_kg} kg)</p>
                          </div>
                          <RiskBadge score={d.risk_score} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {vehicleDetails.trips?.length > 0 && (
                  <div>
                    <h4 className="section-title">Recent Trips ({vehicleDetails.trips.length})</h4>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {vehicleDetails.trips.map(t => (
                        <div key={t.id} className="card-inset flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{t.trip_id}: {t.origin_name} → {t.destination_name}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.distance_km} km · {t.status}</p>
                          </div>
                          <RiskBadge score={t.risk_score} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
