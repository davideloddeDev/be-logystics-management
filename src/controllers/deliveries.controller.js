const deliveriesService = require('../services/deliveries.service');

class DeliveriesController {
  async getAllDeliveries(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const deliveries = await deliveriesService.getAllDeliveries(companyId, req.query);
      res.json({
        success: true,
        data: deliveries,
        count: deliveries.length
      });
    } catch (err) {
      next(err);
    }
  }

  async getDeliveryById(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const delivery = await deliveriesService.getDeliveryById(companyId, req.params.id);
      res.json({
        success: true,
        data: delivery
      });
    } catch (err) {
      next(err);
    }
  }

  async createDelivery(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.userId;
      const created = await deliveriesService.createDelivery(companyId, req.body, userId);
      res.status(201).json({
        success: true,
        data: created,
        message: 'Consegna creata con successo'
      });
    } catch (err) {
      next(err);
    }
  }

  async updateDelivery(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updated = await deliveriesService.updateDelivery(companyId, req.params.id, req.body);
      res.json({
        success: true,
        data: updated,
        message: 'Consegna aggiornata con successo'
      });
    } catch (err) {
      next(err);
    }
  }

  async updateDeliveryStatus(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.userId;
      const { status, notes } = req.body;
      const updated = await deliveriesService.updateDeliveryStatus(companyId, req.params.id, status, userId, notes);
      res.json({
        success: true,
        data: updated,
        message: `Stato consegna aggiornato a '${status}'`
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteDelivery(req, res, next) {
    try {
      const companyId = req.user.companyId;
      await deliveriesService.deleteDelivery(companyId, req.params.id);
      res.json({
        success: true,
        message: 'Consegna eliminata con successo'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DeliveriesController();
