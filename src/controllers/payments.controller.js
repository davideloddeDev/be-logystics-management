const paymentsService = require('../services/payments.service');

class PaymentsController {
  async getAllPayments(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const payments = await paymentsService.getAllPayments(companyId, req.query);
      res.json({
        success: true,
        data: payments,
        count: payments.length
      });
    } catch (err) {
      next(err);
    }
  }

  async getFinancialSummary(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const summary = await paymentsService.getFinancialSummary(companyId);
      res.json({
        success: true,
        data: summary
      });
    } catch (err) {
      next(err);
    }
  }

  async getPaymentById(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const payment = await paymentsService.getPaymentById(companyId, req.params.id);
      res.json({
        success: true,
        data: payment
      });
    } catch (err) {
      next(err);
    }
  }

  async createPayment(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const created = await paymentsService.createPayment(companyId, req.body);
      res.status(201).json({
        success: true,
        data: created,
        message: 'Voce di pagamento creata con successo'
      });
    } catch (err) {
      next(err);
    }
  }

  async updatePayment(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updated = await paymentsService.updatePayment(companyId, req.params.id, req.body);
      res.json({
        success: true,
        data: updated,
        message: 'Voce di pagamento aggiornata con successo'
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsPaid(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { payment_method, paid_at } = req.body;
      const updated = await paymentsService.markAsPaid(companyId, req.params.id, payment_method, paid_at);
      res.json({
        success: true,
        data: updated,
        message: 'Voce registrata come pagata'
      });
    } catch (err) {
      next(err);
    }
  }

  async deletePayment(req, res, next) {
    try {
      const companyId = req.user.companyId;
      await paymentsService.deletePayment(companyId, req.params.id);
      res.json({
        success: true,
        message: 'Voce di pagamento eliminata con successo'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PaymentsController();
