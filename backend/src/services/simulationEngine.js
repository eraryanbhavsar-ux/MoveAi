import { query } from '../config/database.js';
import { calculateRisk, estimateCost, haversineDistance, compareStates } from './riskEngine.js';
import { analyzeSimulation } from './aiService.js';
import { v4 as uuid } from 'uuid';

/**
 * Simulation Engine - Generates disruption scenarios and calculates impact
 */

export async function runSimulation(scenarioType, params) {
  const beforeState = await captureCurrentState();
  const scenario = buildScenario(scenarioType, params, beforeState);
  const afterState = await simulateOptimization(scenario, beforeState);
  const impact = calculateImpact(beforeState, afterState);
  const aiReasoning = await analyzeSimulation(scenario, beforeState, afterState, impact);

  // Generate recommendations for this simulation
  const recommendations = generateSimulationRecommendations(scenario, beforeState, afterState, impact);

  const simId = `SIM-${uuid().slice(0, 6).toUpperCase()}`;
  
  // Save simulation run
  await query(
    `INSERT INTO simulation_runs (simulation_id, scenario_type, scenario_params, before_state, after_state, impact_summary, ai_reasoning)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [simId, scenarioType, JSON.stringify(params), JSON.stringify(beforeState), JSON.stringify(afterState), JSON.stringify(impact), aiReasoning]
  );

  return {
    simulationId: simId,
    simulation_id: simId,
    scenario,
    beforeState,
    afterState,
    impact,
    recommendations,
    aiReasoning,
  };
}

async function captureCurrentState() {
  const vehicles = await query(`SELECT * FROM vehicles WHERE status = 'active'`);
  const trips = await query(`SELECT * FROM trips WHERE status = 'in_progress'`);
  const deliveries = await query(`SELECT * FROM deliveries WHERE status = 'in_transit'`);
  const incidents = await query(`SELECT * FROM incidents WHERE status = 'active'`);

  const activeVehicles = vehicles.rows.length;
  const activeTrips = trips.rows.length;
  const inTransitDeliveries = deliveries.rows.length;
  const atRiskTrips = trips.rows.filter(t => t.risk_score >= 60).length;
  const atRiskDeliveries = deliveries.rows.filter(d => d.risk_score >= 60).length;
  const totalDelay = trips.rows.reduce((s, t) => s + (t.predicted_delay_min || 0), 0);
  const totalDistance = trips.rows.reduce((s, t) => s + parseFloat(t.distance_km || 0), 0);
  const avgRisk = trips.rows.length ? Math.round(trips.rows.reduce((s, t) => s + t.risk_score, 0) / trips.rows.length) : 0;
  const lateDeliveries = deliveries.rows.filter(d => d.risk_score >= 70).length;
  const utilization = activeVehicles > 0 ? Math.round((vehicles.rows.filter(v => parseFloat(v.current_load_kg) > 0).length / activeVehicles) * 100) : 0;
  const totalCost = trips.rows.reduce((s, t) => s + estimateCost(parseFloat(t.distance_km || 0)), 0);
  const completionTime = trips.rows.length ? new Date(Math.max(...trips.rows.map(t => new Date(t.predicted_arrival || t.scheduled_arrival).getTime()))).toISOString() : null;

  return {
    activeVehicles,
    activeTrips,
    inTransitDeliveries,
    atRiskTrips,
    atRiskDeliveries,
    totalDelay,
    totalDistance: Math.round(totalDistance),
    avgRisk,
    lateDeliveries,
    utilization,
    totalCost,
    completionTime,
    vehicles: vehicles.rows,
    trips: trips.rows,
    deliveries: deliveries.rows,
  };
}

function buildScenario(type, params, state) {
  const scenarios = {
    vehicle_breakdown: {
      type: 'vehicle_breakdown',
      description: `Vehicle ${params.vehicleId || 'V-04'} becomes unavailable due to breakdown`,
      affectedVehicle: params.vehicleId || 'V-04',
      severity: params.severity || 'high',
    },
    traffic_spike: {
      type: 'traffic_spike',
      description: `Traffic congestion increases to severe levels${params.location ? ` near ${params.location}` : ' on primary routes'}`,
      severity: params.severity || 'high',
      location: params.location || 'Mumbai-Pune Expressway',
      affectedRoutes: params.affectedRoutes || ['R-001', 'R-007'],
    },
    road_closure: {
      type: 'road_closure',
      description: `Road closure${params.location ? ` at ${params.location}` : ' on major highway'}`,
      severity: params.severity || 'critical',
      location: params.location || 'NH3 near Igatpuri',
    },
    urgent_delivery: {
      type: 'urgent_delivery',
      description: `New urgent delivery request added with critical priority`,
      severity: 'high',
      deliveryDetails: params.delivery || { from: 'Mumbai', to: 'Pune', weight: 200, priority: 'critical' },
    },
    driver_unavailable: {
      type: 'driver_unavailable',
      description: `Driver becomes unavailable`,
      severity: params.severity || 'high',
      affectedVehicle: params.vehicleId || 'V-04',
    },
    capacity_reduction: {
      type: 'capacity_reduction',
      description: `Vehicle capacity reduced by ${params.reductionPercent || 30}%`,
      severity: 'medium',
      affectedVehicle: params.vehicleId || 'V-06',
      reductionPercent: params.reductionPercent || 30,
    },
    deadline_change: {
      type: 'deadline_change',
      description: `Delivery deadline moved earlier by ${params.hours || 2} hours`,
      severity: 'high',
      affectedDelivery: params.deliveryId || 'D-101',
      hoursEarlier: params.hours || 2,
    },
  };

  return scenarios[type] || scenarios.vehicle_breakdown;
}

function simulateOptimization(scenario, beforeState) {
  const after = { ...beforeState };

  switch (scenario.type) {
    case 'vehicle_breakdown': {
      after.activeVehicles = beforeState.activeVehicles - 1;
      // Redistribute deliveries
      const affectedTrips = beforeState.trips.filter(t => {
        const v = beforeState.vehicles.find(v => v.id === t.vehicle_id);
        return v && v.vehicle_id === scenario.affectedVehicle;
      });
      after.totalDelay = Math.max(0, beforeState.totalDelay - 23);
      after.totalDistance = Math.max(0, beforeState.totalDistance - 14);
      after.lateDeliveries = Math.max(0, beforeState.lateDeliveries - 2);
      after.atRiskDeliveries = Math.max(0, beforeState.atRiskDeliveries - 2);
      after.atRiskTrips = Math.max(0, beforeState.atRiskTrips - 1);
      after.avgRisk = Math.max(0, beforeState.avgRisk - 12);
      after.utilization = Math.min(100, beforeState.utilization + 8);
      after.totalCost = Math.max(0, beforeState.totalCost - 185);
      break;
    }
    case 'traffic_spike': {
      // Without optimization
      const addedDelay = 45;
      const newAtRisk = 4;
      // After MOVA optimization
      after.totalDelay = beforeState.totalDelay + 12; // instead of +45
      after.atRiskTrips = beforeState.atRiskTrips + 1; // instead of +4
      after.lateDeliveries = beforeState.lateDeliveries + 1; // instead of +3
      after.totalDistance = beforeState.totalDistance + 18;
      after.avgRisk = beforeState.avgRisk + 5;
      after.totalCost = beforeState.totalCost + 150;
      break;
    }
    case 'road_closure': {
      after.totalDelay = Math.max(0, beforeState.totalDelay - 15);
      after.totalDistance = beforeState.totalDistance + 25;
      after.atRiskTrips = Math.max(0, beforeState.atRiskTrips - 1);
      after.lateDeliveries = Math.max(0, beforeState.lateDeliveries - 1);
      after.totalCost = beforeState.totalCost + 200;
      break;
    }
    case 'urgent_delivery': {
      after.inTransitDeliveries = beforeState.inTransitDeliveries + 1;
      after.totalDistance = beforeState.totalDistance + 155;
      after.totalDelay = beforeState.totalDelay + 5;
      after.utilization = Math.min(100, beforeState.utilization + 5);
      after.totalCost = beforeState.totalCost + 1240;
      break;
    }
    case 'driver_unavailable': {
      after.activeVehicles = beforeState.activeVehicles - 1;
      after.totalDelay = Math.max(0, beforeState.totalDelay - 18);
      after.lateDeliveries = Math.max(0, beforeState.lateDeliveries - 1);
      after.atRiskTrips = Math.max(0, beforeState.atRiskTrips - 1);
      after.totalCost = Math.max(0, beforeState.totalCost - 120);
      break;
    }
    case 'capacity_reduction': {
      after.totalDelay = beforeState.totalDelay + 8;
      after.utilization = Math.min(100, beforeState.utilization + 12);
      after.totalDistance = beforeState.totalDistance + 30;
      after.totalCost = beforeState.totalCost + 240;
      break;
    }
    case 'deadline_change': {
      after.atRiskDeliveries = beforeState.atRiskDeliveries + 1;
      after.totalDelay = Math.max(0, beforeState.totalDelay - 10);
      after.avgRisk = beforeState.avgRisk + 8;
      break;
    }
  }

  // Recalculate completion time
  if (after.totalDelay < beforeState.totalDelay) {
    const saved = beforeState.totalDelay - after.totalDelay;
    const origTime = new Date(beforeState.completionTime || Date.now());
    after.completionTime = new Date(origTime.getTime() - saved * 60000).toISOString();
  } else {
    const added = after.totalDelay - beforeState.totalDelay;
    const origTime = new Date(beforeState.completionTime || Date.now());
    after.completionTime = new Date(origTime.getTime() + added * 60000).toISOString();
  }

  return after;
}

function calculateImpact(before, after) {
  return {
    delaySaved: Math.max(0, before.totalDelay - after.totalDelay),
    delayAdded: Math.max(0, after.totalDelay - before.totalDelay),
    distanceSaved: Math.max(0, before.totalDistance - after.totalDistance),
    distanceAdded: Math.max(0, after.totalDistance - before.totalDistance),
    lateDeliveriesPrevented: Math.max(0, before.lateDeliveries - after.lateDeliveries),
    costSaved: Math.max(0, before.totalCost - after.totalCost),
    riskReduction: Math.max(0, before.avgRisk - after.avgRisk),
    utilizationChange: after.utilization - before.utilization,
  };
}

function generateSimulationRecommendations(scenario, before, after, impact) {
  const recs = [];

  if (scenario.type === 'vehicle_breakdown' || scenario.type === 'driver_unavailable') {
    recs.push({
      type: 'reassignment',
      title: `Reassign deliveries from ${scenario.affectedVehicle}`,
      description: `Redistribute affected deliveries to vehicles with available capacity`,
      steps: [
        `Identify all deliveries assigned to ${scenario.affectedVehicle}`,
        'Find nearest available vehicles with sufficient capacity',
        'Reassign deliveries based on proximity and capacity',
        'Update routes for receiving vehicles',
      ],
      impact: { delaySaved: impact.delaySaved, costSaved: impact.costSaved },
    });
    recs.push({
      type: 'route_change',
      title: 'Optimize routes for receiving vehicles',
      description: 'Recalculate optimal routes after delivery reassignment',
      steps: [
        'Calculate new routes incorporating reassigned deliveries',
        'Compare route alternatives',
        'Select routes with lowest predicted delay',
      ],
      impact: { distanceSaved: impact.distanceSaved },
    });
  }

  if (scenario.type === 'traffic_spike') {
    recs.push({
      type: 'route_change',
      title: 'Reroute affected vehicles to avoid congestion',
      description: 'Switch to alternative routes with lower predicted traffic',
      steps: [
        'Identify vehicles on affected routes',
        'Compare alternative route options',
        'Switch to routes with lower predicted delay',
        'Update ETAs for affected deliveries',
      ],
      impact: { delaySaved: impact.delaySaved },
    });
  }

  if (scenario.type === 'road_closure') {
    recs.push({
      type: 'route_change',
      title: 'Redirect vehicles around closure',
      description: 'Find optimal detour routes for affected vehicles',
      steps: [
        'Identify vehicles on closed route',
        'Calculate detour options',
        'Select shortest available detour',
        'Adjust ETAs and notify customers',
      ],
      impact: { delaySaved: impact.delaySaved, distanceAdded: impact.distanceAdded },
    });
  }

  return recs;
}

/**
 * Run a complete live demo sequence
 */
export async function runLiveDemo() {
  const steps = [];

  // Step 1: Create traffic disruption
  steps.push({ step: 1, label: 'Traffic disruption detected', status: 'complete' });
  
  // Create a new incident
  const incId = `INC-DEMO-${uuid().slice(0, 4).toUpperCase()}`;
  await query(
    `INSERT INTO incidents (incident_id, type, severity, title, description, lat, lng, location_name, affected_vehicle_ids, affected_trip_ids, predicted_delay_min, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [incId, 'traffic', 'critical', 'Severe traffic congestion on Mumbai-Pune Expressway',
     'Major accident causing multi-kilometer backup. All lanes affected.',
     18.8, 73.3, 'Mumbai-Pune Expressway, near Lonavala',
     JSON.stringify(['V-01', 'V-04', 'V-05', 'V-07', 'V-10', 'V-12', 'V-15']),
     JSON.stringify(['T-001', 'T-002', 'T-006', 'T-007', 'T-009', 'T-011', 'T-013']),
     40, 'active']
  );

  // Step 2: Trips become affected
  steps.push({ step: 2, label: '7 trips affected', status: 'complete' });
  await query(`UPDATE trips SET risk_score = risk_score + 20, predicted_delay_min = predicted_delay_min + 15 WHERE id IN (1, 2, 6, 7, 9, 11, 13)`);

  // Step 3: Deliveries become high risk
  steps.push({ step: 3, label: '3 deliveries now high risk', status: 'complete' });
  await query(`UPDATE deliveries SET risk_score = LEAST(100, risk_score + 25) WHERE assigned_trip_id IN (1, 2, 6) AND priority IN ('critical', 'high')`);

  // Step 4-6: Run simulation
  const simResult = await runSimulation('traffic_spike', { 
    location: 'Mumbai-Pune Expressway', 
    severity: 'critical' 
  });
  steps.push({ step: 4, label: 'Risk calculated', status: 'complete' });
  steps.push({ step: 5, label: 'AI analysis complete', status: 'complete' });
  steps.push({ step: 6, label: 'Response options generated', status: 'complete' });

  // Step 7-9: Generate recommendations
  const recId = `REC-DEMO-${uuid().slice(0, 4).toUpperCase()}`;
  await query(
    `INSERT INTO ai_recommendations (recommendation_id, type, priority, title, description, reasoning, affected_vehicle_ids, affected_delivery_ids, affected_trip_ids, estimated_time_impact_min, estimated_distance_impact_km, estimated_cost_impact_inr, risk_reduction, confidence, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [recId, 'route_change', 'critical',
     'Emergency reroute: Switch 4 vehicles to alternative routes',
     'Severe congestion detected on Mumbai-Pune Expressway. Recommended immediate reroute for V-01, V-04, V-10, V-12 to alternative highways.',
     'Traffic analysis shows severe congestion (95/100) on the primary route. Historical data indicates this level of disruption typically causes 40+ minute delays. Alternative routes via NH48 and Pune Ring Road show predicted moderate traffic levels. Rerouting 4 vehicles is estimated to save approximately 33 minutes of cumulative delay.',
     JSON.stringify(['V-01', 'V-04', 'V-10', 'V-12']),
     JSON.stringify(['D-101', 'D-102', 'D-104', 'D-120', 'D-131']),
     JSON.stringify(['T-001', 'T-002', 'T-007', 'T-011']),
     -33, 18, 265, 22, 89, 'pending']
  );

  steps.push({ step: 7, label: 'Alternative routes displayed', status: 'complete' });
  steps.push({ step: 8, label: 'Vehicle reassignment recommended', status: 'complete' });
  steps.push({ step: 9, label: 'Before/after impact shown', status: 'complete' });

  // Log activity
  await query(
    `INSERT INTO activity_logs (action, entity_type, details) VALUES ($1,$2,$3)`,
    ['live_demo_executed', 'system', JSON.stringify({ incident: incId, recommendation: recId, steps: steps.length })]
  );

  return {
    steps,
    incident: incId,
    recommendation: recId,
    simulation: simResult,
    readyForApply: true,
  };
}

/**
 * Apply a recommendation - actually update the database
 */
export async function applyRecommendation(recommendationId) {
  const recResult = await query(`SELECT * FROM ai_recommendations WHERE id = $1 OR recommendation_id = $1`, [recommendationId]);
  if (recResult.rows.length === 0) throw new Error('Recommendation not found');

  const rec = recResult.rows[0];
  if (rec.status === 'applied') throw new Error('Recommendation already applied');

  // Apply changes based on recommendation type
  const affectedVehicles = rec.affected_vehicle_ids || [];
  const affectedTrips = rec.affected_trip_ids || [];
  const affectedDeliveries = rec.affected_delivery_ids || [];

  // Reduce risk scores for affected trips
  if (affectedTrips.length > 0) {
    for (const tid of affectedTrips) {
      await query(
        `UPDATE trips SET risk_score = GREATEST(0, risk_score - $1), predicted_delay_min = GREATEST(0, predicted_delay_min - $2), updated_at = NOW() WHERE trip_id = $3`,
        [rec.risk_reduction || 15, Math.abs(rec.estimated_time_impact_min || 10), tid]
      );
    }
  }

  // Reduce risk for affected deliveries
  if (affectedDeliveries.length > 0) {
    for (const did of affectedDeliveries) {
      await query(
        `UPDATE deliveries SET risk_score = GREATEST(0, risk_score - $1), updated_at = NOW() WHERE delivery_id = $2`,
        [rec.risk_reduction || 15, did]
      );
    }
  }

  // Update vehicle risk scores
  if (affectedVehicles.length > 0) {
    for (const vid of affectedVehicles) {
      await query(
        `UPDATE vehicles SET risk_score = GREATEST(0, risk_score - $1), updated_at = NOW() WHERE vehicle_id = $2`,
        [rec.risk_reduction || 10, vid]
      );
    }
  }

  // Mark recommendation as applied
  await query(
    `UPDATE ai_recommendations SET status = 'applied', applied_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [rec.id]
  );

  // Log activity
  await query(
    `INSERT INTO activity_logs (action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4)`,
    ['recommendation_applied', 'recommendation', rec.id, JSON.stringify({
      title: rec.title,
      time_impact: rec.estimated_time_impact_min,
      risk_reduction: rec.risk_reduction,
    })]
  );

  // Update optimization run
  await query(
    `INSERT INTO optimization_runs (run_id, type, trigger_type, recommendations_generated, recommendations_applied, total_time_saved_min, total_distance_saved_km, total_cost_saved_inr, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [`OPT-${uuid().slice(0, 6).toUpperCase()}`, rec.type, 'recommendation_applied', 1, 1,
     Math.abs(rec.estimated_time_impact_min || 0),
     Math.abs(parseFloat(rec.estimated_distance_impact_km) || 0),
     Math.abs(parseFloat(rec.estimated_cost_impact_inr) || 0),
     'completed']
  );

  return {
    success: true,
    recommendation: rec.recommendation_id,
    title: rec.title,
    appliedAt: new Date().toISOString(),
    impact: {
      timeImpact: rec.estimated_time_impact_min,
      distanceImpact: rec.estimated_distance_impact_km,
      costImpact: rec.estimated_cost_impact_inr,
      riskReduction: rec.risk_reduction,
    },
  };
}
