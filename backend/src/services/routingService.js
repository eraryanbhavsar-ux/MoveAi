/**
 * MOVA Real Routing Provider Architecture
 * 1. Google Maps Directions API (when valid GOOGLE_MAPS_API_KEY is configured)
 * 2. TomTom Real-Time Traffic Routing (when TOMTOM_API_KEY is configured)
 * 3. Open Source Routing Machine (OSRM) on OpenStreetMap
 * 4. Offline Fallback: Deterministic Geometric Road Network
 * Provides actual distance, route geometry (GeoJSON), duration, live traffic delays, and ETA calculations.
 */

import config from '../config/index.js';
import { haversineDistance } from './riskEngine.js';

class BaseRoutingProvider {
  async getRoute(origin, destination, options = {}) {
    throw new Error('getRoute must be implemented by provider');
  }
}

class GoogleMapsRoutingProvider extends BaseRoutingProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.name = 'GoogleMaps';
  }

  async getRoute(origin, destination, options = {}) {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&departure_time=now&alternatives=true&key=${this.apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Google Maps HTTP ${res.status}`);

      const data = await res.json();
      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        throw new Error(`Google Maps API status: ${data.status} - ${data.error_message || 'No route found'}`);
      }

      const primary = data.routes[0];
      const leg = primary.legs?.[0] || {};
      const distanceKm = +(leg.distance?.value / 1000).toFixed(2);
      const durationSec = leg.duration_in_traffic?.value || leg.duration?.value || 3600;
      const durationMin = Math.round(durationSec / 60);
      const baselineMin = Math.round((leg.duration?.value || durationSec) / 60);
      const trafficDelayMin = Math.max(0, durationMin - baselineMin);

      const leafletCoords = [];
      (leg.steps || []).forEach(step => {
        if (step.start_location) leafletCoords.push([step.start_location.lat, step.start_location.lng]);
        if (step.end_location) leafletCoords.push([step.end_location.lat, step.end_location.lng]);
      });

      return {
        success: true,
        provider: 'GoogleMaps-Directions',
        distanceKm,
        durationMin,
        baselineDurationMin: baselineMin,
        trafficDelayMin,
        geometry: leafletCoords,
        coordinates: leafletCoords,
        alternatives: (data.routes.slice(1) || []).map((alt, idx) => ({
          id: `ALT-${idx + 1}`,
          name: alt.summary || `Google Alternative Route ${idx + 1}`,
          distanceKm: +((alt.legs?.[0]?.distance?.value || 0) / 1000).toFixed(2),
          durationMin: Math.round(((alt.legs?.[0]?.duration_in_traffic?.value || alt.legs?.[0]?.duration?.value || 0) / 60)),
          geometry: (alt.legs?.[0]?.steps || []).map(s => [s.start_location.lat, s.start_location.lng]),
          dataOrigin: 'REAL',
        })),
        steps: (leg.steps || []).map(s => ({
          instruction: s.html_instructions?.replace(/<[^>]*>/g, '') || 'Proceed',
          distanceKm: +((s.distance?.value || 0) / 1000).toFixed(2),
          durationMin: Math.round((s.duration?.value || 0) / 60),
        })),
        dataOrigin: 'REAL',
      };
    } catch (err) {
      clearTimeout(timeout);
      // Fallback to TomTom if configured, else OSRM
      const tomtomKey = config.tomtomApiKey || process.env.TOMTOM_API_KEY;
      if (tomtomKey && tomtomKey.trim()) {
        const tomtom = new TomTomRoutingProvider(tomtomKey.trim());
        return tomtom.getRoute(origin, destination, options);
      }
      const osrm = new OSRMRoutingProvider();
      return osrm.getRoute(origin, destination, options);
    }
  }
}

class TomTomRoutingProvider extends BaseRoutingProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.name = 'TomTom';
  }

  async getRoute(origin, destination, options = {}) {
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin.lat},${origin.lng}:${destination.lat},${destination.lng}/json?traffic=true&maxAlternatives=2&key=${this.apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`TomTom HTTP ${res.status}`);

      const data = await res.json();
      if (!data.routes || data.routes.length === 0) throw new Error('No TomTom routes returned');

      const primary = data.routes[0];
      const summary = primary.summary || {};
      const distanceKm = +(summary.lengthInMeters / 1000).toFixed(2);
      const durationMin = Math.round(summary.travelTimeInSeconds / 60);
      const delayMin = Math.round((summary.trafficDelayInSeconds || 0) / 60);
      const baselineMin = Math.max(5, durationMin - delayMin);

      const leafletCoords = (primary.legs?.[0]?.points || []).map(p => [p.latitude, p.longitude]);

      const alternatives = (data.routes.slice(1) || []).map((alt, idx) => ({
        id: `ALT-${idx + 1}`,
        name: `TomTom Traffic Alternative ${idx + 1}`,
        distanceKm: +(alt.summary.lengthInMeters / 1000).toFixed(2),
        durationMin: Math.round(alt.summary.travelTimeInSeconds / 60),
        geometry: (alt.legs?.[0]?.points || []).map(p => [p.latitude, p.longitude]),
        dataOrigin: 'REAL',
      }));

      return {
        success: true,
        provider: 'TomTom-TrafficRouting',
        distanceKm,
        durationMin,
        baselineDurationMin: baselineMin,
        trafficDelayMin: delayMin,
        geometry: leafletCoords,
        coordinates: leafletCoords,
        alternatives,
        steps: (primary.guidance?.instructions || []).map(i => ({
          instruction: i.message,
          distanceKm: +(i.routeOffsetInMeters / 1000).toFixed(2),
          durationMin: Math.round(i.travelTimeInSeconds / 60),
        })),
        dataOrigin: 'REAL',
      };
    } catch (err) {
      clearTimeout(timeout);
      // Resilient fallback to OSRM
      const osrm = new OSRMRoutingProvider();
      return osrm.getRoute(origin, destination, options);
    }
  }
}

class OSRMRoutingProvider extends BaseRoutingProvider {
  constructor(baseUrl = 'https://router.project-osrm.org') {
    super();
    this.baseUrl = baseUrl;
    this.name = 'OSRM';
  }

  async getRoute(origin, destination, options = {}) {
    const url = `${this.baseUrl}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&alternatives=true&steps=true`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'MOVA-Smart-Mobility/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`OSRM HTTP status ${response.status}`);
      }

      const data = await response.json();
      if (!data.routes || data.routes.length === 0) {
        throw new Error('OSRM returned no route paths');
      }

      const primary = data.routes[0];
      const alternatives = (data.routes.slice(1) || []).map((alt, idx) => ({
        id: `ALT-${idx + 1}`,
        name: `Alternative Highway Route ${idx + 1}`,
        distanceKm: +(alt.distance / 1000).toFixed(2),
        durationMin: Math.round(alt.duration / 60),
        geometry: alt.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [],
        dataOrigin: 'REAL',
      }));

      // Convert GeoJSON [lng, lat] to Leaflet [lat, lng] format
      const leafletCoords = primary.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];

      return {
        success: true,
        provider: 'OSRM-OpenStreetMap',
        distanceKm: +(primary.distance / 1000).toFixed(2),
        durationMin: Math.round(primary.duration / 60),
        baselineDurationMin: Math.round(primary.duration / 60),
        trafficDelayMin: 0,
        geometry: leafletCoords,
        coordinates: leafletCoords,
        alternatives,
        steps: (primary.legs?.[0]?.steps || []).map(s => ({
          instruction: s.maneuver?.type + ' ' + (s.name || ''),
          distanceKm: +(s.distance / 1000).toFixed(2),
          durationMin: Math.round(s.duration / 60),
        })),
        dataOrigin: 'REAL',
      };
    } catch (err) {
      clearTimeout(timeout);
      // Graceful fallback to deterministic geometric routing
      return FallbackRoutingProvider.calculate(origin, destination, options);
    }
  }
}

class FallbackRoutingProvider {
  static calculate(origin, destination, options = {}) {
    const directKm = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    const distanceKm = +(directKm * 1.28).toFixed(2);
    const avgSpeedKmh = options.avgSpeedKmh || 50;
    const durationMin = Math.max(5, Math.round((distanceKm / avgSpeedKmh) * 60));

    const stepsCount = 12;
    const geometry = [];
    for (let i = 0; i <= stepsCount; i++) {
      const ratio = i / stepsCount;
      const lat = origin.lat + (destination.lat - origin.lat) * ratio;
      const lng = origin.lng + (destination.lng - origin.lng) * ratio;
      const deviation = Math.sin(ratio * Math.PI) * 0.015;
      geometry.push([+(lat + deviation).toFixed(6), +(lng - deviation).toFixed(6)]);
    }

    return {
      success: true,
      provider: 'Deterministic-Geometric-RoadNetwork',
      distanceKm,
      durationMin,
      baselineDurationMin: durationMin,
      trafficDelayMin: 0,
      geometry,
      coordinates: geometry,
      alternatives: [
        {
          id: 'ALT-1',
          name: 'Regional Bypass Highway',
          distanceKm: +(distanceKm * 1.08).toFixed(2),
          durationMin: Math.round(durationMin * 1.05),
          dataOrigin: 'CALCULATED',
        }
      ],
      steps: [
        { instruction: `Depart from ${options.originName || 'Origin'} onto corridor`, distanceKm: +(distanceKm * 0.4).toFixed(2), durationMin: Math.round(durationMin * 0.4) },
        { instruction: 'Continue on state highway corridor', distanceKm: +(distanceKm * 0.4).toFixed(2), durationMin: Math.round(durationMin * 0.4) },
        { instruction: `Arrive at destination ${options.destinationName || 'Destination'}`, distanceKm: +(distanceKm * 0.2).toFixed(2), durationMin: Math.round(durationMin * 0.2) },
      ],
      dataOrigin: 'CALCULATED',
    };
  }
}

/**
 * High-level routing API
 */
export async function calculateRoute(originOrOptions, maybeDestination, options = {}) {
  let origin = originOrOptions;
  let destination = maybeDestination;
  let opts = options;
  if (originOrOptions && originOrOptions.origin && originOrOptions.destination) {
    origin = originOrOptions.origin;
    destination = originOrOptions.destination;
    opts = originOrOptions;
  }

  const googleKey = config.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY;
  const tomtomKey = config.tomtomApiKey || process.env.TOMTOM_API_KEY;

  let provider;
  if (googleKey && googleKey.trim() && googleKey.startsWith('AIza')) {
    provider = new GoogleMapsRoutingProvider(googleKey.trim());
  } else if (tomtomKey && tomtomKey.trim()) {
    provider = new TomTomRoutingProvider(tomtomKey.trim());
  } else {
    provider = new OSRMRoutingProvider();
  }

  return await provider.getRoute(origin, destination, opts);
}

/**
 * Calculate deterministic ETA with delay factors
 */
export function calculateTripETA(scheduledDeparture, estimatedDurationMin, predictedDelayMin = 0) {
  const departureDate = scheduledDeparture ? new Date(scheduledDeparture) : new Date();
  const baselineArrival = new Date(departureDate.getTime() + estimatedDurationMin * 60 * 1000);
  const predictedArrival = new Date(baselineArrival.getTime() + predictedDelayMin * 60 * 1000);

  return {
    scheduledDeparture: departureDate.toISOString(),
    baselineArrival: baselineArrival.toISOString(),
    predictedArrival: predictedArrival.toISOString(),
    predictedDelayMin,
    isDelayed: predictedDelayMin > 10,
  };
}
