/**
 * MOVA Real Weather & Environmental Telematics Service
 * Primary: OpenWeatherMap (when API key is present and activated)
 * Resilient Fallback: Open-Meteo (Open Science WMO Weather API)
 * Provides real-time precipitation, wind, weather condition, and mobility road hazard assessment.
 */

import config from '../config/index.js';

// WMO Weather interpretation codes (WW)
const WMO_CODES = {
  0: { label: 'Clear sky', hazardLevel: 'none', delayFactor: 0 },
  1: { label: 'Mainly clear', hazardLevel: 'none', delayFactor: 0 },
  2: { label: 'Partly cloudy', hazardLevel: 'none', delayFactor: 0 },
  3: { label: 'Overcast', hazardLevel: 'low', delayFactor: 2 },
  45: { label: 'Fog', hazardLevel: 'medium', delayFactor: 15 },
  48: { label: 'Depositing rime fog', hazardLevel: 'high', delayFactor: 25 },
  51: { label: 'Light drizzle', hazardLevel: 'low', delayFactor: 5 },
  53: { label: 'Moderate drizzle', hazardLevel: 'low', delayFactor: 8 },
  55: { label: 'Dense drizzle', hazardLevel: 'medium', delayFactor: 12 },
  61: { label: 'Slight rain', hazardLevel: 'low', delayFactor: 5 },
  63: { label: 'Moderate rain', hazardLevel: 'medium', delayFactor: 15 },
  65: { label: 'Heavy rain', hazardLevel: 'high', delayFactor: 30 },
  80: { label: 'Slight rain showers', hazardLevel: 'low', delayFactor: 8 },
  81: { label: 'Moderate rain showers', hazardLevel: 'medium', delayFactor: 18 },
  82: { label: 'Violent rain showers', hazardLevel: 'critical', delayFactor: 40 },
  95: { label: 'Thunderstorm', hazardLevel: 'high', delayFactor: 35 },
  96: { label: 'Thunderstorm with slight hail', hazardLevel: 'critical', delayFactor: 45 },
};

async function fetchOpenWeatherMap(lat, lng, apiKey) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`OpenWeatherMap HTTP ${res.status}`);

    const data = await res.json();
    const condition = data.weather?.[0]?.description || 'Clear sky';
    const tempC = Math.round((data.main?.temp ?? 28) * 10) / 10;
    const precipitationMm = data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0;
    const windSpeedKmh = Math.round((data.wind?.speed || 0) * 3.6);

    let hazardLevel = 'none';
    let delayImpactMin = 0;
    const weatherMain = (data.weather?.[0]?.main || '').toLowerCase();

    if (weatherMain.includes('thunderstorm') || precipitationMm > 25 || windSpeedKmh > 60) {
      hazardLevel = 'critical';
      delayImpactMin = 35;
    } else if (weatherMain.includes('rain') || precipitationMm > 10 || windSpeedKmh > 40) {
      hazardLevel = 'high';
      delayImpactMin = 20;
    } else if (weatherMain.includes('drizzle') || weatherMain.includes('fog') || weatherMain.includes('mist')) {
      hazardLevel = 'medium';
      delayImpactMin = 10;
    } else if (weatherMain.includes('cloud')) {
      hazardLevel = 'low';
      delayImpactMin = 2;
    }

    return {
      success: true,
      provider: 'OpenWeatherMap',
      condition: condition.charAt(0).toUpperCase() + condition.slice(1),
      temperatureC: tempC,
      precipitationMm,
      windSpeedKmh,
      hazardLevel,
      delayImpactMin,
      isHazardous: hazardLevel === 'high' || hazardLevel === 'critical',
      dataOrigin: 'REAL',
      recordedAt: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function fetchOpenMeteo(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

    const data = await res.json();
    const current = data.current || {};
    const code = current.weather_code ?? 0;
    const weatherInfo = WMO_CODES[code] || { label: 'Fair conditions', hazardLevel: 'none', delayFactor: 0 };
    const precipitationMm = current.precipitation || 0;
    const windSpeedKmh = current.wind_speed_10m || 0;
    const tempC = current.temperature_2m || 28;

    const isSevere = weatherInfo.hazardLevel === 'high' || weatherInfo.hazardLevel === 'critical' || precipitationMm > 15;
    const calculatedDelayMin = weatherInfo.delayFactor + (precipitationMm > 10 ? 15 : 0);

    return {
      success: true,
      provider: 'Open-Meteo (WMO)',
      condition: weatherInfo.label,
      temperatureC: tempC,
      precipitationMm,
      windSpeedKmh,
      hazardLevel: weatherInfo.hazardLevel,
      delayImpactMin: calculatedDelayMin,
      isHazardous: isSevere,
      dataOrigin: 'PUBLIC',
      recordedAt: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export async function fetchLiveWeather(lat, lng) {
  const weatherKey = config.weatherApiKey || process.env.WEATHER_API_KEY;

  if (weatherKey && weatherKey.trim()) {
    try {
      return await fetchOpenWeatherMap(lat, lng, weatherKey.trim());
    } catch (e) {
      // If key is not yet activated or times out, seamlessly fall back to Open-Meteo
    }
  }

  try {
    return await fetchOpenMeteo(lat, lng);
  } catch (err) {
    return {
      success: false,
      provider: 'Open-Meteo (Offline Fallback)',
      condition: 'Nominal conditions',
      temperatureC: 28,
      precipitationMm: 0,
      windSpeedKmh: 12,
      hazardLevel: 'none',
      delayImpactMin: 0,
      isHazardous: false,
      dataOrigin: 'FALLBACK',
      recordedAt: new Date().toISOString(),
      note: 'External weather service timed out or unavailable',
    };
  }
}
