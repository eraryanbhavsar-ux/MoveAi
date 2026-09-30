import { query } from '../config/database.js';

export async function getDeliveries(req, res, next) {
  try {
    const { status, priority } = req.query;
    let sql = `SELECT d.*, v.vehicle_id as vehicle_code, t.trip_id as trip_code, t.origin_name, t.destination_name
               FROM deliveries d
               LEFT JOIN vehicles v ON d.assigned_vehicle_id = v.id
               LEFT JOIN trips t ON d.assigned_trip_id = t.id`;
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(`d.status = $${params.length + 1}`);
      params.push(status);
    }
    if (priority && priority !== 'all') {
      conditions.push(`d.priority = $${params.length + 1}`);
      params.push(priority);
    }
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ` ORDER BY CASE d.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 END, d.risk_score DESC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getDeliveryById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT d.*, v.vehicle_id as vehicle_code, v.vehicle_type, t.trip_id as trip_code, t.origin_name, t.destination_name, t.status as trip_status, t.risk_score as trip_risk
       FROM deliveries d
       LEFT JOIN vehicles v ON d.assigned_vehicle_id = v.id
       LEFT JOIN trips t ON d.assigned_trip_id = t.id
       WHERE d.id = $1 OR d.delivery_id = $1`, [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });

    const recsRes = await query(
      `SELECT * FROM ai_recommendations WHERE affected_delivery_ids::text LIKE $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 3`,
      [`%${result.rows[0].delivery_id}%`]
    );

    res.json({ ...result.rows[0], recommendations: recsRes.rows });
  } catch (err) {
    next(err);
  }
}
