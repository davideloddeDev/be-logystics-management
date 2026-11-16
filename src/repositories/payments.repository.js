const { query } = require('../config/db');

class PaymentsRepository {
  async findAll(companyId, filters = {}) {
    let sql = 'SELECT * FROM payments WHERE company_id = ?';
    const params = [companyId];

    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.from_date) {
      sql += ' AND due_date >= ?';
      params.push(filters.from_date);
    }
    if (filters.to_date) {
      sql += ' AND due_date <= ?';
      params.push(filters.to_date);
    }

    sql += ' ORDER BY due_date DESC';
    return await query(sql, params);
  }

  async findById(companyId, id) {
    const rows = await query('SELECT * FROM payments WHERE company_id = ? AND id = ?', [companyId, id]);
    return rows[0] || null;
  }

  async getFinancialSummary(companyId) {
    const sql = `
      SELECT
        COALESCE(SUM(CASE WHEN type != 'entrata' THEN amount ELSE 0 END), 0) AS total_expenses,
        COALESCE(SUM(CASE WHEN type != 'entrata' AND status = 'pagato' THEN amount ELSE 0 END), 0) AS expenses_paid,
        COALESCE(SUM(CASE WHEN type != 'entrata' AND status = 'da pagare' THEN amount ELSE 0 END), 0) AS expenses_pending,
        COALESCE(SUM(CASE WHEN type = 'entrata' AND status = 'pagato' THEN amount ELSE 0 END), 0) AS total_incomes,
        COALESCE(SUM(CASE WHEN type = 'entrata' AND status = 'da pagare' THEN amount ELSE 0 END), 0) AS incomes_pending
      FROM payments
      WHERE company_id = ?
    `;
    const rows = await query(sql, [companyId]);
    return rows[0];
  }

  async create(companyId, data) {
    const sql = `
      INSERT INTO payments (
        id, company_id, type, reference, description, amount, status, payment_method, due_date, paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.id,
      companyId,
      data.type,
      data.reference.trim(),
      data.description ? data.description.trim() : null,
      data.amount,
      data.status || 'da pagare',
      data.payment_method || null,
      data.due_date,
      data.paid_at || null
    ];
    await query(sql, params);
    return await this.findById(companyId, data.id);
  }

  async update(companyId, id, data) {
    const fields = [];
    const params = [];

    if (data.type !== undefined) {
      fields.push('type = ?');
      params.push(data.type);
    }
    if (data.reference !== undefined) {
      fields.push('reference = ?');
      params.push(data.reference.trim());
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      params.push(data.description.trim());
    }
    if (data.amount !== undefined) {
      fields.push('amount = ?');
      params.push(data.amount);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      params.push(data.status);
    }
    if (data.payment_method !== undefined) {
      fields.push('payment_method = ?');
      params.push(data.payment_method);
    }
    if (data.due_date !== undefined) {
      fields.push('due_date = ?');
      params.push(data.due_date);
    }
    if (data.paid_at !== undefined) {
      fields.push('paid_at = ?');
      params.push(data.paid_at);
    }

    if (fields.length === 0) return await this.findById(companyId, id);

    const sql = `UPDATE payments SET ${fields.join(', ')} WHERE company_id = ? AND id = ?`;
    params.push(companyId, id);
    await query(sql, params);
    return await this.findById(companyId, id);
  }

  async markAsPaid(companyId, id, paymentMethod, paidAt = new Date()) {
    const sql = `
      UPDATE payments 
      SET status = 'pagato', payment_method = ?, paid_at = ?
      WHERE company_id = ? AND id = ?
    `;
    await query(sql, [paymentMethod, paidAt, companyId, id]);
    return await this.findById(companyId, id);
  }

  async delete(companyId, id) {
    const result = await query('DELETE FROM payments WHERE company_id = ? AND id = ?', [companyId, id]);
    return result.affectedRows > 0;
  }
}

module.exports = new PaymentsRepository();
