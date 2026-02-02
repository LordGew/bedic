const express = require('express');
const router = express.Router();
const scriptActivityController = require('../controllers/scriptActivity.controller');
const { verifyToken, verifyRole } = require('../middleware/auth');

// Obtener actividades del script (requiere autenticación de admin)
router.get('/activities', 
  verifyToken, 
  verifyRole(['admin']), 
  scriptActivityController.getActivities
);

// Obtener estadísticas generales
router.get('/stats', 
  verifyToken, 
  verifyRole(['admin']), 
  scriptActivityController.getStats
);

// Ejecutar script manualmente
router.post('/run', 
  verifyToken, 
  verifyRole(['admin']), 
  scriptActivityController.runManually
);

// Limpiar actividades antiguas
router.delete('/clean', 
  verifyToken, 
  verifyRole(['admin']), 
  scriptActivityController.cleanOldActivities
);

module.exports = router;
