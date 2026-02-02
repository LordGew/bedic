const express = require('express');
const { protect } = require('../utils/authMiddleware');
// Importar los controladores de notificación (registro de token y prueba)
const { 
  registerDeviceToken, 
  sendTestNotification,
  getUnreadNotifications,
  getAllNotifications,
  markNotificationAsRead
} = require('../controllers/notifications.controller'); 

const router = express.Router();

// Todas las rutas de notificación requieren que el usuario esté logueado
router.use(protect);

// Endpoint: POST /api/notifications/token
router.post('/token', registerDeviceToken);

// Endpoint: POST /api/notifications/test
router.post('/test', sendTestNotification);

// Endpoint: GET /api/notifications/unread
router.get('/unread', getUnreadNotifications);

// Endpoint: GET /api/notifications
router.get('/', getAllNotifications);

// Endpoint: PUT /api/notifications/:id/read
router.put('/:id/read', markNotificationAsRead);

module.exports = router;