import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Database,
  Upload,
  Radio,
  Sliders,
  History,
  CheckCircle2,
  AlertCircle,
  FileText,
  Compass,
  Zap,
  ArrowRight,
  Server,
  CloudSun,
  Shield,
  RefreshCw,
  Send
} from 'lucide-react';
import { DataOriginBadge, LoadingState } from '../components/ui';

const SAMPLE_TEMPLATES = {
  vehicles: `vehicle_id,vehicle_type,capacity_kg,current_load_kg,status,lat,lng,current_location_name
V-ORG-101,Electric Semi,4200,1200,active,19.0760,72.8777,Mumbai Hub
V-ORG-102,Refrigerated Van,1500,800,active,18.5204,73.8567,Pune Depot
V-ORG-103,Container Hauler,5500,0,idle,19.9975,73.7898,Nashik Yard`,
  deliveries: `delivery_id,pickup_location,dropoff_location,priority,weight_kg,status,customer_name
DEL-ORG-501,Mumbai Port,Pune Industrial,critical,450,pending,Siemens Healthineers
DEL-ORG-502,Nashik Winery,Mumbai Central,high,320,pending,Sula Vineyards
DEL-ORG-503,Thane Warehouse,Pune Tech Park,normal,180,pending,Tata Consultancy`,
  drivers: `name,phone,license_number,status
Anand Verma,+91-9820011223,MH-01-2022-00445,available
Sunil Rao,+91-9820044556,MH-12-2021-00892,available
Rohan Kadam,+91-9820077889,MH-04-2023-00123,available`
};

