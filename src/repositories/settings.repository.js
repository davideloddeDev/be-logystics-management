const { query } = require('../config/db');

class SettingsRepository {
  async getCompanyProfile(companyId) {
    const rows = await query('SELECT * FROM companies WHERE id = ?', [companyId]);
    return rows[0] || null;
  }

  async updateCompanyProfile(companyId, data) {
    const fields = [];
    const params = [];

    if (data.business_name !== undefined) {
      fields.push('business_name = ?');
      params.push(data.business_name.trim());
    }
    if (data.vat_number !== undefined) {
      fields.push('vat_number = ?');
      params.push(data.vat_number.trim());
    }
    if (data.address !== undefined) {
      fields.push('address = ?');
      params.push(data.address ? data.address.trim() : null);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      params.push(data.email.trim().toLowerCase());
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      params.push(data.phone ? data.phone.trim() : null);
    }

    if (fields.length > 0) {
      params.push(companyId);
      await query(`UPDATE companies SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return await this.getCompanyProfile(companyId);
  }

  async getNotificationSettings(companyId) {
    let rows = await query('SELECT * FROM company_settings WHERE company_id = ?', [companyId]);
    if (rows.length === 0) {
      // Inizializza impostazioni predefinite se non presenti
      await query(
        `INSERT INTO company_settings (company_id, email_notifications, sms_notifications, notification_events)
         VALUES (?, TRUE, FALSE, ?)`,
        [companyId, JSON.stringify({ delivery_status_changed: true, maintenance_alert: true, insurance_expiring: true })]
      );
      rows = await query('SELECT * FROM company_settings WHERE company_id = ?', [companyId]);
    }
    const settings = rows[0];
    if (typeof settings.notification_events === 'string') {
      try {
        settings.notification_events = JSON.parse(settings.notification_events);
      } catch (e) {
        // keep as is
      }
    }
    return settings;
  }

  async updateNotificationSettings(companyId, data) {
    await this.getNotificationSettings(companyId); // assicura esistenza riga

    const fields = [];
    const params = [];

    if (data.email_notifications !== undefined) {
      fields.push('email_notifications = ?');
      params.push(Boolean(data.email_notifications));
    }
    if (data.sms_notifications !== undefined) {
      fields.push('sms_notifications = ?');
      params.push(Boolean(data.sms_notifications));
    }
    if (data.notification_events !== undefined) {
      fields.push('notification_events = ?');
      params.push(typeof data.notification_events === 'string' ? data.notification_events : JSON.stringify(data.notification_events));
    }
    if (data.maintenance_mode !== undefined) {
      fields.push('maintenance_mode = ?');
      params.push(Boolean(data.maintenance_mode));
    }
    if (data.two_factor_required !== undefined) {
      fields.push('two_factor_required = ?');
      params.push(Boolean(data.two_factor_required));
    }

    if (fields.length > 0) {
      params.push(companyId);
      await query(`UPDATE company_settings SET ${fields.join(', ')} WHERE company_id = ?`, params);
    }

    return await this.getNotificationSettings(companyId);
  }

  async getMobileAccessList(companyId) {
    const sql = `
      SELECT c.id as collaborator_id, c.first_name, c.last_name, c.role, c.email, c.phone,
             COALESCE(dma.is_enabled, FALSE) as is_mobile_enabled,
             dma.last_login_at, dma.created_at as access_granted_at
      FROM collaborators c
      LEFT JOIN driver_mobile_access dma ON c.id = dma.collaborator_id AND dma.company_id = ?
      WHERE c.company_id = ? AND c.status != 'cessato'
      ORDER BY c.last_name ASC
    `;
    return await query(sql, [companyId, companyId]);
  }

  async toggleMobileAccess(companyId, collaboratorId, explicitState = null) {
    // Verifica se esiste già
    const rows = await query(
      'SELECT * FROM driver_mobile_access WHERE company_id = ? AND collaborator_id = ?',
      [companyId, collaboratorId]
    );

    let newState;
    if (rows.length === 0) {
      const crypto = require('crypto');
      newState = explicitState !== null ? explicitState : true;
      await query(
        `INSERT INTO driver_mobile_access (id, company_id, collaborator_id, is_enabled)
         VALUES (?, ?, ?, ?)`,
        [crypto.randomUUID(), companyId, collaboratorId, newState]
      );
    } else {
      newState = explicitState !== null ? explicitState : !rows[0].is_enabled;
      await query(
        'UPDATE driver_mobile_access SET is_enabled = ? WHERE company_id = ? AND collaborator_id = ?',
        [newState, companyId, collaboratorId]
      );
    }

    const updated = await query(
      'SELECT * FROM driver_mobile_access WHERE company_id = ? AND collaborator_id = ?',
      [companyId, collaboratorId]
    );
    return updated[0];
  }

  async getSystemLogs(companyId, limit = 50) {
    const sql = `
      SELECT * FROM system_logs
      WHERE company_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const rows = await query(sql, [companyId, Number(limit)]);
    return rows.map(r => {
      if (typeof r.details === 'string') {
        try {
          r.details = JSON.parse(r.details);
        } catch (e) {
          // ignore
        }
      }
      return r;
    });
  }

  async createLog(companyId, userId, action, resource, details = null, ipAddress = null) {
    const crypto = require('crypto');
    const sql = `
      INSERT INTO system_logs (id, company_id, user_id, action, resource, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      crypto.randomUUID(),
      companyId,
      userId || null,
      action,
      resource,
      details ? JSON.stringify(details) : null,
      ipAddress || null
    ];
    await query(sql, params);
  }
}

module.exports = new SettingsRepository();
