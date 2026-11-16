const dashboardService = require('../services/dashboard.service');

class DashboardController {
  async getSummary(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const summary = await dashboardService.getSummary(companyId);
      res.json({
        success: true,
        data: summary
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
