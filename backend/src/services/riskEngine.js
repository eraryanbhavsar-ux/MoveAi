/**
 * MOVA Deterministic Risk Engine
 * Calculates mobility risk scores from weighted factors.
 * Risk: 0-29 LOW, 30-59 MEDIUM, 60-79 HIGH, 80-100 CRITICAL
 */

const RISK_WEIGHTS = {
  traffic: 0.20,
  historicalDelay: 0.18,
  timePressure: 0.17,
  priority: 0.12,
  disruption: 0.10,
  vehicleStatus: 0.08,
  remainingDistance: 0.08,
  capacityPressure: 0.07,
};

export function getRiskLevel(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function getRiskColor(score) {
  if (score >= 80) return '#ef4444';
  if (score >= 60) return '#f97316';
  if (score >= 30) return '#eab308';
  return '#22c55e';
}

/**
 * Calculate traffic risk factor (0-100)
 */
function calcTrafficScore(trafficLevel, congestionPercent = 0) {
  const levels = { light: 10, normal: 20, moderate: 45, heavy: 75, severe: 95 };
  const base = levels[trafficLevel] || 30;
  return Math.min(100, Math.round(base + congestionPercent * 0.3));
}

/**
 * Calculate historical delay risk (0-100)
 */
function calcHistoricalDelayScore(avgDelayMin, delayProbability) {
  const delayScore = Math.min(100, avgDelayMin * 2.5);
  const probScore = delayProbability * 100;
  return Math.round(delayScore * 0.6 + probScore * 0.4);
}

/**
 * Calculate time pressure (0-100)
 */
function calcTimePressureScore(minutesUntilDeadline, estimatedRemainingMin) {
  if (minutesUntilDeadline <= 0) return 100;
  const ratio = estimatedRemainingMin / minutesUntilDeadline;
  if (ratio > 1.2) return 95;
  if (ratio > 1.0) return 80;
  if (ratio > 0.8) return 60;
  if (ratio > 0.6) return 40;
  return 15;
}

/**
 * Calculate priority-based risk (0-100)
 */
function calcPriorityScore(deliveryPriorities) {
  const priorityValues = { critical: 90, high: 65, normal: 30, low: 10 };
  if (!deliveryPriorities || deliveryPriorities.length === 0) return 20;
  const maxPriority = Math.max(...deliveryPriorities.map(p => priorityValues[p] || 20));
  return maxPriority;
}

/**
 * Calculate disruption risk (0-100)
 */
function calcDisruptionScore(activeIncidents, incidentSeverities) {
  if (!activeIncidents || activeIncidents === 0) return 0;
  const severityValues = { critical: 95, high: 70, medium: 45, low: 20 };
  const maxSev = Math.max(...(incidentSeverities || []).map(s => severityValues[s] || 30));
  return Math.min(100, Math.round(maxSev + activeIncidents * 5));
}

/**
 * Calculate vehicle status risk (0-100)
 */
function calcVehicleStatusScore(fuelLevel, vehicleAge, maintenanceDue) {
  let score = 0;
  if (fuelLevel < 20) score += 50;
  else if (fuelLevel < 40) score += 25;
  if (maintenanceDue) score += 30;
  return Math.min(100, score);
}

/**
 * Calculate remaining distance risk (0-100)
 */
function calcRemainingDistanceScore(remainingKm, totalKm) {
  const ratio = remainingKm / (totalKm || 1);
  if (ratio > 0.8) return 15;
  if (ratio > 0.5) return 30;
  if (ratio > 0.2) return 50;
  return 70;
}

/**
 * Calculate capacity pressure (0-100)
 */
function calcCapacityPressureScore(currentLoad, maxCapacity) {
  const utilization = currentLoad / (maxCapacity || 1);
  if (utilization > 0.95) return 95;
  if (utilization > 0.85) return 70;
  if (utilization > 0.7) return 45;
  if (utilization > 0.5) return 25;
  return 10;
}

/**
 * Calculate complete risk assessment
 */
export function calculateRisk(params) {
  const {
    trafficLevel = 'normal',
    congestionPercent = 0,
    avgDelayMin = 0,
    delayProbability = 0,
    minutesUntilDeadline = 480,
    estimatedRemainingMin = 120,
    deliveryPriorities = [],
    activeIncidents = 0,
    incidentSeverities = [],
    fuelLevel = 80,
    vehicleAge = 0,
    maintenanceDue = false,
    remainingKm = 50,
    totalKm = 100,
    currentLoad = 0,
    maxCapacity = 1000,
  } = params;

  const factors = {
    traffic: calcTrafficScore(trafficLevel, congestionPercent),
    historicalDelay: calcHistoricalDelayScore(avgDelayMin, delayProbability),
    timePressure: calcTimePressureScore(minutesUntilDeadline, estimatedRemainingMin),
    priority: calcPriorityScore(deliveryPriorities),
    disruption: calcDisruptionScore(activeIncidents, incidentSeverities),
    vehicleStatus: calcVehicleStatusScore(fuelLevel, vehicleAge, maintenanceDue),
    remainingDistance: calcRemainingDistanceScore(remainingKm, totalKm),
    capacityPressure: calcCapacityPressureScore(currentLoad, maxCapacity),
  };

  const weightedScore = Object.entries(RISK_WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + (factors[key] * weight);
  }, 0);

  const overall = Math.round(Math.min(100, weightedScore));

  // Weighted breakdown showing contribution of each factor
  const breakdown = {};
  for (const [key, weight] of Object.entries(RISK_WEIGHTS)) {
    breakdown[key] = Math.round(factors[key] * weight);
  }

  return {
    overall,
    score: overall,
    level: getRiskLevel(overall),
    color: getRiskColor(overall),
    factors,
    breakdown,
    weights: RISK_WEIGHTS,
  };
}

