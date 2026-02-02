const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const Report = require('../models/Report');
const User = require('../models/User');
const Place = require('../models/Place');
const Rating = require('../models/Rating');
const RatingComment = require('../models/RatingComment');
const ReportComment = require('../models/ReportComment');

// ============ STATS ============
router.get('/stats/overview', verifyToken, checkRole(['admin', 'moderator', 'support_agent']), async (req, res) => {
  try {
    // Obtener estadísticas reales de BD
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'PENDING' });
    const verifiedReports = await Report.countDocuments({ status: 'RESOLVED' });
    const rejectedReports = await Report.countDocuments({ status: 'DISMISSED' });
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const bannedUsers = await User.countDocuments({ status: 'banned' });
    const mutedUsers = await User.countDocuments({ isMuted: true });
    
    const totalPlaces = await Place.countDocuments();
    const verifiedPlaces = await Place.countDocuments({ verified: true });
    const unverifiedPlaces = await Place.countDocuments({ verified: false });

    // Calcular tiempo promedio de resolución
    const resolvedReports = await Report.find({ 
      status: { $in: ['verified', 'rejected'] },
      createdAt: { $exists: true },
      updatedAt: { $exists: true }
    }).select('createdAt updatedAt');

    let averageResolutionTime = 0;
    if (resolvedReports.length > 0) {
      const totalTime = resolvedReports.reduce((sum, report) => {
        return sum + (new Date(report.updatedAt) - new Date(report.createdAt));
      }, 0);
      averageResolutionTime = Math.round(totalTime / resolvedReports.length / (1000 * 60 * 60)); // en horas
    }

    // Obtener reportes por tipo de contenido
    const reportsByType = await Report.aggregate([
      { $group: { _id: '$contentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Obtener reportes por razón
    const reportsByReason = await Report.aggregate([
      {
        $addFields: {
          displayReason: {
            $cond: [
              { $and: [ { $ne: ['$reason', null] }, { $ne: ['$reason', 'OTHER'] } ] },
              '$reason',
              { $ifNull: ['$type', 'OTHER'] }
            ]
          }
        }
      },
      { $group: { _id: '$displayReason', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Obtener usuarios más reportados
    const topReportedUsers = await Report.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userData' } },
      { $unwind: '$userData' },
      { $project: { _id: 0, name: '$userData.username', count: 1 } }
    ]);

    const stats = {
      totalReports,
      pendingReports,
      verifiedReports,
      rejectedReports,
      totalUsers,
      activeUsers,
      bannedUsers,
      mutedUsers,
      totalPlaces,
      verifiedPlaces,
      unverifiedPlaces,
      averageResolutionTime,
      reportsByType: reportsByType.map(r => ({ type: r._id || 'Otro', count: r.count })) || [],
      reportsByReason: reportsByReason.map(r => ({ reason: r._id || 'Otro', count: r.count })) || [],
      topReportedUsers: topReportedUsers || []
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ MODERATION FEED ============
router.get('/moderation/feed', verifyToken, checkRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { reason, moderationAction, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construir filtro
    const filter = {};
    if (reason) {
      filter.reason = reason;
      console.log('🔍 Filtering by reason:', reason);
    }
    if (moderationAction) {
      filter.moderationAction = moderationAction;
      console.log('🔍 Filtering by moderationAction:', moderationAction);
    }

    console.log('🔍 Moderation Feed Filter Object:', JSON.stringify(filter));
    console.log('🔍 Query params received:', { reason, moderationAction, page, limit });
    
    // Obtener reportes de BD
    const reports = await Report.find(filter)
      .populate('user', 'username avatar')
      .populate('place', 'name')
      .populate('moderatedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('📊 Reports found with filter:', reports.length);
    console.log('📊 Sample report:', reports[0] ? { reason: reports[0].reason, contentType: reports[0].contentType, description: reports[0].description?.substring(0, 50) } : 'No reports');

    // Formatear respuesta
    const formattedReports = reports.map(report => ({
      id: report._id,
      contentType: report.contentType,
      reason: report.reason,
      displayReason: (report.reason && report.reason !== 'OTHER') ? report.reason : (report.type || report.reason || 'OTHER'),
      description: report.description,
      userId: report.user?._id,
      userName: report.user?.username || 'Usuario desconocido',
      userAvatar: report.user?.avatar,
      placeName: report.place?.name || 'Lugar desconocido',
      placeId: report.place?._id,
      photoUrl: report.photo_url,
      createdAt: report.createdAt,
      moderationAction: report.moderationAction,
      moderatedBy: report.moderatedBy?.username,
      moderatedAt: report.moderatedAt,
      autoModerated: report.autoModerated,
      upvotes: report.upvotes?.length || 0,
      downvotes: report.downvotes?.length || 0
    }));

    res.json(formattedReports);
  } catch (err) {
    console.error('Error en moderation/feed:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ REPORTS STATS ============
router.get('/reports/stats', verifyToken, checkRole(['admin', 'moderator']), async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({
      $or: [
        { moderationAction: 'PENDING' },
        { moderationAction: { $exists: false } },
        { moderationAction: null }
      ]
    });
    const approvedReports = await Report.countDocuments({ moderationAction: 'APPROVED' });
    const hiddenReports = await Report.countDocuments({ moderationAction: 'HIDDEN' });
    const rejectedReports = await Report.countDocuments({ moderationAction: 'DELETED' });
    const userBannedReports = await Report.countDocuments({ moderationAction: 'USER_BANNED' });

    // Obtener reportes por tipo de contenido
    const reportsByType = await Report.aggregate([
      { $group: { _id: '$contentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Obtener reportes por razón
    const reportsByReason = await Report.aggregate([
      {
        $addFields: {
          displayReason: {
            $cond: [
              { $and: [ { $ne: ['$reason', null] }, { $ne: ['$reason', 'OTHER'] } ] },
              '$reason',
              { $ifNull: ['$type', 'OTHER'] }
            ]
          }
        }
      },
      { $group: { _id: '$displayReason', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('📊 Reports by Reason (Aggregation Result):', JSON.stringify(reportsByReason, null, 2));
    
    // También obtener el conteo directo por campo 'reason' para comparar
    const directReasonCount = await Report.aggregate([
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('📊 Direct Reason Count:', JSON.stringify(directReasonCount, null, 2));

    // Obtener usuarios más reportados
    const topReportedUsers = await Report.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userData' } },
      { $unwind: '$userData' },
      { $project: { _id: 0, name: '$userData.username', count: 1 } }
    ]);

    const stats = {
      totalReports: totalReports || 0,
      pendingReports: pendingReports || 0,
      approvedReports: approvedReports || 0,
      hiddenReports: hiddenReports || 0,
      rejectedReports: rejectedReports || 0,
      userBannedReports: userBannedReports || 0,
      averageResolutionTime: 0, // mantenemos la lógica original arriba
      topReportedUsers: topReportedUsers || [],
      reportsByType: reportsByType.map(r => ({ type: r._id || 'Otro', count: r.count })) || [],
      reportsByReason: reportsByReason.map(r => ({ reason: r._id || 'Otro', count: r.count })) || []
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Error en /reports/stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ REPORT DETAIL ============
router.get('/reports/:id', verifyToken, checkRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener reporte de BD
    const report = await Report.findById(id)
      .populate('user', 'username avatar email')
      .populate('place', 'name address')
      .populate('moderatedBy', 'username');

    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    // Formatear respuesta
    const formattedReport = {
      id: report._id,
      contentType: report.contentType,
      reason: report.reason,
      displayReason: (report.reason && report.reason !== 'OTHER') ? report.reason : (report.type || report.reason || 'OTHER'),
      description: report.description,
      userId: report.user?._id,
      userName: report.user?.username || 'Usuario desconocido',
      userAvatar: report.user?.avatar,
      userEmail: report.user?.email,
      placeName: report.place?.name || 'Lugar desconocido',
      placeAddress: report.place?.address,
      placeId: report.place?._id,
      photoUrl: report.photo_url,
      createdAt: report.createdAt,
      moderationAction: report.moderationAction,
      moderatedBy: report.moderatedBy?.username,
      moderatedAt: report.moderatedAt,
      autoModerated: report.autoModerated,
      upvotes: report.upvotes?.length || 0,
      downvotes: report.downvotes?.length || 0
    };

    res.json(formattedReport);
  } catch (err) {
    console.error('Error en reports/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ MODERATE REPORT ============
router.put('/reports/:id/moderate', verifyToken, checkRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { moderationAction, note } = req.body;
    const moderatorId = req.user.id;

    if (!moderationAction || !['PENDING', 'APPROVED', 'HIDDEN', 'DELETED', 'USER_BANNED'].includes(moderationAction)) {
      return res.status(400).json({ error: 'Acción de moderación inválida' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    const contentType = report.contentType;
    const contentId = report.contentId;

    const setCommentHidden = async (idToUpdate, hidden) => {
      const updatedRatingComment = await RatingComment.findByIdAndUpdate(
        idToUpdate,
        { hidden },
        { new: true }
      );
      if (updatedRatingComment) return updatedRatingComment;

      const updatedReportComment = await ReportComment.findByIdAndUpdate(
        idToUpdate,
        { hidden },
        { new: true }
      );
      return updatedReportComment;
    };

    // Aplicar efectos a contenido (seguro y sin borrados destructivos)
    if (contentType === 'USER' && moderationAction === 'USER_BANNED') {
      await User.findByIdAndUpdate(
        contentId,
        { isBanned: true, banReason: note || 'Baneado por moderación de reporte' },
        { new: true }
      );
    }

    if (contentType === 'REVIEW') {
      if (moderationAction === 'APPROVED') {
        await Rating.findByIdAndUpdate(contentId, { hidden: false, is_moderated: true }, { new: true });
      }
      if (moderationAction === 'HIDDEN' || moderationAction === 'DELETED') {
        await Rating.findByIdAndUpdate(contentId, { hidden: true, is_moderated: true }, { new: true });
      }
    }

    if (contentType === 'COMMENT') {
      if (moderationAction === 'APPROVED') {
        await setCommentHidden(contentId, false);
      }
      if (moderationAction === 'HIDDEN' || moderationAction === 'DELETED') {
        await setCommentHidden(contentId, true);
      }
    }

    // Actualizar reporte en BD
    const updatedReport = await Report.findByIdAndUpdate(
      id,
      {
        moderationAction,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
        is_moderated: true
      },
      { new: true }
    )
      .populate('user', 'username')
      .populate('moderatedBy', 'username');

    if (!updatedReport) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    res.json({ 
      success: true,
      message: 'Reporte moderado exitosamente',
      reportId: id,
      moderationAction,
      data: updatedReport
    });
  } catch (err) {
    console.error('Error en moderate report:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ PLACES ============
router.get('/places', verifyToken, checkRole(['admin', 'support_agent']), async (req, res) => {
  try {
    const { category, verified, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construir filtro
    const filter = {};
    if (category) filter.category = category;
    if (verified !== undefined) filter.verified = verified === 'true';

    // Obtener lugares de BD
    const places = await Place.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Formatear respuesta
    const formattedPlaces = places.map(place => ({
      id: place._id,
      name: place.name,
      description: place.description,
      category: place.category,
      address: place.address,
      coordinates: place.coordinates,
      source: place.source,
      verified: place.verified,
      rating: place.rating || 0,
      reviewCount: place.reviewCount || 0,
      officialImages: place.officialImages || [],
      createdAt: place.createdAt,
      updatedAt: place.updatedAt
    }));

    res.json(formattedPlaces);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/places/:id', verifyToken, checkRole(['admin', 'support_agent']), async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener lugar de BD
    const place = await Place.findById(id);

    if (!place) {
      return res.status(404).json({ error: 'Lugar no encontrado' });
    }

    // Formatear respuesta
    const formattedPlace = {
      id: place._id,
      name: place.name,
      description: place.description,
      category: place.category,
      address: place.address,
      coordinates: place.coordinates,
      source: place.source,
      verified: place.verified,
      rating: place.rating || 0,
      reviewCount: place.reviewCount || 0,
      officialImages: place.officialImages || [],
      createdAt: place.createdAt,
      updatedAt: place.updatedAt
    };

    res.json(formattedPlace);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/places', verifyToken, checkRole(['admin', 'support_agent']), async (req, res) => {
  try {
    const { name, description, category, location } = req.body;

    // Validar campos requeridos
    if (!name || !description || !category || !location) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    // Crear lugar en BD
    const newPlace = new Place({
      name,
      description,
      category,
      location,
      images: [],
      verified: false,
      rating: 0,
      reviewCount: 0
    });

    await newPlace.save();

    res.status(201).json({
      id: newPlace._id,
      name: newPlace.name,
      description: newPlace.description,
      category: newPlace.category,
      location: newPlace.location,
      images: newPlace.images,
      verified: newPlace.verified,
      rating: newPlace.rating,
      reviewCount: newPlace.reviewCount,
      createdAt: newPlace.createdAt,
      updatedAt: newPlace.updatedAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/places/:id', verifyToken, checkRole(['admin', 'support_agent']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, location } = req.body;

    // Actualizar lugar en BD
    const updatedPlace = await Place.findByIdAndUpdate(
      id,
      {
        name,
        description,
        category,
        location,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedPlace) {
      return res.status(404).json({ error: 'Lugar no encontrado' });
    }

    res.json({
      id: updatedPlace._id,
      name: updatedPlace.name,
      description: updatedPlace.description,
      category: updatedPlace.category,
      location: updatedPlace.location,
      images: updatedPlace.images,
      verified: updatedPlace.verified,
      rating: updatedPlace.rating,
      reviewCount: updatedPlace.reviewCount,
      createdAt: updatedPlace.createdAt,
      updatedAt: updatedPlace.updatedAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/places/:id/images', verifyToken, checkRole(['admin', 'support_agent']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Procesar imagen (guardar en servidor o cloud)
    const imageUrl = 'https://via.placeholder.com/150'; // URL simulada

    const newImage = {
      id: Date.now().toString(),
      url: imageUrl,
      isMain: false,
      uploadedAt: new Date()
    };

    res.status(201).json(newImage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/places/:placeId/images/:imageId', verifyToken, checkRole(['admin', 'support_agent']), async (req, res) => {
  try {
    const { placeId, imageId } = req.params;

    // Eliminar de BD y servidor

    res.json({ message: 'Imagen eliminada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/places/:placeId/images/:imageId/main', verifyToken, checkRole(['admin', 'support_agent']), async (req, res) => {
  try {
    const { placeId, imageId } = req.params;

    // Actualizar en BD

    res.json({ message: 'Imagen principal actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/places/:id/verify', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body || {};

    const newVerified = typeof verified === 'boolean' ? verified : true;

    const place = await Place.findByIdAndUpdate(
      id,
      { verified: newVerified },
      { new: true }
    );

    if (!place) {
      return res.status(404).json({ error: 'Lugar no encontrado' });
    }

    res.json({
      success: true,
      message: newVerified
        ? 'Lugar verificado exitosamente'
        : 'Verificación del lugar retirada',
      data: place
    });
  } catch (err) {
    console.error('Error en /places/:id/verify:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/places/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Eliminar de BD

    res.json({ message: 'Lugar eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ GET ALL REPORTS ============
router.get('/reports', verifyToken, checkRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { page = 1, limit = 50, status, reason, contentType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('📋 GET /reports - Query params:', { page, limit, status, reason, contentType });

    // Construir filtro
    const filter = {};
    if (status) {
      if (String(status).toUpperCase() === 'PENDING') {
        filter.$or = [
          { moderationAction: 'PENDING' },
          { moderationAction: { $exists: false } },
          { moderationAction: null }
        ];
      } else {
        filter.moderationAction = status;
      }
    }
    if (reason) {
      // Buscar con regex para ser case-insensitive
      filter.reason = new RegExp(reason, 'i');
      console.log('🔍 Buscando reportes con reason:', reason);
    }
    if (contentType) filter.contentType = String(contentType).toUpperCase();

    console.log('🔎 Filter aplicado:', filter);

    // Obtener reportes de BD
    const reports = await Report.find(filter)
      .populate('user', 'username avatar')
      .populate('place', 'name')
      .populate('moderatedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('✅ Reportes encontrados:', reports.length);

    // Formatear respuesta
    const formattedReports = reports.map(report => ({
      id: report._id,
      contentType: report.contentType,
      reason: report.reason,
      displayReason: (report.reason && report.reason !== 'OTHER') ? report.reason : (report.type || report.reason || 'OTHER'),
      description: report.description,
      userId: report.user?._id,
      userName: report.user?.username || 'Usuario desconocido',
      userAvatar: report.user?.avatar,
      placeName: report.place?.name || 'Lugar desconocido',
      placeId: report.place?._id,
      photoUrl: report.photo_url,
      createdAt: report.createdAt,
      moderationAction: report.moderationAction,
      moderatedBy: report.moderatedBy?.username,
      moderatedAt: report.moderatedAt,
      autoModerated: report.autoModerated,
      upvotes: report.upvotes?.length || 0,
      downvotes: report.downvotes?.length || 0
    }));

    console.log('📤 Devolviendo', formattedReports.length, 'reportes formateados');
    res.json({ success: true, data: formattedReports });
  } catch (err) {
    console.error('Error en GET /reports:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ REPORTS STATS ============
router.get('/reports/stats', verifyToken, checkRole(['admin', 'moderator']), async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({
      $or: [
        { moderationAction: 'PENDING' },
        { moderationAction: { $exists: false } },
        { moderationAction: null }
      ]
    });
    const approvedReports = await Report.countDocuments({ moderationAction: 'APPROVED' });
    const rejectedReports = await Report.countDocuments({ moderationAction: 'DELETED' });

    // Obtener reportes por tipo de contenido
    const reportsByType = await Report.aggregate([
      { $group: { _id: '$contentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Obtener reportes por razón (mostrar razón real seleccionada en móvil)
    // Si reason=OTHER (o null), usamos type como razón de display
    const reportsByReason = await Report.aggregate([
      {
        $addFields: {
          displayReason: {
            $cond: [
              { $and: [ { $ne: ['$reason', null] }, { $ne: ['$reason', 'OTHER'] } ] },
              '$reason',
              { $ifNull: ['$type', 'OTHER'] }
            ]
          }
        }
      },
      { $group: { _id: '$displayReason', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Obtener usuarios más reportados
    const topReportedUsers = await Report.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userData' } },
      { $unwind: '$userData' },
      { $project: { name: '$userData.username', count: 1, _id: 0 } }
    ]);

    // Calcular tiempo promedio de resolución
    const resolvedReports = await Report.find({
      moderationAction: { $in: ['APPROVED', 'DELETED'] },
      moderatedAt: { $exists: true }
    }).select('createdAt moderatedAt');

    let averageResolutionTime = 0;
    if (resolvedReports.length > 0) {
      const totalTime = resolvedReports.reduce((sum, report) => {
        return sum + (new Date(report.moderatedAt) - new Date(report.createdAt));
      }, 0);
      averageResolutionTime = Math.round(totalTime / resolvedReports.length / (1000 * 60 * 60)); // en horas
    }

    const stats = {
      totalReports: totalReports || 0,
      pendingReports: pendingReports || 0,
      approvedReports: approvedReports || 0,
      rejectedReports: rejectedReports || 0,
      averageResolutionTime: averageResolutionTime,
      topReportedUsers: topReportedUsers || [],
      reportsByType: reportsByType.map(r => ({ type: r._id || 'Otro', count: r.count })) || [],
      reportsByReason: reportsByReason.map(r => ({ reason: r._id || 'Otro', count: r.count })) || []
    };

    res.json(stats);
  } catch (err) {
    console.error('Error en /reports/stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ EXPORT REPORTS ============
router.get('/reports/export', verifyToken, checkRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { format } = req.query;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="reports.csv"');
      res.send('id,type,user,reason,status,severity,date\n1,comment,user1,offensive,pending,moderado,2025-11-27');
    } else if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="reports.xlsx"');
      res.send(Buffer.from('Excel file content'));
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="reports.pdf"');
      res.send(Buffer.from('PDF file content'));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ USERS ============
router.get('/users', verifyToken, checkRole(['admin', 'support_agent']), async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;

    // Simulando datos
    const users = [
      {
        id: '1',
        username: 'usuario1',
        email: 'user1@example.com',
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        reportCount: 5,
        isMuted: false,
        isBanned: false
      }
    ];

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users/:id', verifyToken, checkRole(['admin', 'support_agent']), async (req, res) => {
  try {
    const { id } = req.params;

    const user = {
      id,
      username: 'usuario1',
      email: 'user1@example.com',
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      reportCount: 5,
      isMuted: false,
      isBanned: false,
      sanctions: []
    };

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, bio, location, phone, isBanned, banReason, isMuted, muteUntil, emailVerified } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (phone !== undefined) updateData.phone = phone;
    if (isBanned !== undefined) updateData.isBanned = isBanned;
    if (banReason !== undefined) updateData.banReason = banReason;
    if (isMuted !== undefined) updateData.isMuted = isMuted;
    if (muteUntil !== undefined) updateData.muteUntil = muteUntil;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ success: true, data: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/mute', verifyToken, checkRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.body;

    // Validar que hours sea un número válido
    if (!hours || isNaN(hours) || hours <= 0) {
      return res.status(400).json({ error: 'Horas inválidas. Debe ser un número mayor a 0' });
    }

    // Actualizar en BD
    const muteUntil = new Date(Date.now() + parseInt(hours) * 60 * 60 * 1000);
    const updatedUser = await User.findByIdAndUpdate(id, { 
      isMuted: true, 
      muteUntil: muteUntil 
    }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ 
      success: true,
      message: `Usuario silenciado por ${hours} horas`,
      data: updatedUser 
    });
  } catch (err) {
    console.error('Error en mute:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/ban', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Violación de términos de servicio' } = req.body;

    // Validar que el usuario exista
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Banear usuario en BD
    const updatedUser = await User.findByIdAndUpdate(id, { 
      isBanned: true,
      banReason: reason,
      bannedAt: new Date()
    }, { new: true });

    res.json({ 
      success: true,
      message: `Usuario baneado exitosamente. Razón: ${reason}`,
      data: updatedUser 
    });
  } catch (err) {
    console.error('Error en ban:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Eliminar de BD

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ USER PROFILE ============
router.get('/users/:id/profile', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
        role: user.role,
        roleColor: user.corporate_color,
        badges: user.badges || [],
        level: user.current_level || 1,
        isBanned: user.isBanned,
        isMuted: user.isMuted,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (err) {
    console.error('Error en GET user profile:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/profile', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, roleColor } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        name,
        email,
        role,
        corporate_color: roleColor
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: updatedUser
    });
  } catch (err) {
    console.error('Error en PUT user profile:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ BADGES ============
router.get('/badges', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    // Obtener todas las insignias únicas de todos los usuarios
    const users = await User.find().select('badges');
    const badgesSet = new Set();
    
    users.forEach(user => {
      if (user.badges && Array.isArray(user.badges)) {
        user.badges.forEach(badge => badgesSet.add(badge));
      }
    });

    const badges = Array.from(badgesSet).map((badge, index) => ({
      id: index.toString(),
      name: badge,
      description: `Insignia: ${badge}`,
      icon: '🏆'
    }));

    res.json({
      success: true,
      data: badges
    });
  } catch (err) {
    console.error('Error en GET badges:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/badges', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { badge } = req.body;

    if (!badge) {
      return res.status(400).json({ error: 'Badge es requerido' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.badges) {
      user.badges = [];
    }

    if (!user.badges.includes(badge)) {
      user.badges.push(badge);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Insignia asignada exitosamente',
      data: user.badges
    });
  } catch (err) {
    console.error('Error en POST user badges:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id/badges/:badge', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id, badge } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.badges && Array.isArray(user.badges)) {
      user.badges = user.badges.filter(b => b !== badge);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Insignia removida exitosamente',
      data: user.badges
    });
  } catch (err) {
    console.error('Error en DELETE user badges:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ SAVED PLACES ============
router.get('/users/:id/saved-places', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate('savedPlaces', 'name category rating');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      data: user.savedPlaces || []
    });
  } catch (err) {
    console.error('Error en GET saved places:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ ACCOUNT VERIFICATION ============
router.get('/verifications', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.verificationStatus = status;

    const verifications = await User.find({ 
      verificationStatus: { $exists: true },
      ...filter 
    })
    .select('name username email verificationStatus verificationEvidence verificationRequestedAt verificationApprovedAt')
    .sort({ verificationRequestedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await User.countDocuments({ 
      verificationStatus: { $exists: true },
      ...filter 
    });

    res.json({
      success: true,
      data: verifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error en GET verifications:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/verifications/:id/approve', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        verificationStatus: 'approved',
        isVerified: true,
        verificationApprovedAt: new Date(),
        verificationApprovedBy: req.user.id,
        verificationNote: note
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      message: 'Verificación aprobada exitosamente',
      data: user
    });
  } catch (err) {
    console.error('Error en approve verification:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/verifications/:id/reject', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        verificationStatus: 'rejected',
        isVerified: false,
        verificationRejectedAt: new Date(),
        verificationRejectedBy: req.user.id,
        verificationRejectionReason: reason
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      message: 'Verificación rechazada exitosamente',
      data: user
    });
  } catch (err) {
    console.error('Error en reject verification:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ ANNOUNCEMENTS ============
router.get('/announcements', verifyToken, checkRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { status, type } = req.query;
    let filter = {};

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    const Announcement = require('../models/Announcement');
    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: announcements
    });
  } catch (err) {
    console.error('Error getting announcements:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/announcements', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { title, message, description, type, durationDays, location, imageUrl, externalLink, categories, pinned } = req.body;

    if (!title || !message || !durationDays) {
      return res.status(400).json({ error: 'Título, mensaje y duración son requeridos' });
    }

    const Announcement = require('../models/Announcement');
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const announcement = new Announcement({
      title,
      message,
      description,
      type: type || 'general',
      durationDays,
      startDate,
      endDate,
      location,
      imageUrl,
      externalLink,
      categories: categories || [],
      pinned: pinned || false,
      createdBy: req.user.id,
      status: 'active'
    });

    await announcement.save();
    await announcement.populate('createdBy', 'username email');

    res.status(201).json({
      success: true,
      message: 'Anuncio creado exitosamente',
      data: announcement
    });
  } catch (err) {
    console.error('Error creating announcement:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/announcements/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, description, type, durationDays, location, imageUrl, externalLink, categories, pinned, status } = req.body;

    const Announcement = require('../models/Announcement');
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    // Actualizar campos
    if (title) announcement.title = title;
    if (message) announcement.message = message;
    if (description) announcement.description = description;
    if (type) announcement.type = type;
    if (durationDays) {
      announcement.durationDays = durationDays;
      announcement.endDate = new Date(announcement.startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    }
    if (location) announcement.location = location;
    if (imageUrl) announcement.imageUrl = imageUrl;
    if (externalLink) announcement.externalLink = externalLink;
    if (categories) announcement.categories = categories;
    if (pinned !== undefined) announcement.pinned = pinned;
    if (status) announcement.status = status;

    await announcement.save();
    await announcement.populate('createdBy', 'username email');

    res.json({
      success: true,
      message: 'Anuncio actualizado exitosamente',
      data: announcement
    });
  } catch (err) {
    console.error('Error updating announcement:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/announcements/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const Announcement = require('../models/Announcement');

    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    res.json({
      success: true,
      message: 'Anuncio eliminado exitosamente'
    });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/announcements/:id/pin', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { pinned } = req.body;

    const Announcement = require('../models/Announcement');
    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { pinned },
      { new: true }
    ).populate('createdBy', 'username email');

    if (!announcement) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    res.json({
      success: true,
      message: pinned ? 'Anuncio anclado' : 'Anuncio desanclado',
      data: announcement
    });
  } catch (err) {
    console.error('Error pinning announcement:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ REVIEWS ============
router.get('/reviews', verifyToken, checkRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { placeId, status } = req.query;
    let filter = {};

    if (placeId) {
      filter.place = placeId;
    }

    if (status === 'verified') {
      filter.isVerified = true;
    } else if (status === 'unverified') {
      filter.isVerified = false;
    } else if (status === 'reported') {
      filter.isReported = true;
    }

    const Rating = require('../models/Rating');
    const reviews = await Rating.find(filter)
      .populate('user', 'username email')
      .populate('place', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews.map(review => ({
        id: review._id,
        placeId: review.place?._id,
        placeName: review.place?.name || 'N/A',
        userId: review.user?._id,
        userName: review.user?.username || 'N/A',
        userEmail: review.user?.email,
        rating: review.score,
        title: review.title || '',
        content: review.comment || '',
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        verified: review.isVerified || false,
        reported: review.isReported || false
      }))
    });
  } catch (err) {
    console.error('Error getting reviews:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/reviews/:id/verify', verifyToken, checkRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;
    const Rating = require('../models/Rating');

    const review = await Rating.findByIdAndUpdate(
      id,
      { isVerified: true },
      { new: true }
    ).populate('user', 'username').populate('place', 'name');

    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    res.json({
      success: true,
      message: 'Reseña verificada exitosamente',
      data: review
    });
  } catch (err) {
    console.error('Error verifying review:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/reviews/:id', verifyToken, checkRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;
    const Rating = require('../models/Rating');

    const review = await Rating.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    res.json({
      success: true,
      message: 'Reseña eliminada exitosamente'
    });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
