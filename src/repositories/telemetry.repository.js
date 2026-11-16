const { query } = require('../config/db');

class TelemetryRepository {
  async ingest(companyId, data) {
    const timestamp = data.device_timestamp || new Date();

    // 1. Inserimento o aggiornamento in telemetry_latest (chiave primaria: vehicle_id)
    const latestSql = `
      INSERT INTO telemetry_latest (
        vehicle_id, company_id, latitude, longitude, address, speed,
        engine_status, available_load_kg, total_load_kg, tare_kg,
        compartment_temperature, estimated_autonomy_km, device_timestamp, received_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        address = VALUES(address),
        speed = VALUES(speed),
        engine_status = VALUES(engine_status),
        available_load_kg = VALUES(available_load_kg),
        total_load_kg = VALUES(total_load_kg),
        tare_kg = VALUES(tare_kg),
        compartment_temperature = VALUES(compartment_temperature),
        estimated_autonomy_km = VALUES(estimated_autonomy_km),
        device_timestamp = VALUES(device_timestamp),
        received_at = NOW()
    `;
    const latestParams = [
      data.vehicle_id,
      companyId,
      data.latitude,
      data.longitude,
      data.address || null,
      data.speed || 0.0,
      data.engine_status || 'spento',
      data.available_load_kg || 0.0,
      data.total_load_kg || 0.0,
      data.tare_kg || 0.0,
      data.compartment_temperature !== undefined ? data.compartment_temperature : null,
      data.estimated_autonomy_km || 0,
      timestamp
    ];
    await query(latestSql, latestParams);

    // 2. Inserimento nello storico telemetry_history
    const historySql = `
      INSERT INTO telemetry_history (
        vehicle_id, company_id, latitude, longitude, address, speed,
        engine_status, compartment_temperature, device_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const historyParams = [
      data.vehicle_id,
      companyId,
      data.latitude,
      data.longitude,
      data.address || null,
      data.speed || 0.0,
      data.engine_status || 'spento',
      data.compartment_temperature !== undefined ? data.compartment_temperature : null,
      timestamp
    ];
    await query(historySql, historyParams);

    return await this.getLatestByVehicle(companyId, data.vehicle_id);
  }

  async getAllLatest(companyId) {
    const sql = `
      SELECT t.*, v.plate, v.model, v.type as vehicle_type,
             CASE
               WHEN t.received_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE) THEN 'online'
               ELSE 'offline'
             END as connection_status
      FROM telemetry_latest t
      INNER JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.company_id = ?
      ORDER BY t.received_at DESC
    `;
    return await query(sql, [companyId]);
  }

  async getLatestByVehicle(companyId, vehicleId) {
    const sql = `
      SELECT t.*, v.plate, v.model, v.type as vehicle_type,
             CASE
               WHEN t.received_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE) THEN 'online'
               ELSE 'offline'
             END as connection_status
      FROM telemetry_latest t
      INNER JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.company_id = ? AND t.vehicle_id = ?
    `;
    const rows = await query(sql, [companyId, vehicleId]);
    return rows[0] || null;
  }

  async getVehicleHistory(companyId, vehicleId, filters = {}) {
    let sql = 'SELECT * FROM telemetry_history WHERE company_id = ? AND vehicle_id = ?';
    const params = [companyId, vehicleId];

    if (filters.from_date) {
      sql += ' AND device_timestamp >= ?';
      params.push(filters.from_date);
    }
    if (filters.to_date) {
      sql += ' AND device_timestamp <= ?';
      params.push(filters.to_date);
    }

    sql += ' ORDER BY device_timestamp ASC LIMIT 1000';
    return await query(sql, params);
  }
}

module.exports = new TelemetryRepository();
