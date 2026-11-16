const collaboratorsService = require('../services/collaborators.service');

class CollaboratorsController {
  async getAllCollaborators(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const collaborators = await collaboratorsService.getAllCollaborators(companyId, req.query);
      res.json({
        success: true,
        data: collaborators,
        count: collaborators.length
      });
    } catch (err) {
      next(err);
    }
  }

  async getCollaboratorById(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const collaborator = await collaboratorsService.getCollaboratorById(companyId, req.params.id);
      res.json({
        success: true,
        data: collaborator
      });
    } catch (err) {
      next(err);
    }
  }

  async createCollaborator(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const created = await collaboratorsService.createCollaborator(companyId, req.body);
      res.status(201).json({
        success: true,
        data: created,
        message: 'Collaboratore creato con successo'
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCollaborator(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updated = await collaboratorsService.updateCollaborator(companyId, req.params.id, req.body);
      res.json({
        success: true,
        data: updated,
        message: 'Collaboratore aggiornato con successo'
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteCollaborator(req, res, next) {
    try {
      const companyId = req.user.companyId;
      await collaboratorsService.deleteCollaborator(companyId, req.params.id);
      res.json({
        success: true,
        message: 'Collaboratore eliminato con successo'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CollaboratorsController();
