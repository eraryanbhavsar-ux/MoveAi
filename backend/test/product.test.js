import 'dotenv/config';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { query } from '../src/config/database.js';
import { calculateRisk, haversineDistance, estimateCost } from '../src/services/riskEngine.js';
import { calculateRoute, calculateTripETA } from '../src/services/routingService.js';
import { fetchLiveWeather } from '../src/services/weatherService.js';
import { previewCsvData, commitIngestedRecords, ingestGpsPing } from '../src/services/ingestionService.js';
import { runSimulation, applyRecommendation } from '../src/services/simulationEngine.js';

describe('MOVA Enterprise Smart Mobility SaaS Test Suite', () => {

  test('1. Multi-Tenant Database & Organization Isolation', async () => {
    const orgs = await query('SELECT * FROM organizations WHERE id = $1', [1]);
    assert.equal(orgs.rows.length, 1);
    assert.equal(orgs.rows[0].name, 'MOVA Logistics Demo');
    assert.equal(orgs.rows[0].slug, 'mova-logistics-demo');

    const users = await query('SELECT * FROM users WHERE organization_id = $1', [1]);
    assert.ok(users.rows.length >= 1);
    assert.equal(users.rows[0].email, 'admin@mova-demo.com');
    assert.equal(users.rows[0].role, 'ADMIN');
  });

  test('2. Real Geospatial Turn-by-Turn Routing via OSRM OpenStreetMap', async () => {
    // Mumbai (19.0760, 72.8777) to Pune (18.5204, 73.8567)
    const route = await calculateRoute(
      { lat: 18.5204, lng: 73.8567 },
      { lat: 19.0760, lng: 72.8777 }
    );

    assert.ok(route.distanceKm > 100 && route.distanceKm < 200, `Expected distance ~140-160km, got ${route.distanceKm}`);
    assert.ok(route.durationMin > 90 && route.durationMin < 240, `Expected duration ~110-180m, got ${route.durationMin}`);
    assert.ok(['OSRM-OpenStreetMap', 'TomTom-TrafficRouting', 'GoogleMaps-Directions'].includes(route.provider), `Expected real provider, got ${route.provider}`);
  });

  test('3. Real Environmental Telematics via Open-Meteo / OpenWeatherMap', async () => {
    // Weather at Mumbai Hub
    const weather = await fetchLiveWeather(19.0760, 72.8777);
    assert.equal(weather.success, true);
    assert.ok(['Open-Meteo (WMO)', 'OpenWeatherMap'].includes(weather.provider), `Expected valid weather provider, got ${weather.provider}`);
    assert.ok(typeof weather.temperatureC === 'number');
    assert.ok(typeof weather.windSpeedKmh === 'number');
    assert.ok(['none', 'low', 'medium', 'high', 'critical'].includes(weather.hazardLevel));
  });

  test('4. Deterministic Explainable Risk Engine & Score Reproducibility', () => {
    const tripData = {
      traffic_level: 'heavy',
      weather_impact: 'medium',
      predicted_delay_min: 35,
      cargo_priority: 'critical',
      driver_rating: 4.5,
      capacity_utilization: 0.85,
    };

    const riskA = calculateRisk(tripData);
    const riskB = calculateRisk(tripData);

    assert.equal(riskA.score, riskB.score, 'Risk calculation must be strictly deterministic and reproducible');
    assert.ok(riskA.score >= 0 && riskA.score <= 100, 'Score must be between 0 and 100');
    assert.ok(riskA.breakdown, 'Risk calculation must provide explainable factor breakdown');
    assert.ok(riskA.breakdown.traffic > 0);
  });

  test('5. CSV Ingestion Engine — Schema Validation & Error Rejection', () => {
    const validCsv = `vehicle_id,vehicle_type,capacity_kg\nV-TEST-01,Light Truck,2500\nV-TEST-02,Van,800`;
    const previewValid = previewCsvData(validCsv, 'vehicles');
    assert.equal(previewValid.validCount, 2);
    assert.equal(previewValid.invalidCount, 0);

    const corruptCsv = `vehicle_id,vehicle_type,capacity_kg\nV-FAIL-01,,3000\nV-FAIL-02,Truck,-50`;
    const previewCorrupt = previewCsvData(corruptCsv, 'vehicles');
    assert.equal(previewCorrupt.validCount, 0);
    assert.equal(previewCorrupt.invalidCount, 2);
    assert.ok(previewCorrupt.invalidRows[0].errors.some(e => e.includes('vehicle_type')));
    assert.ok(previewCorrupt.invalidRows[1].errors.some(e => e.includes('positive number')));
  });

  test('6. Batch CSV Ingestion — Persistent Commit with USER-PROVIDED Tag', async () => {
    const newVehicle = {
      vehicle_id: 'V-IMPORT-' + Date.now(),
      vehicle_type: 'Refrigerated Truck',
      capacity_kg: 3200,
      current_location_name: 'Vashi Hub',
      status: 'idle',
    };

    const commitRes = await commitIngestedRecords({
      organizationId: 1,
      type: 'vehicles',
      validRows: [newVehicle],
      fileName: 'test_manifest.csv',
    });

    assert.equal(commitRes.importedCount, 1);
    assert.equal(commitRes.status, 'completed');

    const check = await query('SELECT * FROM vehicles WHERE vehicle_id = $1', [newVehicle.vehicle_id]);
    assert.equal(check.rows.length, 1);
    assert.equal(check.rows[0].data_origin, 'USER-PROVIDED');
  });

  test('7. Live GPS Telematics Ping Ingestion & Dynamic Trip Recalculation', async () => {
    const pingResult = await ingestGpsPing({
      organizationId: 1,
      vehicleId: 'V001',
      latitude: 18.7546,
      longitude: 73.4062,
      speedKmh: 74,
      headingDeg: 280,
      status: 'moving',
      timestamp: new Date().toISOString(),
    });

    assert.equal(pingResult.success, true);
    assert.equal(pingResult.vehicleId, 'V001');
    assert.equal(pingResult.dataOrigin, 'REAL');

    // Verify breadcrumb stored in vehicle_locations
    const breadcrumb = await query('SELECT * FROM vehicle_locations WHERE vehicle_id = $1', [1]);
    assert.ok(breadcrumb.rows.length >= 1, 'Breadcrumb must be logged in vehicle_locations');

    // Verify vehicle's live coordinates and REAL data origin
    const vCheck = await query('SELECT * FROM vehicles WHERE id = $1', [1]);
    assert.equal(vCheck.rows[0].data_origin, 'REAL');
    assert.equal(vCheck.rows[0].lat, 18.7546);
  });

  test('8. Digital Twin Scenario Simulation — Non-Destructive What-If Evaluation', async () => {
    // Before state
    const beforeTrips = await query('SELECT * FROM trips WHERE status = $1', ['in_progress']);
    const beforeTotalRisk = beforeTrips.rows.reduce((s, t) => s + t.risk_score, 0);

    // Run what-if scenario (vehicle breakdown)
    const sim = await runSimulation('vehicle_breakdown', { vehicleId: 'V004', severity: 'critical' });

    assert.ok(sim.simulationId.startsWith('SIM-'));
    assert.ok(sim.beforeState);
    assert.ok(sim.afterState);
    assert.ok(sim.impact);
    assert.ok(sim.recommendations.length > 0);

    // Verify that running what-if did NOT mutate active production database records
    const afterTrips = await query('SELECT * FROM trips WHERE status = $1', ['in_progress']);
    const afterTotalRisk = afterTrips.rows.reduce((s, t) => s + t.risk_score, 0);
    assert.equal(beforeTotalRisk, afterTotalRisk, 'Digital Twin what-if simulation must NOT mutate production tables before approval');
  });

  test('9. Human-in-the-Loop Recommendation Approval & Database Auditability', async () => {
    const pendingRecs = await query('SELECT * FROM ai_recommendations WHERE status = $1', ['pending']);
    assert.ok(pendingRecs.rows.length > 0, 'Must have at least one pending recommendation to approve');

    const targetRec = pendingRecs.rows[0];
    const applyRes = await applyRecommendation(targetRec.id);

    assert.equal(applyRes.success, true);
    assert.ok(applyRes.appliedAt);

    // Verify status updated in database
    const updated = await query('SELECT * FROM ai_recommendations WHERE id = $1', [targetRec.id]);
    assert.equal(updated.rows[0].status, 'applied');

    // Verify audit log entry in activity_logs
    const auditLogs = await query('SELECT * FROM activity_logs WHERE entity_type = $1 AND entity_id = $2', ['recommendation', targetRec.id]);
    assert.ok(auditLogs.rows.length >= 1, 'Approval must create permanent audit trail in activity_logs');
  });

  test('10. Operational Alert System — Lifecycle & Resolution', async () => {
    const newAlert = await query(
      `INSERT INTO alerts (organization_id, alert_type, severity, title, message, entity_type, entity_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [1, 'HAZARD_TEST', 'warning', 'High Crosswinds on Sea Link', 'Speed limit restricted to 40 km/h.', 'corridor', 101, 'active']
    );

    const alertId = newAlert.rows[0].id;
    assert.ok(alertId);

    // Acknowledge alert
    const ackRes = await query('UPDATE alerts SET status = $1, acknowledged_at = NOW() WHERE id = $2 AND organization_id = $3', ['acknowledged', alertId, 1]);
    assert.equal(ackRes.rows[0].status, 'acknowledged');
    assert.ok(ackRes.rows[0].acknowledged_at);

    // Resolve alert
    const resolveRes = await query('UPDATE alerts SET status = $1, resolved_at = NOW() WHERE id = $2 AND organization_id = $3', ['resolved', alertId, 1]);
    assert.equal(resolveRes.rows[0].status, 'resolved');
    assert.ok(resolveRes.rows[0].resolved_at);
  });

});
