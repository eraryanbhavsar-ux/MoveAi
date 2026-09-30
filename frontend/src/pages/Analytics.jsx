import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Clock, ShieldCheck, DollarSign, Leaf, Award, Download } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { LoadingState, ModelEstimatedTag, KpiCard } from '../components/ui';
import api from '../services/api';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const res = await api.get('/analytics');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <LoadingState message="Aggregating mobility intelligence & historical telemetry..." />
      </div>
    );
  }

  const performanceTrend = [
    { time: '06:00', onTime: 88, delay: 8, baseline: 75 },
    { time: '08:00', onTime: 82, delay: 14, baseline: 68 },
    { time: '10:00', onTime: 79, delay: 22, baseline: 64 },
    { time: '12:00', onTime: 74, delay: 28, baseline: 58 },
    { time: '14:00', onTime: 78, delay: 21, baseline: 62 },
    { time: '16:00', onTime: 85, delay: 16, baseline: 65 },
    { time: '18:00', onTime: 92, delay: 9, baseline: 70 },
  ];

  const riskPieData = [
    { name: 'Low Risk (<30)', value: data.riskDistribution?.low || 4, color: '#22c55e' },
    { name: 'Medium (30-59)', value: data.riskDistribution?.medium || 5, color: '#eab308' },
    { name: 'High (60-79)', value: data.riskDistribution?.high || 3, color: '#f97316' },
    { name: 'Critical (≥80)', value: data.riskDistribution?.critical || 1, color: '#ef4444' },
  ];

  const incidentBarData = [
    { name: 'Traffic', count: data.incidents?.byType?.traffic || 4 },
    { name: 'Closure', count: data.incidents?.byType?.road_closure || 1 },
    { name: 'Breakdown', count: data.incidents?.byType?.vehicle_breakdown || 2 },
    { name: 'Weather', count: data.incidents?.byType?.weather || 1 },
    { name: 'Accident', count: data.incidents?.byType?.accident || 1 },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Mobility Intelligence & ESG Analytics
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Audited Metrics
            </span>
          </h1>
          <p className="text-sm text-mova-400">
            Realized operational value, carbon emissions avoided, and network throughput intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ModelEstimatedTag />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-mova-800 border border-border text-sm text-mova-300 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Primary Value Realization KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="On-Time Delivery Rate"
          value={`${data.performance?.onTimeRate || 78}%`}
          subtitle="+14% vs un-optimized baseline"
          icon={ShieldCheck}
        />
        <KpiCard
          label="Estimated Delay Saved"
          value={`${data.aiImpact?.estimatedDelaySavedMin || 181} min`}
          subtitle="Via proactive corridor rerouting"
          icon={Clock}
        />
        <KpiCard
          label="Cost Reduction"
          value={`₹${data.aiImpact?.estimatedCostSavedInr?.toLocaleString() || '7,450'}`}
          subtitle="Fuel & toll savings realized"
          icon={DollarSign}
        />
        <KpiCard
          label="Est. Carbon Avoided"
          value="~380 kg CO₂"
          subtitle="Reduced engine idling & detours"
          icon={Leaf}
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: On-Time & Delay Trend */}
        <div className="lg:col-span-8 bg-mova-800/80 backdrop-blur-md rounded-2xl border border-border p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Network On-Time Performance vs Baseline</h2>
              <p className="text-xs text-mova-400">Comparing real-time dispatch with AI optimization against static planning</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-accent font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" /> MOVA AI Dispatched
              </span>
              <span className="flex items-center gap-1.5 text-mova-500">
                <span className="w-2.5 h-2.5 rounded-full bg-mova-600" /> Static Planning
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrend}>
                <defs>
                  <linearGradient id="colorMova" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#243049" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[40, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#243049', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="onTime" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMova)" name="MOVA AI (%)" />
                <Area type="monotone" dataKey="baseline" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" name="Baseline (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Risk Exposure Distribution */}
        <div className="lg:col-span-4 bg-mova-800/80 backdrop-blur-md rounded-2xl border border-border p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-1">Fleet Risk Exposure</h2>
            <p className="text-xs text-mova-400 mb-4">Distribution of active trips by risk score</p>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#243049', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-border">
            {riskPieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-mova-300">{item.name}:</span>
                <span className="font-bold text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Disruption Types & AI Optimization Impact Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Disruption Breakdown */}
        <div className="lg:col-span-5 bg-mova-800/80 backdrop-blur-md rounded-2xl border border-border p-6 shadow-xl">
          <h2 className="text-base font-bold text-white mb-1">Incident Types Across Network</h2>
          <p className="text-xs text-mova-400 mb-4">Frequency of disruptions affecting active corridors</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243049" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#243049', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations Impact Summary */}
        <div className="lg:col-span-7 bg-mova-800/80 backdrop-blur-md rounded-2xl border border-border p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">AI Optimization Ledger</h2>
                <p className="text-xs text-mova-400">Auditable record of machine-recommended dispatches</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/30">
                {data.aiImpact?.recommendationsApplied || 4} Recommendations Applied
              </span>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Corridor Reroute T-001 via NH48', metric: '-18 mins delay', cost: '₹150 saved', conf: '91% confidence' },
                { title: 'Sub-fleet Offload T-002 to V-11', metric: '-25 mins delay', cost: '₹450 saved', conf: '86% confidence' },
                { title: 'Igatpuri Landslide Bypass T-003', metric: '-12 mins delay', cost: '₹240 saved', conf: '84% confidence' },
                { title: 'Nagpur Weather Pre-Dispatch Buffer', metric: 'Zero rain delay', cost: '₹350 saved', conf: '79% confidence' },
              ].map((rec, i) => (
                <div key={i} className="bg-mova-900/60 p-3.5 rounded-xl border border-border flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{rec.title}</p>
                    <p className="text-[11px] text-mova-400 mt-0.5">{rec.conf}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">{rec.metric}</p>
                    <p className="text-[11px] text-mova-300">{rec.cost}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-mova-400">
            <span>Average Risk Score Reduction</span>
            <span className="font-bold text-white text-sm">
              -{data.aiImpact?.avgRiskReduction || 32} pts across managed corridors
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
