/**
 * Rutas de Títulos
 */

const express = require('express');
const router = express.Router();
const titleController = require('../controllers/title.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

// Rutas públicas
router.get('/', titleController.getAllTitles);
router.get('/category/:category', titleController.getTitlesByCategory);
router.get('/user/:userId', titleController.getUserTitles);

// Rutas protegidas
router.use(verifyToken);

router.get('/my-titles', titleController.getUserTitles);
router.post('/select', titleController.selectTitle);

// Rutas admin
router.post('/', checkRole('admin'), titleController.createTitle);
router.post('/unlock', checkRole('admin'), titleController.unlockTitle);

module.exports = router;
