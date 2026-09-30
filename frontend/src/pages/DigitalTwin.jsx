import { useState } from 'react';
import { Truck, CloudLightning, Construction, PackagePlus, UserX, Gauge, Clock, Zap, CheckCircle, AlertTriangle, TrendingDown, Play } from 'lucide-react';
import { RiskBadge, LoadingState, SimulationTag, ModelEstimatedTag } from '../components/ui';
import api from '../services/api';

const SCENARIOS = [
  { type: 'vehicle_breakdown', icon: Truck, label: 'Vehicle Breakdown', desc: 'Simulate a vehicle becoming unavailable', color: 'red' },
  { type: 'traffic_spike', icon: CloudLightning, label: 'Traffic Spike', desc: 'Simulate sudden traffic increase', color: 'orange' },
  { type: 'road_closure', icon: Construction, label: 'Road Closure', desc: 'Simulate a road becoming blocked', color: 'yellow' },
  { type: 'urgent_delivery', icon: PackagePlus, label: 'Urgent Delivery', desc: 'Add an urgent new delivery', color: 'purple' },
  { type: 'driver_unavailable', icon: UserX, label: 'Driver Unavailable', desc: 'Simulate driver unavailability', color: 'red' },
  { type: 'capacity_reduction', icon: Gauge, label: 'Capacity Reduction', desc: 'Reduce vehicle capacity', color: 'blue' },
  { type: 'deadline_change', icon: Clock, label: 'Deadline Change', desc: 'Move a delivery deadline earlier', color: 'orange' },
];

const PROCESSING_STEPS = [
  'Analyzing fleet state...',
  'Identifying affected trips...',
  'Checking vehicle capacity...',
  'Comparing route alternatives...',
  'Evaluating delivery priorities...',
  'Calculating projected impact...',
  'Generating response plan...',
];

