// routes/report.routes.js
const express = require('express');
const multer = require('multer');
const { protect } = require('../utils/authMiddleware');
const filterLanguage = require('../utils/languageFilter');
const { moderateBeforeSave, rateLimit } = require('../middleware/moderation.middleware');

const { 
    createReport,
    getReportsByPlace,
    getReportsByUser,
    getAllReports,
    getReportById,
    takeReportAction,
    updateReportStatus,
    getMyReports,
    upvoteReport,
    downvoteReport,
    getCommentsForReport,
    addCommentToReport,
    upvoteReportComment,
    downvoteReportComment,
} = require('../controllers/report.controller');
const { uploadReportPhoto } = require('../controllers/report_upload.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Crear reporte (solo rate limiting, sin moderación estricta)
router.post(
    '/',
    protect,
    rateLimit('report', { perMinute: 10 }),
    createReport
);

// Subir foto de reporte (marca de agua incluida)
router.post('/upload-photo', protect, upload.single('file'), uploadReportPhoto);

// ========================================
// ENDPOINTS DE GESTIÓN DE REPORTES (Admin)
// ========================================

// Obtener todos los reportes (admin)
router.get('/admin/all', protect, getAllReports);

// Obtener reporte por ID
router.get('/admin/:id', protect, getReportById);

// Tomar acción manual en un reporte (admin)
router.post('/admin/:reportId/action', protect, takeReportAction);

// Actualizar estado de reporte (admin)
router.put('/admin/:reportId/status', protect, updateReportStatus);

// ========================================
// ENDPOINTS DE SEGUIMIENTO DE REPORTES (Usuario)
// ========================================

// Obtener mis reportes (seguimiento del usuario)
router.get('/my-reports', protect, getMyReports);

// ========================================
// ENDPOINTS EXISTENTES
// ========================================

// Obtener reportes por lugar
router.get('/place/:placeId', getReportsByPlace);

// Obtener reportes creados por un usuario
router.get('/user/:userId', getReportsByUser);

// Comentarios de reportes (con moderación)
router.get('/:id/comments', getCommentsForReport);
router.post('/:id/comments', protect, rateLimit('comment', { perMinute: 5 }), moderateBeforeSave, addCommentToReport);
router.put('/comments/:commentId/upvote', protect, upvoteReportComment);
router.put('/comments/:commentId/downvote', protect, downvoteReportComment);

// Votar
router.put('/:id/upvote', protect, upvoteReport);
router.put('/:id/downvote', protect, downvoteReport);

module.exports = router;
