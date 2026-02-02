const express = require('express');
const router = express.Router();
const { protect } = require('../utils/authMiddleware');
const {
  getPersonalizedRecommendation,
  recordSearch,
  recordFilter,
  hidePlace,
  getAdvancedRecommendation
} = require('../controllers/recommendation.controller');

// ========================================
// NUEVO ALGORITMO DE RECOMENDACIONES
// ========================================

// Obtener recomendación personalizada
router.get('/personalized', protect, getPersonalizedRecommendation);

// Obtener recomendación avanzada (para Flutter)
router.get('/advanced', protect, getAdvancedRecommendation);

// Actualizar recomendaciones (compatibilidad con Flutter)
router.post('/update', protect, (req, res) => {
  res.status(200).json({ success: true, message: 'Recomendaciones actualizadas' });
});

// Registrar búsqueda del usuario
router.post('/record-search', protect, recordSearch);

// Registrar filtro del usuario
router.post('/record-filter', protect, recordFilter);

// Ocultar un lugar
router.post('/hide-place', protect, hidePlace);

// Registrar engagement (tracking)
router.post('/track', protect, (req, res) => {
  res.json({ success: true });
});

module.exports = router;
