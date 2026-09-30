import { query } from '../config/database.js';
import { calculateRisk, getRiskLevel } from '../services/riskEngine.js';
import { explainTripRisk } from '../services/aiService.js';

export async function getTrips(req, res, next) {
  try {
    const { status, risk } = req.query;
    let sql = `SELECT t.*, v.vehicle_id as vehicle_code, v.vehicle_type, d.name as driver_name
               FROM trips t
               LEFT JOIN vehicles v ON t.vehicle_id = v.id
               LEFT JOIN drivers d ON t.driver_id = d.id`;
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(`t.status = $${params.length + 1}`);
      params.push(status);
    }
    if (risk === 'high') {
      conditions.push(`t.risk_score >= 60`);
    }
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ` ORDER BY t.risk_score DESC, t.created_at DESC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getTripById(req, res, next) {
  try {
    const { id } = req.params;
    const tripRes = await query(
      `SELECT t.*, v.vehicle_id as vehicle_code, v.vehicle_type, v.capacity_kg, v.current_load_kg,
              d.name as driver_name, d.phone as driver_phone
       FROM trips t
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       WHERE t.id = $1 OR t.trip_id = $1`, [id]
    );
    if (tripRes.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });

    const trip = tripRes.rows[0];

    const [deliveriesRes, routesRes, incidentsRes, riskRes] = await Promise.all([
      query(`SELECT * FROM deliveries WHERE assigned_trip_id = $1`, [trip.id]),
      query(`SELECT * FROM routes WHERE trip_id = $1 ORDER BY is_active DESC, risk_score ASC`, [trip.id]),
      query(`SELECT * FROM incidents WHERE status = 'active' AND affected_trip_ids::text LIKE $1`, [`%${trip.trip_id}%`]),
      query(`SELECT * FROM risk_assessments WHERE entity_type = 'trip' AND entity_id = $1 ORDER BY created_at DESC LIMIT 1`, [trip.id]),
    ]);

    res.json({
      ...trip,
      deliveries: deliveriesRes.rows,
      routes: routesRes.rows,
      incidents: incidentsRes.rows,
      riskAssessment: riskRes.rows[0] || null,
      riskLevel: getRiskLevel(trip.risk_score),
    });
  } catch (err) {
    next(err);
  }
}

export async function analyzeTripRisk(req, res, next) {
  try {
    const { id } = req.params;
    const tripRes = await query(
      `SELECT t.*, v.vehicle_id as vehicle_code, v.fuel_level, v.capacity_kg, v.current_load_kg
       FROM trips t LEFT JOIN vehicles v ON t.vehicle_id = v.id
       WHERE t.id = $1 OR t.trip_id = $1`, [id]
    );
    if (tripRes.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    
    const trip = tripRes.rows[0];

    const [deliveriesRes, incidentsRes] = await Promise.all([
      query(`SELECT priority FROM deliveries WHERE assigned_trip_id = $1`, [trip.id]),
      query(`SELECT * FROM incidents WHERE status = 'active' AND affected_trip_ids::text LIKE $1`, [`%${trip.trip_id || trip.id}%`]),
    ]);

    const remainingKm = parseFloat(trip.distance_km || 0) * (1 - (trip.progress_percent || 0) / 100);
    const minutesUntilDeadline = trip.scheduled_arrival
      ? Math.max(0, (new Date(trip.scheduled_arrival).getTime() - Date.now()) / 60000)
      : 480;
    const estimatedRemainingMin = remainingKm * 1.2; // rough estimate

    const risk = calculateRisk({
      trafficLevel: incidentsRes.rows.some(i => i.type === 'traffic') ? 'heavy' : 'moderate',
      avgDelayMin: trip.predicted_delay_min || 0,
      delayProbability: (trip.predicted_delay_min || 0) > 15 ? 0.7 : 0.3,
      minutesUntilDeadline,
      estimatedRemainingMin,
      deliveryPriorities: deliveriesRes.rows.map(d => d.priority),
      activeIncidents: incidentsRes.rows.length,
      incidentSeverities: incidentsRes.rows.map(i => i.severity),
      fuelLevel: parseFloat(trip.fuel_level || 80),
      remainingKm,
      totalKm: parseFloat(trip.distance_km || 100),
      currentLoad: parseFloat(trip.current_load_kg || 0),
      maxCapacity: parseFloat(trip.capacity_kg || 1000),
    });

    const explanation = await explainTripRisk(
      { ...trip, incidents: incidentsRes.rows },
      risk
    );

    // Save risk assessment
    await query(
      `INSERT INTO risk_assessments (entity_type, entity_id, overall_score, traffic_score, historical_delay_score, time_pressure_score, priority_score, disruption_score, vehicle_status_score, remaining_distance_score, capacity_pressure_score, breakdown)
       VALUES ('trip', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [trip.id, risk.overall, risk.breakdown.traffic, risk.breakdown.historicalDelay, risk.breakdown.timePressure,
       risk.breakdown.priority, risk.breakdown.disruption, risk.breakdown.vehicleStatus, risk.breakdown.remainingDistance,
       risk.breakdown.capacityPressure, JSON.stringify(risk.breakdown)]
    );

    // Update trip risk score
    await query(`UPDATE trips SET risk_score = $1 WHERE id = $2`, [risk.overall, trip.id]);

    res.json({
      tripId: trip.trip_id,
      risk,
      explanation,
      incidents: incidentsRes.rows,
    });
  } catch (err) {
    next(err);
  }
}
