const telemetryService = require('../services/telemetry.service');

class TelemetryController {
  async ingestTelemetry(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await telemetryService.ingestTelemetry(companyId, req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Dati telemetrici acquisiti con successo'
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllLatest(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const latest = await telemetryService.getAllLatest(companyId);
      res.json({
        success: true,
        data: latest,
        count: latest.length
      });
    } catch (err) {
      next(err);
    }
  }

  async getVehicleHistory(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const history = await telemetryService.getVehicleHistory(companyId, req.params.vehicleId, req.query);
      res.json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TelemetryController();
