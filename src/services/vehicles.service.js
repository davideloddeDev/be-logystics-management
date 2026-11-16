const crypto = require('crypto');
const vehiclesRepository = require('../repositories/vehicles.repository');

class VehiclesService {
  async getAllVehicles(companyId, filters) {
    return await vehiclesRepository.findAll(companyId, filters);
  }

  async getVehicleById(companyId, id) {
    const vehicle = await vehiclesRepository.findById(companyId, id);
    if (!vehicle) {
      const error = new Error('Mezzo non trovato');
      error.statusCode = 404;
      throw error;
    }
    return vehicle;
  }

  async createVehicle(companyId, data) {
    const existing = await vehiclesRepository.findByPlate(companyId, data.plate);
    if (existing) {
      const error = new Error(`Esiste già un mezzo con la targa ${data.plate.toUpperCase()} per questa azienda`);
      error.statusCode = 409;
      throw error;
    }

    const newVehicleData = {
      id: crypto.randomUUID(),
      ...data
    };

    return await vehiclesRepository.create(companyId, newVehicleData);
  }

  async updateVehicle(companyId, id, data) {
    await this.getVehicleById(companyId, id);

    if (data.plate) {
      const existing = await vehiclesRepository.findByPlate(companyId, data.plate);
      if (existing && existing.id !== id) {
        const error = new Error(`Esiste già un altro mezzo con la targa ${data.plate.toUpperCase()}`);
        error.statusCode = 409;
        throw error;
      }
    }

    return await vehiclesRepository.update(companyId, id, data);
  }

  async deleteVehicle(companyId, id) {
    await this.getVehicleById(companyId, id);
    return await vehiclesRepository.delete(companyId, id);
  }
}

module.exports = new VehiclesService();
