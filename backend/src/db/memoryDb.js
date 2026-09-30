import bcryptjs from 'bcryptjs';
import {
  CITIES,
  jitter,
  futureDate,
  pastDate,
  DEMO_ORG,
  DEMO_USERS,
  DEMO_DRIVERS,
  DEMO_VEHICLES,
  DEMO_TRIPS,
  DEMO_DELIVERIES,
  DEMO_INCIDENTS,
  DEMO_ROUTES,
  DEMO_RISK_ASSESSMENTS,
  DEMO_RECOMMENDATIONS,
  DEMO_SIMULATION_SCENARIOS,
  DEMO_OPTIMIZATION_RUNS,
  DEMO_ACTIVITY_LOGS,
} from './seedData.js';

export { CITIES, jitter, futureDate, pastDate };

class MemoryDatabase {
  constructor() {
    this.tables = {
      organizations: [],
      users: [],
      drivers: [],
      vehicles: [],
      trips: [],
      trip_stops: [],
      deliveries: [],
      routes: [],
      incidents: [],
      risk_assessments: [],
      ai_recommendations: [],
      optimization_runs: [],
      simulation_runs: [],
      activity_logs: [],
      data_sources: [],
      integration_configs: [],
      vehicle_locations: [],
      alerts: [],
    };
    this.sequences = {};
    this.init();
  }

  nextId(table) {
    if (!this.sequences[table]) this.sequences[table] = 1;
    return this.sequences[table]++;
  }

  reseed() {
    this.sequences = {};
    for (const key of Object.keys(this.tables)) {
      this.tables[key] = [];
    }
    this.init();
    return true;
  }

