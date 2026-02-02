const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

/**
 * Rutas de Verificación de Usuarios
 */

// ========== RUTAS PÚBLICAS / AUTENTICADAS ==========

// Verificar email con token
router.post('/verify-email', authMiddleware, async (req, res) => {
  const authController = require('../controllers/auth.controller');
  authController.verifyEmail(req, res);
});

// Reenviar token de verificación de email
router.post('/resend-email-verification', authMiddleware, async (req, res) => {
  const authController = require('../controllers/auth.controller');
  authController.resendEmailVerification(req, res);
});

// Obtener estado de verificación del usuario actual
router.get('/my-status', authMiddleware, async (req, res) => {
  const authController = require('../controllers/auth.controller');
  authController.getMyVerificationStatus(req, res);
});

// ========== RUTAS DE ADMINISTRADOR ==========

// Obtener lista de usuarios con estado de verificación
router.get('/users', authMiddleware, adminMiddleware, verificationController.getUsersVerificationList);

// Obtener estado de verificación de un usuario específico
router.get('/users/:userId', authMiddleware, adminMiddleware, verificationController.getUserVerificationStatus);

// Verificar manualmente a un usuario
router.post('/users/:userId/verify', authMiddleware, adminMiddleware, verificationController.manuallyVerifyUser);

// Rechazar verificación de un usuario
router.post('/users/:userId/reject', authMiddleware, adminMiddleware, verificationController.rejectUserVerification);

// Obtener estadísticas de verificación
router.get('/stats/overview', authMiddleware, adminMiddleware, verificationController.getVerificationStats);

module.exports = router;
