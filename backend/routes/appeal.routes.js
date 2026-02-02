// routes/appeal.routes.js

const express = require('express');
const { protect } = require('../utils/authMiddleware');
const { createAppeal, getMyAppeals } = require('../controllers/appeal.controller');

const router = express.Router();

// Todas las rutas de apelaciones requieren usuario autenticado
router.use(protect);

// Crear una nueva apelación
router.post('/', createAppeal);

// Ver apelaciones propias
router.get('/me', getMyAppeals);

module.exports = router;
