import { query } from '../config/database.js';
import { calculateMobilityHealth } from '../services/riskEngine.js';

export async function getDashboard(req, res, next) {
  try {
    const [vehiclesRes, tripsRes, deliveriesRes, incidentsRes, recsRes, optsRes] = await Promise.all([
      query(`SELECT * FROM vehicles`),
      query(`SELECT * FROM trips`),
      query(`SELECT * FROM deliveries`),
      query(`SELECT * FROM incidents WHERE status = 'active'`),
      query(`SELECT * FROM ai_recommendations ORDER BY created_at DESC LIMIT 10`),
      query(`SELECT * FROM optimization_runs ORDER BY created_at DESC LIMIT 5`),
    ]);

    const vehicles = vehiclesRes.rows;
    const trips = tripsRes.rows;
    const deliveries = deliveriesRes.rows;
    const incidents = incidentsRes.rows;

    const activeVehicles = vehicles.filter(v => v.status === 'active').length;
    const idleVehicles = vehicles.filter(v => v.status === 'idle').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
    const activeTrips = trips.filter(t => t.status === 'in_progress').length;
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const inTransitDeliveries = deliveries.filter(d => d.status === 'in_transit').length;
    const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;
    const pendingDeliveries = deliveries.filter(d => d.status === 'pending').length;
    const atRiskTrips = trips.filter(t => t.status === 'in_progress' && t.risk_score >= 60).length;
    const totalDeliveries = deliveries.length;

    const onTimeRate = totalDeliveries > 0
      ? Math.round(((deliveredCount + deliveries.filter(d => d.risk_score < 50 && d.status === 'in_transit').length) / Math.max(1, deliveredCount + inTransitDeliveries)) * 100)
      : 85;

    const fleetUtilization = vehicles.length > 0
      ? Math.round((activeVehicles / vehicles.length) * 100)
      : 0;

    const avgRisk = trips.filter(t => t.status === 'in_progress').length > 0
      ? Math.round(trips.filter(t => t.status === 'in_progress').reduce((s, t) => s + t.risk_score, 0) / trips.filter(t => t.status === 'in_progress').length)
      : 0;

    const totalOptTimeSaved = optsRes.rows.reduce((s, o) => s + (o.total_time_saved_min || 0), 0);
    const totalOptDistSaved = optsRes.rows.reduce((s, o) => s + parseFloat(o.total_distance_saved_km || 0), 0);
    const totalOptCostSaved = optsRes.rows.reduce((s, o) => s + parseFloat(o.total_cost_saved_inr || 0), 0);

    const mobilityHealth = calculateMobilityHealth({
      onTimeRate: onTimeRate / 100,
      fleetUtilization: fleetUtilization / 100,
      avgRiskScore: avgRisk,
      activeIncidentCount: incidents.length,
      vehicleAvailabilityRate: (activeVehicles + idleVehicles) / Math.max(1, vehicles.length),
      routeEfficiency: 0.82,
    });

    res.json({
      kpis: {
        activeVehicles,
        idleVehicles,
        maintenanceVehicles,
        totalVehicles: vehicles.length,
        activeTrips,
        completedTrips,
        activeDeliveries: inTransitDeliveries,
        pendingDeliveries,
        deliveredCount,
        totalDeliveries,
        onTimeRate,
        atRiskTrips,
        fleetUtilization,
        avgRisk,
        activeIncidents: incidents.length,
      },
      mobilityHealth,
      estimatedImpact: {
        timeSavedMin: totalOptTimeSaved,
        distanceSavedKm: Math.round(totalOptDistSaved),
        costSavedInr: Math.round(totalOptCostSaved),
        label: 'Model-estimated impact',
      },
      recentRecommendations: recsRes.rows.slice(0, 5),
      activeIncidents: incidents.slice(0, 5),
      highRiskTrips: trips
        .filter(t => t.status === 'in_progress' && t.risk_score >= 60)
        .sort((a, b) => b.risk_score - a.risk_score)
        .slice(0, 5),
      simulationMode: true,
    });
  } catch (err) {
    next(err);
  }
}
