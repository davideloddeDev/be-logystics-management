const express = require('express');
const { body, param, query } = require('express-validator');
const paymentsController = require('../controllers/payments.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Gestione finanziaria e voci di costo/incasso
 */

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Ottiene l'elenco delle voci di pagamento
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [stipendio, mezzo, attrezzatura, entrata]
 *         description: Filtra per tipologia
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [da pagare, pagato]
 *         description: Filtra per stato pagamento
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Data scadenza da (YYYY-MM-DD)
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Data scadenza a (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Elenco pagamenti recuperato con successo
 *       401:
 *         description: Non autorizzato
 */
router.get(
  '/',
  [
    query('type').optional().isIn(['stipendio', 'mezzo', 'attrezzatura', 'entrata']).withMessage('Tipo pagamento non valido'),
    query('status').optional().isIn(['da pagare', 'pagato']).withMessage('Stato pagamento non valido'),
    query('from_date').optional().isISO8601().withMessage('Data inizio non valida'),
    query('to_date').optional().isISO8601().withMessage('Data fine non valida'),
    validate
  ],
  paymentsController.getAllPayments
);

/**
 * @swagger
 * /api/payments/summary:
 *   get:
 *     summary: Ottiene il riepilogo finanziario aggregato (uscite, entrate, sospesi)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Riepilogo finanziario recuperato con successo
 *       401:
 *         description: Non autorizzato
 */
router.get('/summary', paymentsController.getFinancialSummary);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Ottiene il dettaglio di una singola voce di pagamento
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID della voce di pagamento
 *     responses:
 *       200:
 *         description: Voce trovata
 *       404:
 *         description: Voce non trovata
 */
router.get(
  '/:id',
  [param('id').isString().notEmpty().withMessage('ID pagamento non valido'), validate],
  paymentsController.getPaymentById
);

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Registra una nuova voce di pagamento o entrata
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, reference, amount, due_date]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [stipendio, mezzo, attrezzatura, entrata]
 *               reference:
 *                 type: string
 *                 example: 'Fattura #1024 - Manutenzione Iveco'
 *               description:
 *                 type: string
 *                 example: 'Sostituzione pastiglie freni'
 *               amount:
 *                 type: number
 *                 format: float
 *                 example: 350.00
 *               status:
 *                 type: string
 *                 enum: [da pagare, pagato]
 *                 default: da pagare
 *               payment_method:
 *                 type: string
 *                 enum: [bonifico, carta, contanti, assegno]
 *               due_date:
 *                 type: string
 *                 format: date
 *                 example: '2026-12-31'
 *     responses:
 *       201:
 *         description: Voce registrata con successo
 *       400:
 *         description: Dati non validi
 */
router.post(
  '/',
  authorize('owner', 'admin'),
  [
    body('type').isIn(['stipendio', 'mezzo', 'attrezzatura', 'entrata']).withMessage('Tipo pagamento obbligatorio e valido'),
    body('reference').trim().notEmpty().withMessage('Riferimento obbligatorio'),
    body('amount').isFloat({ min: 0 }).withMessage('Importo deve essere un numero positivo'),
    body('due_date').isISO8601().withMessage('Data di scadenza non valida'),
    body('status').optional().isIn(['da pagare', 'pagato']).withMessage('Stato non valido'),
    body('payment_method').optional({ nullable: true }).isIn(['bonifico', 'carta', 'contanti', 'assegno']).withMessage('Metodo di pagamento non valido'),
    validate
  ],
  paymentsController.createPayment
);

/**
 * @swagger
 * /api/payments/{id}:
 *   put:
 *     summary: Aggiorna i dati di una voce di pagamento
 *     tags: [Payments]
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
 *               type:
 *                 type: string
 *                 enum: [stipendio, mezzo, attrezzatura, entrata]
 *               reference:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [da pagare, pagato]
 *               payment_method:
 *                 type: string
 *               due_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Voce aggiornata con successo
 *       404:
 *         description: Voce non trovata
 */
router.put(
  '/:id',
  authorize('owner', 'admin'),
  [
    param('id').isString().notEmpty().withMessage('ID pagamento non valido'),
    body('type').optional().isIn(['stipendio', 'mezzo', 'attrezzatura', 'entrata']).withMessage('Tipo pagamento non valido'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Importo non valido'),
    body('due_date').optional().isISO8601().withMessage('Data scadenza non valida'),
    body('status').optional().isIn(['da pagare', 'pagato']).withMessage('Stato non valido'),
    body('payment_method').optional({ nullable: true }).isIn(['bonifico', 'carta', 'contanti', 'assegno']).withMessage('Metodo di pagamento non valido'),
    validate
  ],
  paymentsController.updatePayment
);

/**
 * @swagger
 * /api/payments/{id}/pay:
 *   patch:
 *     summary: Registra il pagamento avvenuto per una voce
 *     tags: [Payments]
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
 *             required: [payment_method]
 *             properties:
 *               payment_method:
 *                 type: string
 *                 enum: [bonifico, carta, contanti, assegno]
 *               paid_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Pagamento registrato
 *       404:
 *         description: Voce non trovata
 */
router.patch(
  '/:id/pay',
  authorize('owner', 'admin'),
  [
    param('id').isString().notEmpty().withMessage('ID pagamento non valido'),
    body('payment_method').isIn(['bonifico', 'carta', 'contanti', 'assegno']).withMessage('Metodo di pagamento obbligatorio e valido'),
    body('paid_at').optional().isISO8601().withMessage('Data pagamento non valida'),
    validate
  ],
  paymentsController.markAsPaid
);

/**
 * @swagger
 * /api/payments/{id}:
 *   delete:
 *     summary: Elimina una voce di pagamento
 *     tags: [Payments]
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
 *         description: Voce eliminata con successo
 *       404:
 *         description: Voce non trovata
 */
router.delete(
  '/:id',
  authorize('owner', 'admin'),
  [param('id').isString().notEmpty().withMessage('ID pagamento non valido'), validate],
  paymentsController.deletePayment
);

module.exports = router;
