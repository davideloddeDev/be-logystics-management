const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Middleware di autenticazione JWT per il contesto multi-tenant.
 * Valida il token emesso da Java Auth Service o ambiente di sviluppo.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Accesso negato: token mancante o formato errato (Bearer token richiesto)'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      // In dev o test può non avere issuer/audience rigidi se generato al volo
    });

    if (!decoded.companyId) {
      return res.status(401).json({
        success: false,
        error: 'Token non valido: contesto aziendale (companyId) assente'
      });
    }

    req.user = {
      userId: decoded.userId || decoded.sub || 'user-unknown',
      companyId: decoded.companyId,
      role: decoded.role || 'employee',
      licenseId: decoded.licenseId || null,
      licenseType: decoded.licenseType || 'standard',
      email: decoded.email || null
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token scaduto'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Token non valido o firma non verificata'
    });
  }
}

module.exports = authenticate;
