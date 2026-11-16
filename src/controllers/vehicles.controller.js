const vehiclesService = require('../services/vehicles.service');

class VehiclesController {
  async getAllVehicles(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const vehicles = await vehiclesService.getAllVehicles(companyId, req.query);
      res.json({
        success: true,
        data: vehicles,
        count: vehicles.length
      });
    } catch (err) {
      next(err);
    }
  }

  async getVehicleById(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const vehicle = await vehiclesService.getVehicleById(companyId, req.params.id);
      res.json({
        success: true,
        data: vehicle
      });
    } catch (err) {
      next(err);
    }
  }

  async createVehicle(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const created = await vehiclesService.createVehicle(companyId, req.body);
      res.status(201).json({
        success: true,
        data: created,
        message: 'Mezzo creato con successo'
      });
    } catch (err) {
      next(err);
    }
  }

  async updateVehicle(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updated = await vehiclesService.updateVehicle(companyId, req.params.id, req.body);
      res.json({
        success: true,
        data: updated,
        message: 'Mezzo aggiornato con successo'
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteVehicle(req, res, next) {
    try {
      const companyId = req.user.companyId;
      await vehiclesService.deleteVehicle(companyId, req.params.id);
      res.json({
        success: true,
        message: 'Mezzo eliminato con successo'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VehiclesController();
