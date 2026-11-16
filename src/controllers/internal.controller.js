const { query } = require('../config/db');

class InternalController {
  async getCompanyStats(req, res, next) {
    try {
      const companyId = req.params.companyId;

      // Verifica esistenza azienda
      const companyRows = await query('SELECT * FROM companies WHERE id = ?', [companyId]);
      if (companyRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Azienda non trovata'
        });
      }

      const statsSql = `
        SELECT
          (SELECT COUNT(*) FROM vehicles WHERE company_id = ?) AS total_vehicles,
          (SELECT COUNT(*) FROM vehicles WHERE company_id = ? AND status = 'attivo') AS active_vehicles,
          (SELECT COUNT(*) FROM collaborators WHERE company_id = ?) AS total_collaborators,
          (SELECT COUNT(*) FROM collaborators WHERE company_id = ? AND status = 'attivo') AS active_collaborators,
          (SELECT COUNT(*) FROM deliveries WHERE company_id = ?) AS total_deliveries,
          (SELECT COUNT(*) FROM deliveries WHERE company_id = ? AND status = 'consegnata') AS delivered_count,
          (SELECT COUNT(*) FROM deliveries WHERE company_id = ? AND status = 'in attesa') AS pending_deliveries,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE company_id = ? AND type = 'entrata' AND status = 'pagato') AS total_revenue
      `;
      const [stats] = await query(statsSql, [
        companyId, companyId, companyId, companyId, companyId, companyId, companyId, companyId
      ]);

      res.json({
        success: true,
        company: {
          id: companyRows[0].id,
          businessName: companyRows[0].business_name,
          vatNumber: companyRows[0].vat_number
        },
        stats: {
          totalVehicles: Number(stats.total_vehicles),
          activeVehicles: Number(stats.active_vehicles),
          totalCollaborators: Number(stats.total_collaborators),
          activeCollaborators: Number(stats.active_collaborators),
          totalDeliveries: Number(stats.total_deliveries),
          deliveredCount: Number(stats.delivered_count),
          pendingDeliveries: Number(stats.pending_deliveries),
          totalRevenue: parseFloat(stats.total_revenue).toFixed(2)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async querySemanticContext(req, res, next) {
    try {
      const companyId = req.params.companyId;
      const { entity, keyword, limit = 20 } = req.query;

      let results = [];

      switch (entity) {
        case 'vehicles': {
          let sql = 'SELECT id, plate, model, type, status, mileage FROM vehicles WHERE company_id = ?';
          const params = [companyId];
          if (keyword) {
            sql += ' AND (plate LIKE ? OR model LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
          }
          sql += ' LIMIT ?';
          params.push(Number(limit));
          results = await query(sql, params);
          break;
        }

        case 'collaborators': {
          let sql = 'SELECT id, first_name, last_name, role, status, email, phone FROM collaborators WHERE company_id = ?';
          const params = [companyId];
          if (keyword) {
            sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
          }
          sql += ' LIMIT ?';
          params.push(Number(limit));
          results = await query(sql, params);
          break;
        }

        case 'deliveries': {
          let sql = `
            SELECT d.id, d.code, d.customer, d.delivery_address, d.status, d.delivery_datetime, d.amount,
                   v.plate as vehicle_plate, c.last_name as driver_last_name
            FROM deliveries d
            LEFT JOIN vehicles v ON d.vehicle_id = v.id
            LEFT JOIN collaborators c ON d.driver_id = c.id
            WHERE d.company_id = ?
          `;
          const params = [companyId];
          if (keyword) {
            sql += ' AND (d.code LIKE ? OR d.customer LIKE ? OR d.delivery_address LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
          }
          sql += ' ORDER BY d.delivery_datetime DESC LIMIT ?';
          params.push(Number(limit));
          results = await query(sql, params);
          break;
        }

        case 'payments': {
          let sql = 'SELECT id, type, reference, amount, status, payment_method, due_date FROM payments WHERE company_id = ?';
          const params = [companyId];
          if (keyword) {
            sql += ' AND (reference LIKE ? OR description LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
          }
          sql += ' ORDER BY due_date DESC LIMIT ?';
          params.push(Number(limit));
          results = await query(sql, params);
          break;
        }

        default:
          return res.status(400).json({
            success: false,
            error: 'Entità di consultazione non valida. Valori supportati: vehicles, collaborators, deliveries, payments'
          });
      }

      res.json({
        success: true,
        entity,
        count: results.length,
        data: results
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new InternalController();
