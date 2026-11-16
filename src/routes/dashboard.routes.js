const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Analitiche e statistiche aggregate operative e finanziarie
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Ottiene le metriche aggregate della dashboard per il frontend
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dati aggregati della dashboard recuperati con successo
 *       401:
 *         description: Non autorizzato
 */
router.get('/summary', dashboardController.getSummary);

module.exports = router;
