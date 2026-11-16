const express = require('express');
const { param, query } = require('express-validator');
const internalController = require('../controllers/internal.controller');
const config = require('../config/env');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// Middleware di protezione con token di servizio condiviso
function verifyInternalToken(req, res, next) {
  const token = req.headers['x-internal-token'];
  if (!token || token !== config.services.internalToken) {
    return res.status(403).json({
      success: false,
      error: 'Accesso negato: token di servizio interno non valido o assente'
    });
  }
  next();
}

router.use(verifyInternalToken);

/**
 * @swagger
 * tags:
 *   name: Internal
 *   description: API interne ad uso esclusivo di microservizi autorizzati (AI Service, Auth Service)
 */

/**
 * @swagger
 * /api/internal/companies/{companyId}/stats:
 *   get:
 *     summary: Statistiche operative di riepilogo per un'azienda (uso servizi partner)
 *     tags: [Internal]
 *     security:
 *       - internalServiceToken: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statistiche azienda calcolate con successo
 *       403:
 *         description: Token interno mancante o non valido
 *       404:
 *         description: Azienda non trovata
 */
router.get(
  '/companies/:companyId/stats',
  [param('companyId').isUUID().withMessage('ID azienda non valido'), validate],
  internalController.getCompanyStats
);

/**
 * @swagger
 * /api/internal/companies/{companyId}/query:
 *   get:
 *     summary: Consultazione contestuale controllata per il servizio AI
 *     tags: [Internal]
 *     security:
 *       - internalServiceToken: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *           enum: [vehicles, collaborators, deliveries, payments]
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Dati di contesto estratti
 *       400:
 *         description: Parametri non validi
 *       403:
 *         description: Non autorizzato
 */
router.get(
  '/companies/:companyId/query',
  [
    param('companyId').isUUID().withMessage('ID azienda non valido'),
    query('entity').isIn(['vehicles', 'collaborators', 'deliveries', 'payments']).withMessage('Entità non valida'),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate
  ],
  internalController.querySemanticContext
);

module.exports = router;
