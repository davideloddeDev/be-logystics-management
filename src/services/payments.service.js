const crypto = require('crypto');
const paymentsRepository = require('../repositories/payments.repository');

class PaymentsService {
  async getAllPayments(companyId, filters) {
    return await paymentsRepository.findAll(companyId, filters);
  }

  async getFinancialSummary(companyId) {
    return await paymentsRepository.getFinancialSummary(companyId);
  }

  async getPaymentById(companyId, id) {
    const payment = await paymentsRepository.findById(companyId, id);
    if (!payment) {
      const error = new Error('Voce di pagamento non trovata');
      error.statusCode = 404;
      throw error;
    }
    return payment;
  }

  async createPayment(companyId, data) {
    const newPayment = {
      id: crypto.randomUUID(),
      ...data
    };
    return await paymentsRepository.create(companyId, newPayment);
  }

  async updatePayment(companyId, id, data) {
    await this.getPaymentById(companyId, id);
    return await paymentsRepository.update(companyId, id, data);
  }

  async markAsPaid(companyId, id, paymentMethod, paidAt) {
    await this.getPaymentById(companyId, id);
    return await paymentsRepository.markAsPaid(companyId, id, paymentMethod, paidAt);
  }

  async deletePayment(companyId, id) {
    await this.getPaymentById(companyId, id);
    return await paymentsRepository.delete(companyId, id);
  }
}

module.exports = new PaymentsService();
