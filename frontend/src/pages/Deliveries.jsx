import { useState, useEffect } from 'react';
import { Package, Search, AlertTriangle, CheckCircle, Clock, MapPin, ArrowRight, X, Sparkles } from 'lucide-react';
import { RiskBadge, PriorityBadge, StatusBadge, LoadingState, DataOriginBadge } from '../components/ui';
import api from '../services/api';

function FilterPill({ value, active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-all"
      style={{
        background: active ? 'var(--accent)' : 'var(--bg-surface-subtle)',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'transparent' : 'var(--border-color)'}`,
      }}
    >
      {children}
    </button>
  );
}

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => { loadDeliveries(); }, [statusFilter, priorityFilter]);

  async function loadDeliveries() {
    setLoading(true);
    try {
      let url = '/deliveries?';
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      if (priorityFilter !== 'all') url += `priority=${priorityFilter}&`;
      const res = await api.get(url);
      setDeliveries(res.data);
    } catch {}
    finally { setLoading(false); }
  }

  async function openDeliveryDetails(d) {
    setSelectedDelivery(d);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/deliveries/${d.id}`);
      setDeliveryDetails(res.data);
    } catch {}
    finally { setLoadingDetails(false); }
  }

  const filtered = deliveries.filter(d => {
    const q = search.toLowerCase();
    return !q ||
      d.delivery_id.toLowerCase().includes(q) ||
      (d.customer_name?.toLowerCase().includes(q)) ||
      (d.description?.toLowerCase().includes(q)) ||
      (d.pickup_location?.toLowerCase().includes(q)) ||
      (d.dropoff_location?.toLowerCase().includes(q));
  });

  const inTransitCount = deliveries.filter(d => d.status === 'in_transit').length;
  const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;
  const pendingCount   = deliveries.filter(d => d.status === 'pending').length;
  const criticalCount  = deliveries.filter(d => d.priority === 'critical').length;

  return (
    <div className="animate-fade-in space-y-5 max-w-7xl">
      <div>
        <h1 className="page-title">Deliveries</h1>
        <p className="page-subtitle">Package manifests, SLAs, chain of custody, and delay mitigation</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Manifest', value: deliveries.length, icon: Package, color: 'var(--accent)' },
          { label: 'In Transit',     value: inTransitCount,    icon: Clock,    color: '#2563eb' },
          { label: 'Critical',       value: criticalCount,     icon: AlertTriangle, color: '#ef4444' },
          { label: 'Fulfilled',      value: deliveredCount,    icon: CheckCircle,   color: '#22c55e' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-sm">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input
            type="text"
            placeholder="Search delivery, customer, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 text-xs h-8"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all','in_transit','pending','delivered'].map(st => (
            <FilterPill key={st} active={statusFilter === st} onClick={() => setStatusFilter(st)}>
              {st.replace('_',' ')}
            </FilterPill>
          ))}
          <div className="w-px mx-1" style={{ background: 'var(--border-color)' }} />
          {['all','critical','high','normal'].map(pr => (
            <FilterPill key={pr} active={priorityFilter === pr} onClick={() => setPriorityFilter(pr)}>
              {pr}
            </FilterPill>
          ))}
        </div>
        <span className="text-xs ml-auto shrink-0" style={{ color: 'var(--text-muted)' }}>{filtered.length} records</span>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading delivery manifest..." />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>No deliveries match current filters.</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Priority</th>
                <th>Customer & Cargo</th>
                <th>Route</th>
                <th>Vehicle</th>
                <th>SLA Deadline</th>
                <th>Risk</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} onClick={() => openDeliveryDetails(d)} style={{ cursor: 'pointer' }}>
                  <td className="font-bold" style={{ color: 'var(--text-primary)' }}>{d.delivery_id}</td>
                  <td><PriorityBadge priority={d.priority} /></td>
                  <td>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{d.customer_name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{d.description} ({d.weight_kg} kg)</p>
                  </td>
                  <td>
                    <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      {d.pickup_location} <ArrowRight className="w-3 h-3 shrink-0" style={{ color: 'var(--text-faint)' }} /> {d.dropoff_location}
                    </span>
                  </td>
                  <td>
                    {d.vehicle_code
                      ? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{d.vehicle_code}</span>
                      : <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>Unassigned</span>}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {d.deadline ? new Date(d.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td><RiskBadge score={d.risk_score} /></td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="card max-w-lg w-full relative" style={{ boxShadow: 'var(--shadow-md)' }}>
            <button onClick={() => { setSelectedDelivery(null); setDeliveryDetails(null); }} className="absolute right-4 top-4" style={{ color: 'var(--text-muted)' }}>
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
                <Package className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{selectedDelivery.delivery_id}</h2>
                  <PriorityBadge priority={selectedDelivery.priority} />
                  <RiskBadge score={selectedDelivery.risk_score} />
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedDelivery.customer_name}</p>
              </div>
            </div>

            {loadingDetails ? (
              <LoadingState message="Loading shipment details..." />
            ) : deliveryDetails ? (
              <div className="space-y-4 text-xs">
                <div className="card-inset space-y-2">
                  {[
                    ['Cargo', deliveryDetails.description],
                    ['Weight', `${deliveryDetails.weight_kg} kg`],
                    ['Vehicle', deliveryDetails.vehicle_code || 'Pending dispatch'],
                    ['Trip Code', deliveryDetails.trip_code || 'N/A'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{val}</span>
                    </div>
                  ))}
                </div>

                <div className="card-inset">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                    <div>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Pickup</p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{deliveryDetails.pickup_location}</p>
                    </div>
                  </div>
                  <div className="ml-1.5 pl-5 border-l border-dashed" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                      <div>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Dropoff</p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{deliveryDetails.dropoff_location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {deliveryDetails.recommendations?.length > 0 && (
                  <div className="card-inset" style={{ border: '1px solid var(--accent-border)', background: 'var(--accent-subtle)' }}>
                    <div className="flex items-center gap-1.5 mb-2" style={{ color: 'var(--accent)' }}>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">AI Recommendation</span>
                    </div>
                    {deliveryDetails.recommendations.map(r => (
                      <div key={r.id}>
                        <p className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{r.reasoning}</p>
                      </div>
                    ))}
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
