const express = require('express');
const { body, param, query } = require('express-validator');
const collaboratorsController = require('../controllers/collaborators.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Collaborators
 *   description: Gestione dei collaboratori e autisti aziendali
 */

/**
 * @swagger
 * /api/collaborators:
 *   get:
 *     summary: Ottiene l'elenco dei collaboratori
 *     tags: [Collaborators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [autista, magazziniere, responsabile logistica, amministrazione]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [attivo, malattia, cessato]
 *     responses:
 *       200:
 *         description: Elenco collaboratori
 */
router.get(
  '/',
  [
    query('role').optional().isIn(['autista', 'magazziniere', 'responsabile logistica', 'amministrazione']),
    query('status').optional().isIn(['attivo', 'malattia', 'cessato']),
    validate
  ],
  collaboratorsController.getAllCollaborators
);

/**
 * @swagger
 * /api/collaborators/{id}:
 *   get:
 *     summary: Dettaglio collaboratore
 *     tags: [Collaborators]
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
 *         description: Dati collaboratore
 *       404:
 *         description: Collaboratore non trovato
 */
router.get(
  '/:id',
  [param('id').isString().notEmpty(), validate],
  collaboratorsController.getCollaboratorById
);

/**
 * @swagger
 * /api/collaborators:
 *   post:
 *     summary: Crea un nuovo collaboratore
 *     tags: [Collaborators]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [first_name, last_name, email]
 *             properties:
 *               first_name: { type: string, example: "Mario" }
 *               last_name: { type: string, example: "Rossi" }
 *               role: { type: string, enum: [autista, magazziniere, responsabile logistica, amministrazione], example: "autista" }
 *               phone: { type: string, example: "+39 340 1234567" }
 *               email: { type: string, format: email, example: "mario.rossi@logistica.it" }
 *               status: { type: string, enum: [attivo, malattia, cessato], example: "attivo" }
 *               hiring_date: { type: string, format: date, example: "2024-01-15" }
 *               license_expiry_date: { type: string, format: date, example: "2028-05-20" }
 *     responses:
 *       201:
 *         description: Collaboratore creato con successo
 *       409:
 *         description: Email già presente
 */
router.post(
  '/',
  authorize('owner', 'admin', 'responsabile logistica'),
  [
    body('first_name').isString().trim().notEmpty().withMessage('Il nome è obbligatorio'),
    body('last_name').isString().trim().notEmpty().withMessage('Il cognome è obbligatorio'),
    body('email').isEmail().normalizeEmail().withMessage('Email non valida'),
    body('role').optional().isIn(['autista', 'magazziniere', 'responsabile logistica', 'amministrazione']),
    body('phone').optional({ nullable: true }).isString(),
    body('status').optional().isIn(['attivo', 'malattia', 'cessato']),
    body('hiring_date').optional({ nullable: true }).isISO8601().toDate(),
    body('license_expiry_date').optional({ nullable: true }).isISO8601().toDate(),
    validate
  ],
  collaboratorsController.createCollaborator
);

/**
 * @swagger
 * /api/collaborators/{id}:
 *   put:
 *     summary: Aggiorna un collaboratore
 *     tags: [Collaborators]
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
 *         description: Collaboratore aggiornato
 *       404:
 *         description: Collaboratore non trovato
 */
router.put(
  '/:id',
  authorize('owner', 'admin', 'responsabile logistica'),
  [
    param('id').isString().notEmpty(),
    body('first_name').optional().isString().trim().notEmpty(),
    body('last_name').optional().isString().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['autista', 'magazziniere', 'responsabile logistica', 'amministrazione']),
    body('status').optional().isIn(['attivo', 'malattia', 'cessato']),
    validate
  ],
  collaboratorsController.updateCollaborator
);

/**
 * @swagger
 * /api/collaborators/{id}:
 *   delete:
 *     summary: Elimina un collaboratore
 *     tags: [Collaborators]
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
 *         description: Collaboratore eliminato
 *       404:
 *         description: Non trovato
 */
router.delete(
  '/:id',
  authorize('owner', 'admin'),
  [param('id').isString().notEmpty(), validate],
  collaboratorsController.deleteCollaborator
);

module.exports = router;
