const express = require('express');
const multer = require('multer');
// RESTAURAR TODAS LAS IMPORTACIONES DEL CONTROLADOR DE AUTENTICACIÓN
const { register, login, googleSignIn, forgotPassword, resetPassword } = require('../controllers/auth.controller');
// Asumimos que profile.controller se llama profile.controller.js
const { getProfile, getPublicProfile, updateProfile, deleteAccount, requestVerification, getFavoritePlaces, addFavoritePlace, removeFavoritePlace } = require('../controllers/profile.controller'); 

const { uploadAvatar } = require('../controllers/avatar_upload.controller');
const { protect } = require('../utils/authMiddleware');

// Importar middlewares de seguridad y validación
const { authLimiter, registerLimiter } = require('../middleware/security');
const { validate, validateMongoId } = require('../middleware/validation');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Rutas de AUTENTICACIÓN (Login, Registro) con rate limiting y validación
router.post('/register', registerLimiter, validate('register'), register);
router.post('/login', authLimiter, validate('login'), login);

// --- RUTA PROBLEMA: DEBEMOS CARGARLA CON LA FUNCIÓN REAL PARA PRUEBAS
// Si el servidor falla al iniciar, la causa es el require() en auth.routes.js, 
// por lo que usamos las funciones reales que deben estar exportadas en auth.controller.js.
router.post('/google', googleSignIn); 

// RUTAS DE RECUPERACIÓN DE CONTRASEÑA
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);

// Rutas de PERFIL y GESTIÓN DE CUENTA (Requieren Token)
router.route('/profile')
    .get(protect, getProfile) 
    .put(protect, validate('updateProfile'), updateProfile); 

router.get('/favorites', protect, getFavoritePlaces);
router.post('/favorites/:placeId', protect, validateMongoId('placeId'), addFavoritePlace);
router.delete('/favorites/:placeId', protect, validateMongoId('placeId'), removeFavoritePlace);

// Solicitud de verificación de perfil
router.post('/verification', protect, requestVerification);

// Perfil público (solo lectura)
router.get('/public/:userId', validateMongoId('userId'), getPublicProfile);

// Subir avatar con marca de agua
router.post('/profile/avatar', protect, upload.single('file'), uploadAvatar);

router.delete('/delete-account', protect, deleteAccount); 
router.post('/delete-account', protect, deleteAccount);

module.exports = router;