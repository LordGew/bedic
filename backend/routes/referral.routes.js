/**
 * Rutas de Referidos
 */

const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');
const { verifyToken } = require('../middleware/auth');

// Rutas públicas
router.get('/leaderboard', referralController.getReferralLeaderboard);

// Rutas protegidas
router.use(verifyToken);

// Obtener información de referidos
router.get('/code', referralController.getOrCreateReferralCode);
router.get('/info', referralController.getReferralInfo);
router.get('/my-referrals', referralController.getUserReferrals);
router.get('/exclusive-rewards', referralController.getExclusiveRewards);

// Aplicar y completar referidos
router.post('/apply', referralController.applyReferralCode);
router.post('/complete', referralController.completeReferral);

// Actualizar configuración
router.put('/description', referralController.updateReferralDescription);

module.exports = router;
