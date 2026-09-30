import { query } from '../config/database.js';

export const migration = `
-- Organizations table (Tenancy)
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'enterprise',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table (RBAC: ADMIN, OPERATIONS_MANAGER, DISPATCHER, ANALYST, VIEWER)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'DISPATCHER',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Data Sources / Ingestion Logs
CREATE TABLE IF NOT EXISTS data_sources (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  source_type VARCHAR(50) NOT NULL, -- 'CSV_IMPORT', 'GPS_TELEMATICS', 'REST_API', 'MANUAL'
  name VARCHAR(255) NOT NULL,
  format VARCHAR(50), -- 'CSV', 'JSON', 'NMEA', 'GEOJSON'
  status VARCHAR(50) DEFAULT 'active', -- 'processing', 'completed', 'failed'
  records_imported INTEGER DEFAULT 0,
  records_rejected INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  data_origin VARCHAR(50) DEFAULT 'USER-PROVIDED', -- 'REAL', 'PUBLIC', 'USER-PROVIDED', 'SYNTHETIC/FALLBACK'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Integration Configs
CREATE TABLE IF NOT EXISTS integration_configs (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  provider VARCHAR(100) NOT NULL, -- 'OSRM', 'OPEN_METEO', 'TOMTOM', 'CUSTOM_TELEMATICS'
  service_type VARCHAR(50) NOT NULL, -- 'ROUTING', 'WEATHER', 'TRAFFIC', 'TELEMATICS'
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  last_synced_at TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'active', -- 'active', 'degraded', 'offline'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  employee_code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  license_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'available',
  assigned_vehicle_id INTEGER,
  shift_start VARCHAR(20) DEFAULT '08:00',
  shift_end VARCHAR(20) DEFAULT '17:00',
  hours_driven_today DECIMAL(4,2) DEFAULT 0,
  safety_score INTEGER DEFAULT 90,
  rating DECIMAL(3,2) DEFAULT 4.5,
  total_trips INTEGER DEFAULT 0,
  data_origin VARCHAR(50) DEFAULT 'SEED',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  vehicle_id VARCHAR(50) NOT NULL,
  registration_number VARCHAR(50),
  vehicle_type VARCHAR(50) NOT NULL,
  capacity_kg DECIMAL(10,2) NOT NULL,
  current_load_kg DECIMAL(10,2) DEFAULT 0,
  driver_id INTEGER REFERENCES drivers(id),
  status VARCHAR(50) DEFAULT 'idle', -- 'active', 'idle', 'maintenance', 'available'
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  speed_kmh DECIMAL(6,2) DEFAULT 0,
  heading_deg DECIMAL(6,2) DEFAULT 0,
  fuel_type VARCHAR(50) DEFAULT 'Diesel',
  fuel_level DECIMAL(5,2) DEFAULT 100,
  odometer_km DECIMAL(10,2) DEFAULT 0,
  maintenance_status VARCHAR(50) DEFAULT 'OK',
  distance_today_km DECIMAL(10,2) DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  current_location_name VARCHAR(255),
  data_origin VARCHAR(50) DEFAULT 'SEED',
  last_telematics_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (organization_id, vehicle_id)
);

-- Vehicle Location History (True GPS Ping Breadcrumbs)
CREATE TABLE IF NOT EXISTS vehicle_locations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  speed_kmh DECIMAL(6,2) DEFAULT 0,
  heading_deg DECIMAL(6,2) DEFAULT 0,
  accuracy_m DECIMAL(6,2),
  recorded_at TIMESTAMP NOT NULL,
  data_origin VARCHAR(50) DEFAULT 'REAL',
  raw_payload JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  trip_id VARCHAR(50) NOT NULL,
  vehicle_id INTEGER REFERENCES vehicles(id),
  driver_id INTEGER REFERENCES drivers(id),
  origin_name VARCHAR(255) NOT NULL,
  origin_lat DECIMAL(10,7) NOT NULL,
  origin_lng DECIMAL(10,7) NOT NULL,
  destination_name VARCHAR(255) NOT NULL,
  destination_lat DECIMAL(10,7) NOT NULL,
  destination_lng DECIMAL(10,7) NOT NULL,
  distance_km DECIMAL(10,2),
  planned_distance_km DECIMAL(10,2),
  estimated_distance_km DECIMAL(10,2),
  progress_percent DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'rerouted', 'cancelled'
  scheduled_departure TIMESTAMP,
  scheduled_arrival TIMESTAMP,
  planned_departure TIMESTAMP,
  actual_departure TIMESTAMP,
  baseline_arrival TIMESTAMP,
  predicted_arrival TIMESTAMP,
  actual_arrival TIMESTAMP,
  predicted_delay_min INTEGER DEFAULT 0,
  traffic_level VARCHAR(50) DEFAULT 'MODERATE',
  weather_condition VARCHAR(100),
  incident_involvement TEXT,
  risk_score INTEGER DEFAULT 0,
  current_route_id INTEGER,
  route_geometry JSONB DEFAULT '[]', -- Real GeoJSON/Coordinates from Routing Provider
  data_origin VARCHAR(50) DEFAULT 'SEED',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (organization_id, trip_id)
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  delivery_id VARCHAR(50) NOT NULL,
  customer_reference VARCHAR(100),
  pickup_location VARCHAR(255) NOT NULL,
  pickup_lat DECIMAL(10,7),
  pickup_lng DECIMAL(10,7),
  dropoff_location VARCHAR(255) NOT NULL,
  dropoff_lat DECIMAL(10,7),
  dropoff_lng DECIMAL(10,7),
  priority VARCHAR(20) DEFAULT 'normal', -- 'critical', 'high', 'normal', 'low'
  weight_kg DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'assigned', 'in_transit', 'delivered', 'failed'
  assigned_vehicle_id INTEGER REFERENCES vehicles(id),
  assigned_driver_id INTEGER REFERENCES drivers(id),
  assigned_trip_id INTEGER REFERENCES trips(id),
  deadline TIMESTAMP,
  estimated_arrival TIMESTAMP,
  actual_arrival TIMESTAMP,
  risk_score INTEGER DEFAULT 0,
  customer_name VARCHAR(255),
  special_requirements TEXT,
  description TEXT,
  data_origin VARCHAR(50) DEFAULT 'SEED',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (organization_id, delivery_id)
);

-- Routes table (OSRM / Engine Generated)
CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  route_id VARCHAR(50) NOT NULL,
  trip_id INTEGER REFERENCES trips(id),
  name VARCHAR(255),
  provider VARCHAR(50) DEFAULT 'OSRM',
  distance_km DECIMAL(10,2),
  estimated_duration_min INTEGER,
  baseline_duration_min INTEGER,
  traffic_level VARCHAR(20) DEFAULT 'normal',
  risk_score INTEGER DEFAULT 0,
  incident_count INTEGER DEFAULT 0,
  capacity_feasible BOOLEAN DEFAULT true,
  recommendation_status VARCHAR(50) DEFAULT 'ALTERNATIVE',
  is_active BOOLEAN DEFAULT false,
  waypoints JSONB DEFAULT '[]',
  route_geometry JSONB DEFAULT '[]',
  estimated_cost_inr DECIMAL(10,2),
  data_origin VARCHAR(50) DEFAULT 'SEED',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Incidents & Road Disruptions table
CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  incident_id VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'traffic', 'road_closure', 'vehicle_breakdown', 'weather', 'accident'
  severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  location_name VARCHAR(255),
  affected_road VARCHAR(255),
  source VARCHAR(100),
  start_time TIMESTAMP,
  expected_end_time TIMESTAMP,
  affected_route_ids JSONB DEFAULT '[]',
  affected_vehicle_ids JSONB DEFAULT '[]',
  affected_trip_ids JSONB DEFAULT '[]',
  predicted_delay_min INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'mitigated', 'resolved', 'monitoring'
  resolved_at TIMESTAMP,
  data_origin VARCHAR(50) DEFAULT 'SEED',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Operational Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  alert_type VARCHAR(50) NOT NULL, -- 'HIGH_RISK_TRIP', 'PREDICTED_DELAY', 'VEHICLE_OFFLINE', 'CAPACITY_BREACH', 'DEADLINE_RISK', 'INCIDENT_DETECTED'
  severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(50), -- 'trip', 'vehicle', 'delivery', 'incident'
  entity_id INTEGER,
  entity_code VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  acknowledged_by INTEGER REFERENCES users(id),
  resolved_by INTEGER REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Risk Assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  overall_score INTEGER NOT NULL,
  traffic_score INTEGER DEFAULT 0,
  historical_delay_score INTEGER DEFAULT 0,
  time_pressure_score INTEGER DEFAULT 0,
  priority_score INTEGER DEFAULT 0,
  disruption_score INTEGER DEFAULT 0,
  vehicle_status_score INTEGER DEFAULT 0,
  remaining_distance_score INTEGER DEFAULT 0,
  capacity_pressure_score INTEGER DEFAULT 0,
  breakdown JSONB,
  confidence_pct INTEGER DEFAULT 90,
  data_origin VARCHAR(50) DEFAULT 'REAL',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Recommendations (Human-In-The-Loop)
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  recommendation_id VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'reroute', 'reassign', 'dispatch', 'schedule_adjust'
  priority VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reasoning TEXT,
  affected_vehicle_ids JSONB DEFAULT '[]',
  affected_delivery_ids JSONB DEFAULT '[]',
  affected_trip_ids JSONB DEFAULT '[]',
  current_plan JSONB,
  recommended_plan JSONB,
  estimated_time_impact_min INTEGER,
  estimated_distance_impact_km DECIMAL(10,2),
  estimated_cost_impact_inr DECIMAL(10,2),
  risk_reduction INTEGER,
  confidence DECIMAL(5,2),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'applied', 'rejected', 'modified'
  approved_by INTEGER REFERENCES users(id),
  applied_at TIMESTAMP,
  action_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Optimization runs
CREATE TABLE IF NOT EXISTS optimization_runs (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  run_id VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  objective VARCHAR(50) DEFAULT 'BALANCED', -- 'MINIMIZE_DELAY', 'MINIMIZE_DISTANCE', 'MINIMIZE_COST', 'MINIMIZE_RISK', 'BALANCED'
  trigger_type VARCHAR(50),
  constraints JSONB DEFAULT '{}',
  before_state JSONB,
  proposed_plan JSONB,
  after_state JSONB,
  recommendations_generated INTEGER DEFAULT 0,
  recommendations_applied INTEGER DEFAULT 0,
  total_time_saved_min INTEGER DEFAULT 0,
  total_distance_saved_km DECIMAL(10,2) DEFAULT 0,
  total_cost_saved_inr DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Simulation runs (Digital Twin Sandboxes)
CREATE TABLE IF NOT EXISTS simulation_runs (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  simulation_id VARCHAR(50) NOT NULL,
  scenario_type VARCHAR(50) NOT NULL,
  scenario_params JSONB,
  current_state JSONB,
  scenario_state JSONB,
  optimized_state JSONB,
  impact_summary JSONB,
  ai_reasoning TEXT,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activity & Audit Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  user_id INTEGER REFERENCES users(id),
  user_name VARCHAR(255),
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL, -- e.g. 'APPROVE_RECOMMENDATION', 'INGEST_CSV_DATA', 'UPDATE_ROUTE'
  entity_type VARCHAR(50),
  entity_id INTEGER,
  entity_code VARCHAR(50),
  previous_state JSONB,
  new_state JSONB,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for high-throughput queries
CREATE INDEX IF NOT EXISTS idx_org_vehicles ON vehicles(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_trips ON trips(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_deliveries ON deliveries(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_incidents ON incidents(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_alerts ON alerts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_recs ON ai_recommendations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_locations ON vehicle_locations(organization_id, vehicle_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_activity ON activity_logs(organization_id, created_at DESC);
-- Backward compatible ALTER statements for existing DBs
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS assigned_vehicle_id INTEGER;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS shift_start VARCHAR(20) DEFAULT '08:00';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS shift_end VARCHAR(20) DEFAULT '17:00';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hours_driven_today DECIMAL(4,2) DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS safety_score INTEGER DEFAULT 90;

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50) DEFAULT 'Diesel';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS odometer_km DECIMAL(10,2) DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS maintenance_status VARCHAR(50) DEFAULT 'OK';

ALTER TABLE trips ADD COLUMN IF NOT EXISTS planned_departure TIMESTAMP;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS actual_departure TIMESTAMP;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS actual_arrival TIMESTAMP;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS planned_distance_km DECIMAL(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS estimated_distance_km DECIMAL(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS traffic_level VARCHAR(50) DEFAULT 'MODERATE';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS weather_condition VARCHAR(100);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS incident_involvement TEXT;

ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS customer_reference VARCHAR(100);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS assigned_driver_id INTEGER;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS special_requirements TEXT;

ALTER TABLE routes ADD COLUMN IF NOT EXISTS incident_count INTEGER DEFAULT 0;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS capacity_feasible BOOLEAN DEFAULT true;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS recommendation_status VARCHAR(50) DEFAULT 'ALTERNATIVE';

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS affected_road VARCHAR(255);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS source VARCHAR(100);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS expected_end_time TIMESTAMP;
`;

async function migrate() {
  console.log('Running enterprise database migration...');
  try {
    await query(migration);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  migrate().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default migrate;
