import { query } from '../config/database.js';

export async function getVehicles(req, res, next) {
  try {
    const { status, risk } = req.query;
    let sql = `SELECT v.*, d.name as driver_name, d.phone as driver_phone, d.rating as driver_rating,
               t.trip_id as current_trip_id, t.origin_name, t.destination_name, t.progress_percent as trip_progress
               FROM vehicles v
               LEFT JOIN drivers d ON v.driver_id = d.id
               LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'in_progress'`;
    const params = [];
    const conditions = [];
    
    if (status && status !== 'all') {
      conditions.push(`v.status = $${params.length + 1}`);
      params.push(status);
    }
    if (risk === 'high') {
      conditions.push(`v.risk_score >= 60`);
    }
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ` ORDER BY v.risk_score DESC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getVehicleById(req, res, next) {
  try {
    const { id } = req.params;
    const vehicleRes = await query(
      `SELECT v.*, d.name as driver_name, d.phone as driver_phone, d.rating as driver_rating
       FROM vehicles v LEFT JOIN drivers d ON v.driver_id = d.id
       WHERE v.id = $1 OR v.vehicle_id = $1`, [id]
    );
    if (vehicleRes.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });

    const vehicle = vehicleRes.rows[0];
    const [tripsRes, deliveriesRes] = await Promise.all([
      query(`SELECT * FROM trips WHERE vehicle_id = $1 ORDER BY created_at DESC`, [vehicle.id]),
      query(`SELECT * FROM deliveries WHERE assigned_vehicle_id = $1 ORDER BY created_at DESC`, [vehicle.id]),
    ]);

    res.json({ ...vehicle, trips: tripsRes.rows, deliveries: deliveriesRes.rows });
  } catch (err) {
    next(err);
  }
}
