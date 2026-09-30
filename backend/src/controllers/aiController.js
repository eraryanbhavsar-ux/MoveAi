import { query } from '../config/database.js';
import { generateRecommendation, assistantQuery, isGeminiAvailable, setApiKey } from '../services/aiService.js';
import { runSimulation, applyRecommendation, runLiveDemo } from '../services/simulationEngine.js';
import { calculateRoute } from '../services/routingService.js';
import { fetchLiveWeather } from '../services/weatherService.js';
import { fetchLiveTrafficFlow } from '../services/trafficService.js';

export async function getRecommendations(req, res, next) {
  try {
    const { status } = req.query;
    let sql = `SELECT * FROM ai_recommendations`;
    if (status && status !== 'all') {
      sql += ` WHERE status = $1`;
      const result = await query(sql, [status]);
      return res.json(result.rows);
    }
    sql += ` ORDER BY CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END, created_at DESC`;
    const result = await query(sql);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function applyRec(req, res, next) {
  try {
    const { id } = req.params;
    const result = await applyRecommendation(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function approveRec(req, res, next) {
  try {
    const { id } = req.params;
    const result = await applyRecommendation(id);
    await query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, details, user_id) VALUES ($1,$2,$3,$4,$5)`,
      ['recommendation_approved', 'recommendation', id, JSON.stringify({ approved_by: req.user?.name }), req.user?.id]
    );
    res.json({ ...result, status: 'approved' });
  } catch (err) {
    next(err);
  }
}

export async function rejectRec(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    await query(
      `UPDATE ai_recommendations SET status = 'rejected', updated_at = NOW() WHERE id = $1 OR recommendation_id = $1`,
      [id]
    );
    await query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, details, user_id) VALUES ($1,$2,$3,$4,$5)`,
      ['recommendation_rejected', 'recommendation', id, JSON.stringify({ rejected_by: req.user?.name, reason }), req.user?.id]
    );
    res.json({ success: true, status: 'rejected', message: 'Recommendation rejected by operator', id, reason });
  } catch (err) {
    next(err);
  }
}

export async function optimizeTrip(req, res, next) {
  try {
    const { tripId } = req.body;
    // Get trip data with routes
    const tripRes = await query(
      `SELECT t.*, v.vehicle_id as vehicle_code, v.capacity_kg, v.current_load_kg
       FROM trips t LEFT JOIN vehicles v ON t.vehicle_id = v.id
       WHERE t.id = $1 OR t.trip_id = $1`, [tripId]
    );
    if (tripRes.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });

    const trip = tripRes.rows[0];
    const routesRes = await query(`SELECT * FROM routes WHERE trip_id = $1`, [trip.id]);
    const deliveriesRes = await query(`SELECT * FROM deliveries WHERE assigned_trip_id = $1`, [trip.id]);

    const activeRoute = routesRes.rows.find(r => r.is_active);
    const altRoutes = routesRes.rows.filter(r => !r.is_active);

    const context = {
      scenario: `Optimize trip ${trip.trip_id} (${trip.origin_name} → ${trip.destination_name})`,
      affectedVehicles: [trip.vehicle_code],
      affectedDeliveries: deliveriesRes.rows.map(d => d.delivery_id),
      currentRisk: trip.risk_score,
      alternatives: altRoutes.map(r => ({
        name: r.name,
        distance: r.distance_km,
        duration: r.estimated_duration_min,
        risk: r.risk_score,
        cost: r.estimated_cost_inr,
      })),
      timeImpact: activeRoute && altRoutes[0] ? (altRoutes[0].estimated_duration_min - activeRoute.estimated_duration_min) : -15,
      distanceImpact: activeRoute && altRoutes[0] ? parseFloat(altRoutes[0].distance_km) - parseFloat(activeRoute.distance_km) : 5,
      costImpact: activeRoute && altRoutes[0] ? parseFloat(altRoutes[0].estimated_cost_inr) - parseFloat(activeRoute.estimated_cost_inr) : 50,
      riskReduction: activeRoute && altRoutes[0] ? activeRoute.risk_score - altRoutes[0].risk_score : 20,
      confidence: 88,
    };

    const recommendation = await generateRecommendation(context);

    res.json({
      trip: {
        id: trip.trip_id,
        origin: trip.origin_name,
        destination: trip.destination_name,
        currentRisk: trip.risk_score,
        predictedDelay: trip.predicted_delay_min,
      },
      currentRoute: activeRoute ? {
        name: activeRoute.name,
        distance: activeRoute.distance_km,
        duration: activeRoute.estimated_duration_min,
        risk: activeRoute.risk_score,
        cost: activeRoute.estimated_cost_inr,
        traffic: activeRoute.traffic_level,
      } : null,
      alternativeRoutes: altRoutes.map(r => ({
        name: r.name,
        distance: r.distance_km,
        duration: r.estimated_duration_min,
        risk: r.risk_score,
        cost: r.estimated_cost_inr,
        traffic: r.traffic_level,
      })),
      recommendation,
      aiAvailable: isGeminiAvailable(),
    });
  } catch (err) {
    next(err);
  }
}

export async function runSim(req, res, next) {
  try {
    const { scenarioType, params } = req.body;
    const result = await runSimulation(scenarioType || 'vehicle_breakdown', params || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function assistant(req, res, next) {
  try {
    const question = req.body.question || req.body.query || req.body.prompt || req.body.message;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    // Gather context from database
    const [vehiclesRes, tripsRes, deliveriesRes, incidentsRes, recsRes] = await Promise.all([
      query(`SELECT * FROM vehicles WHERE status = 'active'`),
      query(`SELECT * FROM trips WHERE status = 'in_progress' ORDER BY risk_score DESC`),
      query(`SELECT * FROM deliveries WHERE status = 'in_transit'`),
      query(`SELECT * FROM incidents WHERE status = 'active'`),
      query(`SELECT * FROM ai_recommendations WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5`),
    ]);

    const contextData = {
      activeVehicles: vehiclesRes.rows.length,
      totalDeliveries: (await query(`SELECT COUNT(*) FROM deliveries`)).rows[0].count,
      inTransitDeliveries: deliveriesRes.rows.length,
      atRiskTrips: tripsRes.rows.filter(t => t.risk_score >= 60).length,
      onTimeRate: 78,
      fleetUtilization: Math.round((vehiclesRes.rows.length / 15) * 100),
      activeIncidents: incidentsRes.rows.length,
      highRiskTrips: tripsRes.rows.filter(t => t.risk_score >= 60).slice(0, 5),
      recommendations: recsRes.rows,
      incidentList: incidentsRes.rows,
    };

    const result = await assistantQuery(question, contextData);
    res.json({
      answer: result.response,
      source: result.source || 'gemini',
      aiAvailable: isGeminiAvailable(),
      context: {
        activeVehicles: contextData.activeVehicles,
        atRiskTrips: contextData.atRiskTrips,
        activeIncidents: contextData.activeIncidents,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function liveDemo(req, res, next) {
  try {
    const result = await runLiveDemo();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAnalytics(req, res, next) {
  try {
    const [tripsRes, deliveriesRes, incidentsRes, recsRes, optsRes, vehiclesRes] = await Promise.all([
      query(`SELECT * FROM trips`),
      query(`SELECT * FROM deliveries`),
      query(`SELECT * FROM incidents`),
      query(`SELECT * FROM ai_recommendations`),
      query(`SELECT * FROM optimization_runs`),
      query(`SELECT * FROM vehicles`),
    ]);

    const trips = tripsRes.rows;
    const deliveries = deliveriesRes.rows;
    const activeTrips = trips.filter(t => t.status === 'in_progress');
    const completedTrips = trips.filter(t => t.status === 'completed');
    const recs = recsRes.rows;
    const appliedRecs = recs.filter(r => r.status === 'applied');

    // Risk distribution
    const riskDistribution = {
      low: activeTrips.filter(t => t.risk_score < 30).length,
      medium: activeTrips.filter(t => t.risk_score >= 30 && t.risk_score < 60).length,
      high: activeTrips.filter(t => t.risk_score >= 60 && t.risk_score < 80).length,
      critical: activeTrips.filter(t => t.risk_score >= 80).length,
    };

    // AI Impact
    const totalTimeSaved = optsRes.rows.reduce((s, o) => s + (o.total_time_saved_min || 0), 0);
    const totalDistSaved = optsRes.rows.reduce((s, o) => s + parseFloat(o.total_distance_saved_km || 0), 0);
    const totalCostSaved = optsRes.rows.reduce((s, o) => s + parseFloat(o.total_cost_saved_inr || 0), 0);

    res.json({
      performance: {
        onTimeRate: 78,
        avgDelay: Math.round(activeTrips.reduce((s, t) => s + (t.predicted_delay_min || 0), 0) / Math.max(1, activeTrips.length)),
        totalTrips: trips.length,
        completedTrips: completedTrips.length,
        activeTrips: activeTrips.length,
      },
      fleet: {
        totalVehicles: vehiclesRes.rows.length,
        active: vehiclesRes.rows.filter(v => v.status === 'active').length,
        idle: vehiclesRes.rows.filter(v => v.status === 'idle').length,
        maintenance: vehiclesRes.rows.filter(v => v.status === 'maintenance').length,
        utilization: Math.round((vehiclesRes.rows.filter(v => v.status === 'active').length / vehiclesRes.rows.length) * 100),
        totalDistanceToday: Math.round(vehiclesRes.rows.reduce((s, v) => s + parseFloat(v.distance_today_km || 0), 0)),
      },
      riskDistribution,
      incidents: {
        total: incidentsRes.rows.length,
        active: incidentsRes.rows.filter(i => i.status === 'active').length,
        byType: {
          traffic: incidentsRes.rows.filter(i => i.type === 'traffic').length,
          road_closure: incidentsRes.rows.filter(i => i.type === 'road_closure').length,
          vehicle_breakdown: incidentsRes.rows.filter(i => i.type === 'vehicle_breakdown').length,
          accident: incidentsRes.rows.filter(i => i.type === 'accident').length,
          weather: incidentsRes.rows.filter(i => i.type === 'weather').length,
          delivery_delay: incidentsRes.rows.filter(i => i.type === 'delivery_delay').length,
        },
      },
      aiImpact: {
        tripsAnalyzed: trips.length,
        recommendationsGenerated: recs.length,
        recommendationsApplied: appliedRecs.length,
        estimatedDelaySavedMin: totalTimeSaved,
        estimatedDistanceSavedKm: Math.round(totalDistSaved),
        estimatedCostSavedInr: Math.round(totalCostSaved),
        avgRiskReduction: appliedRecs.length > 0
          ? Math.round(appliedRecs.reduce((s, r) => s + (r.risk_reduction || 0), 0) / appliedRecs.length)
          : 0,
        label: 'Model-estimated impact',
      },
      deliveries: {
        total: deliveries.length,
        inTransit: deliveries.filter(d => d.status === 'in_transit').length,
        delivered: deliveries.filter(d => d.status === 'delivered').length,
        pending: deliveries.filter(d => d.status === 'pending').length,
        byPriority: {
          critical: deliveries.filter(d => d.priority === 'critical').length,
          high: deliveries.filter(d => d.priority === 'high').length,
          normal: deliveries.filter(d => d.priority === 'normal').length,
          low: deliveries.filter(d => d.priority === 'low').length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function setKey(req, res, next) {
  try {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'API key is required' });
    const success = setApiKey(apiKey);
    res.json({ success, aiAvailable: isGeminiAvailable() });
  } catch (err) {
    next(err);
  }
}

export async function getAIStatus(req, res) {
  res.json({
    aiAvailable: isGeminiAvailable(),
    model: isGeminiAvailable() ? 'gemini-3.8-flash' : 'mova-engine',
  });
}

/**
 * Calculate genuine turn-by-turn route geometry and ETAs using OSRM
 */
export async function calculateRealRoute(req, res, next) {
  try {
    const { origin, destination, waypoints, mode } = req.body;
    if (!origin || !destination) {
      return res.status(400).json({ error: 'origin and destination coordinates {lat, lng} required' });
    }
    const route = await calculateRoute({ origin, destination, waypoints, mode });
    res.json(route);
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch live telematics weather
 */
export async function getLiveWeather(req, res, next) {
  try {
    const lat = Number(req.query.lat || 19.0760);
    const lng = Number(req.query.lng || 72.8777);
    const weather = await fetchLiveWeather(lat, lng);
    res.json(weather);
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch live traffic flow from TomTom
 */
export async function getTrafficFlow(req, res, next) {
  try {
    const lat = Number(req.query.lat || 19.0760);
    const lng = Number(req.query.lng || 72.8777);
    const flow = await fetchLiveTrafficFlow(lat, lng);
    res.json(flow);
  } catch (err) {
    next(err);
  }
}


