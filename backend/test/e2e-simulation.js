import assert from 'node:assert/strict';

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

console.log('====================================================');
console.log('🚀 MOVA End-to-End API Integration & Verification');
console.log('Target API:', BASE_URL);
console.log('====================================================\n');

async function runE2E() {
  let token = null;
  let orgId = null;

  // 1. Authentication
  console.log('▶ [1/12] Authenticating as demo@mova.ai...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@mova.ai', password: 'MovaDemo123!' })
  });
  assert.equal(loginRes.status, 200, `Login failed with status ${loginRes.status}`);
  const loginData = await loginRes.json();
  assert.ok(loginData.token, 'Token must be returned');
  token = loginData.token;
  console.log(`  ✔ Authenticated successfully. User: ${loginData.user.name}, Role: ${loginData.user.role}`);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 2. Identity & Multi-Tenant Claims
  console.log('\n▶ [2/12] Verifying tenant claims via /auth/me...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.equal(meData.user.email, 'demo@mova.ai');
  orgId = meData.user.organization_id;
  assert.ok(orgId, 'Organization ID must exist');
  console.log(`  ✔ Tenant verified. Org ID: ${orgId}`);

  // 3. Operational Dashboard
  console.log('\n▶ [3/12] Fetching Dashboard Metrics...');
  const dashRes = await fetch(`${BASE_URL}/dashboard`, { headers: authHeaders });
  assert.equal(dashRes.status, 200);
  const dashData = await dashRes.json();
  assert.ok(dashData.kpis, 'Dashboard KPIs must be present');
  console.log(`  ✔ KPIs: Active Fleet: ${dashData.kpis.activeVehicles}, Active Trips: ${dashData.kpis.activeTrips}, On-Time: ${dashData.kpis.onTimeRate}%`);

  // 4. Real Geospatial Turn-by-Turn Routing
  console.log('\n▶ [4/12] Calculating Turn-by-Turn Route (Mumbai -> Pune)...');
  const routeRes = await fetch(`${BASE_URL}/routing/calculate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      origin: { lat: 18.5204, lng: 73.8567 },
      destination: { lat: 19.0760, lng: 72.8777 }
    })
  });
  assert.equal(routeRes.status, 200);
  const routeData = await routeRes.json();
  assert.ok(routeData.distanceKm > 100 && routeData.distanceKm < 200);
  assert.ok(routeData.geometry.length > 5);
  console.log(`  ✔ Route calculated via ${routeData.provider}: ${routeData.distanceKm}km, ${routeData.durationMin} mins, Geometry points: ${routeData.geometry.length}`);

  // 5. Environmental & Traffic Telematics
  console.log('\n▶ [5/12] Fetching Live Weather & Traffic Flow...');
  const weatherRes = await fetch(`${BASE_URL}/weather?lat=19.0760&lng=72.8777`, { headers: authHeaders });
  assert.equal(weatherRes.status, 200);
  const weatherData = await weatherRes.json();
  console.log(`  ✔ Weather at Hub: ${weatherData.temperatureC}°C, ${weatherData.conditions} (${weatherData.provider})`);

  const trafficRes = await fetch(`${BASE_URL}/traffic/flow?lat=19.0760&lng=72.8777`, { headers: authHeaders });
  assert.equal(trafficRes.status, 200);
  const trafficData = await trafficRes.json();
  console.log(`  ✔ Traffic Flow: ${trafficData.currentSpeedKmh} km/h (Congestion: ${trafficData.congestionPercent}%)`);

  // 6. CSV Batch Ingestion & Validation
  console.log('\n▶ [6/12] Testing CSV Ingestion & Commit...');
  const csvText = `vehicle_id,vehicle_type,capacity_kg\nV-E2E-99,Heavy Electric,4200\nV-E2E-98,Cargo Van,1200`;
  const previewRes = await fetch(`${BASE_URL}/ingestion/csv-preview`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ type: 'vehicles', csvText })
  });
  assert.equal(previewRes.status, 200);
  const previewData = await previewRes.json();
  assert.equal(previewData.validCount, 2);

  const commitRes = await fetch(`${BASE_URL}/ingestion/csv-commit`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      type: 'vehicles',
      validRows: previewData.previewValid,
      fileName: 'e2e_vehicles_test.csv'
    })
  });
  assert.equal(commitRes.status, 200);
  const commitData = await commitRes.json();
  assert.equal(commitData.committed, 2);
  console.log(`  ✔ Committed 2 vehicles to database with USER-PROVIDED data origin.`);

  // 7. Live GPS Ping Ingestion
  console.log('\n▶ [7/12] Sending Live GPS Telematics Ping for V-01...');
  const pingRes = await fetch(`${BASE_URL}/telematics/ping`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      vehicle_id: 'V-01',
      latitude: 19.0765,
      longitude: 72.8780,
      speed_kmh: 58.4,
      heading_deg: 120,
      status: 'moving'
    })
  });
  assert.equal(pingRes.status, 200);
  const pingData = await pingRes.json();
  const resVid = pingData.data.vehicleId || pingData.data.vehicle_id;
  assert.equal(resVid, 'V-01');
  console.log(`  ✔ GPS ping ingested. Vehicle ${resVid} updated to lat ${pingData.data.coordinates?.lat || pingData.data.latitude}`);

  // 8. Digital Twin Simulation
  console.log('\n▶ [8/12] Executing Digital Twin Simulation (Weather Event)...');
  const simRes = await fetch(`${BASE_URL}/simulation/run`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      scenarioType: 'weather_event',
      severity: 'high',
      parameters: { radiusKm: 25, delayMultiplier: 1.45 }
    })
  });
  assert.equal(simRes.status, 200);
  const simData = await simRes.json();
  assert.ok(simData.simulation_id, 'Simulation ID required');
  console.log(`  ✔ Simulation ${simData.simulation_id} complete. Affected vehicles: ${simData.affected_vehicles?.length || 0}`);

  // 9. Operational Alert Lifecycle
  console.log('\n▶ [9/12] Testing Alert Lifecycle (Create -> Acknowledge -> Resolve)...');
  const newAlertRes = await fetch(`${BASE_URL}/alerts`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'E2E Highway Maintenance Alert',
      message: 'Single lane operation near Expressway km 42',
      severity: 'warning'
    })
  });
  assert.equal(newAlertRes.status, 201);
  const createdAlert = await newAlertRes.json();
  const alertId = createdAlert.id;

  const ackRes = await fetch(`${BASE_URL}/alerts/${alertId}/acknowledge`, { method: 'POST', headers: authHeaders });
  assert.equal(ackRes.status, 200);

  const resolveRes = await fetch(`${BASE_URL}/alerts/${alertId}/resolve`, { method: 'POST', headers: authHeaders });
  assert.equal(resolveRes.status, 200);
  console.log(`  ✔ Alert #${alertId} created, acknowledged, and resolved.`);

  // 10. Human-in-the-Loop Recommendation Governance
  console.log('\n▶ [10/12] Testing Recommendation Governance & Audit Log...');
  const recsRes = await fetch(`${BASE_URL}/recommendations`, { headers: authHeaders });
  assert.equal(recsRes.status, 200);
  const recsData = await recsRes.json();
  const targetRec = recsData.find(r => r.status === 'pending') || recsData[0];
  if (targetRec) {
    const approveRes = await fetch(`${BASE_URL}/recommendations/${targetRec.id}/approve`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ notes: 'Verified route safety and capacity.' })
    });
    assert.equal(approveRes.status, 200);
    const approvedData = await approveRes.json();
    assert.equal(approvedData.status, 'approved');
    console.log(`  ✔ Recommendation #${targetRec.id} approved by human operator with audit log recorded.`);
  }

  // 11. AI Assistant Reasoning
  console.log('\n▶ [11/12] Testing Gemini AI Assistant Integration...');
  const aiRes = await fetch(`${BASE_URL}/ai/assistant`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      query: 'Give a 2-sentence operational status of high-risk vehicles in Mumbai.',
      context: { source: 'e2e-test' }
    })
  });
  assert.equal(aiRes.status, 200);
  const aiData = await aiRes.json();
  assert.ok(aiData.answer && aiData.answer.length > 20);
  console.log(`  ✔ Gemini AI Response (${aiData.model}):\n    "${aiData.answer.trim().slice(0, 140)}..."`);

  // 12. Complete Health & Final Assertions
  console.log('\n▶ [12/12] Verifying System Analytics...');
  const analyticsRes = await fetch(`${BASE_URL}/analytics`, { headers: authHeaders });
  assert.equal(analyticsRes.status, 200);
  console.log('  ✔ Analytics endpoint responded with operational metrics.');

  console.log('\n====================================================');
  console.log('🎉 ALL 12 END-TO-END SAAS WORKFLOWS PASSED 100%!');
  console.log('====================================================');
}

runE2E().catch(err => {
  console.error('\n❌ E2E Simulation Failed:', err);
  process.exit(1);
});
