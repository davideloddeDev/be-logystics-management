const express = require('express');
const { body, param, query } = require('express-validator');
const settingsController = require('../controllers/settings.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Impostazioni aziendali, notifiche, log di sistema e abilitazione app mobile
 */

/**
 * @swagger
 * /api/settings/profile:
 *   get:
 *     summary: Ottiene l'anagrafica del profilo aziendale
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profilo aziendale recuperato con successo
 *       404:
 *         description: Azienda non trovata
 */
router.get('/profile', settingsController.getCompanyProfile);

/**
 * @swagger
 * /api/settings/profile:
 *   put:
 *     summary: Aggiorna l'anagrafica aziendale
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               business_name:
 *                 type: string
 *               vat_number:
 *                 type: string
 *               address:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profilo aziendale aggiornato
 */
router.put(
  '/profile',
  authorize('owner', 'admin'),
  [
    body('business_name').optional().trim().notEmpty().withMessage('Ragione sociale non valida'),
    body('vat_number').optional().trim().notEmpty().withMessage('Partita IVA non valida'),
    body('email').optional().isEmail().withMessage('Email aziendale non valida'),
    validate
  ],
  settingsController.updateCompanyProfile
);

/**
 * @swagger
 * /api/settings/notifications:
 *   get:
 *     summary: Ottiene le preferenze per le notifiche aziendali
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Impostazioni notifiche recuperate
 */
router.get('/notifications', settingsController.getNotificationSettings);

/**
 * @swagger
 * /api/settings/notifications:
 *   put:
 *     summary: Aggiorna le preferenze di notifica ed eventi
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email_notifications:
 *                 type: boolean
 *               sms_notifications:
 *                 type: boolean
 *               notification_events:
 *                 type: object
 *               maintenance_mode:
 *                 type: boolean
 *               two_factor_required:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Impostazioni aggiornate con successo
 */
router.put(
  '/notifications',
  authorize('owner', 'admin'),
  [
    body('email_notifications').optional().isBoolean(),
    body('sms_notifications').optional().isBoolean(),
    body('maintenance_mode').optional().isBoolean(),
    body('two_factor_required').optional().isBoolean(),
    validate
  ],
  settingsController.updateNotificationSettings
);

/**
 * @swagger
 * /api/settings/mobile-access:
 *   get:
 *     summary: Ottiene l'elenco dei collaboratori con il relativo stato di abilitazione all'app mobile
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Elenco recuperato con successo
 */
router.get('/mobile-access', authorize('owner', 'admin'), settingsController.getMobileAccessList);

/**
 * @swagger
 * /api/settings/mobile-access/{collaboratorId}/toggle:
 *   post:
 *     summary: Abilita o disabilita l'accesso all'app mobile per un collaboratore
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collaboratorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stato accesso modificato con successo
 */
router.post(
  '/mobile-access/:collaboratorId/toggle',
  authorize('owner', 'admin'),
  [param('collaboratorId').isString().notEmpty().withMessage('ID collaboratore non valido'), validate],
  settingsController.toggleMobileAccess
);

/**
 * @swagger
 * /api/settings/system-logs:
 *   get:
 *     summary: Consulta i log delle operazioni di sistema e audit trail dell'azienda
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Log recuperati con successo
 */
router.get(
  '/system-logs',
  authorize('owner', 'admin'),
  [query('limit').optional().isInt({ min: 1, max: 200 }), validate],
  settingsController.getSystemLogs
);

module.exports = router;
