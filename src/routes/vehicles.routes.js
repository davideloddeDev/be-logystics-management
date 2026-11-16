const express = require('express');
const { body, param, query } = require('express-validator');
const vehiclesController = require('../controllers/vehicles.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: Gestione del parco mezzi aziendale
 */

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Ottiene l'elenco dei mezzi aziendali
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [attivo, in manutenzione, fuori servizio]
 *         description: Filtra per stato mezzo
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [furgone, mezzo leggero, camion, moto]
 *         description: Filtra per tipo mezzo
 *       - in: query
 *         name: insurance_expiring
 *         schema:
 *           type: boolean
 *         description: Se true, filtra per assicurazioni in scadenza entro 30 giorni
 *     responses:
 *       200:
 *         description: Elenco recuperato con successo
 *       401:
 *         description: Non autorizzato
 */
router.get(
  '/',
  [
    query('status').optional().isIn(['attivo', 'in manutenzione', 'fuori servizio']),
    query('type').optional().isIn(['furgone', 'mezzo leggero', 'camion', 'moto']),
    query('insurance_expiring').optional().isBoolean(),
    validate
  ],
  vehiclesController.getAllVehicles
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Recupera i dettagli di un singolo mezzo
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dettagli del mezzo
 *       404:
 *         description: Mezzo non trovato
 */
router.get(
  '/:id',
  [param('id').isString().notEmpty(), validate],
  vehiclesController.getVehicleById
);

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Crea un nuovo mezzo
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plate, model]
 *             properties:
 *               plate: { type: string, example: "AB123CD" }
 *               model: { type: string, example: "Iveco Daily 35S16" }
 *               type: { type: string, enum: [furgone, mezzo leggero, camion, moto], example: "furgone" }
 *               status: { type: string, enum: [attivo, in manutenzione, fuori servizio], example: "attivo" }
 *               mileage: { type: integer, example: 45000 }
 *               last_maintenance_date: { type: string, format: date, example: "2026-08-15" }
 *               insurance_company: { type: string, example: "Generali" }
 *               insurance_policy_number: { type: string, example: "POL-9921" }
 *               insurance_expiry_date: { type: string, format: date, example: "2027-04-30" }
 *     responses:
 *       201:
 *         description: Mezzo creato con successo
 *       400:
 *         description: Dati non validi
 *       409:
 *         description: Targa già esistente per questa azienda
 */
router.post(
  '/',
  authorize('owner', 'admin', 'responsabile logistica'),
  [
    body('plate').isString().trim().notEmpty().withMessage('La targa è obbligatoria'),
    body('model').isString().trim().notEmpty().withMessage('Il modello è obbligatorio'),
    body('type').optional().isIn(['furgone', 'mezzo leggero', 'camion', 'moto']),
    body('status').optional().isIn(['attivo', 'in manutenzione', 'fuori servizio']),
    body('mileage').optional().isInt({ min: 0 }),
    body('last_maintenance_date').optional({ nullable: true }).isISO8601().toDate(),
    body('insurance_company').optional({ nullable: true }).isString(),
    body('insurance_policy_number').optional({ nullable: true }).isString(),
    body('insurance_expiry_date').optional({ nullable: true }).isISO8601().toDate(),
    validate
  ],
  vehiclesController.createVehicle
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Aggiorna un mezzo esistente
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plate: { type: string }
 *               model: { type: string }
 *               type: { type: string }
 *               status: { type: string }
 *               mileage: { type: integer }
 *     responses:
 *       200:
 *         description: Mezzo aggiornato con successo
 *       404:
 *         description: Mezzo non trovato
 */
router.put(
  '/:id',
  authorize('owner', 'admin', 'responsabile logistica'),
  [
    param('id').isString().notEmpty(),
    body('plate').optional().isString().trim().notEmpty(),
    body('model').optional().isString().trim().notEmpty(),
    body('type').optional().isIn(['furgone', 'mezzo leggero', 'camion', 'moto']),
    body('status').optional().isIn(['attivo', 'in manutenzione', 'fuori servizio']),
    body('mileage').optional().isInt({ min: 0 }),
    body('last_maintenance_date').optional({ nullable: true }),
    body('insurance_expiry_date').optional({ nullable: true }),
    validate
  ],
  vehiclesController.updateVehicle
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     summary: Elimina un mezzo
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mezzo eliminato con successo
 *       404:
 *         description: Mezzo non trovato
 */
router.delete(
  '/:id',
  authorize('owner', 'admin'),
  [param('id').isString().notEmpty(), validate],
  vehiclesController.deleteVehicle
);

module.exports = router;
