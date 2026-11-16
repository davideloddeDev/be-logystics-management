const { query } = require('../config/db');

class CollaboratorsRepository {
  async findAll(companyId, filters = {}) {
    let sql = 'SELECT * FROM collaborators WHERE company_id = ?';
    const params = [companyId];

    if (filters.role) {
      sql += ' AND role = ?';
      params.push(filters.role);
    }
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY created_at DESC';
    return await query(sql, params);
  }

  async findById(companyId, id) {
    const rows = await query('SELECT * FROM collaborators WHERE company_id = ? AND id = ?', [companyId, id]);
    return rows[0] || null;
  }

  async findByEmail(companyId, email) {
    const rows = await query('SELECT * FROM collaborators WHERE company_id = ? AND email = ?', [companyId, email]);
    return rows[0] || null;
  }

  async create(companyId, data) {
    const sql = `
      INSERT INTO collaborators (
        id, company_id, first_name, last_name, role, phone, email, status, hiring_date, license_expiry_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.id,
      companyId,
      data.first_name.trim(),
      data.last_name.trim(),
      data.role || 'autista',
      data.phone || null,
      data.email.trim().toLowerCase(),
      data.status || 'attivo',
      data.hiring_date || null,
      data.license_expiry_date || null
    ];
    await query(sql, params);
    return await this.findById(companyId, data.id);
  }

  async update(companyId, id, data) {
    const fields = [];
    const params = [];

    if (data.first_name !== undefined) {
      fields.push('first_name = ?');
      params.push(data.first_name.trim());
    }
    if (data.last_name !== undefined) {
      fields.push('last_name = ?');
      params.push(data.last_name.trim());
    }
    if (data.role !== undefined) {
      fields.push('role = ?');
      params.push(data.role);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      params.push(data.phone);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      params.push(data.email.trim().toLowerCase());
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      params.push(data.status);
    }
    if (data.hiring_date !== undefined) {
      fields.push('hiring_date = ?');
      params.push(data.hiring_date);
    }
    if (data.license_expiry_date !== undefined) {
      fields.push('license_expiry_date = ?');
      params.push(data.license_expiry_date);
    }

    if (fields.length === 0) return await this.findById(companyId, id);

    const sql = `UPDATE collaborators SET ${fields.join(', ')} WHERE company_id = ? AND id = ?`;
    params.push(companyId, id);
    await query(sql, params);
    return await this.findById(companyId, id);
  }

  async delete(companyId, id) {
    const result = await query('DELETE FROM collaborators WHERE company_id = ? AND id = ?', [companyId, id]);
    return result.affectedRows > 0;
  }
}

module.exports = new CollaboratorsRepository();
