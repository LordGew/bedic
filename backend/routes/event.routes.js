const express = require('express');
const { protect } = require('../utils/authMiddleware');
const { moderateBeforeSave, rateLimit } = require('../middleware/moderation.middleware');
const filterLanguage = require('../utils/languageFilter');
const { createEvent, getEventsByPlace, respondToEvent, uploadEventImage } = require('../controllers/event.controller');
const multer = require('multer');

const router = express.Router();

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'El archivo es demasiado grande (máximo 5MB)' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: 'Error al subir la imagen: ' + err.message 
    });
  } else if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ 
      success: false, 
      message: 'Error al subir la imagen: ' + err.message 
    });
  }
  next();
};

// Crear evento (con moderación y rate limiting)
router.post(
  '/',
  protect,
  rateLimit('event', { perMinute: 3 }),
  uploadEventImage,
  handleMulterError,
  createEvent,
);

// Obtener eventos por lugar
router.get('/:placeId', getEventsByPlace);

// Responder a un evento (me interesa, no me interesa, etc.)
router.put('/:eventId/rsvp', protect, respondToEvent);

// Servir archivos estáticos de imágenes de eventos
const path = require('path');
router.use('/uploads/events', express.static(path.join(__dirname, '../uploads/events')));

module.exports = router;
