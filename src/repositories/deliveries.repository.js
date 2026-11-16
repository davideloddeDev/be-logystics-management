const { query, withTransaction } = require('../config/db');
const crypto = require('crypto');

class DeliveriesRepository {
  async findAll(companyId, filters = {}) {
    let sql = `
      SELECT d.*, 
             v.plate as vehicle_plate, v.model as vehicle_model,
             c.first_name as driver_first_name, c.last_name as driver_last_name
      FROM deliveries d
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      LEFT JOIN collaborators c ON d.driver_id = c.id
      WHERE d.company_id = ?
    `;
    const params = [companyId];

    if (filters.status) {
      sql += ' AND d.status = ?';
      params.push(filters.status);
    }
    if (filters.driver_id) {
      sql += ' AND d.driver_id = ?';
      params.push(filters.driver_id);
    }
    if (filters.vehicle_id) {
      sql += ' AND d.vehicle_id = ?';
      params.push(filters.vehicle_id);
    }
    if (filters.customer) {
      sql += ' AND d.customer LIKE ?';
      params.push(`%${filters.customer}%`);
    }
    if (filters.from_date) {
      sql += ' AND d.delivery_datetime >= ?';
      params.push(filters.from_date);
    }
    if (filters.to_date) {
      sql += ' AND d.delivery_datetime <= ?';
      params.push(filters.to_date);
    }

    sql += ' ORDER BY d.delivery_datetime DESC';
    return await query(sql, params);
  }

  async findById(companyId, id) {
    const sql = `
      SELECT d.*, 
             v.plate as vehicle_plate, v.model as vehicle_model,
             c.first_name as driver_first_name, c.last_name as driver_last_name
      FROM deliveries d
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      LEFT JOIN collaborators c ON d.driver_id = c.id
      WHERE d.company_id = ? AND d.id = ?
    `;
    const rows = await query(sql, [companyId, id]);
    if (!rows[0]) return null;

    // Recupera storico stati
    const history = await query(
      'SELECT * FROM delivery_status_history WHERE company_id = ? AND delivery_id = ? ORDER BY created_at ASC',
      [companyId, id]
    );

    return {
      ...rows[0],
      status_history: history
    };
  }

  async findByCode(companyId, code) {
    const rows = await query('SELECT * FROM deliveries WHERE company_id = ? AND code = ?', [companyId, code]);
    return rows[0] || null;
  }

  async create(companyId, data, userId = null) {
    return await withTransaction(async (conn) => {
      const sql = `
        INSERT INTO deliveries (
          id, company_id, code, customer, delivery_address, vehicle_id, driver_id, status, delivery_datetime, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        data.id,
        companyId,
        data.code.trim(),
        data.customer.trim(),
        data.delivery_address.trim(),
        data.vehicle_id || null,
        data.driver_id || null,
        data.status || 'in attesa',
        data.delivery_datetime,
        data.amount || 0.00
      ];
      await conn.execute(sql, params);

      // Registra stato iniziale nella cronologia
      await conn.execute(`
        INSERT INTO delivery_status_history (
          id, delivery_id, company_id, previous_status, new_status, changed_by_user_id, notes
        ) VALUES (?, ?, ?, NULL, ?, ?, ?)
      `, [
        crypto.randomUUID(),
        data.id,
        companyId,
        data.status || 'in attesa',
        userId,
        'Creazione consegna'
      ]);

      return true;
    });
  }

  async update(companyId, id, data) {
    const fields = [];
    const params = [];

    if (data.code !== undefined) {
      fields.push('code = ?');
      params.push(data.code.trim());
    }
    if (data.customer !== undefined) {
      fields.push('customer = ?');
      params.push(data.customer.trim());
    }
    if (data.delivery_address !== undefined) {
      fields.push('delivery_address = ?');
      params.push(data.delivery_address.trim());
    }
    if (data.vehicle_id !== undefined) {
      fields.push('vehicle_id = ?');
      params.push(data.vehicle_id);
    }
    if (data.driver_id !== undefined) {
      fields.push('driver_id = ?');
      params.push(data.driver_id);
    }
    if (data.delivery_datetime !== undefined) {
      fields.push('delivery_datetime = ?');
      params.push(data.delivery_datetime);
    }
    if (data.amount !== undefined) {
      fields.push('amount = ?');
      params.push(data.amount);
    }

    if (fields.length > 0) {
      const sql = `UPDATE deliveries SET ${fields.join(', ')} WHERE company_id = ? AND id = ?`;
      params.push(companyId, id);
      await query(sql, params);
    }

    return await this.findById(companyId, id);
  }

  async updateStatus(companyId, id, newStatus, userId, notes = null) {
    return await withTransaction(async (conn) => {
      const [currRows] = await conn.execute(
        'SELECT status FROM deliveries WHERE company_id = ? AND id = ?',
        [companyId, id]
      );
      if (!currRows[0]) return null;

      const previousStatus = currRows[0].status;

      await conn.execute(
        'UPDATE deliveries SET status = ? WHERE company_id = ? AND id = ?',
        [newStatus, companyId, id]
      );

      await conn.execute(`
        INSERT INTO delivery_status_history (
          id, delivery_id, company_id, previous_status, new_status, changed_by_user_id, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        crypto.randomUUID(),
        id,
        companyId,
        previousStatus,
        newStatus,
        userId,
        notes
      ]);

      return true;
    });
  }

  async delete(companyId, id) {
    const result = await query('DELETE FROM deliveries WHERE company_id = ? AND id = ?', [companyId, id]);
    return result.affectedRows > 0;
  }
}

module.exports = new DeliveriesRepository();
