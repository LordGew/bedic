/**
 * Rutas de Insignias
 */

const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badge.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

// Rutas públicas
router.get('/', badgeController.getAllBadges);
router.get('/type/:type', badgeController.getBadgesByType);
router.get('/user/:userId', badgeController.getUserBadges);
router.get('/leaderboard', badgeController.getBadgeLeaderboard);

// Rutas protegidas
router.use(verifyToken);

router.get('/my-badges', badgeController.getUserBadges);
router.post('/select', badgeController.selectBadges);

// Rutas admin
router.post('/', checkRole('admin'), badgeController.createBadge);
router.post('/unlock', checkRole('admin'), badgeController.unlockBadge);

module.exports = router;
