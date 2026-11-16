const { query } = require('../config/db');

class DashboardRepository {
  async getSummary(companyId) {
    // 1. Contatori mensili ed operativi
    const countSql = `
      SELECT
        (SELECT COUNT(*) FROM deliveries WHERE company_id = ? AND MONTH(delivery_datetime) = MONTH(CURRENT_DATE()) AND YEAR(delivery_datetime) = YEAR(CURRENT_DATE())) AS monthly_deliveries,
        (SELECT COUNT(*) FROM vehicles WHERE company_id = ? AND status = 'attivo') AS active_vehicles,
        (SELECT COUNT(*) FROM collaborators WHERE company_id = ? AND status = 'attivo') AS active_collaborators,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE company_id = ? AND type = 'entrata' AND status = 'pagato' AND MONTH(due_date) = MONTH(CURRENT_DATE()) AND YEAR(due_date) = YEAR(CURRENT_DATE())) AS monthly_revenue
    `;
    const [counts] = await query(countSql, [companyId, companyId, companyId, companyId]);

    // 2. Serie temporale entrate e consegne dell'ultima settimana (ultimi 7 giorni)
    const timelineSql = `
      SELECT
        d.dt AS date,
        COALESCE(del.delivery_count, 0) AS delivery_count,
        COALESCE(pay.revenue, 0.00) AS revenue
      FROM (
        SELECT CURDATE() - INTERVAL (a.a + (10 * b.a)) DAY AS dt
        FROM (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) a
        CROSS JOIN (SELECT 0 AS a) b
      ) d
      LEFT JOIN (
        SELECT DATE(delivery_datetime) as ddate, COUNT(*) as delivery_count
        FROM deliveries
        WHERE company_id = ? AND delivery_datetime >= CURDATE() - INTERVAL 6 DAY
        GROUP BY DATE(delivery_datetime)
      ) del ON d.dt = del.ddate
      LEFT JOIN (
        SELECT DATE(due_date) as pdate, SUM(amount) as revenue
        FROM payments
        WHERE company_id = ? AND type = 'entrata' AND status = 'pagato' AND due_date >= CURDATE() - INTERVAL 6 DAY
        GROUP BY DATE(due_date)
      ) pay ON d.dt = pay.pdate
      ORDER BY d.dt ASC
    `;
    const weeklyTimeline = await query(timelineSql, [companyId, companyId]);

    // 3. Ultime 5 consegne recenti
    const recentDeliveriesSql = `
      SELECT d.*, v.plate AS vehicle_plate, v.model AS vehicle_model,
             c.first_name AS driver_first_name, c.last_name AS driver_last_name
      FROM deliveries d
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      LEFT JOIN collaborators c ON d.driver_id = c.id
      WHERE d.company_id = ?
      ORDER BY d.delivery_datetime DESC
      LIMIT 5
    `;
    const recentDeliveries = await query(recentDeliveriesSql, [companyId]);

    // 4. Ripartizione consegne per stato
    const deliveriesByStatusSql = `
      SELECT status, COUNT(*) AS count
      FROM deliveries
      WHERE company_id = ?
      GROUP BY status
    `;
    const deliveriesByStatus = await query(deliveriesByStatusSql, [companyId]);

    // 5. Mezzi più utilizzati (per numero di consegne associate)
    const topVehiclesSql = `
      SELECT v.id, v.plate, v.model, v.type, v.mileage, COUNT(d.id) AS delivery_count
      FROM vehicles v
      LEFT JOIN deliveries d ON v.id = d.vehicle_id AND d.company_id = ?
      WHERE v.company_id = ?
      GROUP BY v.id, v.plate, v.model, v.type, v.mileage
      ORDER BY delivery_count DESC, v.mileage DESC
      LIMIT 5
    `;
    const topVehicles = await query(topVehiclesSql, [companyId, companyId]);

    // 6. Distribuzione pagamenti/incassi per metodo
    const paymentMethodsSql = `
      SELECT payment_method, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total_amount
      FROM payments
      WHERE company_id = ? AND payment_method IS NOT NULL
      GROUP BY payment_method
    `;
    const paymentMethods = await query(paymentMethodsSql, [companyId]);

    return {
      overview: {
        monthlyDeliveries: Number(counts.monthly_deliveries || 0),
        activeVehicles: Number(counts.active_vehicles || 0),
        activeCollaborators: Number(counts.active_collaborators || 0),
        monthlyRevenue: parseFloat(counts.monthly_revenue || 0).toFixed(2)
      },
      weeklyTimeline,
      recentDeliveries,
      deliveriesByStatus,
      topVehicles,
      paymentMethodsDistribution: paymentMethods
    };
  }
}

module.exports = new DashboardRepository();
