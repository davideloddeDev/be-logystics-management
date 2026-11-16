const telemetryRepository = require('../repositories/telemetry.repository');
const vehiclesRepository = require('../repositories/vehicles.repository');

class TelemetryService {
  async ingestTelemetry(companyId, data) {
    // Verifica che il mezzo esista per questa azienda
    const vehicle = await vehiclesRepository.findById(companyId, data.vehicle_id);
    if (!vehicle) {
      const error = new Error('Mezzo non trovato per questa azienda');
      error.statusCode = 404;
      throw error;
    }

    return await telemetryRepository.ingest(companyId, data);
  }

  async getAllLatest(companyId) {
    return await telemetryRepository.getAllLatest(companyId);
  }

  async getVehicleHistory(companyId, vehicleId, filters) {
    const vehicle = await vehiclesRepository.findById(companyId, vehicleId);
    if (!vehicle) {
      const error = new Error('Mezzo non trovato');
      error.statusCode = 404;
      throw error;
    }

    return await telemetryRepository.getVehicleHistory(companyId, vehicleId, filters);
  }
}

module.exports = new TelemetryService();
