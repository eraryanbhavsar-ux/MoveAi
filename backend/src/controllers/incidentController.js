import { query } from '../config/database.js';

export async function getIncidents(req, res, next) {
  try {
    const { status, type } = req.query;
    let sql = `SELECT * FROM incidents`;
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }
    if (type && type !== 'all') {
      conditions.push(`type = $${params.length + 1}`);
      params.push(type);
    }
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ` ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END, created_at DESC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getIncidentById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM incidents WHERE id = $1 OR incident_id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });

    const incident = result.rows[0];
    const recsRes = await query(
      `SELECT * FROM ai_recommendations WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5`
    );

    res.json({ ...incident, recommendations: recsRes.rows });
  } catch (err) {
    next(err);
  }
}
