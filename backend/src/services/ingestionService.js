/**
 * MOVA Real Data Ingestion Engine
 * Handles CSV parsing, schema validation, preview, rejection, batch commit,
 * and live GPS telematics ingestion with breadcrumb tracking.
 */

import { query } from '../config/database.js';
import { calculateRisk } from './riskEngine.js';
import { haversineDistance } from './riskEngine.js';

// Schemas for CSV Validation
const SCHEMAS = {
  vehicles: {
    required: ['vehicle_id', 'vehicle_type', 'capacity_kg'],
    validate: (row) => {
      const errors = [];
      if (!row.vehicle_id) errors.push('vehicle_id is required');
      if (!row.vehicle_type) errors.push('vehicle_type is required');
      const cap = parseFloat(row.capacity_kg);
      if (isNaN(cap) || cap <= 0) errors.push('capacity_kg must be a positive number');
      if (row.lat && (isNaN(parseFloat(row.lat)) || parseFloat(row.lat) < -90 || parseFloat(row.lat) > 90)) {
        errors.push('lat must be valid coordinate (-90 to 90)');
      }
      if (row.lng && (isNaN(parseFloat(row.lng)) || parseFloat(row.lng) < -180 || parseFloat(row.lng) > 180)) {
        errors.push('lng must be valid coordinate (-180 to 180)');
      }
      return errors;
    }
  },
  deliveries: {
    required: ['delivery_id', 'pickup_location', 'dropoff_location', 'weight_kg'],
    validate: (row) => {
      const errors = [];
      if (!row.delivery_id) errors.push('delivery_id is required');
      if (!row.pickup_location) errors.push('pickup_location is required');
      if (!row.dropoff_location) errors.push('dropoff_location is required');
      const weight = parseFloat(row.weight_kg);
      if (isNaN(weight) || weight <= 0) errors.push('weight_kg must be positive');
      if (row.priority && !['critical', 'high', 'normal', 'low'].includes(row.priority.toLowerCase())) {
        errors.push('priority must be one of: critical, high, normal, low');
      }
      return errors;
    }
  },
  drivers: {
    required: ['name', 'phone'],
    validate: (row) => {
      const errors = [];
      if (!row.name || row.name.trim().length < 2) errors.push('name must be at least 2 characters');
      if (!row.phone || row.phone.trim().length < 7) errors.push('phone must be at least 7 digits');
      return errors;
    }
  }
};

/**
 * Simple robust CSV string parser
 */