/**
 * Calculate fleet-wide mobility health score (0-100)
 */
export function calculateMobilityHealth(metrics) {
  const {
    onTimeRate = 0.85,
    fleetUtilization = 0.7,
    avgRiskScore = 30,
    activeIncidentCount = 0,
    vehicleAvailabilityRate = 0.9,
    routeEfficiency = 0.85,
  } = metrics;

  const scores = {
    onTimePerformance: Math.round(onTimeRate * 100),
    fleetUtilization: Math.round(fleetUtilization * 100),
    riskExposure: Math.round(Math.max(0, 100 - avgRiskScore)),
    incidentExposure: Math.round(Math.max(0, 100 - activeIncidentCount * 10)),
    vehicleAvailability: Math.round(vehicleAvailabilityRate * 100),
    routeEfficiency: Math.round(routeEfficiency * 100),
  };

  const weights = {
    onTimePerformance: 0.25,
    fleetUtilization: 0.20,
    riskExposure: 0.20,
    incidentExposure: 0.10,
    vehicleAvailability: 0.15,
    routeEfficiency: 0.10,
  };

  const overall = Math.round(
    Object.entries(weights).reduce((sum, [key, w]) => sum + scores[key] * w, 0)
  );

  return { overall, scores, weights };
}

/**
 * Compare two operational states
 */
export function compareStates(before, after) {
  return {
    delayChange: (after.totalDelay || 0) - (before.totalDelay || 0),
    distanceChange: (after.totalDistance || 0) - (before.totalDistance || 0),
    costChange: (after.totalCost || 0) - (before.totalCost || 0),
    riskChange: (after.avgRisk || 0) - (before.avgRisk || 0),
    lateDeliveriesChange: (after.lateDeliveries || 0) - (before.lateDeliveries || 0),
    utilizationChange: (after.utilization || 0) - (before.utilization || 0),
  };
}

/**
 * Estimate operational cost in INR
 */
export function estimateCost(distanceKm, vehicleType = 'Light Truck') {
  const ratesPerKm = {
    'Light Truck': 8,
    'Heavy Truck': 12,
    'Van': 6,
    'Mini Truck': 7,
    'Container': 15,
  };
  return Math.round(distanceKm * (ratesPerKm[vehicleType] || 8));
}

/**
 * Haversine distance between two points
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
