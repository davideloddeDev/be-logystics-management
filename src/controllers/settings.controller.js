const settingsService = require('../services/settings.service');

class SettingsController {
  async getCompanyProfile(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const profile = await settingsService.getCompanyProfile(companyId);
      res.json({
        success: true,
        data: profile
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCompanyProfile(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.userId;
      const updated = await settingsService.updateCompanyProfile(companyId, req.body, userId);
      res.json({
        success: true,
        data: updated,
        message: 'Profilo aziendale aggiornato con successo'
      });
    } catch (err) {
      next(err);
    }
  }

  async getNotificationSettings(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const settings = await settingsService.getNotificationSettings(companyId);
      res.json({
        success: true,
        data: settings
      });
    } catch (err) {
      next(err);
    }
  }

  async updateNotificationSettings(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.userId;
      const updated = await settingsService.updateNotificationSettings(companyId, req.body, userId);
      res.json({
        success: true,
        data: updated,
        message: 'Preferenze notifiche aggiornate con successo'
      });
    } catch (err) {
      next(err);
    }
  }

  async getMobileAccessList(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const list = await settingsService.getMobileAccessList(companyId);
      res.json({
        success: true,
        data: list,
        count: list.length
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleMobileAccess(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.userId;
      const result = await settingsService.toggleMobileAccess(companyId, req.params.collaboratorId, userId);
      res.json({
        success: true,
        data: result,
        message: `Accesso app mobile ${result.is_enabled ? 'abilitato' : 'revocato'} con successo`
      });
    } catch (err) {
      next(err);
    }
  }

  async getSystemLogs(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const limit = req.query.limit || 50;
      const logs = await settingsService.getSystemLogs(companyId, limit);
      res.json({
        success: true,
        data: logs,
        count: logs.length
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SettingsController();
