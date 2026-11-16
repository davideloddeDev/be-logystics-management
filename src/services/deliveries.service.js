const crypto = require('crypto');
const deliveriesRepository = require('../repositories/deliveries.repository');
const vehiclesRepository = require('../repositories/vehicles.repository');
const collaboratorsRepository = require('../repositories/collaborators.repository');

class DeliveriesService {
  async getAllDeliveries(companyId, filters) {
    return await deliveriesRepository.findAll(companyId, filters);
  }

  async getDeliveryById(companyId, id) {
    const delivery = await deliveriesRepository.findById(companyId, id);
    if (!delivery) {
      const error = new Error('Consegna non trovata');
      error.statusCode = 404;
      throw error;
    }
    return delivery;
  }

  async createDelivery(companyId, data, userId) {
    // Verifica unicità codice
    const existing = await deliveriesRepository.findByCode(companyId, data.code);
    if (existing) {
      const error = new Error(`Codice consegna '${data.code}' già presente`);
      error.statusCode = 409;
      throw error;
    }

    // Verifica esistenza mezzo se indicato
    if (data.vehicle_id) {
      const vehicle = await vehiclesRepository.findById(companyId, data.vehicle_id);
      if (!vehicle) {
        const error = new Error('Mezzo associato non trovato per questa azienda');
        error.statusCode = 400;
        throw error;
      }
    }

    // Verifica esistenza autista se indicato
    if (data.driver_id) {
      const driver = await collaboratorsRepository.findById(companyId, data.driver_id);
      if (!driver) {
        const error = new Error('Autista/collaboratore non trovato per questa azienda');
        error.statusCode = 400;
        throw error;
      }
    }

    const deliveryId = crypto.randomUUID();
    await deliveriesRepository.create(companyId, { id: deliveryId, ...data }, userId);
    return await deliveriesRepository.findById(companyId, deliveryId);
  }

  async updateDelivery(companyId, id, data) {
    await this.getDeliveryById(companyId, id);

    if (data.code) {
      const existing = await deliveriesRepository.findByCode(companyId, data.code);
      if (existing && existing.id !== id) {
        const error = new Error(`Codice consegna '${data.code}' già presente`);
        error.statusCode = 409;
        throw error;
      }
    }

    return await deliveriesRepository.update(companyId, id, data);
  }

  async updateDeliveryStatus(companyId, id, newStatus, userId, notes) {
    await this.getDeliveryById(companyId, id);
    await deliveriesRepository.updateStatus(companyId, id, newStatus, userId, notes);
    return await deliveriesRepository.findById(companyId, id);
  }

  async deleteDelivery(companyId, id) {
    const delivery = await this.getDeliveryById(companyId, id);
    if (delivery.status === 'in transito') {
      const error = new Error('Non è possibile eliminare una consegna in transito');
      error.statusCode = 400;
      throw error;
    }
    return await deliveriesRepository.delete(companyId, id);
  }
}

module.exports = new DeliveriesService();
