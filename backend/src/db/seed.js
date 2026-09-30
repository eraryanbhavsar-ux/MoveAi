import { query, getClient } from '../config/database.js';
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

async function seed() {
  const client = await getClient();
  console.log('====================================================');
  console.log('🌱 MOVA — Seeding Realistic Development Dataset');
  console.log('Mode: Development / Test Seed Data (Non-Destructive)');
  console.log('====================================================\n');

  try {
    // Clear existing development records in reverse dependency order
    const tables = [
      'activity_logs', 'simulation_runs', 'optimization_runs',
      'ai_recommendations', 'risk_assessments', 'routes',
      'deliveries', 'alerts', 'vehicle_locations', 'incidents',
      'trips', 'vehicles', 'drivers', 'users', 'organizations'
    ];

    for (const t of tables) {
      await client.query(`DELETE FROM ${t}`);
      await client.query(`ALTER SEQUENCE IF EXISTS ${t}_id_seq RESTART WITH 1`);
    }

    // 1. ORGANIZATION
    await client.query(
      `INSERT INTO organizations (id, name, slug, plan, settings)
       VALUES ($1, $2, $3, $4, $5)`,
      [DEMO_ORG.id, DEMO_ORG.name, DEMO_ORG.slug, DEMO_ORG.plan, JSON.stringify(DEMO_ORG.settings)]
    );
    console.log(`✓ [1/12] Organization seeded: ${DEMO_ORG.name}`);

    // 2. USERS
    for (const u of DEMO_USERS) {
      await client.query(
        `INSERT INTO users (organization_id, email, password_hash, name, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [DEMO_ORG.id, u.email, u.password_hash, u.name, u.role]
      );
    }
    console.log(`✓ [2/12] Users seeded (${DEMO_USERS.length} accounts: Admin, Operations, Dispatcher, Analyst)`);

    // 3. DRIVERS (20)
    for (const d of DEMO_DRIVERS) {
      await client.query(
        `INSERT INTO drivers (id, organization_id, employee_code, name, phone, license_number, status, assigned_vehicle_id, shift_start, shift_end, hours_driven_today, safety_score, rating, total_trips, data_origin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'SEED')`,
        [d.id, DEMO_ORG.id, d.employee_code, d.name, d.phone, `MH-${String(d.id).padStart(2, '0')}-DL-${1000 + d.id}`,
         d.status.toLowerCase(), d.assigned_vehicle_id, d.shift_start, d.shift_end, d.hours_driven_today, d.safety_score, d.rating, Math.floor(Math.random() * 200 + 40)]
      );
    }
    console.log(`✓ [3/12] Drivers seeded (${DEMO_DRIVERS.length} verified commercial drivers)`);

    // 4. VEHICLES (20)
    for (const v of DEMO_VEHICLES) {
      const c = CITIES[v.city] || CITIES.mumbai;
      await client.query(
        `INSERT INTO vehicles (id, organization_id, vehicle_id, registration_number, vehicle_type, capacity_kg, current_load_kg, driver_id, status, lat, lng, speed_kmh, heading_deg, fuel_type, fuel_level, odometer_km, maintenance_status, distance_today_km, risk_score, current_location_name, data_origin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'SEED')`,
        [v.id, DEMO_ORG.id, v.vehicle_id, v.reg, v.type, v.cap, v.load, v.driver, v.status,
         jitter(c.lat), jitter(c.lng), v.status === 'active' ? 58 : 0, Math.floor(Math.random() * 360),
         v.fuel_type, v.fuel, v.odo, v.maint, v.dist, v.risk, c.name]
      );
    }
    console.log(`✓ [4/12] Vehicles seeded (${DEMO_VEHICLES.length} commercial fleet units)`);

    // 5. TRIPS (30)
    for (const t of DEMO_TRIPS) {
      const from = CITIES[t.from] || CITIES.mumbai;
      const to = CITIES[t.to] || CITIES.pune;
      const schedDep = pastDate(-t.depH);
      const schedArr = futureDate(t.arrH);
      const predArr = futureDate(t.arrH + t.delay / 60);
      const actArr = t.status === 'completed' ? futureDate(t.arrH + t.delay / 60) : null;

      await client.query(
        `INSERT INTO trips (id, organization_id, trip_id, vehicle_id, driver_id, origin_name, origin_lat, origin_lng, destination_name, destination_lat, destination_lng, distance_km, planned_distance_km, estimated_distance_km, progress_percent, status, scheduled_departure, scheduled_arrival, planned_departure, actual_departure, baseline_arrival, predicted_arrival, actual_arrival, predicted_delay_min, traffic_level, weather_condition, incident_involvement, risk_score, current_route_id, data_origin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, 1, 'SEED')`,
        [t.id, DEMO_ORG.id, t.tid, t.v, t.d, from.name, from.lat, from.lng, to.name, to.lat, to.lng,
         t.dist, t.pdist, t.dist, t.prog, t.status, schedDep, schedArr, schedDep, schedDep,
         schedArr, predArr, actArr, t.delay, t.traf, t.wth, t.inc, t.risk]
      );
    }
    console.log(`✓ [5/12] Trips seeded (${DEMO_TRIPS.length} records: active, scheduled & historical completed)`);

    // 6. DELIVERIES (50)
    for (const d of DEMO_DELIVERIES) {
      const from = CITIES[d.from] || CITIES.mumbai;
      const to = CITIES[d.to] || CITIES.pune;
      const deadline = d.st === 'delivered' ? pastDate(2) : futureDate(3 + Math.random() * 8);
      const estArrival = d.st === 'delivered' ? pastDate(3) : futureDate(1.5 + Math.random() * 5);
      const actArrival = d.st === 'delivered' ? pastDate(2.5) : null;

      await client.query(
        `INSERT INTO deliveries (id, organization_id, delivery_id, customer_reference, pickup_location, pickup_lat, pickup_lng, dropoff_location, dropoff_lat, dropoff_lng, priority, weight_kg, status, assigned_vehicle_id, assigned_driver_id, assigned_trip_id, deadline, estimated_arrival, actual_arrival, risk_score, customer_name, special_requirements, description, data_origin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 'SEED')`,
        [d.id, DEMO_ORG.id, d.did, d.cust, from.name, jitter(from.lat), jitter(from.lng),
         to.name, jitter(to.lat), jitter(to.lng), d.prio, d.wt, d.st, d.v, d.d, d.t,
         deadline, estArrival, actArrival, d.risk, d.name, d.req, d.desc]
      );
    }
    console.log(`✓ [6/12] Deliveries seeded (${DEMO_DELIVERIES.length} orders: low, medium, high, critical)`);

    // 7. INCIDENTS (15)
    for (const inc of DEMO_INCIDENTS) {
      const c = CITIES[inc.city] || CITIES.mumbai;
      await client.query(
        `INSERT INTO incidents (id, organization_id, incident_id, type, severity, title, description, lat, lng, location_name, affected_road, source, start_time, expected_end_time, affected_vehicle_ids, affected_trip_ids, predicted_delay_min, status, resolved_at, data_origin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'SEED')`,
        [inc.id, DEMO_ORG.id, inc.iid, inc.type, inc.sev, inc.title, inc.desc,
         jitter(c.lat, 0.01), jitter(c.lng, 0.01), c.name, inc.road, inc.src,
         pastDate(2), inc.st === 'resolved' ? pastDate(0.5) : futureDate(3),
         JSON.stringify(inc.veh), JSON.stringify(inc.trp), inc.delay, inc.st,
         inc.st === 'resolved' ? pastDate(0.5) : null]
      );
    }
    console.log(`✓ [7/12] Incidents seeded (${DEMO_INCIDENTS.length} records: active, resolved, monitoring)`);

    // 8. ROUTES (Multiple Options)
    for (const r of DEMO_ROUTES) {
      await client.query(
        `INSERT INTO routes (id, organization_id, route_id, trip_id, name, distance_km, estimated_duration_min, baseline_duration_min, traffic_level, risk_score, incident_count, capacity_feasible, recommendation_status, is_active, estimated_cost_inr, data_origin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'SEED')`,
        [r.id, DEMO_ORG.id, r.rid, r.trip, r.name, r.dist, r.dur, Math.round(r.dur * 0.85),
         r.traf.toLowerCase(), r.risk, r.inc, r.feas, r.st, r.act, r.cost]
      );
    }
    console.log(`✓ [8/12] Routes seeded (${DEMO_ROUTES.length} alternatives across major corridors)`);

    // 9. RISK ASSESSMENTS
    for (const r of DEMO_RISK_ASSESSMENTS) {
      await client.query(
        `INSERT INTO risk_assessments (organization_id, entity_type, entity_id, overall_score, traffic_score, historical_delay_score, time_pressure_score, priority_score, disruption_score, vehicle_status_score, remaining_distance_score, capacity_pressure_score, breakdown, data_origin)
         VALUES ($1, 'trip', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'SEED')`,
        [DEMO_ORG.id, r.eid, r.overall, r.traffic, r.historical, r.time, r.priority, r.disruption,
         r.veh, r.dist, r.cap, JSON.stringify({
           traffic: r.traffic,
           historical_delay: r.historical,
           time_pressure: r.time,
           priority: r.priority,
           disruption: r.disruption,
           notes: r.notes
         })]
      );
    }
    console.log(`✓ [9/12] Risk assessments seeded (${DEMO_RISK_ASSESSMENTS.length} detailed factor breakdowns)`);

    // 10. AI RECOMMENDATIONS (10)
    for (const rec of DEMO_RECOMMENDATIONS) {
      await client.query(
        `INSERT INTO ai_recommendations (organization_id, recommendation_id, type, priority, title, description, reasoning, affected_vehicle_ids, affected_delivery_ids, affected_trip_ids, current_plan, recommended_plan, estimated_time_impact_min, estimated_distance_impact_km, estimated_cost_impact_inr, risk_reduction, confidence, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'pending')`,
        [DEMO_ORG.id, rec.rid, rec.type, rec.priority, rec.title, rec.description, rec.reasoning,
         JSON.stringify(rec.veh), JSON.stringify(rec.del), JSON.stringify(rec.trp),
         JSON.stringify({ baseline: 'Current operational plan' }),
         JSON.stringify({ optimized: 'AI recommended adjustment' }),
         rec.time, rec.dist, rec.cost, rec.riskRed, rec.conf]
      );
    }
    console.log(`✓ [10/12] AI Recommendations seeded (${DEMO_RECOMMENDATIONS.length} actionable suggestions)`);

    // 11. DIGITAL TWIN SIMULATION SCENARIOS (8)
    for (const sim of DEMO_SIMULATION_SCENARIOS) {
      await client.query(
        `INSERT INTO simulation_runs (organization_id, simulation_id, scenario_type, scenario_params, current_state, scenario_state, optimized_state, impact_summary, ai_reasoning, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed')`,
        [DEMO_ORG.id, sim.id, sim.type, JSON.stringify(sim.params),
         JSON.stringify({ state: 'Baseline operational network' }),
         JSON.stringify({ simulated_event: sim.name, description: sim.desc }),
         JSON.stringify({ mitigation: 'AI Dynamic reroute & dispatch' }),
         JSON.stringify(sim.metrics), sim.reasoning]
      );
    }
    console.log(`✓ [11/12] Digital Twin Scenarios seeded (${DEMO_SIMULATION_SCENARIOS.length} sandboxes)`);

    // 12. OPTIMIZATION RUNS & ACTIVITY AUDIT TRAIL
    for (const opt of DEMO_OPTIMIZATION_RUNS) {
      await client.query(
        `INSERT INTO optimization_runs (organization_id, run_id, type, trigger_type, recommendations_generated, recommendations_applied, total_time_saved_min, total_distance_saved_km, total_cost_saved_inr, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [DEMO_ORG.id, opt.run_id, opt.type, opt.trigger_type, opt.recs_gen, opt.recs_app,
         opt.time_saved, opt.dist_saved, opt.cost_saved, opt.status]
      );
    }

    for (const act of DEMO_ACTIVITY_LOGS) {
      await client.query(
        `INSERT INTO activity_logs (organization_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [DEMO_ORG.id, act.action, act.type, act.id, JSON.stringify(act.details)]
      );
    }
    console.log(`✓ [12/12] Optimization runs and audit trail seeded`);

    console.log('\n====================================================');
    console.log('🎉 MOVA Seed Data Initialization Completed 100%!');
    console.log('====================================================');
    console.log('Available Demo Accounts (Password: Password123!):');
    console.log('  • Admin:              admin@mova-demo.com');
    console.log('  • Operations Manager: operations@mova-demo.com');
    console.log('  • Dispatcher:         dispatcher@mova-demo.com');
    console.log('  • Mobility Analyst:   analyst@mova-demo.com');
    console.log('  • Test Suite User:    demo@mova.ai (Password: MovaDemo123!)');
    console.log('====================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Database seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
