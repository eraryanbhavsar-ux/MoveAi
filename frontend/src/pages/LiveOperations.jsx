import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { RiskBadge, LoadingState, LiveStreamBadge, DataOriginBadge } from '../components/ui';
import { MapPin } from 'lucide-react';
import api from '../services/api';

function createVehicleIcon(riskScore, heading = 0) {
  const color = riskScore >= 80 ? '#ef4444' : riskScore >= 60 ? '#f97316' : riskScore >= 30 ? '#eab308' : '#22c55e';
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px ${color}80;">
      <svg style="transform:rotate(${heading || 0}deg);" width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function createIncidentIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;border-radius:50%;background:#ef4444;border:2px solid #fff;display:flex;align-items:center;justify-content:center;">
      <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function createPointIcon(label, color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:white;">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function LiveOperations() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedRouteGeometry, setSelectedRouteGeometry] = useState(null);
  const [tripDetail, setTripDetail] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [optimization, setOptimization] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastTickAt, setLastTickAt] = useState(null);

  useEffect(() => {
    loadInitialData();
    loadCorridors();

    const telematicsInterval = setInterval(async () => {
      try {
        const [liveRes, tripsRes] = await Promise.all([
          api.get('/telematics/live'),
          api.get('/trips?status=in_progress'),
        ]);
        const liveVehicles = Array.isArray(liveRes.data) ? liveRes.data : (liveRes.data?.vehicles || []);
        if (liveVehicles.length > 0) {
          setVehicles(prev => {
            const liveMap = new Map(liveVehicles.map(v => [v.id, v]));
            return prev.map(v => {
              const live = liveMap.get(v.id);
              if (live) return { ...v, lat: live.lat, lng: live.lng, speed: live.speed_kmh || live.speed || 60, heading: live.heading_deg || live.heading || 0, fuel_level: live.fuel_level, current_location_name: live.current_location_name || v.current_location_name, data_origin: 'REAL' };
              return v;
            });
          });
          setLastTickAt(new Date());
        }
        if (tripsRes.data) setTrips(tripsRes.data);
      } catch {}
    }, 3500);

    const corridorInterval = setInterval(loadCorridors, 20000);
    return () => { clearInterval(telematicsInterval); clearInterval(corridorInterval); };
  }, []);

  const loadInitialData = async () => {
    try {
      const [t, v, i] = await Promise.all([
        api.get('/trips?status=in_progress'),
        api.get('/vehicles'),
        api.get('/incidents?status=active'),
      ]);
      setTrips(t.data);
      setVehicles(v.data);
      setIncidents(i.data);
      setLastTickAt(new Date());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const loadCorridors = async () => {
    try {
      const res = await api.get('/telematics/corridors');
      setCorridors(Array.isArray(res.data) ? res.data : (res.data?.corridors || []));
    } catch {}
  };

  const selectTrip = async (trip) => {
    setSelectedTrip(trip);
    setRiskAnalysis(null);
    setOptimization(null);
    setSelectedRouteGeometry(null);
    try {
      const { data } = await api.get(`/trips/${trip.trip_id || trip.id}`);
      setTripDetail(data);
    } catch {}
    if (trip.origin_lat && trip.destination_lat) {
      try {
        const routeRes = await api.post('/routing/calculate', {
          origin: { lat: parseFloat(trip.origin_lat), lng: parseFloat(trip.origin_lng) },
          destination: { lat: parseFloat(trip.destination_lat), lng: parseFloat(trip.destination_lng) },
          departureTime: new Date().toISOString()
        });
        if (Array.isArray(routeRes.data?.coordinates)) setSelectedRouteGeometry(routeRes.data.coordinates);
        else if (Array.isArray(routeRes.data?.geometry)) setSelectedRouteGeometry(routeRes.data.geometry);
        else if (routeRes.data?.geometry?.coordinates) setSelectedRouteGeometry(routeRes.data.geometry.coordinates.map(c => [c[1], c[0]]));
      } catch {}
    }
  };

  const analyzeRisk = async () => {
    if (!selectedTrip) return;
    setAnalyzing(true);
    try {
      const { data } = await api.post(`/ai/analyze-trip/${selectedTrip.trip_id || selectedTrip.id}`);
      setRiskAnalysis(data);
    } catch {}
    setAnalyzing(false);
  };

  const findBetterPlan = async () => {
    if (!selectedTrip) return;
    setOptimizing(true);
    try {
      const { data } = await api.post('/ai/optimize', { tripId: selectedTrip.trip_id || selectedTrip.id });
      setOptimization(data);
    } catch {}
    setOptimizing(false);
  };

  if (loading) return <LoadingState message="Connecting to live telematics..." />;

  const activeVehicles = vehicles.filter(v => v.lat && v.lng && v.status === 'active');
  const sortedTrips = [...trips].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Live Operations</h1>
          <p className="page-subtitle">Real-time GPS, traffic corridors, and risk monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveStreamBadge label="GPS · 3.5s" />
          {lastTickAt && (
            <span className="text-[11px] font-mono hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
              {lastTickAt.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Corridors Strip */}
      {corridors.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {corridors.map((c, i) => {
            const status = (c.traffic?.roadStatus || c.telematics?.status || 'Flowing').toUpperCase();
            const isFlowing = status.includes('FLOW');
            const isCongested = status.includes('CONGEST');
            const speed = c.traffic?.speedKmh || c.telematics?.speedKmh || '--';
            const temp = c.weather?.tempC !== undefined ? `${c.weather.tempC}°C` : '--';
            return (
              <div key={i} className="card-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isFlowing ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                    isCongested ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                    'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}>
                    {status}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{speed} km/h</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{temp}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Map + Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 280px)', minHeight: '520px' }}>
        {/* Map */}
        <div className="lg:col-span-2 card p-0 overflow-hidden" style={{ height: '100%' }}>
          <MapContainer center={[19.3, 73.8]} zoom={8} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />

            {activeVehicles.map(v => (
              <Marker key={v.id} position={[parseFloat(v.lat), parseFloat(v.lng)]} icon={createVehicleIcon(v.risk_score, v.heading)}>
                <Popup>
                  <div style={{ minWidth: '170px' }} className="text-xs space-y-1.5 p-1">
                    <div className="flex items-center justify-between pb-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <span className="font-bold">{v.vehicle_id}</span>
                      <span style={{ color: '#22c55e' }} className="font-mono font-bold text-[10px]">{v.speed || 60} km/h</span>
                    </div>
                    <p>{v.vehicle_type} · {v.driver_name || 'Unassigned'}</p>
                    <p style={{ color: 'var(--text-muted)' }}>Fuel: {v.fuel_level}% · Risk: {v.risk_score}</p>
                    <DataOriginBadge origin={v.data_origin || 'REAL'} />
                  </div>
                </Popup>
              </Marker>
            ))}

            {incidents.map(inc => inc.lat && (
              <Marker key={inc.id} position={[parseFloat(inc.lat), parseFloat(inc.lng)]} icon={createIncidentIcon()}>
                <Popup>
                  <div className="text-xs p-1">
                    <p className="font-bold">{inc.title}</p>
                    <p style={{ color: '#ef4444' }}>{inc.severity} — {inc.type}</p>
                    <p style={{ color: 'var(--text-muted)' }}>+{inc.predicted_delay_min} min delay</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {selectedTrip && selectedRouteGeometry?.length > 0 ? (
              <>
                <Polyline positions={selectedRouteGeometry} color="#38bdf8" weight={5} opacity={0.9} />
                <Marker position={[parseFloat(selectedTrip.origin_lat), parseFloat(selectedTrip.origin_lng)]} icon={createPointIcon('A', '#10b981')}>
                  <Popup>Origin: {selectedTrip.origin_name}</Popup>
                </Marker>
                <Marker position={[parseFloat(selectedTrip.destination_lat), parseFloat(selectedTrip.destination_lng)]} icon={createPointIcon('B', '#f43f5e')}>
                  <Popup>Destination: {selectedTrip.destination_name}</Popup>
                </Marker>
              </>
            ) : selectedTrip?.origin_lat && (
              <>
                <Polyline
                  positions={[[parseFloat(selectedTrip.origin_lat), parseFloat(selectedTrip.origin_lng)], [parseFloat(selectedTrip.destination_lat), parseFloat(selectedTrip.destination_lng)]]}
                  color="#38bdf8" weight={3} dashArray="6 6"
                />
                <Marker position={[parseFloat(selectedTrip.origin_lat), parseFloat(selectedTrip.origin_lng)]} icon={createPointIcon('A', '#10b981')} />
                <Marker position={[parseFloat(selectedTrip.destination_lat), parseFloat(selectedTrip.destination_lng)]} icon={createPointIcon('B', '#f43f5e')} />
              </>
            )}
          </MapContainer>
        </div>

        {/* Side Panel */}
        <div className="card overflow-y-auto" style={{ maxHeight: '100%' }}>
          {!selectedTrip ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="section-title mb-0">Priority Feed</h3>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{trips.length} in-flight</span>
              </div>
              <div className="space-y-1.5">
                {sortedTrips.map(trip => {
                  const level = trip.risk_score >= 80 ? 'CRITICAL' : trip.risk_score >= 60 ? 'HIGH' : trip.risk_score >= 30 ? 'MEDIUM' : 'LOW';
                  const lc = trip.risk_score >= 80 ? '#ef4444' : trip.risk_score >= 60 ? '#f97316' : trip.risk_score >= 30 ? '#eab308' : '#22c55e';
                  return (
                    <div
                      key={trip.id}
                      onClick={() => selectTrip(trip)}
                      className="list-row border-l-2 rounded-lg cursor-pointer"
                      style={{ borderLeftColor: lc, background: 'var(--bg-surface-subtle)', border: `1px solid var(--border-subtle)`, borderLeft: `3px solid ${lc}` }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold" style={{ color: lc }}>{level}</span>
                          <RiskBadge score={trip.risk_score} />
                        </div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{trip.vehicle_code || trip.trip_id}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{trip.origin_name} → {trip.destination_name}</p>
                        <div className="flex justify-between mt-1 text-[10px]">
                          <span style={{ color: 'var(--text-faint)' }}>Progress: {trip.progress_percent}%</span>
                          {trip.predicted_delay_min > 0 && <span style={{ color: '#f97316' }} className="font-semibold">+{trip.predicted_delay_min}m</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => { setSelectedTrip(null); setTripDetail(null); setRiskAnalysis(null); setOptimization(null); setSelectedRouteGeometry(null); }}
                className="text-xs font-medium mb-3 block"
                style={{ color: 'var(--accent)' }}
              >
                ← Back to feed
              </button>

              <div className="flex items-center justify-between mb-3">
                <h3 className="section-title mb-0">Trip {selectedTrip.trip_id}</h3>
                <DataOriginBadge origin="REAL" />
              </div>

              <div className="space-y-2 text-xs mb-4">
                {[
                  ['Vehicle', selectedTrip.vehicle_code],
                  ['Driver', selectedTrip.driver_name],
                  ['Route', `${selectedTrip.origin_name} → ${selectedTrip.destination_name}`],
                  ['Distance', `${selectedTrip.distance_km} km`],
                  ['Progress', `${selectedTrip.progress_percent}%`],
                  ['Predicted Delay', `${selectedTrip.predicted_delay_min} min`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{val}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-muted)' }}>Risk Score</span>
                  <RiskBadge score={selectedTrip.risk_score} />
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${selectedTrip.progress_percent}%`, background: 'var(--accent)' }} />
                </div>
              </div>

              {!riskAnalysis ? (
                <button onClick={analyzeRisk} disabled={analyzing} className="btn-primary w-full mb-3">
                  {analyzing ? 'Analyzing...' : 'Why is this trip at risk?'}
                </button>
              ) : (
                <div className="mb-3 p-3 rounded-lg animate-slide-up" style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-color)' }}>
                  <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>RISK BREAKDOWN</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{riskAnalysis.risk.overall}</span>
                    <span style={{ color: 'var(--text-muted)' }}>/100</span>
                    <RiskBadge score={riskAnalysis.risk.overall} />
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {Object.entries(riskAnalysis.risk.breakdown).sort(([,a],[,b]) => b-a).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className="w-28 capitalize" style={{ color: 'var(--text-muted)' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                          <div style={{ width: `${val * 5}%`, background: val > 15 ? '#ef4444' : val > 8 ? '#f97316' : '#22c55e' }} className="h-full rounded-full" />
                        </div>
                        <span className="w-6 text-right" style={{ color: 'var(--text-secondary)' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{riskAnalysis.explanation}</p>
                </div>
              )}

              {!optimization ? (
                <button onClick={findBetterPlan} disabled={optimizing} className="btn-outline w-full">
                  {optimizing ? 'Calculating...' : 'Find Better Plan'}
                </button>
              ) : (
                <div className="animate-slide-up space-y-3">
                  <h4 className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>ROUTE COMPARISON</h4>
                  {optimization.currentRoute && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <p className="text-[10px] font-bold mb-1" style={{ color: '#ef4444' }}>CURRENT</p>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{optimization.currentRoute.name}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>ETA: {optimization.currentRoute.duration}min · ₹{optimization.currentRoute.cost}</p>
                      </div>
                      {optimization.alternativeRoutes?.[0] && (
                        <div className="p-2.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                          <p className="text-[10px] font-bold mb-1" style={{ color: '#22c55e' }}>BETTER</p>
                          <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{optimization.alternativeRoutes[0].name}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>ETA: {optimization.alternativeRoutes[0].duration}min · ₹{optimization.alternativeRoutes[0].cost}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {optimization.recommendation && (
                    <div className="p-2.5 rounded-lg" style={{ border: '1px solid var(--accent-border)', background: 'var(--accent-subtle)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>{optimization.recommendation.title}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{optimization.recommendation.reasoning}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
