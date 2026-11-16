const express = require('express');
const { body, param, query } = require('express-validator');
const deliveriesController = require('../controllers/deliveries.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Deliveries
 *   description: Gestione delle consegne e stati di avanzamento
 */

/**
 * @swagger
 * /api/deliveries:
 *   get:
 *     summary: Elenco consegne con filtri
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [in attesa, in transito, consegnata, annullata]
 *       - in: query
 *         name: driver_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: vehicle_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: customer
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Elenco consegne
 */
router.get(
  '/',
  [
    query('status').optional().isIn(['in attesa', 'in transito', 'consegnata', 'annullata']),
    query('driver_id').optional().isString(),
    query('vehicle_id').optional().isString(),
    query('customer').optional().isString(),
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601(),
    validate
  ],
  deliveriesController.getAllDeliveries
);

/**
 * @swagger
 * /api/deliveries/{id}:
 *   get:
 *     summary: Dettaglio consegna con storico stati
 *     tags: [Deliveries]
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
 *         description: Consegna e cronologia
 *       404:
 *         description: Non trovata
 */
router.get(
  '/:id',
  [param('id').isString().notEmpty(), validate],
  deliveriesController.getDeliveryById
);

/**
 * @swagger
 * /api/deliveries:
 *   post:
 *     summary: Crea nuova consegna
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, customer, delivery_address, delivery_datetime]
 *             properties:
 *               code: { type: string, example: "DEL-2026-901" }
 *               customer: { type: string, example: "Barilla S.p.A." }
 *               delivery_address: { type: string, example: "Via Mantova 166, Parma" }
 *               vehicle_id: { type: string }
 *               driver_id: { type: string }
 *               status: { type: string, enum: [in attesa, in transito, consegnata, annullata], default: "in attesa" }
 *               delivery_datetime: { type: string, format: date-time, example: "2026-11-20T14:30:00Z" }
 *               amount: { type: number, format: float, example: 450.00 }
 *     responses:
 *       201:
 *         description: Consegna creata
 *       409:
 *         description: Codice già esistente
 */
router.post(
  '/',
  authorize('owner', 'admin', 'responsabile logistica'),
  [
    body('code').isString().trim().notEmpty().withMessage('Il codice consegna è obbligatorio'),
    body('customer').isString().trim().notEmpty().withMessage('Il cliente è obbligatorio'),
    body('delivery_address').isString().trim().notEmpty().withMessage('L\'indirizzo è obbligatorio'),
    body('delivery_datetime').isISO8601().toDate().withMessage('Data e ora consegna non valide'),
    body('vehicle_id').optional({ nullable: true }).isString(),
    body('driver_id').optional({ nullable: true }).isString(),
    body('status').optional().isIn(['in attesa', 'in transito', 'consegnata', 'annullata']),
    body('amount').optional().isFloat({ min: 0 }),
    validate
  ],
  deliveriesController.createDelivery
);

/**
 * @swagger
 * /api/deliveries/{id}:
 *   put:
 *     summary: Aggiorna dati consegna
 *     tags: [Deliveries]
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
 *         description: Consegna aggiornata
 */
router.put(
  '/:id',
  authorize('owner', 'admin', 'responsabile logistica'),
  [
    param('id').isString().notEmpty(),
    body('customer').optional().isString().trim().notEmpty(),
    body('delivery_address').optional().isString().trim().notEmpty(),
    body('delivery_datetime').optional().isISO8601().toDate(),
    body('vehicle_id').optional({ nullable: true }).isString(),
    body('driver_id').optional({ nullable: true }).isString(),
    body('amount').optional().isFloat({ min: 0 }),
    validate
  ],
  deliveriesController.updateDelivery
);

/**
 * @swagger
 * /api/deliveries/{id}/status:
 *   patch:
 *     summary: Cambia lo stato di una consegna (es. da app o gestionale)
 *     tags: [Deliveries]
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [in attesa, in transito, consegnata, annullata] }
 *               notes: { type: string, example: "Pacco consegnato al piano terra" }
 *     responses:
 *       200:
 *         description: Stato aggiornato con audit log
 */
router.patch(
  '/:id/status',
  [
    param('id').isString().notEmpty(),
    body('status').isIn(['in attesa', 'in transito', 'consegnata', 'annullata']).withMessage('Stato non valido'),
    body('notes').optional({ nullable: true }).isString(),
    validate
  ],
  deliveriesController.updateDeliveryStatus
);

/**
 * @swagger
 * /api/deliveries/{id}:
 *   delete:
 *     summary: Elimina una consegna
 *     tags: [Deliveries]
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
 *         description: Consegna eliminata
 */
router.delete(
  '/:id',
  authorize('owner', 'admin'),
  [param('id').isString().notEmpty(), validate],
  deliveriesController.deleteDelivery
);

module.exports = router;