  init() {
    // 0. Organization
    this.tables.organizations = [
      {
        id: DEMO_ORG.id,
        name: DEMO_ORG.name,
        slug: DEMO_ORG.slug,
        plan: DEMO_ORG.plan,
        settings: DEMO_ORG.settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // 1. Users
    this.tables.users = DEMO_USERS.map((u, idx) => ({
      id: u.id || (idx + 1),
      organization_id: DEMO_ORG.id,
      email: u.email,
      password_hash: u.password_hash,
      name: u.name,
      role: u.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // 2. Drivers (20 commercial drivers)
    this.tables.drivers = DEMO_DRIVERS.map((d) => ({
      id: d.id,
      driver_id: d.id,
      organization_id: DEMO_ORG.id,
      employee_code: d.employee_code,
      name: d.name,
      phone: d.phone,
      phone_placeholder: d.phone,
      license_number: `MH-${String(d.id).padStart(2, "0")}-DL-${1000 + d.id}`,
      status: d.status.toLowerCase(),
      assigned_vehicle_id: d.assigned_vehicle_id,
      shift_start: d.shift_start,
      shift_end: d.shift_end,
      hours_driven_today: d.hours_driven_today,
      safety_score: d.safety_score,
      rating: d.rating,
      total_trips: Math.floor(Math.random() * 150 + 50),
      data_origin: "SEED",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // 3. Vehicles (20 fleet units)
    this.tables.vehicles = DEMO_VEHICLES.map((v) => {
      const c = CITIES[v.city] || CITIES.mumbai;
      const lat = jitter(c.lat);
      const lng = jitter(c.lng);
      return {
        id: v.id,
        organization_id: DEMO_ORG.id,
        vehicle_id: v.vehicle_id,
        registration_number: v.reg,
        registration_no: v.reg,
        vehicle_type: v.type,
        capacity_kg: v.cap,
        current_load_kg: v.load,
        driver_id: v.driver,
        status: v.status,
        lat,
        lng,
        current_latitude: lat,
        current_longitude: lng,
        current_location: c.name,
        current_location_name: c.name,
        speed_kmh: v.status === "active" ? 45 + (v.id % 25) : 0,
        heading_deg: v.status === "active" ? (v.id * 37) % 360 : 0,
        fuel_type: v.fuel_type,
        fuel_level: v.fuel,
        fuel_level_percent: v.fuel,
        odometer_km: v.odo,
        maintenance_status: v.maint,
        distance_today_km: v.dist,
        risk_score: v.risk,
        last_gps_update: pastDate(0.05),
        data_origin: "SEED",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    // 4. Trips (30 realistic trips: 12 active, 16 completed, 2 scheduled)
    this.tables.trips = DEMO_TRIPS.map((t) => {
      const from = CITIES[t.from] || CITIES.mumbai;
      const to = CITIES[t.to] || CITIES.pune;
      const schedDep = pastDate(-t.depH);
      const schedArr = futureDate(t.arrH);
      const predArr = futureDate(t.arrH + t.delay / 60);
      const actArr = t.status === "completed" ? pastDate(-t.arrH) : null;
      return {
        id: t.id,
        organization_id: DEMO_ORG.id,
        trip_id: t.tid,
        vehicle_id: t.v,
        driver_id: t.d,
        origin_name: from.name,
        origin_lat: from.lat,
        origin_lng: from.lng,
        destination_name: to.name,
        destination_lat: to.lat,
        destination_lng: to.lng,
        distance_km: t.dist,
        planned_distance_km: t.pdist,
        estimated_distance_km: t.dist,
        progress_percent: t.prog,
        status: t.status,
        scheduled_departure: schedDep,
        scheduled_arrival: schedArr,
        planned_departure: schedDep,
        actual_departure: t.status !== "scheduled" ? schedDep : null,
        baseline_arrival: schedArr,
        planned_eta: schedArr,
        predicted_arrival: predArr,
        predicted_eta: predArr,
        actual_arrival: actArr,
        predicted_delay_min: t.delay,
        delay_minutes: t.delay,
        traffic_level: t.traf,
        weather_condition: t.wth,
        incident_involvement: t.inc,
        risk_score: t.risk,
        current_route_id: 1,
        data_origin: "SEED",
        created_at: pastDate(Math.abs(t.depH) + 1),
        updated_at: new Date().toISOString(),
      };
    });

    // 5. Deliveries (50 records)
    this.tables.deliveries = DEMO_DELIVERIES.map((d) => {
      const from = CITIES[d.from] || CITIES.mumbai;
      const to = CITIES[d.to] || CITIES.pune;
      const deadline =
        d.st === "delivered"
          ? pastDate(12)
          : d.risk > 70
          ? futureDate(1.5)
          : futureDate(8);
      return {
        id: d.id,
        organization_id: DEMO_ORG.id,
        delivery_id: d.did,
        customer_reference: d.cust,
        customer_name: d.name,
        description: d.desc,
        special_requirements: d.req,
        pickup_location: from.name,
        dropoff_location: to.name,
        destination: to.name,
        pickup_lat: from.lat,
        pickup_lng: from.lng,
        dropoff_lat: to.lat,
        dropoff_lng: to.lng,
        latitude: to.lat,
        longitude: to.lng,
        weight_kg: d.wt,
        priority: d.prio,
        status: d.st,
        assigned_vehicle_id: d.v,
        assigned_trip_id: d.t,
        assigned_driver_id: d.d,
        risk_score: d.risk,
        deadline,
        data_origin: "SEED",
        created_at: pastDate(24),
        updated_at: new Date().toISOString(),
      };
    });

    // 6. Incidents (15 records: 5 active, 5 resolved, 5 monitoring)
    this.tables.incidents = DEMO_INCIDENTS.map((i) => {
      const c = CITIES[i.city] || CITIES.mumbai;
      return {
        id: i.id,
        incident_id: i.iid,
        organization_id: DEMO_ORG.id,
        incident_type: i.type,
        severity: i.sev,
        title: i.title,
        description: i.desc,
        latitude: jitter(c.lat, 0.04),
        longitude: jitter(c.lng, 0.04),
        lat: jitter(c.lat, 0.04),
        lng: jitter(c.lng, 0.04),
        location: c.name,
        affected_road: i.road,
        estimated_delay_minutes: i.delay,
        status: i.st,
        source: i.src,
        affected_vehicle_ids: i.veh,
        affected_trip_ids: i.trp,
        start_time: pastDate(1.5),
        expected_end_time: futureDate(2.5),
        data_origin: "SEED",
        created_at: pastDate(2),
      };
    });

    // 7. Routes (17 routes across 10 active trips)
    this.tables.routes = DEMO_ROUTES.map((r) => ({
      id: r.id,
      route_id: r.rid,
      trip_id: r.trip,
      route_name: r.name,
      distance_km: r.dist,
      estimated_duration_minutes: r.dur,
      estimated_duration_min: r.dur,
      estimated_cost: r.cost,
      traffic_level: r.traf,
      risk_score: r.risk,
      incident_count: r.inc,
      capacity_feasible: r.feas,
      recommendation_status: r.st,
      is_active: r.act,
      data_origin: "SEED",
      created_at: pastDate(3),
    }));

    // 8. Risk Assessments (5 breakdowns)
    this.tables.risk_assessments = DEMO_RISK_ASSESSMENTS.map((r, idx) => ({
      id: idx + 1,
      entity_type: "trip",
      entity_id: r.eid,
      overall_score: r.overall,
      traffic_score: r.traffic,
      historical_delay_score: r.historical,
      time_pressure_score: r.time,
      priority_score: r.priority,
      disruption_score: r.disruption,
      vehicle_status_score: r.veh,
      distance_score: r.dist,
      capacity_score: r.cap,
      breakdown: {
        traffic: r.traffic,
        historical_delay: r.historical,
        time_pressure: r.time,
        priority: r.priority,
        disruptions: r.disruption,
        vehicle_status: r.veh,
        remaining_distance: r.dist,
        capacity_utilization: r.cap,
        notes: r.notes,
      },
      data_origin: "SEED",
      created_at: pastDate(1),
    }));

    // 9. AI Recommendations (10 records)
    this.tables.ai_recommendations = DEMO_RECOMMENDATIONS.map((rec, idx) => ({
      id: idx + 1,
      recommendation_id: rec.rid || `REC-${String(idx + 1).padStart(3, '0')}`,
      type: rec.type,
      priority: rec.priority || rec.prio || 'medium',
      title: rec.title,
      description: rec.description || rec.desc || '',
      reasoning: rec.reasoning || rec.reason || '',
      affected_vehicle_ids: rec.veh || rec.vehs || [],
      affected_delivery_ids: rec.del || rec.dels || [],
      affected_trip_ids: rec.trp || rec.trips || [],
      current_plan: rec.current_plan || null,
      recommended_plan: rec.recommended_plan || null,
      estimated_time_impact_min: rec.time || rec.time_saved || 0,
      estimated_time_saving: `${rec.time || rec.time_saved || 0} min`,
      estimated_distance_impact_km: rec.dist || rec.dist_saved || 0,
      estimated_distance_change: `${rec.dist || rec.dist_saved || 0} km`,
      estimated_cost_impact_inr: rec.cost || rec.cost_saved || 0,
      estimated_cost_change: `₹${rec.cost || rec.cost_saved || 0}`,
      risk_reduction: rec.riskRed || rec.risk_red || 0,
      estimated_risk_reduction: `-${rec.riskRed || rec.risk_red || 0} pts`,
      confidence: rec.conf || 85,
      status: rec.st || rec.status || 'pending',
      data_origin: "SEED",
      created_at: pastDate(rec.hoursAgo || (idx + 1)),
      updated_at: pastDate(rec.hoursAgo || (idx + 1)),
    }));

    // 10. Simulation Scenarios (8 Digital Twin scenarios)
    this.tables.simulation_runs = DEMO_SIMULATION_SCENARIOS.map((s, idx) => ({
      id: idx + 1,
      simulation_id: s.scen_id,
      scenario_id: s.scen_id,
      scenario_type: s.type,
      name: s.name,
      description: s.desc,
      affected_entities: s.affected,
      baseline_state: s.baseline,
      simulated_state: s.simulated,
      expected_metrics: s.expected_metrics,
      before_state: s.baseline,
      after_state: s.simulated,
      impact_summary: s.expected_metrics,
      ai_reasoning: `Digital Twin simulation sandbox for ${s.name}. Sandboxed scenario evaluation shows realistic network stress.`,
      data_origin: "SEED",
      created_at: pastDate(4),
    }));

    // 11. Optimization Runs
    this.tables.optimization_runs = DEMO_OPTIMIZATION_RUNS.map((o, idx) => ({
      id: idx + 1,
      run_id: o.run_id,
      type: o.type,
      trigger_type: o.trigger_type,
      recommendations_generated: o.recs_gen,
      recommendations_applied: o.recs_app,
      total_time_saved_min: o.time_saved,
      total_distance_saved_km: o.dist_saved,
      total_cost_saved_inr: o.cost_saved,
      status: o.status,
      data_origin: "SEED",
      created_at: pastDate(6),
    }));

    // 12. Activity Logs
    this.tables.activity_logs = DEMO_ACTIVITY_LOGS.map((a, idx) => ({
      id: idx + 1,
      action: a.action,
      entity_type: a.type,
      entity_id: a.id,
      details: a.details,
      user_id: 1,
      data_origin: "SEED",
      created_at: pastDate(idx * 0.5 + 0.1),
    }));

    // 13. Integration Configs
    this.tables.integration_configs = [
      {
        id: this.nextId("integration_configs"),
        organization_id: DEMO_ORG.id,
        provider: "google_maps",
        service_type: "geospatial_mapping",
        is_enabled: true,
        config: { endpoint: "https://maps.googleapis.com", mode: "directions-mapid" },
        status: "configured",
        last_sync_at: new Date().toISOString(),
      },
      {
        id: this.nextId("integration_configs"),
        organization_id: DEMO_ORG.id,
        provider: "openweathermap",
        service_type: "weather_telematics",
        is_enabled: true,
        config: { endpoint: "https://api.openweathermap.org/data/2.5" },
        status: "connected",
        last_sync_at: new Date().toISOString(),
      },
      {
        id: this.nextId("integration_configs"),
        organization_id: DEMO_ORG.id,
        provider: "gemini",
        service_type: "ai_reasoning",
        is_enabled: true,
        config: { model: "gemini-2.5-flash", backend_managed: true },
        status: "connected",
        last_sync_at: new Date().toISOString(),
      },
      {
        id: this.nextId("integration_configs"),
        organization_id: DEMO_ORG.id,
        provider: "telematics_rest",
        service_type: "gps_ingestion",
        is_enabled: true,
        config: { endpoint: "/api/telematics/ping", auth_type: "bearer" },
        status: "active",
        last_sync_at: new Date().toISOString(),
      },
      {
        id: this.nextId("integration_configs"),
        organization_id: DEMO_ORG.id,
        provider: "osrm",
        service_type: "routing_resilient_fallback",
        is_enabled: true,
        config: { endpoint: "https://router.project-osrm.org", mode: "driving" },
        status: "connected",
        last_sync_at: new Date().toISOString(),
      },
    ];

    // 14. Data Sources / Ingestion History
    this.tables.data_sources = [
      {
        id: this.nextId("data_sources"),
        organization_id: DEMO_ORG.id,
        name: "Maharashtra Inter-City Commercial Fleet Master",
        source_type: "seed_dataset",
        file_name: "mova_seed_dataset_v2.json",
        row_count: 20,
        status: "completed",
        metadata: { type: "seed_fleet", successful: 20, rejected: 0, mode: "DEVELOPMENT" },
        created_at: pastDate(48),
      },
      {
        id: this.nextId("data_sources"),
        organization_id: DEMO_ORG.id,
        name: "Western Corridor High-Resolution Telematics Feed",
        source_type: "gps_telematics",
        file_name: null,
        row_count: 184,
        status: "completed",
        metadata: { protocol: "REST_PING", active_transmitters: 12, mode: "DEVELOPMENT" },
        created_at: pastDate(2),
      },
    ];

    // 15. Vehicle Locations (Initial Breadcrumbs)
    this.tables.vehicle_locations = this.tables.vehicles
      .filter((v) => v.status === "active")
      .map((v) => ({
        id: this.nextId("vehicle_locations"),
        organization_id: DEMO_ORG.id,
        vehicle_id: v.id,
        lat: v.lat,
        latitude: v.lat,
        lng: v.lng,
        longitude: v.lng,
        speed_kmh: v.speed_kmh,
        heading_deg: v.heading_deg,
        recorded_at: pastDate(0.02),
        data_origin: "SEED",
        raw_payload: { simulated: true, vehicle_code: v.vehicle_id },
      }));

    // 16. Operational Alerts
    this.tables.alerts = [
      {
        id: this.nextId("alerts"),
        organization_id: DEMO_ORG.id,
        alert_type: "INCIDENT_BLOCKAGE",
        severity: "critical",
        title: "Multi-vehicle collision near Khandala Ghat",
        message: "Active incident INC-001 affecting TRP-001 (V001). Estimated delay +45 mins. Urgent reroute advised.",
        entity_type: "trip",
        entity_id: 1,
        status: "active",
        metadata: { trip_id: "TRP-001", vehicle_id: "V001", incident_id: "INC-001" },
        created_at: pastDate(0.8),
        acknowledged_at: null,
        resolved_at: null,
      },
      {
        id: this.nextId("alerts"),
        organization_id: DEMO_ORG.id,
        alert_type: "DELIVERY_AT_RISK",
        severity: "critical",
        title: "Avionics radar delivery at critical SLA risk",
        message: "Delivery DEL-002 (Bharat Electronics) on TRP-002 affected by Kasara Ghat landslide delay.",
        entity_type: "delivery",
        entity_id: 2,
        status: "active",
        metadata: { delivery_id: "DEL-002", priority: "critical" },
        created_at: pastDate(0.6),
        acknowledged_at: null,
        resolved_at: null,
      },
      {
        id: this.nextId("alerts"),
        organization_id: DEMO_ORG.id,
        alert_type: "HIGH_RISK_TRIP",
        severity: "warning",
        title: "Trip TRP-003 risk score escalated to 71",
        message: "Alephata NH-60 breakdown causing secondary tailback for V008.",
        entity_type: "trip",
        entity_id: 3,
        status: "active",
        metadata: { trip_id: "TRP-003", risk_score: 71 },
        created_at: pastDate(0.4),
        acknowledged_at: null,
        resolved_at: null,
      },
      {
        id: this.nextId("alerts"),
        organization_id: DEMO_ORG.id,
        alert_type: "WEATHER_ADVISORY",
        severity: "warning",
        title: "Orange Alert: Squalls in Nagpur-Wardha belt",
        message: "Moderate monsoon slowdown predicted for TRP-005 (V006).",
        entity_type: "trip",
        entity_id: 5,
        status: "active",
        metadata: { trip_id: "TRP-005", incident_id: "INC-011" },
        created_at: pastDate(1.2),
        acknowledged_at: pastDate(0.5),
        resolved_at: null,
      },
    ];
  }

  // Unified Query Parser & Handler
  async query(text, params = []) {
    const cleanSql = text.trim();
    const upper = cleanSql.toUpperCase();

    // 0. DELETE FROM / TRUNCATE
    if (upper.startsWith("DELETE FROM") || upper.startsWith("TRUNCATE")) {
      const match = cleanSql.match(/(?:DELETE\s+FROM|TRUNCATE(?:\s+TABLE)?)\s+(\w+)/i);
      if (match) {
        const table = match[1].toLowerCase();
        if (this.tables[table]) {
          const count = this.tables[table].length;
          this.tables[table] = [];
          return { rows: [], rowCount: count };
        }
      }
      return { rows: [], rowCount: 0 };
    }
    if (upper.startsWith("ALTER SEQUENCE")) {
      return { rows: [], rowCount: 0 };
    }

    // 1. SELECT COUNT(*) FROM table
    const countMatch = cleanSql.match(/SELECT\s+COUNT\(\*\)\s+FROM\s+(\w+)/i);
    if (countMatch) {
      const table = countMatch[1].toLowerCase();
      const count = (this.tables[table] || []).length;
      return { rows: [{ count }] };
    }

    // 2. ORGANIZATIONS
    if (upper.includes('FROM ORGANIZATIONS')) {
      if (upper.includes('WHERE ID = $1')) {
        const org = this.tables.organizations.find(o => o.id === Number(params[0]));
        return { rows: org ? [org] : [] };
      }
      if (upper.includes('WHERE SLUG = $1')) {
        const org = this.tables.organizations.find(o => o.slug === params[0]);
        return { rows: org ? [org] : [] };
      }
      return { rows: [...this.tables.organizations] };
    }
    if (upper.startsWith('INSERT INTO ORGANIZATIONS')) {
      const newOrg = {
        id: this.nextId('organizations'),
        name: params[0] || 'Default Organization',
        slug: params[1] || `org-${Date.now()}`,
        plan: params[2] || 'standard',
        settings: typeof params[3] === 'string' ? JSON.parse(params[3]) : (params[3] || {}),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.tables.organizations.push(newOrg);
      return { rows: [newOrg], rowCount: 1 };
    }

    // 3. USERS
    if (upper.includes('FROM USERS')) {
      if (upper.includes('WHERE U.EMAIL = $1') || upper.includes('WHERE EMAIL = $1')) {
        const u = this.tables.users.find(x => x.email.toLowerCase() === (params[0] || '').toLowerCase());
        if (!u) return { rows: [] };
        const org = this.tables.organizations.find(o => o.id === (u.organization_id || 1)) || { name: 'Apex Mobility Logistics', slug: 'apex-mobility' };
        return { rows: [{ ...u, organization_name: org.name, organization_slug: org.slug }] };
      }
      if (upper.includes('WHERE U.ID = $1') || upper.includes('WHERE ID = $1')) {
        const u = this.tables.users.find(x => x.id === Number(params[0]));
        if (!u) return { rows: [] };
        const org = this.tables.organizations.find(o => o.id === (u.organization_id || 1)) || { name: 'Apex Mobility Logistics', slug: 'apex-mobility' };
        return { rows: [{ ...u, organization_name: org.name, organization_slug: org.slug }] };
      }
      return { rows: [...this.tables.users] };
    }
    if (upper.startsWith('INSERT INTO USERS')) {
      // (organization_id, email, password_hash, name, role)
      let orgId = 1;
      let email = params[0];
      let passHash = params[1];
      let name = params[2];
      let role = 'operator';
      if (params.length >= 4 && typeof params[0] === 'number') {
        orgId = params[0];
        email = params[1];
        passHash = params[2];
        name = params[3];
        role = params[4] || 'operator';
      }
      const newUser = {
        id: this.nextId('users'),
        organization_id: orgId,
        email,
        password_hash: passHash,
        name,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.tables.users.push(newUser);
      return { rows: [newUser], rowCount: 1 };
    }

    // 4. VEHICLES
    if (upper.includes('FROM VEHICLES')) {
      if (upper.includes('ORGANIZATION_ID') && (upper.includes('ID = $2') || upper.includes('VEHICLE_ID = $2'))) {
        const p = params[1];
        const v = this.tables.vehicles.find(x => x.id === Number(p) || x.vehicle_id === p);
        if (!v) return { rows: [] };
        const d = this.tables.drivers.find(x => x.id === v.driver_id) || {};
        return { rows: [{ ...v, driver_name: d.name, driver_phone: d.phone, driver_rating: d.rating }] };
      }
      if (upper.includes('WHERE V.ID = $1') || upper.includes('WHERE V.VEHICLE_ID = $1') || upper.includes('WHERE ID = $1') || upper.includes('WHERE VEHICLE_ID = $1')) {
        const p = params[0];
        const v = this.tables.vehicles.find(x => x.id === Number(p) || x.vehicle_id === p);
        if (!v) return { rows: [] };
        const d = this.tables.drivers.find(x => x.id === v.driver_id) || {};
        return { rows: [{ ...v, driver_name: d.name, driver_phone: d.phone, driver_rating: d.rating }] };
      }

      let res = this.tables.vehicles.map(v => {
        const d = this.tables.drivers.find(x => x.id === v.driver_id) || {};
        const t = this.tables.trips.find(x => x.vehicle_id === v.id && x.status === 'in_progress') || {};
        return {
          ...v,
          driver_name: d.name,
          driver_phone: d.phone,
          driver_rating: d.rating,
          current_trip_id: t.trip_id,
          origin_name: t.origin_name,
          destination_name: t.destination_name,
          trip_progress: t.progress_percent,
        };
      });

      if (params.length > 0 && params[0] && params[0] !== 'all') {
        res = res.filter(v => v.status === params[0]);
      }
      if (upper.includes('RISK_SCORE >= 60')) {
        res = res.filter(v => v.risk_score >= 60);
      }
      res.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
      return { rows: res };
    }

    if (upper.startsWith('INSERT INTO VEHICLES')) {
      const isIngestion = upper.includes('ORGANIZATION_ID');
      const orgId = isIngestion ? (Number(params[0]) || 1) : 1;
      const vehicleId = isIngestion ? params[1] : params[0];
      const vehicleType = isIngestion ? params[2] : params[1];
      const capacityKg = isIngestion ? (Number(params[3]) || 1000) : (Number(params[2]) || 1000);
      const status = isIngestion ? (params[4] || 'idle') : (params[5] || 'idle');
      const lat = isIngestion ? (Number(params[5]) || 19.0760) : (Number(params[6]) || 19.0760);
      const lng = isIngestion ? (Number(params[6]) || 72.8777) : (Number(params[7]) || 72.8777);
      const locationName = isIngestion ? (params[7] || 'Terminal') : (params[11] || 'Hub');
      const dataOrigin = upper.includes("'USER-PROVIDED'") ? 'USER-PROVIDED' : (upper.includes("'REAL'") ? 'REAL' : 'USER-PROVIDED');

      const existing = this.tables.vehicles.find(v => v.organization_id === orgId && v.vehicle_id === vehicleId);
      if (existing) {
        existing.vehicle_type = vehicleType;
        existing.capacity_kg = capacityKg;
        existing.status = status;
        existing.lat = lat;
        existing.lng = lng;
        existing.current_location_name = locationName;
        existing.data_origin = dataOrigin;
        existing.updated_at = new Date().toISOString();
        return { rows: [existing], rowCount: 1 };
      }

      const newV = {
        id: this.nextId('vehicles'),
        organization_id: orgId,
        vehicle_id: vehicleId,
        vehicle_type: vehicleType,
        capacity_kg: capacityKg,
        current_load_kg: 0,
        status: status,
        current_location_name: locationName,
        data_origin: dataOrigin,
        lat: lat,
        lng: lng,
        speed_kmh: 0,
        heading_deg: 0,
        risk_score: 10,
        fuel_level: 100,
        distance_today_km: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.tables.vehicles.push(newV);
      return { rows: [newV], rowCount: 1 };
    }

    // 5. DRIVERS
    if (upper.includes('FROM DRIVERS')) {
      return { rows: [...this.tables.drivers] };
    }
    if (upper.startsWith('INSERT INTO DRIVERS')) {
      const newD = {
        id: this.nextId('drivers'),
        organization_id: params[0] || 1,
        name: params[1],
        phone: params[2],
        license_number: params[3],
        status: params[4] || 'available',
        data_origin: params[5] || 'USER-PROVIDED',
        total_trips: 0,
        rating: 5.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.tables.drivers.push(newD);
      return { rows: [newD], rowCount: 1 };
    }

    // 6. TRIPS
    if (upper.includes('FROM TRIPS')) {
      if (upper.includes('WHERE T.ID = $1') || upper.includes('WHERE T.TRIP_ID = $1') || upper.includes('WHERE ID = $1') || upper.includes('WHERE TRIP_ID = $1')) {
        const p = params[0];
        const t = this.tables.trips.find(x => x.id === Number(p) || x.trip_id === p);
        if (!t) return { rows: [] };
        const v = this.tables.vehicles.find(x => x.id === t.vehicle_id) || {};
        const d = this.tables.drivers.find(x => x.id === t.driver_id) || {};
        return {
          rows: [{
            ...t,
            vehicle_code: v.vehicle_id,
            vehicle_type: v.vehicle_type,
            capacity_kg: v.capacity_kg,
            current_load_kg: v.current_load_kg,
            driver_name: d.name,
            driver_phone: d.phone,
          }]
        };
      }
      if (upper.includes('WHERE VEHICLE_ID = $1') || (upper.includes('ORGANIZATION_ID') && upper.includes('VEHICLE_ID = $2'))) {
        const vid = Number(params[1]) || Number(params[0]);
        let res = this.tables.trips.filter(t => t.vehicle_id === vid);
        if (upper.includes("'IN_PROGRESS'") || params.includes('in_progress')) {
          res = res.filter(t => t.status === 'in_progress');
        }
        return { rows: res };
      }

      let res = this.tables.trips.map(t => {
        const v = this.tables.vehicles.find(x => x.id === t.vehicle_id) || {};
        const d = this.tables.drivers.find(x => x.id === t.driver_id) || {};
        return {
          ...t,
          vehicle_code: v.vehicle_id,
          vehicle_type: v.vehicle_type,
          driver_name: d.name,
        };
      });

      if (params.length > 0 && params[0] && params[0] !== 'all') {
        res = res.filter(t => t.status === params[0]);
      }
      if (upper.includes('RISK_SCORE >= 60')) {
        res = res.filter(t => t.risk_score >= 60);
      }
      res.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
      return { rows: res };
    }

    // 7. DELIVERIES
    if (upper.includes('FROM DELIVERIES')) {
      if (upper.includes('WHERE D.ID = $1') || upper.includes('WHERE D.DELIVERY_ID = $1') || upper.includes('WHERE ID = $1') || upper.includes('WHERE DELIVERY_ID = $1')) {
        const p = params[0];
        const d = this.tables.deliveries.find(x => x.id === Number(p) || x.delivery_id === p);
        if (!d) return { rows: [] };
        const v = this.tables.vehicles.find(x => x.id === d.assigned_vehicle_id) || {};
        const t = this.tables.trips.find(x => x.id === d.assigned_trip_id) || {};
        return {
          rows: [{
            ...d,
            vehicle_code: v.vehicle_id,
            vehicle_type: v.vehicle_type,
            trip_code: t.trip_id,
            origin_name: t.origin_name,
            destination_name: t.destination_name,
            trip_status: t.status,
            trip_risk: t.risk_score,
          }]
        };
      }
      if (upper.includes('WHERE ASSIGNED_TRIP_ID = $1')) {
        const res = this.tables.deliveries.filter(d => d.assigned_trip_id === Number(params[0]));
        return { rows: res };
      }
      if (upper.includes('WHERE ASSIGNED_VEHICLE_ID = $1')) {
        const res = this.tables.deliveries.filter(d => d.assigned_vehicle_id === Number(params[0]));
        return { rows: res };
      }

      let res = this.tables.deliveries.map(d => {
        const v = this.tables.vehicles.find(x => x.id === d.assigned_vehicle_id) || {};
        const t = this.tables.trips.find(x => x.id === d.assigned_trip_id) || {};
        return {
          ...d,
          vehicle_code: v.vehicle_id,
          trip_code: t.trip_id,
          origin_name: t.origin_name,
          destination_name: t.destination_name,
        };
      });

      if (params.length > 0 && params[0] && params[0] !== 'all') {
        res = res.filter(d => d.status === params[0]);
      }
      if (params.length > 1 && params[1] && params[1] !== 'all') {
        res = res.filter(d => d.priority === params[1]);
      }
      return { rows: res };
    }

    if (upper.startsWith('INSERT INTO DELIVERIES')) {
      const newDel = {
        id: this.nextId('deliveries'),
        organization_id: params[0] || 1,
        delivery_id: params[1],
        pickup_location: params[2],
        dropoff_location: params[3],
        pickup_lat: Number(params[4]) || 19.0760,
        pickup_lng: Number(params[5]) || 72.8777,
        dropoff_lat: Number(params[6]) || 18.5204,
        dropoff_lng: Number(params[7]) || 73.8567,
        weight_kg: Number(params[8]) || 100,
        priority: params[9] || 'normal',
        status: params[10] || 'pending',
        data_origin: params[11] || 'USER-PROVIDED',
        customer_name: 'Enterprise Client',
        description: 'Commercial Cargo',
        risk_score: 15,
        deadline: futureDate(6),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.tables.deliveries.push(newDel);
      return { rows: [newDel], rowCount: 1 };
    }

    // 8. INCIDENTS
    if (upper.includes('FROM INCIDENTS')) {
      let res = [...this.tables.incidents];
      if (upper.includes("STATUS = 'ACTIVE'")) {
        res = res.filter(i => i.status === 'active');
      }
      if (upper.includes('AFFECTED_TRIP_IDS::TEXT LIKE $1')) {
        const search = (params[0] || '').replace(/%/g, '');
        res = res.filter(i => JSON.stringify(i.affected_trip_ids || []).includes(search));
      }
      return { rows: res };
    }

    // 9. ROUTES
    if (upper.includes('FROM ROUTES')) {
      if (upper.includes('WHERE TRIP_ID = $1')) {
        const res = this.tables.routes.filter(r => r.trip_id === Number(params[0]));
        return { rows: res };
      }
      return { rows: [...this.tables.routes] };
    }

    // 10. AI RECOMMENDATIONS
    if (upper.includes('FROM AI_RECOMMENDATIONS')) {
      let res = [...this.tables.ai_recommendations];
      if (upper.includes('WHERE ID = $1') || upper.includes('WHERE RECOMMENDATION_ID = $1')) {
        const match = res.find(r => r.id === Number(params[0]) || r.recommendation_id === params[0]);
        return { rows: match ? [match] : [] };
      }
      if (upper.includes('WHERE STATUS = $1')) {
        res = res.filter(r => r.status === params[0]);
      }
      if (upper.includes('AFFECTED_DELIVERY_IDS::TEXT LIKE $1')) {
        const search = (params[0] || '').replace(/%/g, '');
        res = res.filter(r => JSON.stringify(r.affected_delivery_ids || []).includes(search));
      }
      const limitMatch = cleanSql.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        res = res.slice(0, Number(limitMatch[1]));
      }
      return { rows: res };
    }
    if (upper.startsWith('INSERT INTO AI_RECOMMENDATIONS')) {
      const rec = {
        id: this.nextId('ai_recommendations'),
        recommendation_id: params[0],
        type: params[1],
        priority: params[2],
        title: params[3],
        description: params[4],
        reasoning: params[5],
        affected_vehicle_ids: typeof params[6] === 'string' ? JSON.parse(params[6]) : params[6],
        affected_delivery_ids: typeof params[7] === 'string' ? JSON.parse(params[7]) : params[7],
        affected_trip_ids: typeof params[8] === 'string' ? JSON.parse(params[8]) : params[8],
        estimated_time_impact_min: params[9],
        estimated_distance_impact_km: params[10],
        estimated_cost_impact_inr: params[11],
        risk_reduction: params[12],
        confidence: params[13],
        status: params[14] || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.tables.ai_recommendations.push(rec);
      return { rows: [rec], rowCount: 1 };
    }

    // 11. OPTIMIZATION RUNS
    if (upper.includes('FROM OPTIMIZATION_RUNS')) {
      let res = [...this.tables.optimization_runs];
      const limitMatch = cleanSql.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) res = res.slice(0, Number(limitMatch[1]));
      return { rows: res };
    }

    // 12. SIMULATION RUNS
    if (upper.includes('FROM SIMULATION_RUNS')) {
      return { rows: [...this.tables.simulation_runs] };
    }

    // 13. RISK ASSESSMENTS
    if (upper.includes('FROM RISK_ASSESSMENTS')) {
      let res = [...this.tables.risk_assessments];
      if (upper.includes("ENTITY_TYPE = 'TRIP'") && upper.includes('ENTITY_ID = $1')) {
        res = res.filter(r => r.entity_type === 'trip' && r.entity_id === Number(params[0]));
      }
      return { rows: res };
    }

    // 14. DATA SOURCES (Ingestion History)
    if (upper.includes('FROM DATA_SOURCES')) {
      let res = [...this.tables.data_sources];
      if (upper.includes('ORGANIZATION_ID = $1')) {
        res = res.filter(d => d.organization_id === Number(params[0]));
      }
      res.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows: res };
    }
    if (upper.startsWith('INSERT INTO DATA_SOURCES')) {
      const rec = {
        id: this.nextId('data_sources'),
        organization_id: params[0] || 1,
        name: params[1],
        source_type: params[2],
        file_name: params[3],
        row_count: params[4],
        status: params[5] || 'completed',
        metadata: typeof params[6] === 'string' ? JSON.parse(params[6]) : (params[6] || {}),
        created_at: new Date().toISOString(),
      };
      this.tables.data_sources.push(rec);
      return { rows: [rec], rowCount: 1 };
    }

    // 15. INTEGRATION CONFIGS
    if (upper.includes('FROM INTEGRATION_CONFIGS')) {
      let res = [...this.tables.integration_configs];
      if (upper.includes('ORGANIZATION_ID = $1')) {
        res = res.filter(i => i.organization_id === Number(params[0]));
      }
      return { rows: res };
    }
    if (upper.startsWith('INSERT INTO INTEGRATION_CONFIGS')) {
      const rec = {
        id: this.nextId('integration_configs'),
        organization_id: params[0] || 1,
        provider: params[1],
        service_type: params[2],
        is_enabled: params[3] !== false,
        config: typeof params[4] === 'string' ? JSON.parse(params[4]) : (params[4] || {}),
        status: params[5] || 'connected',
        last_sync_at: new Date().toISOString(),
      };
      this.tables.integration_configs.push(rec);
      return { rows: [rec], rowCount: 1 };
    }

    // 16. VEHICLE LOCATIONS (Telematics Breadcrumbs)
    if (upper.includes('FROM VEHICLE_LOCATIONS')) {
      let res = [...this.tables.vehicle_locations];
      if (upper.includes('VEHICLE_ID = $1')) {
        res = res.filter(l => l.vehicle_id === params[0] || l.vehicle_id === Number(params[0]) || String(l.vehicle_id) === String(params[0]));
      }
      return { rows: res };
    }
    if (upper.startsWith('INSERT INTO VEHICLE_LOCATIONS')) {
      const rec = {
        id: this.nextId('vehicle_locations'),
        organization_id: params[0] || 1,
        vehicle_id: Number(params[1]) || params[1],
        lat: Number(params[2]),
        latitude: Number(params[2]),
        lng: Number(params[3]),
        longitude: Number(params[3]),
        speed_kmh: Number(params[4]) || 0,
        heading_deg: Number(params[5]) || 0,
        recorded_at: params[6] || new Date().toISOString(),
        data_origin: 'REAL',
        raw_payload: typeof params[7] === 'string' ? JSON.parse(params[7]) : (params[7] || {}),
      };
      this.tables.vehicle_locations.push(rec);
      return { rows: [rec], rowCount: 1 };
    }

    // 17. ALERTS
    if (upper.includes('FROM ALERTS')) {
      let res = [...this.tables.alerts];
      if (upper.includes('ORGANIZATION_ID = $1') || upper.includes('WHERE ORGANIZATION_ID = $1')) {
        res = res.filter(a => a.organization_id === Number(params[0]));
      }
      if (upper.includes("STATUS = 'ACTIVE'")) {
        res = res.filter(a => a.status === 'active');
      }
      res.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows: res };
    }
    if (upper.startsWith('INSERT INTO ALERTS')) {
      const rec = {
        id: this.nextId('alerts'),
        organization_id: params[0] || 1,
        alert_type: params[1],
        severity: params[2] || 'warning',
        title: params[3],
        message: params[4],
        entity_type: params[5],
        entity_id: params[6],
        status: params[7] || 'active',
        metadata: typeof params[8] === 'string' ? JSON.parse(params[8]) : (params[8] || {}),
        created_at: new Date().toISOString(),
        acknowledged_at: null,
        resolved_at: null,
      };
      this.tables.alerts.push(rec);
      return { rows: [rec], rowCount: 1 };
    }
    if (upper.startsWith('UPDATE ALERTS')) {
      // SET status = $1, acknowledged_at / resolved_at = NOW() WHERE id = $2 AND organization_id = $3
      const statusVal = params[0];
      const alertId = Number(params[1]);
      const alert = this.tables.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.status = statusVal;
        if (statusVal === 'acknowledged') alert.acknowledged_at = new Date().toISOString();
        if (statusVal === 'resolved') alert.resolved_at = new Date().toISOString();
        return { rows: [alert], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // 18. INSERT ENTITIES (Simulations, Risk Assessments, Optimization Runs, Activity Logs)
    if (upper.startsWith('INSERT INTO RISK_ASSESSMENTS')) {
      const rec = {
        id: this.nextId('risk_assessments'),
        entity_type: params[0],
        entity_id: params[1],
        overall_score: params[2],
        breakdown: typeof params[10] === 'string' ? JSON.parse(params[10]) : params[10],
        created_at: new Date().toISOString(),
      };
      this.tables.risk_assessments.push(rec);
      return { rows: [rec], rowCount: 1 };
    }
    if (upper.startsWith('INSERT INTO SIMULATION_RUNS')) {
      const rec = {
        id: this.nextId('simulation_runs'),
        simulation_id: params[0],
        scenario_type: params[1],
        scenario_params: typeof params[2] === 'string' ? JSON.parse(params[2]) : params[2],
        before_state: typeof params[3] === 'string' ? JSON.parse(params[3]) : params[3],
        after_state: typeof params[4] === 'string' ? JSON.parse(params[4]) : params[4],
        impact_summary: typeof params[5] === 'string' ? JSON.parse(params[5]) : params[5],
        ai_reasoning: params[6],
        created_at: new Date().toISOString(),
      };
      this.tables.simulation_runs.push(rec);
      return { rows: [rec], rowCount: 1 };
    }
    if (upper.startsWith('INSERT INTO OPTIMIZATION_RUNS')) {
      const rec = {
        id: this.nextId('optimization_runs'),
        run_id: params[0],
        type: params[1],
        trigger_type: params[2],
        recommendations_generated: params[3] || 1,
        recommendations_applied: params[4] || 0,
        total_time_saved_min: params[5] || 0,
        total_distance_saved_km: params[6] || 0,
        total_cost_saved_inr: params[7] || 0,
        status: params[8] || 'completed',
        created_at: new Date().toISOString(),
      };
      this.tables.optimization_runs.push(rec);
      return { rows: [rec], rowCount: 1 };
    }
    if (upper.includes('FROM ACTIVITY_LOGS')) {
      let res = [...this.tables.activity_logs];
      if (upper.includes('ENTITY_TYPE = $1')) res = res.filter(a => a.entity_type === params[0]);
      if (upper.includes('ENTITY_ID = $2')) res = res.filter(a => Number(a.entity_id) === Number(params[1]) || String(a.entity_id) === String(params[1]));
      return { rows: res };
    }
    if (upper.startsWith('INSERT INTO ACTIVITY_LOGS')) {
      const rec = {
        id: this.nextId('activity_logs'),
        action: params[0],
        entity_type: params[1],
        entity_id: params[2],
        details: params[3],
        user_id: params[4],
        created_at: new Date().toISOString(),
      };
      this.tables.activity_logs.push(rec);
      return { rows: [rec], rowCount: 1 };
    }

    // 19. UPDATES
    if (upper.startsWith('UPDATE AI_RECOMMENDATIONS')) {
      const id = Number(params[params.length - 1]);
      const rec = this.tables.ai_recommendations.find(r => r.id === id || r.recommendation_id === String(params[params.length - 1]));
      if (rec) {
        if (upper.includes("SET STATUS = 'APPLIED'") || (params[0] === 'applied')) {
          rec.status = 'applied';
          rec.applied_at = new Date().toISOString();
        } else if (upper.includes("SET STATUS = 'REJECTED'") || (params[0] === 'rejected')) {
          rec.status = 'rejected';
        } else if (upper.includes("SET STATUS = 'APPROVED'") || (params[0] === 'approved')) {
          rec.status = 'approved';
        }
        rec.updated_at = new Date().toISOString();
        return { rows: [rec], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (upper.startsWith('UPDATE TRIPS')) {
      if (upper.includes('SET RISK_SCORE = $1 WHERE ID = $2')) {
        const t = this.tables.trips.find(x => x.id === Number(params[1]));
        if (t) t.risk_score = params[0];
        return { rows: t ? [t] : [], rowCount: t ? 1 : 0 };
      }
      if (upper.includes('SET STATUS = $1')) {
        const t = this.tables.trips.find(x => x.id === Number(params[1]));
        if (t) t.status = params[0];
        return { rows: t ? [t] : [], rowCount: t ? 1 : 0 };
      }
      if (upper.includes('PROGRESS_PERCENT = $1')) {
        const t = this.tables.trips.find(x => x.id === Number(params[2]));
        if (t) {
          t.progress_percent = params[0];
          t.distance_km = params[1];
        }
        return { rows: t ? [t] : [], rowCount: t ? 1 : 0 };
      }
    }

    if (upper.startsWith('UPDATE VEHICLES')) {
      // Handles live GPS ping:
      // UPDATE vehicles SET lat = $1, lng = $2, speed_kmh = $3, heading_deg = $4, status = COALESCE($5, status), updated_at = NOW() WHERE (id = $6 OR vehicle_id = $7)
      if (upper.includes('SET LAT = $1')) {
        const lat = params[0];
        const lng = params[1];
        const speed = params[2];
        const heading = params[3];
        const targetId = params[params.length - 1];
        const v = this.tables.vehicles.find(x => x.id === Number(targetId) || x.vehicle_id === String(targetId));
        if (v) {
          v.lat = lat;
          v.lng = lng;
          v.speed_kmh = speed;
          v.heading_deg = heading;
          v.data_origin = 'REAL';
          v.updated_at = new Date().toISOString();
          return { rows: [v], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      const v = this.tables.vehicles.find(x => x.id === Number(params[1]));
      if (v) v.status = params[0];
      return { rows: v ? [v] : [], rowCount: v ? 1 : 0 };
    }

    if (upper.startsWith('UPDATE DELIVERIES')) {
      const d = this.tables.deliveries.find(x => x.id === Number(params[1]) || x.delivery_id === params[1]);
      if (d) {
        if (upper.includes('SET STATUS = $1')) d.status = params[0];
        d.updated_at = new Date().toISOString();
        return { rows: [d], rowCount: 1 };
      }
    }

    return { rows: [], rowCount: 0 };
  }
}

export const memoryDb = new MemoryDatabase();
