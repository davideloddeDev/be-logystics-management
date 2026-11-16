const settingsRepository = require('../repositories/settings.repository');

class SettingsService {
  async getCompanyProfile(companyId) {
    const profile = await settingsRepository.getCompanyProfile(companyId);
    if (!profile) {
      const error = new Error('Profilo aziendale non trovato');
      error.statusCode = 404;
      throw error;
    }
    return profile;
  }

  async updateCompanyProfile(companyId, data, userId = null) {
    const updated = await settingsRepository.updateCompanyProfile(companyId, data);
    await settingsRepository.createLog(companyId, userId, 'UPDATE_PROFILE', 'companies', { updatedFields: Object.keys(data) });
    return updated;
  }

  async getNotificationSettings(companyId) {
    return await settingsRepository.getNotificationSettings(companyId);
  }

  async updateNotificationSettings(companyId, data, userId = null) {
    const updated = await settingsRepository.updateNotificationSettings(companyId, data);
    await settingsRepository.createLog(companyId, userId, 'UPDATE_NOTIFICATION_SETTINGS', 'company_settings', data);
    return updated;
  }

  async getMobileAccessList(companyId) {
    return await settingsRepository.getMobileAccessList(companyId);
  }

  async toggleMobileAccess(companyId, collaboratorId, userId = null) {
    const result = await settingsRepository.toggleMobileAccess(companyId, collaboratorId);
    await settingsRepository.createLog(companyId, userId, 'TOGGLE_MOBILE_ACCESS', 'driver_mobile_access', {
      collaboratorId,
      isEnabled: result.is_enabled
    });
    return result;
  }

  async getSystemLogs(companyId, limit) {
    return await settingsRepository.getSystemLogs(companyId, limit);
  }
}

module.exports = new SettingsService();
