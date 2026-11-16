const { query } = require('../config/db');

class VehiclesRepository {
  async findAll(companyId, filters = {}) {
    let sql = 'SELECT * FROM vehicles WHERE company_id = ?';
    const params = [companyId];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.insurance_expiring === 'true') {
      // Scadenza entro 30 giorni
      sql += ' AND insurance_expiry_date IS NOT NULL AND insurance_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)';
    }

    sql += ' ORDER BY created_at DESC';
    return await query(sql, params);
  }

  async findById(companyId, id) {
    const rows = await query('SELECT * FROM vehicles WHERE company_id = ? AND id = ?', [companyId, id]);
    return rows[0] || null;
  }

  async findByPlate(companyId, plate) {
    const rows = await query('SELECT * FROM vehicles WHERE company_id = ? AND plate = ?', [companyId, plate]);
    return rows[0] || null;
  }

  async create(companyId, data) {
    const sql = `
      INSERT INTO vehicles (
        id, company_id, plate, model, type, status, mileage,
        last_maintenance_date, insurance_company, insurance_policy_number, insurance_expiry_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.id,
      companyId,
      data.plate.toUpperCase().trim(),
      data.model.trim(),
      data.type || 'furgone',
      data.status || 'attivo',
      data.mileage || 0,
      data.last_maintenance_date || null,
      data.insurance_company || null,
      data.insurance_policy_number || null,
      data.insurance_expiry_date || null
    ];
    await query(sql, params);
    return await this.findById(companyId, data.id);
  }

  async update(companyId, id, data) {
    const fields = [];
    const params = [];

    if (data.plate !== undefined) {
      fields.push('plate = ?');
      params.push(data.plate.toUpperCase().trim());
    }
    if (data.model !== undefined) {
      fields.push('model = ?');
      params.push(data.model.trim());
    }
    if (data.type !== undefined) {
      fields.push('type = ?');
      params.push(data.type);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      params.push(data.status);
    }
    if (data.mileage !== undefined) {
      fields.push('mileage = ?');
      params.push(data.mileage);
    }
    if (data.last_maintenance_date !== undefined) {
      fields.push('last_maintenance_date = ?');
      params.push(data.last_maintenance_date);
    }
    if (data.insurance_company !== undefined) {
      fields.push('insurance_company = ?');
      params.push(data.insurance_company);
    }
    if (data.insurance_policy_number !== undefined) {
      fields.push('insurance_policy_number = ?');
      params.push(data.insurance_policy_number);
    }
    if (data.insurance_expiry_date !== undefined) {
      fields.push('insurance_expiry_date = ?');
      params.push(data.insurance_expiry_date);
    }

    if (fields.length === 0) return await this.findById(companyId, id);

    const sql = `UPDATE vehicles SET ${fields.join(', ')} WHERE company_id = ? AND id = ?`;
    params.push(companyId, id);
    await query(sql, params);
    return await this.findById(companyId, id);
  }

  async delete(companyId, id) {
    const result = await query('DELETE FROM vehicles WHERE company_id = ? AND id = ?', [companyId, id]);
    return result.affectedRows > 0;
  }
}

module.exports = new VehiclesRepository();
