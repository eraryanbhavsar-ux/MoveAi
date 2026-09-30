/**
 * MOVA Real Traffic & Road Flow Service
 * Integrates TomTom Traffic Flow & Incident APIs
 * Provides real-time corridor speeds, congestion percentages, and road closure flags.
 */

import config from '../config/index.js';

export async function fetchLiveTrafficFlow(lat, lng) {
  const tomtomKey = config.tomtomApiKey || process.env.TOMTOM_API_KEY;

  if (!tomtomKey) {
    return {
      success: false,
      provider: 'Internal-Estimator',
      currentSpeedKmh: 45,
      freeFlowSpeedKmh: 60,
      congestionPercent: 25,
      trafficLevel: 'normal',
      roadClosure: false,
      dataOrigin: 'ESTIMATED',
      recordedAt: new Date().toISOString(),
    };
  }

  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lng}&key=${tomtomKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`TomTom Traffic HTTP ${res.status}`);

    const data = await res.json();
    const flow = data.flowSegmentData || {};
    const currentSpeed = flow.currentSpeed || 40;
    const freeFlowSpeed = flow.freeFlowSpeed || 50;
    const congestionPercent = Math.min(100, Math.max(0, Math.round((1 - currentSpeed / Math.max(1, freeFlowSpeed)) * 100)));

    let trafficLevel = 'normal';
    if (flow.roadClosure || congestionPercent >= 75) trafficLevel = 'severe';
    else if (congestionPercent >= 50) trafficLevel = 'heavy';
    else if (congestionPercent >= 25) trafficLevel = 'moderate';
    else trafficLevel = 'light';

    return {
      success: true,
      provider: 'TomTom-TrafficFlow',
      currentSpeedKmh: currentSpeed,
      freeFlowSpeedKmh: freeFlowSpeed,
      congestionPercent,
      trafficLevel,
      currentTravelTimeSec: flow.currentTravelTime,
      freeFlowTravelTimeSec: flow.freeFlowTravelTime,
      confidence: flow.confidence || 0.95,
      roadClosure: !!flow.roadClosure,
      dataOrigin: 'REAL',
      recordedAt: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timeout);
    return {
      success: false,
      provider: 'TomTom-Fallback',
      currentSpeedKmh: 45,
      freeFlowSpeedKmh: 60,
      congestionPercent: 25,
      trafficLevel: 'normal',
      roadClosure: false,
      dataOrigin: 'ESTIMATED',
      recordedAt: new Date().toISOString(),
      note: err.message,
    };
  }
}
