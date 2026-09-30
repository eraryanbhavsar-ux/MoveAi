import { useState, useEffect } from 'react';
import { Brain, ArrowRight, Zap, CheckCircle2, ShieldAlert, Clock, Fuel, Sparkles, Sliders, AlertCircle, RefreshCw } from 'lucide-react';
import { RiskBadge, PriorityBadge, LoadingState, ModelEstimatedTag } from '../components/ui';
import api from '../services/api';

export default function AIOptimizer() {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [applied, setApplied] = useState(false);
  const [activeObjective, setActiveObjective] = useState('balanced'); // speed, cost, risk, balanced
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [tripsRes, recsRes] = await Promise.all([
        api.get('/trips?status=in_progress'),
        api.get('/recommendations?status=pending'),
      ]);
      setTrips(tripsRes.data);
      setRecs(recsRes.data);
      if (tripsRes.data.length > 0) {
        const firstHighRisk = tripsRes.data.find(t => t.risk_score >= 60) || tripsRes.data[0];
        setSelectedTripId(firstHighRisk.trip_id);
        fetchOptimization(firstHighRisk.trip_id);
      }
    } catch (err) {
      console.error('Error loading optimizer data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOptimization(tripId) {
    setOptimizing(true);
    setApplied(false);
    try {
      const res = await api.post('/ai/optimize', { tripId });
      setOptimizationData(res.data);
    } catch (err) {
      console.error('Error optimizing trip:', err);
    } finally {
      setOptimizing(false);
    }
  }

  async function handleApplyOptimization() {
    setApplied(true);
    try {
      const matchingRec = recs.find(r => r.affected_trip_ids?.includes(selectedTripId)) || recs[0];
      if (matchingRec) {
        await api.post(`/recommendations/${matchingRec.id}/approve`);
      }
      loadData();
    } catch (err) {
      console.error('Error applying optimization:', err);
    }
  }

  async function handleRejectOptimization() {
    try {
      const matchingRec = recs.find(r => r.affected_trip_ids?.includes(selectedTripId)) || recs[0];
      if (matchingRec) {
        await api.post(`/recommendations/${matchingRec.id}/reject`, { reason: 'Operator rejected recommended alternative corridor.' });
      }
      setOptimizationData(null);
      loadData();
    } catch (err) {
      console.error('Error rejecting optimization:', err);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <LoadingState message="Loading AI Mobility Optimizer..." />
      </div>
    );
  }

  const selectedTrip = trips.find(t => t.trip_id === selectedTripId);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                AI Route & Dispatch Optimizer
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                  Real-time Neural Engine
                </span>
              </h1>
              <p className="text-sm text-mova-400">
                Multi-objective route optimization with live disruption avoidance and corridor rebalancing
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ModelEstimatedTag />
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-mova-800 border border-border text-sm text-mova-300 hover:text-white hover:bg-mova-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Trip Selector & Strategy */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Trips Card */}
          <div className="bg-mova-800/80 backdrop-blur-md rounded-2xl border border-border p-5 shadow-xl">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
              <span>Select Active Trip to Optimize</span>
              <span className="text-xs text-mova-400 font-normal">{trips.length} in transit</span>
            </h2>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {trips.map(trip => {
                const isSelected = trip.trip_id === selectedTripId;
                return (
                  <button
                    key={trip.trip_id}
                    onClick={() => {
                      setSelectedTripId(trip.trip_id);
                      fetchOptimization(trip.trip_id);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-accent/10 border-accent text-white shadow-md'
                        : 'bg-mova-900/40 border-border/60 text-mova-300 hover:bg-mova-700/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs tracking-wider text-mova-200">{trip.trip_id}</span>
                      <RiskBadge score={trip.risk_score} />
                    </div>
                    <div className="flex items-center text-xs font-medium text-white mb-2">
                      <span className="truncate">{trip.origin_name}</span>
                      <ArrowRight className="w-3.5 h-3.5 mx-1.5 text-mova-400 shrink-0" />
                      <span className="truncate">{trip.destination_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-mova-400">
                      <span>Vehicle: {trip.vehicle_code || 'V-' + trip.vehicle_id}</span>
                      <span>Progress: {trip.progress_percent}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-Objective Strategy Controls */}
          <div className="bg-mova-800/80 backdrop-blur-md rounded-2xl border border-border p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sliders className="w-4 h-4 text-accent" />
              <span>Optimization Objective</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'speed', label: 'Fastest ETA', desc: 'Prioritize lowest delay' },
                { id: 'cost', label: 'Minimum Cost', desc: 'Prioritize fuel & tolls' },
                { id: 'risk', label: 'Lowest Risk', desc: 'Avoid incidents & hazards' },
                { id: 'balanced', label: 'AI Balanced', desc: 'Pareto-optimal tradeoff' },
              ].map(strat => (
                <button
                  key={strat.id}
                  onClick={() => setActiveObjective(strat.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeObjective === strat.id
                      ? 'bg-accent/15 border-accent text-white'
                      : 'bg-mova-900/40 border-border/60 text-mova-400 hover:bg-mova-700/40 hover:text-mova-200'
                  }`}
                >
                  <p className="text-xs font-semibold">{strat.label}</p>
                  <p className="text-[10px] text-mova-400 mt-0.5">{strat.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Optimization Output & Alternatives */}
        <div className="lg:col-span-8 space-y-6">
          {optimizing ? (
            <div className="bg-mova-800/80 backdrop-blur-md rounded-2xl border border-border p-12 text-center shadow-xl">
              <LoadingState message={`Analyzing alternative routes and telemetry for ${selectedTripId}...`} />
            </div>
          ) : optimizationData ? (
            <>
              {/* Trip Context Card */}
              <div className="bg-mova-800/80 backdrop-blur-md rounded-2xl border border-border p-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <span className="text-xs font-bold text-accent tracking-wider uppercase">Trip Analysis</span>
                    <h2 className="text-xl font-bold text-white mt-1">
                      {optimizationData.trip?.origin} → {optimizationData.trip?.destination}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-mova-400">Current Risk</p>
                      <RiskBadge score={optimizationData.trip?.currentRisk || 0} size="md" />
                    </div>
                    {optimizationData.trip?.predictedDelay > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-mova-400">Predicted Delay</p>
                        <span className="text-sm font-bold text-orange-400">+{optimizationData.trip?.predictedDelay}m</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Route Alternatives Comparison */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-xs font-bold text-mova-300 uppercase tracking-wider">Route Comparison</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Active Route */}
                    {optimizationData.currentRoute && (
                      <div className="bg-mova-900/60 rounded-xl border border-border p-4 relative overflow-hidden">
                        <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                          CURRENT ROUTE
                        </div>
                        <h4 className="text-sm font-semibold text-white mb-3 pr-24">
                          {optimizationData.currentRoute.name}
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-mova-400">Distance</span>
                            <p className="text-sm font-bold text-white">{optimizationData.currentRoute.distance} km</p>
                          </div>
                          <div>
                            <span className="text-mova-400">Est. Duration</span>
                            <p className="text-sm font-bold text-white">{optimizationData.currentRoute.duration} min</p>
                          </div>
                          <div>
                            <span className="text-mova-400">Traffic Level</span>
                            <p className="text-sm font-semibold text-orange-400 capitalize">{optimizationData.currentRoute.traffic}</p>
                          </div>
                          <div>
                            <span className="text-mova-400">Est. Cost</span>
                            <p className="text-sm font-bold text-white">₹{optimizationData.currentRoute.cost}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recommended Alternative */}
                    {optimizationData.alternativeRoutes?.[0] && (
                      <div className="bg-emerald-950/20 rounded-xl border border-emerald-500/40 p-4 relative overflow-hidden">
                        <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> RECOMMENDED
                        </div>
                        <h4 className="text-sm font-semibold text-white mb-3 pr-28">
                          {optimizationData.alternativeRoutes[0].name}
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-mova-400">Distance</span>
                            <p className="text-sm font-bold text-white">{optimizationData.alternativeRoutes[0].distance} km</p>
                          </div>
                          <div>
                            <span className="text-mova-400">Est. Duration</span>
                            <p className="text-sm font-bold text-emerald-400">
                              {optimizationData.alternativeRoutes[0].duration} min
                              {optimizationData.currentRoute && (
                                <span className="text-[10px] ml-1 text-emerald-300">
                                  ({optimizationData.alternativeRoutes[0].duration - optimizationData.currentRoute.duration}m)
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-mova-400">Traffic Level</span>
                            <p className="text-sm font-semibold text-emerald-400 capitalize">{optimizationData.alternativeRoutes[0].traffic}</p>
                          </div>
                          <div>
                            <span className="text-mova-400">Est. Cost</span>
                            <p className="text-sm font-bold text-white">₹{optimizationData.alternativeRoutes[0].cost}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Reasoning & Decision Card */}
                {optimizationData.recommendation && (
                  <div className="mt-6 bg-accent/10 border border-accent/20 rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-accent">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">AI Optimization Rationale</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {optimizationData.recommendation.title}
                    </h4>
                    <p className="text-xs text-mova-300 leading-relaxed">
                      {optimizationData.recommendation.reasoning}
                    </p>

                    {optimizationData.recommendation.steps && optimizationData.recommendation.steps.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-white mb-2">Execution Protocol:</p>
                        <ul className="space-y-1">
                          {optimizationData.recommendation.steps.map((st, i) => (
                            <li key={i} className="text-xs text-mova-400 flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span>{st}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action button */}
                    <div className="pt-4 flex items-center justify-between border-t border-accent/20">
                      <div className="flex items-center gap-4 text-xs text-mova-300">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          Save ~18 mins
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Fuel className="w-3.5 h-3.5 text-blue-400" />
                          Risk Reduction -37 pts
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleRejectOptimization}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold text-mova-400 hover:text-red-400 hover:bg-red-500/10 border border-border/80 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={handleApplyOptimization}
                          disabled={applied}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                            applied
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:scale-[1.02]'
                          }`}
                        >
                          {applied ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" /> Plan Approved & Dispatched!
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" /> Approve & Apply Plan
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-mova-800/80 backdrop-blur-md rounded-2xl border border-border p-12 text-center text-mova-400">
              Select a trip to generate real-time AI optimization recommendations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
