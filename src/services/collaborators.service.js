const crypto = require('crypto');
const collaboratorsRepository = require('../repositories/collaborators.repository');

class CollaboratorsService {
  async getAllCollaborators(companyId, filters) {
    return await collaboratorsRepository.findAll(companyId, filters);
  }

  async getCollaboratorById(companyId, id) {
    const collaborator = await collaboratorsRepository.findById(companyId, id);
    if (!collaborator) {
      const error = new Error('Collaboratore non trovato');
      error.statusCode = 404;
      throw error;
    }
    return collaborator;
  }

  async createCollaborator(companyId, data) {
    const existing = await collaboratorsRepository.findByEmail(companyId, data.email);
    if (existing) {
      const error = new Error(`Esiste già un collaboratore con l'email ${data.email} per questa azienda`);
      error.statusCode = 409;
      throw error;
    }

    const newCollaborator = {
      id: crypto.randomUUID(),
      ...data
    };

    return await collaboratorsRepository.create(companyId, newCollaborator);
  }

  async updateCollaborator(companyId, id, data) {
    await this.getCollaboratorById(companyId, id);

    if (data.email) {
      const existing = await collaboratorsRepository.findByEmail(companyId, data.email);
      if (existing && existing.id !== id) {
        const error = new Error(`Esiste già un altro collaboratore con l'email ${data.email}`);
        error.statusCode = 409;
        throw error;
      }
    }

    return await collaboratorsRepository.update(companyId, id, data);
  }

  async deleteCollaborator(companyId, id) {
    await this.getCollaboratorById(companyId, id);
    return await collaboratorsRepository.delete(companyId, id);
  }
}

module.exports = new CollaboratorsService();
