const express = require('express');
const multer = require('multer');
const { protect, admin } = require('../utils/authMiddleware');
const { 
    getUsers, 
    getUserById,
    updateUser,
    deleteUser, 
    moderateReport, 
    verifyPlace,
    getModerationFeed,
    moderateRating,
    muteUser,
    banUser,
    getVerifications,
    updateVerification,
    createAnnouncement,
    createPlace,
    updatePlace,
    uploadPlacePhoto,
    deletePlacePhoto,
    getOverviewStats,
    getPlacesActivityStats,
    moderateReportComment,
    moderateRatingComment,
    updateUserEmail,
    adminResetPassword,
    exportOverviewStatsCsv,
    getModerationAppeals,
    resolveModerationAppeal,
    getAdminPinStatus,
    setAdminPin,
    verifyAdminPin,
    requestAdminPinReset,
    confirmAdminPinReset,
} = require('../controllers/admin.controller');

const { importPlacesFromOSM } = require('../services/osmImporter');
const { enrichPlacesWithImages } = require('../services/imageEnricher');
const {
  createOrUpdatePolicy,
  getAllPolicies,
  getPolicyById,
  deletePolicy,
  togglePolicyStatus
} = require('../controllers/policy.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Todas las rutas aquí requieren autenticación y rol de administrador
router.use(protect);
router.use(admin);

// Rutas de Gestión de Usuarios
router.route('/users').get(getUsers);
router.route('/users/:id').get(getUserById).put(updateUser).delete(deleteUser);
router.route('/users/:id/email').put(updateUserEmail);
router.route('/users/:id/reset-password').put(adminResetPassword);
router.route('/users/:id/ban').put(banUser);

// Métricas generales
router.route('/stats/overview').get(getOverviewStats);
router.route('/stats/overview/export').get(exportOverviewStatsCsv);
router.route('/stats/places-activity').get(getPlacesActivityStats);

// Rutas de Moderación / Lugares
router.route('/moderation/feed').get(getModerationFeed);
router.get('/moderation/appeals', getModerationAppeals);
router.put('/moderation/appeals/:id', resolveModerationAppeal);
router.put('/reports/:id/moderate', moderateReport);
router.put('/ratings/:id/moderate', moderateRating);
router.put('/report-comments/:id', moderateReportComment);
router.put('/rating-comments/:id', moderateRatingComment);

// PIN de admin (seguridad adicional)
router.get('/pin/status', getAdminPinStatus);
router.post('/pin', setAdminPin);
router.post('/pin/verify', verifyAdminPin);
router.post('/pin/reset-request', requestAdminPinReset);
router.post('/pin/reset-confirm', confirmAdminPinReset);

router.route('/places/:id/verify').put(verifyPlace);
router.route('/places').post(createPlace);
router.route('/places/:id').put(updatePlace);
router
  .route('/places/:id/photos')
  .post(upload.single('file'), uploadPlacePhoto)
  .delete(deletePlacePhoto);

// Rutas de Usuarios
router.route('/users/:id/mute').put(muteUser);

// Verificaciones
router.route('/verifications').get(getVerifications);
router.route('/verifications/:id').put(updateVerification);

// Importación de lugares desde OSM
router.post('/import-osm', async (req, res) => {
  try {
    const { lat, lon, radius } = req.body;
    
    const count = await importPlacesFromOSM(
      lat || 4.6097,  // Bogotá por defecto
      lon || -74.0817,
      radius || 5
    );
    
    res.json({
      success: true,
      message: `Se importaron ${count} lugares desde OpenStreetMap`,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Enriquecer lugares con imágenes
router.post('/enrich-images', async (req, res) => {
  try {
    const { limit } = req.body;
    
    const count = await enrichPlacesWithImages(limit || 30);
    
    res.json({
      success: true,
      message: `Se enriquecieron ${count} lugares con imágenes`,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Rutas de Políticas Comunitarias
router.route('/policies')
  .get(getAllPolicies)
  .post(createOrUpdatePolicy);

router.route('/policies/:id')
  .get(getPolicyById)
  .delete(deletePolicy);

router.put('/policies/:id/toggle', togglePolicyStatus);

module.exports = router;