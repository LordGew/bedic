const express = require('express');
// CORRECCIÓN: Importar 'searchPlaces'
const { searchPlaces, getPlace, getAllCategories } = require('../controllers/place.controller'); 
const { protect } = require('../utils/authMiddleware');

const router = express.Router();

// --- RUTA PARA OBTENER TODAS LAS CATEGORÍAS ---
// Endpoint: GET /api/places/categories
router.get('/categories', getAllCategories);

// --- NUEVA RUTA DE BÚSQUEDA Y FILTROS ---
// Endpoint: GET /api/places/search?lat=X&lon=Y&q=restaurante&category=Parques
router.get('/search', searchPlaces);

// Ruta para obtener detalles del lugar por ID
router.route('/:id').get(getPlace);

// Ruta para crear un nuevo lugar (protegida)
router.post('/', protect, (req, res) => {
    res.status(501).json({ message: 'POST /api/places - Creation placeholder.' });
});

// Ruta de recomendaciones anterior (opcionalmente la mantenemos o la eliminamos)
// router.get('/recommendations', getRecommendedPlaces); // Deshabilitada en favor de /search

module.exports = router;