export default function DigitalTwin() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [params, setParams] = useState({ vehicleId: 'V-04', severity: 'high', location: 'Mumbai-Pune Expressway' });
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoResult, setDemoResult] = useState(null);

  const runSimulation = async () => {
    if (!selectedScenario) return;
    setProcessing(true);
    setCurrentStep(0);
    setResult(null);
    setApplied(false);

    // Animate processing steps
    for (let i = 0; i < PROCESSING_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise(r => setTimeout(r, 400));
    }

    try {
      const { data } = await api.post('/simulation/run', {
        scenarioType: selectedScenario,
        params,
      });
      setResult(data);
    } catch (err) {
      console.error(err);
    }
    setProcessing(false);
  };

  const applyOptimization = async () => {
    if (!result?.recommendations?.[0] && !result?.simulation?.recommendations?.[0]) return;
    setApplying(true);
    // The simulation itself doesn't create a recommendation record we can apply directly
    // but we can trigger a new recommendation application
    try {
      // Get pending recommendations and apply the first matching one
      const { data: recs } = await api.get('/recommendations?status=pending');
      if (recs.length > 0) {
        await api.post(`/recommendations/${recs[0].id}/apply`);
      }
      setApplied(true);
    } catch (err) {
      console.error(err);
    }
    setApplying(false);
  };

  const runLiveDemo = async () => {
    setDemoRunning(true);
    setDemoResult(null);
    try {
      const { data } = await api.post('/simulation/live-demo');
      setDemoResult(data);
    } catch (err) {
      console.error(err);
    }
    setDemoRunning(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-mova-50">AI What-If Simulator</h1>
          <p className="text-sm text-mova-400">Test disruptions before they become operational problems.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            🧠 DIGITAL TWIN ENGINE
          </span>
          <button onClick={runLiveDemo} disabled={demoRunning}
            className="btn-primary flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Play className="w-4 h-4" />
            {demoRunning ? 'Running Demo...' : 'RUN LIVE DEMO'}
          </button>
        </div>
      </div>

      {/* Live Demo Result */}
      {demoResult && (
        <div className="mb-6 card border-purple-500/30 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-purple-300">Live Demo Complete</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
            {demoResult.steps?.map(step => (
              <div key={step.step} className="flex items-center gap-2 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <span className="text-mova-300">{step.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-mova-400">Incident: {demoResult.incident} • Recommendation: {demoResult.recommendation}</p>
        </div>
      )}

      {/* Scenario Selection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        {SCENARIOS.map(s => {
          const Icon = s.icon;
          const selected = selectedScenario === s.type;
          return (
            <button key={s.type} onClick={() => { setSelectedScenario(s.type); setResult(null); setApplied(false); }}
              className={`card text-left transition-all ${selected ? 'border-accent ring-1 ring-accent/30' : ''}`}>
              <Icon className={`w-6 h-6 mb-2 ${selected ? 'text-accent' : 'text-mova-400'}`} />
              <p className="text-xs font-semibold text-mova-200">{s.label}</p>
              <p className="text-[10px] text-mova-400 mt-0.5">{s.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Parameters & Run */}
      {selectedScenario && !processing && !result && (
        <div className="card mb-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-mova-200 mb-3">Scenario Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-mova-400 mb-1">Vehicle</label>
              <select value={params.vehicleId} onChange={e => setParams(p => ({ ...p, vehicleId: e.target.value }))}
                className="w-full bg-mova-700 border border-mova-600 rounded-lg px-3 py-2 text-sm text-mova-200 focus:outline-none focus:border-accent">
                {['V-01','V-02','V-03','V-04','V-05','V-06','V-07','V-08','V-09','V-10','V-12','V-14','V-15'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-mova-400 mb-1">Severity</label>
              <select value={params.severity} onChange={e => setParams(p => ({ ...p, severity: e.target.value }))}
                className="w-full bg-mova-700 border border-mova-600 rounded-lg px-3 py-2 text-sm text-mova-200 focus:outline-none focus:border-accent">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-mova-400 mb-1">Location</label>
              <input value={params.location} onChange={e => setParams(p => ({ ...p, location: e.target.value }))}
                className="w-full bg-mova-700 border border-mova-600 rounded-lg px-3 py-2 text-sm text-mova-200 focus:outline-none focus:border-accent" />
            </div>
          </div>
          <button onClick={runSimulation} className="btn-primary flex items-center gap-2">
            <Zap className="w-4 h-4" /> RUN SIMULATION
          </button>
        </div>
      )}

      {/* Processing Animation */}
      {processing && (
        <div className="card mb-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-mova-200 mb-4">ANALYZING MOBILITY STATE</h3>
          <div className="space-y-2">
            {PROCESSING_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                {i < currentStep ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : i === currentStep ? (
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-mova-600" />
                )}
                <span className={i <= currentStep ? 'text-mova-200' : 'text-mova-500'}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="animate-slide-up space-y-4">
          {/* Before / After Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card border-red-500/30">
              <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> BEFORE (Current State)
              </h3>
              <div className="space-y-2 text-sm">
                <Row label="Active Vehicles" value={result.beforeState.activeVehicles} />
                <Row label="In-Transit Deliveries" value={result.beforeState.inTransitDeliveries} />
                <Row label="At-Risk Deliveries" value={result.beforeState.atRiskDeliveries} />
                <Row label="Total Predicted Delay" value={`${result.beforeState.totalDelay} min`} />
                <Row label="Planned Distance" value={`${result.beforeState.totalDistance} km`} />
                <Row label="Late Deliveries" value={result.beforeState.lateDeliveries} />
                <Row label="Average Risk" value={`${result.beforeState.avgRisk}/100`} />
                <Row label="Fleet Utilization" value={`${result.beforeState.utilization}%`} />
              </div>
            </div>

            <div className="card border-green-500/30">
              <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> AFTER AI OPTIMIZATION
              </h3>
              <div className="space-y-2 text-sm">
                <Row label="Active Vehicles" value={result.afterState.activeVehicles}
                  diff={result.afterState.activeVehicles - result.beforeState.activeVehicles} />
                <Row label="In-Transit Deliveries" value={result.afterState.inTransitDeliveries}
                  diff={result.afterState.inTransitDeliveries - result.beforeState.inTransitDeliveries} />
                <Row label="At-Risk Deliveries" value={result.afterState.atRiskDeliveries}
                  diff={result.afterState.atRiskDeliveries - result.beforeState.atRiskDeliveries} />
                <Row label="Total Predicted Delay" value={`${result.afterState.totalDelay} min`}
                  diff={result.afterState.totalDelay - result.beforeState.totalDelay} unit="min" />
                <Row label="Planned Distance" value={`${result.afterState.totalDistance} km`}
                  diff={result.afterState.totalDistance - result.beforeState.totalDistance} unit="km" />
                <Row label="Late Deliveries" value={result.afterState.lateDeliveries}
                  diff={result.afterState.lateDeliveries - result.beforeState.lateDeliveries} />
                <Row label="Average Risk" value={`${result.afterState.avgRisk}/100`}
                  diff={result.afterState.avgRisk - result.beforeState.avgRisk} />
                <Row label="Fleet Utilization" value={`${result.afterState.utilization}%`}
                  diff={result.afterState.utilization - result.beforeState.utilization} invert />
              </div>
            </div>
          </div>

          {/* Impact Summary */}
          <div className="card border-accent/30">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-semibold text-accent">MODEL-ESTIMATED IMPACT</h3>
              <ModelEstimatedTag />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {result.impact.delaySaved > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{result.impact.delaySaved} min</p>
                  <p className="text-xs text-mova-400">Estimated delay avoided</p>
                </div>
              )}
              {result.impact.distanceSaved > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{result.impact.distanceSaved} km</p>
                  <p className="text-xs text-mova-400">Estimated distance saved</p>
                </div>
              )}
              {result.impact.lateDeliveriesPrevented > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{result.impact.lateDeliveriesPrevented}</p>
                  <p className="text-xs text-mova-400">Late deliveries prevented</p>
                </div>
              )}
              {result.impact.costSaved > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">₹{result.impact.costSaved}</p>
                  <p className="text-xs text-mova-400">Estimated cost avoided</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Reasoning */}
          {result.aiReasoning && (
            <div className="card">
              <h3 className="text-sm font-semibold text-mova-200 mb-2">AI REASONING</h3>
              <p className="text-sm text-mova-300 leading-relaxed">{result.aiReasoning}</p>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-mova-200 mb-3">AI RESPONSE PLAN</h3>
              <div className="space-y-2 mb-4">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="p-3 bg-mova-700/50 rounded-lg">
                    <p className="text-xs font-semibold text-mova-200">{rec.title}</p>
                    <p className="text-[10px] text-mova-400 mt-0.5">{rec.description}</p>
                    {rec.steps?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {rec.steps.map((step, j) => (
                          <div key={j} className="flex items-center gap-2 text-[10px] text-mova-300">
                            <span className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">{j+1}</span>
                            {step}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={applyOptimization} disabled={applying || applied}
                  className={`btn-primary flex items-center gap-2 ${applied ? 'bg-green-600 hover:bg-green-600' : ''}`}>
                  {applied ? <><CheckCircle className="w-4 h-4" /> Applied</> :
                   applying ? 'Applying...' : <><Zap className="w-4 h-4" /> APPLY OPTIMIZATION</>}
                </button>
                <button onClick={() => { setResult(null); setSelectedScenario(null); }} className="btn-outline">
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, diff, unit = '', invert = false }) {
  const showDiff = diff !== undefined && diff !== 0;
  const positive = invert ? diff > 0 : diff < 0;
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-mova-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-mova-100">{value}</span>
        {showDiff && (
          <span className={`text-xs ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {diff > 0 ? '+' : ''}{diff}{unit}
          </span>
        )}
      </div>
    </div>
  );
}