export function parseCSV(csvString) {
  const lines = csvString.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one data row');
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    const rowObj = {};
    headers.forEach((header, index) => {
      rowObj[header] = rawCols[index] !== undefined ? rawCols[index] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Validate CSV records against schema and return preview
 */
export function validateAndPreview(entityType, rawRows) {
  const schema = SCHEMAS[entityType];
  if (!schema) {
    throw new Error(`Unsupported entity type for ingestion: ${entityType}. Supported: vehicles, deliveries, drivers`);
  }

  const validRows = [];
  const invalidRows = [];

  rawRows.forEach((row, index) => {
    const errors = schema.validate(row);
    if (errors.length === 0) {
      validRows.push({ rowIndex: index + 1, data: row });
    } else {
      invalidRows.push({ rowIndex: index + 1, data: row, errors });
    }
  });

  return {
    totalRecords: rawRows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    previewValid: validRows.slice(0, 10),
    invalidRows,
  };
}

/**
 * Commit validated CSV records to database
 */
export async function commitIngestion(organizationId, entityType, rows, sourceName = 'User CSV Upload') {
  const validRows = [];
  const rejectedRows = [];

  const schema = SCHEMAS[entityType];
  rows.forEach((row, idx) => {
    const errors = schema.validate(row);
    if (errors.length === 0) validRows.push(row);
    else rejectedRows.push({ row, errors });
  });

  let importedCount = 0;

  if (entityType === 'vehicles') {
    for (const row of validRows) {
      const cap = parseFloat(row.capacity_kg);
      const lat = row.lat ? parseFloat(row.lat) : 19.0760;
      const lng = row.lng ? parseFloat(row.lng) : 72.8777;
      await query(
        `INSERT INTO vehicles (organization_id, vehicle_id, vehicle_type, capacity_kg, status, lat, lng, current_location_name, data_origin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'USER-PROVIDED')
         ON CONFLICT (organization_id, vehicle_id) DO UPDATE
         SET vehicle_type = EXCLUDED.vehicle_type, capacity_kg = EXCLUDED.capacity_kg, lat = EXCLUDED.lat, lng = EXCLUDED.lng`,
        [organizationId, row.vehicle_id, row.vehicle_type, cap, row.status || 'idle', lat, lng, row.current_location_name || 'Terminal']
      );
      importedCount++;
    }
  } else if (entityType === 'deliveries') {
    for (const row of validRows) {
      const weight = parseFloat(row.weight_kg);
      await query(
        `INSERT INTO deliveries (organization_id, delivery_id, pickup_location, dropoff_location, priority, weight_kg, status, customer_name, description, data_origin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'USER-PROVIDED')
         ON CONFLICT (organization_id, delivery_id) DO UPDATE
         SET priority = EXCLUDED.priority, weight_kg = EXCLUDED.weight_kg, customer_name = EXCLUDED.customer_name`,
        [organizationId, row.delivery_id, row.pickup_location, row.dropoff_location, row.priority || 'normal', weight, row.status || 'pending', row.customer_name || 'Client', row.description || 'General freight']
      );
      importedCount++;
    }
  } else if (entityType === 'drivers') {
    for (const row of validRows) {
      await query(
        `INSERT INTO drivers (organization_id, name, phone, license_number, status, data_origin)
         VALUES ($1, $2, $3, $4, $5, 'USER-PROVIDED')`,
        [organizationId, row.name, row.phone, row.license_number || 'N/A', row.status || 'available']
      );
      importedCount++;
    }
  }

  // Record ingestion audit entry in data_sources
  const dsRes = await query(
    `INSERT INTO data_sources (organization_id, source_type, name, format, status, records_imported, records_rejected, error_log, data_origin)
     VALUES ($1, 'CSV_IMPORT', $2, 'CSV', 'completed', $3, $4, $5, 'USER-PROVIDED')
     RETURNING id, created_at`,
    [organizationId, sourceName, importedCount, rejectedRows.length, JSON.stringify(rejectedRows.slice(0, 50))]
  );

  return {
    dataSourceId: dsRes.rows[0]?.id,
    importedCount,
    rejectedCount: rejectedRows.length,
    entityType,
    status: 'completed',
  };
}

/**
 * Ingest live real-world GPS telematics ping
 */
export async function ingestGPSPing(organizationId, payload) {
  const vehicle_id = payload.vehicle_id || payload.vehicleId;
  const latitude = payload.latitude ?? payload.lat;
  const longitude = payload.longitude ?? payload.lng;
  const speed = payload.speedKmh ?? payload.speed_kmh ?? payload.speed ?? 0;
  const heading = payload.headingDeg ?? payload.heading_deg ?? payload.heading ?? 0;
  const { timestamp, fuel_level, odometer_km } = payload;

  if (!vehicle_id) throw new Error('vehicle_id is required');
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (isNaN(lat) || lat < -90 || lat > 90) throw new Error('Invalid latitude');
  if (isNaN(lng) || lng < -180 || lng > 180) throw new Error('Invalid longitude');

  const pingTime = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

  // Find vehicle
  const vRes = await query(
    `SELECT * FROM vehicles WHERE organization_id = $1 AND (id = $2 OR vehicle_id = $2)`,
    [organizationId, vehicle_id]
  );
  if (vRes.rows.length === 0) {
    throw new Error(`Vehicle ${vehicle_id} not found in organization`);
  }
  const vehicle = vRes.rows[0];

  // 1. Record breadcrumb in vehicle_locations
  await query(
    `INSERT INTO vehicle_locations (organization_id, vehicle_id, lat, lng, speed_kmh, heading_deg, recorded_at, data_origin, raw_payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'REAL', $8)`,
    [organizationId, vehicle.id, lat, lng, speed, heading, pingTime, JSON.stringify(payload)]
  );

  // 2. Update current position, speed, fuel on vehicle
  await query(
    `UPDATE vehicles
     SET lat = $1, lng = $2, speed_kmh = $3, heading_deg = $4,
         fuel_level = COALESCE($5, fuel_level),
         distance_today_km = distance_today_km + COALESCE($6, 0),
         last_telematics_at = $7,
         data_origin = 'REAL'
     WHERE id = $8`,
    [lat, lng, speed, heading, fuel_level, odometer_km, pingTime, vehicle.id]
  );

  // 3. If vehicle has an active in_progress trip, recalculate progress and ETA
  const tripRes = await query(
    `SELECT * FROM trips WHERE organization_id = $1 AND vehicle_id = $2 AND status = 'in_progress'`,
    [organizationId, vehicle.id]
  );

  let tripUpdate = null;
  if (tripRes.rows.length > 0) {
    const trip = tripRes.rows[0];
    const distToDest = haversineDistance(lat, lng, parseFloat(trip.destination_lat), parseFloat(trip.destination_lng));
    const totalDist = parseFloat(trip.distance_km) || 100;
    const progress = Math.min(99, Math.max(1, Math.round(((totalDist - distToDest) / totalDist) * 100)));

    await query(
      `UPDATE trips SET progress_percent = $1 WHERE id = $2`,
      [progress, trip.id]
    );

    tripUpdate = {
      tripId: trip.trip_id,
      progressPercent: progress,
      remainingKm: +distToDest.toFixed(2),
    };
  }

  return {
    success: true,
    vehicleId: vehicle.vehicle_id,
    coordinates: { lat, lng },
    speedKmh: speed,
    recordedAt: pingTime,
    dataOrigin: 'REAL',
    tripUpdate,
  };
}

/**
 * Preview CSV text by parsing and validating against target entity schema
 */
export function previewCsvData(csvText, entityType) {
  const { headers, rows } = parseCSV(csvText);
  const validation = validateAndPreview(entityType, rows);
  return {
    headers,
    ...validation,
  };
}

/**
 * Convenience wrapper for commitIngestion
 */
export async function commitIngestedRecords({ organizationId, type, validRows, fileName }) {
  const rawRows = validRows.map(r => r.data || r);
  return await commitIngestion(organizationId, type, rawRows, fileName);
}

/**
 * Convenience wrapper for ingestGPSPing
 */
export async function ingestGpsPing(params) {
  const { organizationId, ...payload } = params;
  return await ingestGPSPing(organizationId, payload);
}

/**
 * Fetch data sources and ingestion audit trail for tenant
 */
export async function getIngestionHistory(organizationId) {
  const result = await query(
    `SELECT * FROM data_sources WHERE organization_id = $1 ORDER BY created_at DESC`,
    [organizationId]
  );
  return result.rows;
}