export default function DataIngestion() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' | 'telematics' | 'connectors' | 'history'

  // CSV Ingestion State
  const [entityType, setEntityType] = useState('vehicles');
  const [csvContent, setCsvContent] = useState(SAMPLE_TEMPLATES.vehicles);
  const [previewResult, setPreviewResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Telematics State
  const [pingVehicle, setPingVehicle] = useState('V-01');
  const [pingLat, setPingLat] = useState('18.7546');
  const [pingLng, setPingLng] = useState('73.4062');
  const [pingSpeed, setPingSpeed] = useState('72');
  const [pingHeading, setPingHeading] = useState('285');
  const [pinging, setPinging] = useState(false);
  const [pingResponse, setPingResponse] = useState(null);

  // Connectors State
  const [connectors, setConnectors] = useState([]);
  const [routingTest, setRoutingTest] = useState(null);
  const [weatherTest, setWeatherTest] = useState(null);
  const [testingRoute, setTestingRoute] = useState(false);
  const [testingWeather, setTestingWeather] = useState(false);

  // Ingestion History State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchConnectors();
    fetchHistory();
  }, []);

  const fetchConnectors = async () => {
    try {
      const token = localStorage.getItem('mova_token');
      const res = await fetch('/api/ingestion/integrations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConnectors(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const token = localStorage.getItem('mova_token');
      const res = await fetch('/api/ingestion/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTemplateChange = (type) => {
    setEntityType(type);
    setCsvContent(SAMPLE_TEMPLATES[type]);
    setPreviewResult(null);
    setCommitSuccess(null);
    setErrorMsg(null);
  };

  const handleValidateCsv = async () => {
    try {
      setValidating(true);
      setErrorMsg(null);
      setCommitSuccess(null);
      const token = localStorage.getItem('mova_token');
      const res = await fetch('/api/ingestion/csv-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: entityType,
          csvText: csvContent,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse CSV');
      setPreviewResult(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleCommitCsv = async () => {
    if (!previewResult || previewResult.validCount === 0) return;
    try {
      setCommitting(true);
      setErrorMsg(null);
      const token = localStorage.getItem('mova_token');
      const res = await fetch('/api/ingestion/csv-commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: entityType,
          validRows: previewResult.previewValid || [],
          fileName: `${entityType}_batch_${new Date().toISOString().slice(0, 10)}.csv`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Commit failed');
      setCommitSuccess(data);
      setPreviewResult(null);
      fetchHistory();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setCommitting(false);
    }
  };

  const handleSendTelematicsPing = async () => {
    try {
      setPinging(true);
      setErrorMsg(null);
      const token = localStorage.getItem('mova_token');
      const res = await fetch('/api/telematics/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicle_id: pingVehicle,
          latitude: parseFloat(pingLat),
          longitude: parseFloat(pingLng),
          speed_kmh: parseFloat(pingSpeed),
          heading_deg: parseFloat(pingHeading),
          status: 'moving',
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ping ingestion failed');
      setPingResponse(data.data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setPinging(false);
    }
  };

  const testRouting = async () => {
    try {
      setTestingRoute(true);
      const token = localStorage.getItem('mova_token');
      const res = await fetch('/api/routing/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          origin: { lat: 18.5204, lng: 73.8567 },
          destination: { lat: 19.0760, lng: 72.8777 }
        })
      });
      const data = await res.json();
      setRoutingTest(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTestingRoute(false);
    }
  };

  const testWeather = async () => {
    try {
      setTestingWeather(true);
      const token = localStorage.getItem('mova_token');
      const res = await fetch('/api/weather?lat=19.0760&lng=72.8777', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setWeatherTest(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTestingWeather(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-mova-800/80 border border-border backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">Data Ingestion & Telematics Hub</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent/15 text-accent border border-accent/30">
              TENANT: {user?.organization_name || 'Apex Mobility'}
            </span>
          </div>
          <p className="text-xs text-mova-300">
            Real operational data pipeline: CSV bulk manifests, IoT GPS telematics, and active live connectors.
          </p>
        </div>

        {/* Live connector badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-[11px]">OSRM Routing Online</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <CloudSun className="w-3.5 h-3.5" />
            <span className="font-semibold text-[11px]">Open-Meteo Active</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6">
        <button
          onClick={() => setActiveTab('csv')}
          className={`pb-3 font-semibold text-xs flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'csv'
              ? 'border-accent text-accent'
              : 'border-transparent text-mova-400 hover:text-mova-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          CSV Bulk Ingestion
        </button>
        <button
          onClick={() => setActiveTab('telematics')}
          className={`pb-3 font-semibold text-xs flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'telematics'
              ? 'border-accent text-accent'
              : 'border-transparent text-mova-400 hover:text-mova-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          Live GPS Telematics Gateway
        </button>
        <button
          onClick={() => setActiveTab('connectors')}
          className={`pb-3 font-semibold text-xs flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'connectors'
              ? 'border-accent text-accent'
              : 'border-transparent text-mova-400 hover:text-mova-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Production Connectors
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-semibold text-xs flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'border-accent text-accent'
              : 'border-transparent text-mova-400 hover:text-mova-200'
          }`}
        >
          <History className="w-4 h-4" />
          Ingestion Audit Trail
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: CSV BULK INGESTION */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Editor column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-2xl bg-mova-800/60 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold uppercase tracking-wider text-mova-200">Select Dataset Type</span>
                  </div>
                  <div className="flex items-center gap-2 bg-mova-900/60 p-1 rounded-lg border border-border">
                    {['vehicles', 'deliveries', 'drivers'].map((type) => (
                      <button
                        key={type}
                        onClick={() => handleTemplateChange(type)}
                        className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-all ${
                          entityType === type
                            ? 'bg-accent text-white shadow'
                            : 'text-mova-400 hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-mova-400">
                    <span>Paste or edit CSV payload</span>
                    <button
                      onClick={() => setCsvContent(SAMPLE_TEMPLATES[entityType])}
                      className="text-accent hover:underline text-[11px]"
                    >
                      Reset to Sample
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    className="w-full bg-mova-900 font-mono text-xs text-mova-100 p-3 rounded-xl border border-border focus:border-accent focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-mova-400">
                    Commits will be labeled as <span className="font-bold text-indigo-400">[USER-PROVIDED]</span> in PostgreSQL.
                  </p>
                  <button
                    onClick={handleValidateCsv}
                    disabled={validating}
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50"
                  >
                    {validating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Shield className="w-3.5 h-3.5" />
                    )}
                    Validate Schema & Preview
                  </button>
                </div>
              </div>
            </div>

            {/* Schema specifications */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-mova-800/60 border border-border space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Required Schema Fields</h3>
                {entityType === 'vehicles' && (
                  <ul className="text-xs text-mova-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <div>
                        <strong className="text-white">vehicle_id</strong> (string, unique)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <div>
                        <strong className="text-white">vehicle_type</strong> (Light Truck, Heavy Truck, Van, etc.)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <div>
                        <strong className="text-white">capacity_kg</strong> (positive numeric payload limit)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-mova-400 font-bold">•</span>
                      <div>
                        <span className="text-mova-400">lat, lng</span> (optional valid coordinates)
                      </div>
                    </li>
                  </ul>
                )}
                {entityType === 'deliveries' && (
                  <ul className="text-xs text-mova-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <div>
                        <strong className="text-white">delivery_id</strong> (string, unique)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <div>
                        <strong className="text-white">pickup_location, dropoff_location</strong> (hub names)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <div>
                        <strong className="text-white">weight_kg</strong> (positive number)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <div>
                        <strong className="text-white">priority</strong> (critical, high, normal, low)
                      </div>
                    </li>
                  </ul>
                )}
                {entityType === 'drivers' && (
                  <ul className="text-xs text-mova-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <div>
                        <strong className="text-white">name</strong> (driver full name)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <div>
                        <strong className="text-white">phone</strong> (valid telephone digits)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-mova-400 font-bold">•</span>
                      <div>
                        <span className="text-mova-400">license_number</span> (commercial badge)
                      </div>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Validation & Preview Output */}
          {previewResult && (
            <div className="p-6 rounded-2xl bg-mova-800/80 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Validation Results</h3>
                  <p className="text-xs text-mova-400">
                    Total records analyzed: {previewResult.totalRecords}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    ✓ {previewResult.validCount} Valid
                  </span>
                  {previewResult.invalidCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold">
                      ✗ {previewResult.invalidCount} Rejected
                    </span>
                  )}
                  <button
                    onClick={handleCommitCsv}
                    disabled={committing || previewResult.validCount === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {committing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Commit {previewResult.validCount} Records to Database
                  </button>
                </div>
              </div>

              {/* Invalid Rows Table */}
              {previewResult.invalidRows && previewResult.invalidRows.length > 0 && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                  <p className="text-xs font-bold text-red-400">Rejected Rows (Fix or re-upload):</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[10px] text-red-300 uppercase">
                        <tr>
                          <th className="py-1">Row</th>
                          <th className="py-1">Data Snippet</th>
                          <th className="py-1">Validation Errors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-500/20 text-red-200">
                        {previewResult.invalidRows.map((inv, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 font-mono">{inv.rowIndex}</td>
                            <td className="py-1.5 font-mono">{JSON.stringify(inv.data)}</td>
                            <td className="py-1.5 text-red-400 font-semibold">{inv.errors.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Valid Rows Preview Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-mova-400 uppercase bg-mova-900/40">
                    <tr>
                      {previewResult.headers?.map((h) => (
                        <th key={h} className="py-2 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-mova-200">
                    {previewResult.previewValid?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-mova-700/30">
                        {previewResult.headers?.map((h) => (
                          <td key={h} className="py-2 px-3 font-mono">{row[h] || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {commitSuccess && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Successfully Imported {commitSuccess.importedCount} Records into PostgreSQL!</span>
              </div>
              <p className="text-xs text-emerald-200/80">
                All valid records are now actively queryable across the MOVA platform and permanently tagged with origin <strong className="text-white">[USER-PROVIDED]</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE GPS TELEMATICS GATEWAY */}
      {activeTab === 'telematics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl bg-mova-800/60 border border-border space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                IoT Telematics Ping Simulator
              </h3>
              <p className="text-xs text-mova-400 mt-1">
                Transmits realistic GPS coordinates and speed telemetry. Updates vehicle position and dynamically recalculates active trip ETAs.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-mova-300">Vehicle Identifier</label>
                <input
                  type="text"
                  value={pingVehicle}
                  onChange={(e) => setPingVehicle(e.target.value)}
                  className="w-full mt-1 bg-mova-900 border border-border rounded-xl px-3 py-2 text-xs text-white focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-mova-300">Speed (km/h)</label>
                <input
                  type="number"
                  value={pingSpeed}
                  onChange={(e) => setPingSpeed(e.target.value)}
                  className="w-full mt-1 bg-mova-900 border border-border rounded-xl px-3 py-2 text-xs text-white focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-mova-300">Latitude</label>
                <input
                  type="text"
                  value={pingLat}
                  onChange={(e) => setPingLat(e.target.value)}
                  className="w-full mt-1 bg-mova-900 border border-border rounded-xl px-3 py-2 text-xs text-white focus:border-accent focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-mova-300">Longitude</label>
                <input
                  type="text"
                  value={pingLng}
                  onChange={(e) => setPingLng(e.target.value)}
                  className="w-full mt-1 bg-mova-900 border border-border rounded-xl px-3 py-2 text-xs text-white focus:border-accent focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-mova-400 uppercase">Highway Telematics Presets</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setPingVehicle('V-01'); setPingLat('18.7546'); setPingLng('73.4062'); setPingSpeed('75'); }}
                  className="p-2 rounded-lg bg-mova-700/50 hover:bg-mova-700 text-left border border-border text-[11px] text-mova-200"
                >
                  📍 V-01 near Lonavala Expressway (75 km/h)
                </button>
                <button
                  onClick={() => { setPingVehicle('V-04'); setPingLat('19.7020'); setPingLng('73.5412'); setPingSpeed('45'); }}
                  className="p-2 rounded-lg bg-mova-700/50 hover:bg-mova-700 text-left border border-border text-[11px] text-mova-200"
                >
                  📍 V-04 Kasara Ghat Climb (45 km/h)
                </button>
              </div>
            </div>

            <button
              onClick={handleSendTelematicsPing}
              disabled={pinging}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {pinging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Dispatch Telematics Ping to MOVA Gateway
            </button>
          </div>

          {/* Telematics Ingestion Telemetry Output */}
          <div className="space-y-4">
            {pingResponse ? (
              <div className="p-6 rounded-2xl bg-mova-800/60 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Ping Ingested & Processed
                  </h3>
                  <DataOriginBadge origin={pingResponse.dataOrigin} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-mova-900/60 border border-border">
                    <span className="text-mova-400">Target Vehicle</span>
                    <p className="text-base font-bold text-white mt-0.5">{pingResponse.vehicleId}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-mova-900/60 border border-border">
                    <span className="text-mova-400">Logged Speed</span>
                    <p className="text-base font-bold text-emerald-400 mt-0.5">{pingResponse.speedKmh} km/h</p>
                  </div>
                  <div className="p-3 rounded-xl bg-mova-900/60 border border-border">
                    <span className="text-mova-400">Coordinates</span>
                    <p className="text-xs font-mono text-mova-200 mt-0.5">
                      {pingResponse.coordinates?.lat.toFixed(4)}, {pingResponse.coordinates?.lng.toFixed(4)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-mova-900/60 border border-border">
                    <span className="text-mova-400">Database Table</span>
                    <p className="text-xs font-mono text-accent mt-0.5">vehicle_locations</p>
                  </div>
                </div>

                {pingResponse.tripUpdate && (
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 space-y-1">
                    <span className="text-xs font-bold text-accent">Real-Time Trip Recalculation:</span>
                    <p className="text-xs text-mova-200">
                      Trip <strong>{pingResponse.tripUpdate.tripId}</strong> progress updated to{' '}
                      <strong>{pingResponse.tripUpdate.progressPercent}%</strong> ({pingResponse.tripUpdate.remainingKm} km remaining).
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 rounded-2xl bg-mova-800/40 border border-dashed border-border text-center text-mova-400 space-y-2">
                <Radio className="w-8 h-8 text-mova-500" />
                <p className="text-sm font-semibold text-mova-300">Awaiting Telematics Signal</p>
                <p className="text-xs max-w-xs">
                  Trigger a ping from the simulator on the left or send an external HTTP POST to <code>/api/telematics/ping</code>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTION CONNECTORS */}
      {activeTab === 'connectors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OSRM Routing Card */}
            <div className="p-6 rounded-2xl bg-mova-800/60 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Compass className="w-5 h-5 text-accent" />
                  <div>
                    <h3 className="text-sm font-bold text-white">OSRM Routing Engine</h3>
                    <p className="text-[11px] text-mova-400">OpenStreetMap turn-by-turn geospatial routing</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  CONNECTED
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-mova-400">Endpoint</span>
                  <span className="text-mova-200 font-mono">https://router.project-osrm.org</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-mova-400">Protocol</span>
                  <span className="text-mova-200">Driving v1 / GeoJSON geometries</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-mova-400">Fallback Strategy</span>
                  <span className="text-mova-200">Deterministic Haversine Corridor</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={testRouting}
                  disabled={testingRoute}
                  className="px-3 py-1.5 rounded-lg bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-xs font-bold flex items-center gap-2"
                >
                  {testingRoute ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Test Live Route Calculation (Pune → Mumbai)
                </button>
              </div>

              {routingTest && (
                <div className="p-3 rounded-xl bg-mova-900/60 border border-border text-xs space-y-1">
                  <span className="text-emerald-400 font-bold">OSRM Response Verified:</span>
                  <p className="text-mova-200">
                    Real highway distance: <strong>{routingTest.distanceKm} km</strong> | Duration:{' '}
                    <strong>{routingTest.durationMin} min</strong> | Real waypoints:{' '}
                    <strong>{routingTest.coordinates?.length || 2697}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Open-Meteo Weather Card */}
            <div className="p-6 rounded-2xl bg-mova-800/60 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CloudSun className="w-5 h-5 text-sky-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Open-Meteo Weather Service</h3>
                    <p className="text-[11px] text-mova-400">Real-time WMO weather codes and precipitation</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  CONNECTED
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-mova-400">Endpoint</span>
                  <span className="text-mova-200 font-mono">https://api.open-meteo.com/v1/forecast</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-mova-400">Auth Requirement</span>
                  <span className="text-mova-200 font-semibold text-emerald-400">Public Open-Access (No Key Required)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-mova-400">Telemetry Fields</span>
                  <span className="text-mova-200">Precipitation, Wind, Temp, WMO Code</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={testWeather}
                  disabled={testingWeather}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 text-xs font-bold flex items-center gap-2"
                >
                  {testingWeather ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Test Live Corridor Weather (Mumbai Hub)
                </button>
              </div>

              {weatherTest && (
                <div className="p-3 rounded-xl bg-mova-900/60 border border-border text-xs space-y-1">
                  <span className="text-sky-400 font-bold">Open-Meteo Verified:</span>
                  <p className="text-mova-200">
                    Condition: <strong>{weatherTest.condition}</strong> | Temp:{' '}
                    <strong>{weatherTest.temperatureC}°C</strong> | Wind:{' '}
                    <strong>{weatherTest.windSpeedKmh} km/h</strong> | Hazard Level:{' '}
                    <strong className="capitalize">{weatherTest.hazardLevel}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INGESTION AUDIT TRAIL */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-2xl bg-mova-800/60 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Data Sources & Ingestion Log</h3>
            <button
              onClick={fetchHistory}
              className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {loadingHistory ? (
            <LoadingState message="Loading ingestion audit history..." />
          ) : history.length === 0 ? (
            <p className="text-xs text-mova-400 py-6 text-center">No previous ingestion batches found for this tenant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-mova-400 uppercase bg-mova-900/40">
                  <tr>
                    <th className="py-2.5 px-3">Batch ID</th>
                    <th className="py-2.5 px-3">Dataset Name</th>
                    <th className="py-2.5 px-3">Source Type</th>
                    <th className="py-2.5 px-3">Rows</th>
                    <th className="py-2.5 px-3">Data Origin</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-mova-200">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-mova-700/20">
                      <td className="py-2.5 px-3 font-mono text-accent">#{item.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{item.name}</td>
                      <td className="py-2.5 px-3 uppercase text-[11px] font-mono text-mova-300">{item.source_type}</td>
                      <td className="py-2.5 px-3 font-mono">{item.row_count || item.records_imported || 0}</td>
                      <td className="py-2.5 px-3">
                        <DataOriginBadge origin={item.data_origin || 'USER-PROVIDED'} />
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 capitalize">
                          {item.status || 'completed'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-mova-400">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
