import { query } from '../config/database.js';

/**
 * Get all alerts for the organization with optional status and severity filtering
 */
export async function getAlerts(req, res, next) {
  try {
    const organizationId = req.user?.organization_id || 1;
    const { status, severity } = req.query;

    let sql = `SELECT * FROM alerts WHERE organization_id = $1`;
    const params = [organizationId];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    if (severity && severity !== 'all') {
      params.push(severity);
      sql += ` AND severity = $${params.length}`;
    }

    sql += ` ORDER BY 
      CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 WHEN 'info' THEN 3 ELSE 4 END,
      created_at DESC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(req, res, next) {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organization_id || 1;

    const result = await query(
      `UPDATE alerts SET status = 'acknowledged', acknowledged_at = NOW() WHERE id = $1 AND organization_id = $2 RETURNING *`,
      [Number(id), organizationId]
    );

    // Audit log
    await query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, details, user_id) VALUES ($1,$2,$3,$4,$5)`,
      ['alert_acknowledged', 'alert', Number(id), JSON.stringify({ acknowledged_by: req.user?.name }), req.user?.id]
    );

    res.json({ success: true, message: 'Alert acknowledged', alert: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * Resolve an alert
 */
export async function resolveAlert(req, res, next) {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organization_id || 1;

    const result = await query(
      `UPDATE alerts SET status = 'resolved', resolved_at = NOW() WHERE id = $1 AND organization_id = $2 RETURNING *`,
      [Number(id), organizationId]
    );

    // Audit log
    await query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, details, user_id) VALUES ($1,$2,$3,$4,$5)`,
      ['alert_resolved', 'alert', Number(id), JSON.stringify({ resolved_by: req.user?.name }), req.user?.id]
    );

    res.json({ success: true, message: 'Alert resolved', alert: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a manual operational alert
 */
export async function createAlert(req, res, next) {
  try {
    const organizationId = req.user?.organization_id || 1;
    const { alert_type, severity, title, message, entity_type, entity_id, metadata } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const result = await query(
      `INSERT INTO alerts (organization_id, alert_type, severity, title, message, entity_type, entity_id, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8) RETURNING *`,
      [
        organizationId,
        alert_type || 'OPERATIONAL_ALERT',
        severity || 'warning',
        title,
        message,
        entity_type || 'system',
        entity_id || null,
        JSON.stringify(metadata || {}),
      ]
    );

    const alert = result.rows[0];
    res.status(201).json({ success: true, alert, id: alert?.id, ...alert });
  } catch (err) {
    next(err);
  }
}
