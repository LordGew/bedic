const DeviceToken = require('../models/DeviceToken');
const FCMClient = require('../services/fcmClient'); // Servicio para interactuar con la API de Firebase
const Notification = require('../models/Notification');

// @desc    Registrar el token FCM de un usuario
// @route   POST /api/notifications/token
// @access  Private
exports.registerDeviceToken = async (req, res) => {
    const { deviceToken, platform } = req.body;
    const userId = req.user.id; // Obtenido del middleware 'protect'

    if (!deviceToken || !platform) {
        return res.status(400).json({ success: false, message: 'Faltan deviceToken o plataforma.' });
    }

    try {
        await DeviceToken.updateOne(
            { deviceToken: deviceToken }, // Buscar por token (evita duplicados si el token cambia de usuario, aunque idealmente se buscaría por user+platform)
            { user: userId, deviceToken: deviceToken, platform: platform },
            { upsert: true } // Inserta si no existe, actualiza si sí
        );

        res.status(200).json({ success: true, message: 'Token de dispositivo registrado/actualizado.' });
    } catch (error) {
        console.error("Error al registrar token:", error);
        res.status(500).json({ success: false, message: 'Error interno al guardar el token.' });
    }
};

// @desc    Enviar notificación de prueba
// @route   POST /api/notifications/test
// @access  Private
exports.sendTestNotification = async (req, res) => {
    // Buscar el token más reciente para el usuario logueado
    const tokenRecord = await DeviceToken.findOne({ user: req.user.id }).sort({ createdAt: -1 });

    if (!tokenRecord) {
        return res.status(404).json({ success: false, message: 'No se encontró un token de dispositivo para este usuario. Asegúrese de iniciar la aplicación en el móvil primero.' });
    }

    // Llamar al servicio FCM para enviar la notificación
    const result = await FCMClient.sendToDevice(
        tokenRecord.deviceToken,
        'Alerta de Prueba BEDIC',
        'Tu notificación push de FCM está funcionando correctamente.',
        { origin: 'test_endpoint' }
    );

    res.status(result.success ? 200 : 500).json(result);
};

// @desc    Disparador de alerta geolocalizada (ej. Reporte de peligro cercano)
// @route   POST /api/reports/alert
// @access  Private/Admin (o activado por un sistema de moderación)
exports.sendGeolocatedAlert = async (req, res) => {
    // Lógica para encontrar todos los DeviceTokens que están cerca de las coordenadas del reporte.
    // Esto implicaría una consulta geoespacial a la colección Places o a la colección Users/DeviceTokens
    
    // Ejemplo:
    // const nearbyTokens = await DeviceToken.find({ location: { $near: [lon, lat], $maxDistance: 1000 } });
    
    res.status(501).json({ success: false, message: 'La lógica de alerta geolocalizada no está implementada.' });
};

// @desc    Obtener notificaciones no leídas del usuario actual
// @route   GET /api/notifications/unread
// @access  Private
exports.getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await Notification.getUnreadByUser(userId);
    res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error('getUnreadNotifications ERROR:', err);
    res.status(500).json({ success: false, message: 'Error al obtener notificaciones no leídas' });
  }
};

// @desc    Obtener todas las notificaciones del usuario actual
// @route   GET /api/notifications
// @access  Private
exports.getAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(200);
    res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error('getAllNotifications ERROR:', err);
    res.status(500).json({ success: false, message: 'Error al obtener notificaciones' });
  }
};

// @desc    Marcar una notificación como leída
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notif = await Notification.findOne({ _id: id, userId });
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }

    await notif.markAsRead();
    res.status(200).json({ success: true, data: notif });
  } catch (err) {
    console.error('markNotificationAsRead ERROR:', err);
    res.status(500).json({ success: false, message: 'Error al marcar notificación como leída' });
  }
};