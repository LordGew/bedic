// routes/places.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const placesController = require('../controllers/places.controller');
const { verifyToken, verifyRole } = require('../middleware/auth');

// Configurar multer para manejar uploads en memoria
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo
    },
    fileFilter: (req, file, cb) => {
        // Solo aceptar imágenes
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'));
        }
    }
});

// Rutas públicas (lectura)
router.get('/', placesController.getAllPlaces);
router.get('/stats', placesController.getPlacesStats);
router.get('/cities', placesController.getCities);
router.get('/categories', placesController.getCategories);
router.get('/:id', placesController.getPlaceById);

// Rutas protegidas (solo admin)
router.post('/', verifyToken, verifyRole(['admin']), placesController.createPlace);
router.put('/:id', verifyToken, verifyRole(['admin']), placesController.updatePlace);
router.delete('/:id', verifyToken, verifyRole(['admin']), placesController.deletePlace);
router.post('/:id/images', verifyToken, verifyRole(['admin']), upload.single('image'), placesController.uploadPlaceImage);

module.exports = router;
