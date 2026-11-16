const express = require('express');
const { body, param, query } = require('express-validator');
const telemetryController = require('../controllers/telemetry.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

// Middleware per verificare la licenza "pro" per telemetria avanzata
function requireProLicense(req, res, next) {
  if (req.user.licenseType !== 'pro' && req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      error: 'La funzionalità Telemetria Pro richiede una licenza PRO attiva'
    });
  }
  next();
}

/**
 * @swagger
 * tags:
 *   name: Telemetry
 *   description: Ingestione e tracciamento telemetrico dei mezzi in tempo reale (Licenza Pro)
 */

/**
 * @swagger
 * /api/telemetry/ingest:
 *   post:
 *     summary: Ingestione dati telemetrici e GPS da dispositivi di bordo o app autista
 *     tags: [Telemetry]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicle_id, latitude, longitude]
 *             properties:
 *               vehicle_id:
 *                 type: string
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: 45.4642
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: 9.1900
 *               address:
 *                 type: string
 *               speed:
 *                 type: number
 *                 example: 60.5
 *               engine_status:
 *                 type: string
 *                 enum: [acceso, spento]
 *               available_load_kg:
 *                 type: number
 *               total_load_kg:
 *                 type: number
 *               tare_kg:
 *                 type: number
 *               compartment_temperature:
 *                 type: number
 *                 example: 4.5
 *               estimated_autonomy_km:
 *                 type: integer
 *               device_timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Dati telemetrici registrati con successo
 *       400:
 *         description: Coordinate o dati non validi
 *       404:
 *         description: Mezzo non trovato
 */
router.post(
  '/ingest',
  [
    body('vehicle_id').isString().notEmpty().withMessage('ID veicolo non valido'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitudine non valida (-90 a +90)'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitudine non valida (-180 a +180)'),
    body('speed').optional().isFloat({ min: 0 }).withMessage('Velocità deve essere positiva'),
    body('engine_status').optional().isIn(['acceso', 'spento']).withMessage('Stato motore non valido'),
    body('device_timestamp').optional().isISO8601().withMessage('Timestamp non valido'),
    validate
  ],
  telemetryController.ingestTelemetry
);

/**
 * @swagger
 * /api/telemetry/vehicles/latest:
 *   get:
 *     summary: Ottiene l'ultima posizione e stato telemetrico di tutti i mezzi aziendali
 *     tags: [Telemetry]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ultimi rilievi telemetrici della flotta
 */
router.get('/vehicles/latest', requireProLicense, telemetryController.getAllLatest);

/**
 * @swagger
 * /api/telemetry/vehicles/{vehicleId}/history:
 *   get:
 *     summary: Tracciato storico di posizione e parametri per un mezzo specifico
 *     tags: [Telemetry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Storico telemetrico recuperato con successo
 *       404:
 *         description: Mezzo non trovato
 */
router.get(
  '/vehicles/:vehicleId/history',
  requireProLicense,
  [
    param('vehicleId').isString().notEmpty().withMessage('ID veicolo non valido'),
    query('from_date').optional().isISO8601().withMessage('Data inizio non valida'),
    query('to_date').optional().isISO8601().withMessage('Data fine non valida'),
    validate
  ],
  telemetryController.getVehicleHistory
);

module.exports = router;
