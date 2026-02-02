const express = require('express');
const { protect } = require('../utils/authMiddleware');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats
} = require('../controllers/category.controller');

const router = express.Router();

// Middleware para verificar si es administrador
const isAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'moderator')) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
};

// Rutas públicas (solo lectura)
router.get('/', getCategories);
router.get('/stats', getCategoryStats);
router.get('/:id', getCategoryById);

// Rutas protegidas (requieren autenticación)
router.use(protect);

// Rutas de administrador
router.use(isAdmin);

router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
