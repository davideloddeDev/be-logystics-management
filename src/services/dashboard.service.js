const dashboardRepository = require('../repositories/dashboard.repository');

class DashboardService {
  async getSummary(companyId) {
    return await dashboardRepository.getSummary(companyId);
  }
}

module.exports = new DashboardService();
