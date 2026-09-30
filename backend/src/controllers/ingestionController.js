import {
  previewCsvData,
  commitIngestedRecords,
  ingestGpsPing,
  getIngestionHistory
} from '../services/ingestionService.js';
import { query } from '../config/database.js';

/**
 * Preview uploaded CSV records and run schema validation
 */
export async function previewCsv(req, res, next) {
  try {
    const { csvText, type } = req.body;
    if (!csvText || !type) {
      return res.status(400).json({ error: 'Missing csvText or type (vehicles, deliveries, drivers)' });
    }

    const preview = previewCsvData(csvText, type);
    res.json(preview);
  } catch (err) {
    next(err);
  }
}

/**
 * Commit validated CSV records to the persistent database
 */
export async function commitCsv(req, res, next) {
  try {
    const { validRows, type, fileName } = req.body;
    const organizationId = req.user?.organization_id || 1;

    if (!validRows || !Array.isArray(validRows) || validRows.length === 0) {
      return res.status(400).json({ error: 'No valid rows provided to commit' });
    }
    if (!['vehicles', 'deliveries', 'drivers'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be vehicles, deliveries, or drivers' });
    }

    const result = await commitIngestedRecords({
      organizationId,
      type,
      validRows,
      fileName: fileName || `manual_upload_${Date.now()}.csv`,
    });

    res.json({ ...result, committed: result.importedCount });
  } catch (err) {
    next(err);
  }
}

/**
 * Ingest live GPS telematics ping from IoT tracker or telematics gateway
 */
export async function ingestPing(req, res, next) {
  try {
    const {
      vehicle_id,
      latitude,
      longitude,
      speed,
      speed_kmh,
      heading,
      heading_deg,
      status,
      timestamp,
    } = req.body;

    const organizationId = req.user?.organization_id || 1;

    if (!vehicle_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'vehicle_id, latitude, and longitude are required' });
    }

    const pingResult = await ingestGpsPing({
      organizationId,
      vehicleId: vehicle_id,
      latitude: Number(latitude),
      longitude: Number(longitude),
      speedKmh: Number(speed_kmh ?? speed ?? 0),
      headingDeg: Number(heading_deg ?? heading ?? 0),
      status: status || 'moving',
      timestamp: timestamp || new Date().toISOString(),
      rawPayload: req.body,
    });

    res.json({
      success: true,
      message: 'Telematics ping ingested successfully',
      data: pingResult,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch ingestion audit history for the authenticated tenant organization
 */
export async function getHistory(req, res, next) {
  try {
    const organizationId = req.user?.organization_id || 1;
    const history = await getIngestionHistory(organizationId);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

/**
 * Get active integration connector configurations and live statuses
 */
export async function getIntegrations(req, res, next) {
  try {
    const organizationId = req.user?.organization_id || 1;
    const result = await query(
      `SELECT * FROM integration_configs WHERE organization_id = $1`,
      [organizationId]
    );

    // If empty, return standard production connectors
    const connectors = result.rows.length > 0 ? result.rows : [
      {
        provider: 'osrm',
        service_type: 'routing',
        is_enabled: true,
        status: 'connected',
        config: { endpoint: 'https://router.project-osrm.org', mode: 'driving' },
      },
      {
        provider: 'open-meteo',
        service_type: 'weather',
        is_enabled: true,
        status: 'connected',
        config: { endpoint: 'https://api.open-meteo.com/v1/forecast' },
      },
      {
        provider: 'telematics_rest',
        service_type: 'gps_ingestion',
        is_enabled: true,
        status: 'active',
        config: { endpoint: '/api/telematics/ping', auth_type: 'bearer' },
      },
      {
        provider: 'gemini',
        service_type: 'ai_reasoning',
        is_enabled: true,
        status: 'connected',
        config: { model: 'gemini-1.5-flash', backend_managed: true },
      },
    ];

    res.json(connectors);
  } catch (err) {
    next(err);
  }
}

/**
 * Update or save an integration connector config
 */
export async function saveIntegration(req, res, next) {
  try {
    const organizationId = req.user?.organization_id || 1;
    const { provider, service_type, is_enabled, config } = req.body;

    const existing = await query(
      `SELECT id FROM integration_configs WHERE organization_id = $1 AND provider = $2`,
      [organizationId, provider]
    );

    if (existing.rows.length > 0) {
      await query(
        `UPDATE integration_configs SET is_enabled = $1, config = $2, updated_at = NOW() WHERE id = $3`,
        [is_enabled, JSON.stringify(config || {}), existing.rows[0].id]
      );
    } else {
      await query(
        `INSERT INTO integration_configs (organization_id, provider, service_type, is_enabled, config, status)
         VALUES ($1, $2, $3, $4, $5, 'connected')`,
        [organizationId, provider, service_type, is_enabled, JSON.stringify(config || {})]
      );
    }

    res.json({ success: true, message: 'Integration configuration updated' });
  } catch (err) {
    next(err);
  }
}
