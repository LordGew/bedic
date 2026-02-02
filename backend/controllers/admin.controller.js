const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Place = require('../models/Place');
const Report = require('../models/Report');
const Rating = require('../models/Rating');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const VerificationRequest = require('../models/VerificationRequest');
const ReportComment = require('../models/ReportComment');
const RatingComment = require('../models/RatingComment');
const ModerationAppeal = require('../models/ModerationAppeal');
const sendEmail = require('../services/emailService');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { addWatermark } = require('../utils/watermark');
const DeviceToken = require('../models/DeviceToken');
const FCMClient = require('../services/fcmClient');

async function recalcPlaceRatingForAdmin(placeId) {
    if (!placeId) return;
    const agg = await Rating.aggregate([
        { $match: { place: placeId } },
        {
            $group: {
                _id: '$place',
                avgScore: { $avg: '$score' },
                count: { $sum: 1 },
            },
        },
    ]);

    if (!agg.length) {
        await Place.findByIdAndUpdate(placeId, { rating: 0 });
        return;
    }

    const { avgScore } = agg[0];
    await Place.findByIdAndUpdate(placeId, { rating: avgScore });
}

// @desc    Obtener todos los usuarios (solo Admin)
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
};

// @desc    Obtener un usuario por ID (solo Admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: `Usuario no encontrado con ID ${req.params.id}` });
        }

        const isMuted = !!(user.muted_until && user.muted_until > new Date());

        return res.status(200).json({
            success: true,
            data: {
                ...user.toObject(),
                isMuted,
                muteUntil: user.muted_until,
                avatar: user.avatar_url,
            },
        });
    } catch (err) {
        console.error('Error en getUserById:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener usuario' });
    }
};

// @desc    Actualizar un usuario (solo Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        const {
            name,
            username,
            email,
            role,
            avatar_url,
            phone,
            bio,
            location,
            isBanned,
            banReason,
            muted_until,
            mute_reason,
            emailVerified,
        } = req.body || {};

        const updates = {};
        if (typeof name === 'string') updates.name = name;
        if (typeof username === 'string') updates.username = username;
        if (typeof email === 'string') updates.email = email;
        if (typeof role === 'string') updates.role = role;
        if (typeof avatar_url === 'string') updates.avatar_url = avatar_url;
        if (typeof phone === 'string') updates.phone = phone;
        if (typeof bio === 'string') updates.bio = bio;
        if (typeof location === 'string') updates.location = location;
        if (typeof isBanned === 'boolean') updates.isBanned = isBanned;
        if (typeof banReason === 'string' || banReason === null) updates.banReason = banReason || undefined;
        if (typeof muted_until === 'string' || muted_until instanceof Date) updates.muted_until = muted_until;
        if (typeof mute_reason === 'string' || mute_reason === null) updates.mute_reason = mute_reason || undefined;
        if (typeof emailVerified === 'boolean') updates.emailVerified = emailVerified;

        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select(
            '-password'
        );
        if (!user) {
            return res.status(404).json({ success: false, message: `Usuario no encontrado con ID ${req.params.id}` });
        }

        const isMuted = !!(user.muted_until && user.muted_until > new Date());

        return res.status(200).json({
            success: true,
            data: {
                ...user.toObject(),
                isMuted,
                muteUntil: user.muted_until,
                avatar: user.avatar_url,
            },
        });
    } catch (err) {
        console.error('Error en updateUser:', err);
        return res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
};

// @desc    Eliminar usuario (solo Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: `Usuario no encontrado con ID ${req.params.id}`,
            });
        }

        return res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error('Error en deleteUser:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
        });
    }
};

// @desc    Métricas generales de la plataforma (overview)
// @route   GET /api/admin/stats/overview
// @access  Private/Admin
function buildCreatedAtFilter(query) {
    const { from, to } = query || {};
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    if (!Object.keys(dateFilter).length) return {};
    return { createdAt: dateFilter };
}

exports.getOverviewStats = async (req, res) => {
    try {
        const createdFilter = buildCreatedAtFilter(req.query || {});

        const [totalUsers, totalPlaces, totalReports, totalRatings, pendingReports, verifiedReports] = await Promise.all([
            User.countDocuments(createdFilter),
            Place.countDocuments(createdFilter),
            Report.countDocuments(createdFilter),
            Rating.countDocuments(createdFilter),
            Report.countDocuments({ status: 'PENDING' }),
            Report.countDocuments({ status: 'RESOLVED' }),
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

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalPlaces,
                totalReports,
                totalRatings,
                pendingReports,
                verifiedReports,
                reportsByReason: reportsByReason.map(r => ({ reason: r._id || 'Otro', count: r.count })) || [],
                topReportedUsers: topReportedUsers || []
            },
        });
    } catch (err) {
        console.error('Error en getOverviewStats:', err);
        res.status(500).json({ success: false, message: 'Error al obtener métricas generales' });
    }
};

// @desc    Métricas de lugares / actividad
// @route   GET /api/admin/stats/places-activity
// @access  Private/Admin
exports.getPlacesActivityStats = async (req, res) => {
    try {
        const [totalPlaces, totalReports, totalRatings] = await Promise.all([
            Place.countDocuments({}),
            Report.countDocuments({}),
            Rating.countDocuments({}),
        ]);

        // Top categorías por número de lugares
        const topCategories = await Place.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        // Lugares con más reportes
        const topReportedPlaces = await Report.aggregate([
            {
                $group: {
                    _id: '$place',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'places',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'place',
                },
            },
            { $unwind: '$place' },
            {
                $project: {
                    _id: '$place._id',
                    name: '$place.name',
                    category: '$place.category',
                    count: 1,
                },
            },
        ]);

        // Lugares mejor valorados por rating promedio
        const topRatedPlaces = await Rating.aggregate([
            {
                $group: {
                    _id: '$place',
                    avgScore: { $avg: '$score' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { avgScore: -1, count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'places',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'place',
                },
            },
            { $unwind: '$place' },
            {
                $project: {
                    _id: '$place._id',
                    name: '$place.name',
                    category: '$place.category',
                    count: 1,
                    avgScore: 1,
                },
            },
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalPlaces,
                totalReports,
                totalRatings,
                topCategories,
                topReportedPlaces,
                topRatedPlaces,
            },
        });
    } catch (err) {
        console.error('Error en getPlacesActivityStats:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener métricas de lugares y actividad',
        });
    }
};

// ---------------------------------------------------------------------------
// APELACIONES DE MODERACIÓN (ADMIN)
// ---------------------------------------------------------------------------

// @desc    Listar apelaciones de moderación
// @route   GET /api/admin/moderation/appeals
// @access  Private/Admin
exports.getModerationAppeals = async (req, res) => {
    try {
        const { status } = req.query || {};

        const filter = {};
        if (status) {
            filter.status = status;
        }

        const appeals = await ModerationAppeal.find(filter)
            .populate('user', 'username email strikes suspendedUntil')
            .sort('-createdAt')
            .lean();

        return res.status(200).json({ success: true, data: appeals });
    } catch (err) {
        console.error('getModerationAppeals ERROR:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al cargar apelaciones de moderación',
        });
    }
};

// @desc    Resolver una apelación de moderación
// @route   PUT /api/admin/moderation/appeals/:id
// @access  Private/Admin
exports.resolveModerationAppeal = async (req, res) => {
    try {
        const { status, adminResponse, resetStrikes, clearSuspension } = req.body || {};

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido. Debe ser APPROVED o REJECTED.',
            });
        }

        const appeal = await ModerationAppeal.findById(req.params.id);
        if (!appeal) {
            return res.status(404).json({ success: false, message: 'Apelación no encontrada.' });
        }

        appeal.status = status;
        if (adminResponse && adminResponse.trim()) {
            appeal.adminResponse = adminResponse.trim();
        }

        await appeal.save();

        // Si se aprueba la apelación, aplicar acciones sobre el usuario
        if (status === 'APPROVED') {
            const user = await User.findById(appeal.user);
            if (user) {
                if (resetStrikes) {
                    user.strikes = 0;
                }
                if (clearSuspension) {
                    user.suspendedUntil = null;
                    user.suspensionReason = null;
                }
                await user.save();
            }
        }

        return res.status(200).json({ success: true, data: appeal });
    } catch (err) {
        console.error('resolveModerationAppeal ERROR:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al resolver la apelación.',
        });
    }
};

// @desc    Feed de moderación (reportes, ratings, eventos)
// @route   GET /api/admin/moderation/feed
// @access  Private/Admin
exports.getModerationFeed = async (req, res) => {
    try {
        const { keyword, user, category, type, from, to, reason, moderationAction } = req.query || {};

        console.log('🔍 getModerationFeed - Query params:', { keyword, user, category, type, from, to, reason, moderationAction });

        const dateFilter = {};
        if (from) dateFilter.$gte = new Date(from);
        if (to) dateFilter.$lte = new Date(to);

        const baseFilter = {};
        if (Object.keys(dateFilter).length) {
            baseFilter.createdAt = dateFilter;
        }
        
        // Agregar filtro por type (categoría de reporte) si se proporciona
        if (type) {
            baseFilter.type = type;
            console.log('🔍 Filtering reports by type:', type);
        }
        
        // Agregar filtro por reason si se proporciona (backward compatibility)
        if (reason) {
            baseFilter.reason = reason;
            console.log('🔍 Filtering reports by reason:', reason);
        }
        
        // Agregar filtro por moderationAction si se proporciona
        if (moderationAction) {
            baseFilter.moderationAction = moderationAction;
            console.log('🔍 Filtering reports by moderationAction:', moderationAction);
        }

        // Determinar qué tipos de documentos incluir (solo reportes si se filtra por type de reporte)
        const filters = {
            includeReports: true, // Siempre incluir reportes
            includeRatings: false, // No incluir ratings en este filtro
            includeEvents: false, // No incluir events en este filtro
        };

        const regexKeyword = keyword ? new RegExp(keyword, 'i') : null;
        const regexUser = user ? new RegExp(user, 'i') : null;
        const regexCategory = category ? new RegExp(category, 'i') : null;

        const items = [];

        if (filters.includeReports) {
            const reportDocs = await Report.find(baseFilter)
                .populate('user', 'username')
                .populate('place', 'name category')
                .sort('-createdAt');
            
            console.log('📊 Reports found with filter:', reportDocs.length);

            for (const r of reportDocs) {
                if (!r.user || !r.place) continue;
                if (regexKeyword && !regexKeyword.test(r.description || '')) continue;
                if (regexUser && !regexUser.test(r.user.username || '')) continue;
                if (regexCategory && !regexCategory.test(r.place.category || '')) continue;

                items.push({
                    _id: r._id,
                    type: 'report',
                    category: r.place.category || r.type || 'General',
                    summary: r.description || '',
                    username: r.user.username || 'Anónimo',
                    userId: r.user._id,
                    placeName: r.place.name,
                    createdAt: r.createdAt,
                    status: r.verified
                        ? 'verified'
                        : (r.is_moderated ? 'moderated' : 'pending'),
                });
            }
        }

        if (filters.includeRatings) {
            const ratingDocs = await Rating.find(baseFilter)
                .populate('user', 'username')
                .populate('place', 'name category')
                .sort('-createdAt');

            for (const rt of ratingDocs) {
                if (!rt.user || !rt.place) continue;
                if (regexKeyword && !regexKeyword.test(rt.comment || '')) continue;
                if (regexUser && !regexUser.test(rt.user.username || '')) continue;
                if (regexCategory && !regexCategory.test(rt.place.category || '')) continue;

                items.push({
                    _id: rt._id,
                    type: 'rating',
                    category: rt.place.category || 'General',
                    summary: rt.comment || '',
                    username: rt.user.username || 'Anónimo',
                    userId: rt.user._id,
                    placeName: rt.place.name,
                    createdAt: rt.createdAt,
                    status: rt.hidden ? 'hidden' : (rt.is_moderated ? 'moderated' : 'pending'),
                });
            }
        }

        if (filters.includeEvents) {
            const eventDocs = await Event.find(baseFilter)
                .populate('user', 'username')
                .populate('place', 'name category')
                .sort('-createdAt');

            for (const ev of eventDocs) {
                if (!ev.user || !ev.place) continue;
                if (regexKeyword && !regexKeyword.test(ev.title || ev.description || '')) continue;
                if (regexUser && !regexUser.test(ev.user.username || '')) continue;
                if (regexCategory && !regexCategory.test(ev.place.category || '')) continue;

                items.push({
                    _id: ev._id,
                    type: 'event',
                    category: ev.place.category || 'Evento',
                    summary: ev.title || ev.description || '',
                    username: ev.user.username || 'Anónimo',
                    userId: ev.user._id,
                    placeName: ev.place.name,
                    createdAt: ev.createdAt,
                    status: 'pending',
                });
            }
        }

        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.status(200).json({ success: true, data: items });
    } catch (err) {
        console.error('Error en getModerationFeed:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener feed de moderación',
        });
    }
};

// @desc    Moderar un reporte (marcar como moderado / verificado)
// @route   PUT /api/admin/reports/:id/moderate
// @access  Private/Admin
exports.moderateReport = async (req, res) => {
    try {
        const { is_moderated, verified, moderationAction, note } = req.body || {};
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: `Reporte no encontrado con ID ${req.params.id}`,
            });
        }

        const validActions = ['PENDING', 'APPROVED', 'HIDDEN', 'DELETED', 'USER_BANNED'];

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

        // Compat: aceptar payload viejo (verified/is_moderated)
        if (typeof is_moderated === 'boolean') {
            report.is_moderated = is_moderated;
        } else {
            report.is_moderated = true;
        }

        if (typeof verified === 'boolean') {
            report.verified = verified;
            if (verified) {
                report.moderationAction = 'APPROVED';
            } else {
                report.moderationAction = report.moderationAction || 'PENDING';
            }
        }

        // Nuevo flujo: moderationAction explícita
        if (moderationAction) {
            const action = String(moderationAction).toUpperCase();
            if (!validActions.includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Acción de moderación inválida',
                });
            }

            // Efectos sobre contenido (no destructivos)
            if (report.contentType === 'USER' && action === 'USER_BANNED') {
                await User.findByIdAndUpdate(
                    report.contentId,
                    { isBanned: true, banReason: note || 'Baneado por moderación de reporte' },
                    { new: true }
                );
            }

            if (report.contentType === 'REVIEW') {
                if (action === 'APPROVED') {
                    await Rating.findByIdAndUpdate(report.contentId, { hidden: false, is_moderated: true }, { new: true });
                }
                if (action === 'HIDDEN' || action === 'DELETED') {
                    await Rating.findByIdAndUpdate(report.contentId, { hidden: true, is_moderated: true }, { new: true });
                }
            }

            if (report.contentType === 'COMMENT') {
                if (action === 'APPROVED') {
                    await setCommentHidden(report.contentId, false);
                }
                if (action === 'HIDDEN' || action === 'DELETED') {
                    await setCommentHidden(report.contentId, true);
                }
            }

            report.moderationAction = action;
            report.moderatedBy = req.user?.id;
            report.moderatedAt = new Date();
        }

        await report.save();

        return res.status(200).json({ success: true, data: report });
    } catch (err) {
        console.error('Error en moderateReport:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al moderar el reporte',
        });
    }
};

// @desc    Verificar / desverificar lugar
// @route   PUT /api/admin/places/:id/verify
// @access  Private/Admin
exports.verifyPlace = async (req, res) => {
    try {
        const { verified } = req.body || {};
        const place = await Place.findByIdAndUpdate(
            req.params.id,
            { verified: verified === false ? false : true },
            { new: true }
        );

        if (!place) {
            return res.status(404).json({
                success: false,
                message: `Lugar no encontrado con ID ${req.params.id}`,
            });
        }

        return res.status(200).json({ success: true, data: place });
    } catch (err) {
        console.error('Error en verifyPlace:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar verificación del lugar',
        });
    }
};

// @desc    Crear lugar (admin)
// @route   POST /api/admin/places
// @access  Private/Admin
exports.createPlace = async (req, res) => {
    try {
        const { name, category, description, address, latitude, longitude } = req.body || {};

        if (!name || !category || typeof latitude === 'undefined' || typeof longitude === 'undefined') {
            return res.status(400).json({
                success: false,
                message: 'Nombre, categoría, latitud y longitud son obligatorios',
            });
        }

        const place = await Place.create({
            name,
            category,
            description: description || '',
            address: address || '',
            coordinates: {
                type: 'Point',
                coordinates: [Number(longitude), Number(latitude)],
            },
            source: 'Community',
            adminCreated: true,
        });

        return res.status(201).json({ success: true, data: place });
    } catch (err) {
        console.error('Error en createPlace:', err);
        return res.status(500).json({ success: false, message: 'Error al crear lugar' });
    }
};

// @desc    Actualizar lugar (admin)
// @route   PUT /api/admin/places/:id
// @access  Private/Admin
exports.updatePlace = async (req, res) => {
    try {
        const { name, category, description, address, latitude, longitude } = req.body || {};

        const place = await Place.findById(req.params.id);
        if (!place) {
            return res.status(404).json({
                success: false,
                message: `Lugar no encontrado con ID ${req.params.id}`,
            });
        }

        if (typeof name === 'string' && name.trim()) place.name = name.trim();
        if (typeof category === 'string' && category.trim()) place.category = category.trim();
        if (typeof description === 'string') place.description = description;
        if (typeof address === 'string') place.address = address;

        if (typeof latitude !== 'undefined' && typeof longitude !== 'undefined') {
            place.coordinates = {
                type: 'Point',
                coordinates: [Number(longitude), Number(latitude)],
            };
        }

        await place.save();

        return res.status(200).json({ success: true, data: place });
    } catch (err) {
        console.error('Error en updatePlace:', err);
        return res.status(500).json({ success: false, message: 'Error al actualizar lugar' });
    }
};

// @desc    Moderar un rating/comentario
// @route   PUT /api/admin/ratings/:id/moderate
// @access  Private/Admin
exports.moderateRating = async (req, res) => {
    try {
        const { remove } = req.body;
        const rating = await Rating.findById(req.params.id);

        if (!rating) {
            return res.status(404).json({ success: false, message: `Rating no encontrado con ID ${req.params.id}` });
        }

        if (remove) {
            const placeId = rating.place;
            await rating.deleteOne();
            try {
                await recalcPlaceRatingForAdmin(placeId);
            } catch (aggErr) {
                console.error('Error al recalcular rating del lugar tras eliminar rating:', aggErr);
            }
            return res.status(200).json({ success: true, message: 'Rating eliminado.' });
        }

        rating.is_moderated = true;
        rating.hidden = true;
        await rating.save();

        res.status(200).json({ success: true, data: rating });
    } catch (err) {
        console.error('Error en moderateRating:', err);
        res.status(500).json({ success: false, message: 'Error al moderar el rating' });
    }
};

exports.moderateReportComment = async (req, res) => {
    try {
        const { action } = req.body || {};
        const comment = await ReportComment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ success: false, message: `Comentario de reporte no encontrado con ID ${req.params.id}` });
        }

        if (action === 'hide') comment.hidden = true;
        if (action === 'unhide') comment.hidden = false;
        if (action === 'censor') comment.censored = true;
        if (action === 'uncensor') comment.censored = false;

        await comment.save();

        res.status(200).json({ success: true, data: comment });
    } catch (err) {
        console.error('Error en moderateReportComment:', err);
        res.status(500).json({ success: false, message: 'Error al moderar comentario de reporte' });
    }
};

exports.moderateRatingComment = async (req, res) => {
    try {
        const { action } = req.body || {};
        const comment = await RatingComment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ success: false, message: `Comentario de rating no encontrado con ID ${req.params.id}` });
        }

        if (action === 'hide') comment.hidden = true;
        if (action === 'unhide') comment.hidden = false;
        if (action === 'censor') comment.censored = true;
        if (action === 'uncensor') comment.censored = false;

        await comment.save();

        res.status(200).json({ success: true, data: comment });
    } catch (err) {
        console.error('Error en moderateRatingComment:', err);
        res.status(500).json({ success: false, message: 'Error al moderar comentario de rating' });
    }
};

exports.updateUserEmail = async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email) {
            return res.status(400).json({ success: false, message: 'Nuevo email es obligatorio' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { email },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: `Usuario no encontrado con ID ${req.params.id}` });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        console.error('Error en updateUserEmail:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar email del usuario' });
    }
};

exports.adminResetPassword = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: `Usuario no encontrado con ID ${req.params.id}` });
        }

        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        const resetUrl = `${process.env.BASE_URL}/resetpassword?token=${resetToken}`;
        const message = `Un administrador ha iniciado un restablecimiento de contraseña de tu cuenta BEDIC. Restablece tu contraseña aquí: ${resetUrl}`;

        try {
            await sendEmail({ email: user.email, subject: 'BEDIC: Restablecer Contraseña', message });
        } catch (mailErr) {
            console.error('Error al enviar email en adminResetPassword:', mailErr);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ success: false, message: 'No se pudo enviar email de restablecimiento.' });
        }

        res.status(200).json({ success: true, data: 'Email de restablecimiento enviado.' });
    } catch (err) {
        console.error('Error en adminResetPassword:', err);
        res.status(500).json({ success: false, message: 'Error al iniciar restablecimiento de contraseña' });
    }
};

exports.exportOverviewStatsCsv = async (req, res) => {
    try {
        const createdFilter = buildCreatedAtFilter(req.query || {});

        const [totalUsers, totalPlaces, totalReports, totalRatings] = await Promise.all([
            User.countDocuments(createdFilter),
            Place.countDocuments(createdFilter),
            Report.countDocuments(createdFilter),
            Rating.countDocuments(createdFilter),
        ]);

        const rows = [
            ['metric', 'value'],
            ['totalUsers', totalUsers],
            ['totalPlaces', totalPlaces],
            ['totalReports', totalReports],
            ['totalRatings', totalRatings],
        ];

        const csv = rows.map((r) => r.join(',')).join('\n');
        res.header('Content-Type', 'text/csv');
        res.attachment('overview-stats.csv');
        res.status(200).send(csv);
    } catch (err) {
        console.error('Error en exportOverviewStatsCsv:', err);
        res.status(500).json({ success: false, message: 'Error al exportar métricas generales' });
    }
};

// ---------------------------------------------------------------------------
// SEGURIDAD ADICIONAL: PIN DE ADMIN (6 DÍGITOS, CADUCIDAD MENSUAL)
// ---------------------------------------------------------------------------

// @desc    Obtener estado del PIN de admin para el usuario actual
// @route   GET /api/admin/pin/status
// @access  Private/Admin
exports.getAdminPinStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('adminPinHash adminPinExpiresAt role');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const now = new Date();
        const hasPin = !!user.adminPinHash;
        const expiresAt = user.adminPinExpiresAt || null;
        const expired = !expiresAt || expiresAt <= now;

        return res.status(200).json({
            success: true,
            data: { hasPin, expiresAt, expired },
        });
    } catch (err) {
        console.error('getAdminPinStatus ERROR:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener estado del PIN de admin' });
    }
};

// @desc    Crear o actualizar PIN de admin (6 dígitos)
// @route   POST /api/admin/pin
// @access  Private/Admin
exports.setAdminPin = async (req, res) => {
    try {
        const { pin } = req.body || {};

        if (!pin || !/^\d{6}$/.test(pin)) {
            return res.status(400).json({
                success: false,
                message: 'El PIN debe tener exactamente 6 dígitos numéricos.',
            });
        }

        const user = await User.findById(req.user.id).select('adminPinHash adminPinExpiresAt role');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const now = new Date();
        if (user.adminPinHash && user.adminPinExpiresAt && user.adminPinExpiresAt > now) {
            return res.status(403).json({
                success: false,
                message:
                    'Tu PIN actual sigue vigente. Para cambiarlo antes de que expire, usa la opción de restablecer PIN (verificación por correo).',
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(pin, salt);

        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // ~30 días

        user.adminPinHash = hash;
        user.adminPinExpiresAt = expiresAt;
        await user.save({ validateBeforeSave: false });

        return res.status(200).json({
            success: true,
            data: { expiresAt },
        });
    } catch (err) {
        console.error('setAdminPin ERROR:', err);
        return res.status(500).json({ success: false, message: 'Error al configurar el PIN de admin' });
    }
};

// @desc    Verificar PIN de admin
// @route   POST /api/admin/pin/verify
// @access  Private/Admin
exports.verifyAdminPin = async (req, res) => {
    try {
        const { pin } = req.body || {};

        if (!pin || !/^\d{6}$/.test(pin)) {
            return res.status(400).json({
                success: false,
                message: 'PIN inválido. Debe tener 6 dígitos.',
            });
        }

        const user = await User.findById(req.user.id).select('adminPinHash adminPinExpiresAt role');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        if (!user.adminPinHash) {
            return res.status(400).json({
                success: false,
                message: 'Aún no has configurado un PIN de administrador.',
            });
        }

        const now = new Date();
        if (!user.adminPinExpiresAt || user.adminPinExpiresAt <= now) {
            return res.status(403).json({
                success: false,
                expired: true,
                message: 'Tu PIN ha vencido. Debes configurar uno nuevo.',
            });
        }

        const isMatch = await bcrypt.compare(pin, user.adminPinHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'PIN incorrecto.',
            });
        }

        return res.status(200).json({
            success: true,
            data: { verified: true, expiresAt: user.adminPinExpiresAt },
        });
    } catch (err) {
        console.error('verifyAdminPin ERROR:', err);
        return res.status(500).json({ success: false, message: 'Error al verificar el PIN de admin' });
    }
};

// @desc    Solicitar código para restablecer PIN (se envía al correo)
// @route   POST /api/admin/pin/reset-request
// @access  Private/Admin
exports.requestAdminPinReset = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('email adminPinResetToken adminPinResetExpiresAt');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashed = crypto.createHash('sha256').update(code).digest('hex');

        user.adminPinResetToken = hashed;
        user.adminPinResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        await user.save({ validateBeforeSave: false });

        const message = `Has solicitado restablecer tu PIN de administrador BEDIC. Tu código es: ${code}. Tiene una validez de 15 minutos.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'BEDIC: Código para restablecer PIN de administración',
                message,
            });
        } catch (mailErr) {
            console.error('Error al enviar email en requestAdminPinReset:', mailErr);
            return res.status(500).json({
                success: false,
                message: 'No se pudo enviar el código de restablecimiento. Intenta más tarde.',
            });
        }

        return res.status(200).json({
            success: true,
            data: 'Código de restablecimiento enviado a tu correo.',
        });
    } catch (err) {
        console.error('requestAdminPinReset ERROR:', err);
        return res.status(500).json({ success: false, message: 'Error al solicitar restablecimiento de PIN' });
    }
};

// @desc    Confirmar restablecimiento de PIN con código enviado por correo
// @route   POST /api/admin/pin/reset-confirm
// @access  Private/Admin
exports.confirmAdminPinReset = async (req, res) => {
    try {
        const { code, newPin } = req.body || {};

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ success: false, message: 'Código de verificación requerido.' });
        }
        if (!newPin || !/^\d{6}$/.test(newPin)) {
            return res.status(400).json({
                success: false,
                message: 'El nuevo PIN debe tener exactamente 6 dígitos numéricos.',
            });
        }

        const user = await User.findById(req.user.id).select(
            'adminPinResetToken adminPinResetExpiresAt adminPinHash adminPinExpiresAt'
        );
        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        if (!user.adminPinResetToken || !user.adminPinResetExpiresAt) {
            return res.status(400).json({
                success: false,
                message: 'No hay una solicitud de restablecimiento activa.',
            });
        }

        const now = new Date();
        if (user.adminPinResetExpiresAt <= now) {
            return res.status(403).json({
                success: false,
                message: 'El código de restablecimiento ha expirado. Solicita uno nuevo.',
            });
        }

        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
        if (hashedCode !== user.adminPinResetToken) {
            return res.status(401).json({ success: false, message: 'Código de verificación incorrecto.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPin, salt);

        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // ~30 días

        user.adminPinHash = hash;
        user.adminPinExpiresAt = expiresAt;
        user.adminPinResetToken = undefined;
        user.adminPinResetExpiresAt = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(200).json({
            success: true,
            data: { expiresAt },
        });
    } catch (err) {
        console.error('confirmAdminPinReset ERROR:', err);
        return res.status(500).json({ success: false, message: 'Error al confirmar restablecimiento de PIN' });
    }
};

// @desc    Silenciar usuario
// @route   POST /api/admin/users/:id/mute
// @access  Private/Admin
exports.muteUser = async (req, res) => {
    try {
        const { days, hours, reason } = req.body || {};
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: `Usuario no encontrado con ID ${req.params.id}` });
        }

        const until = new Date();
        if (typeof hours === 'number' && !Number.isNaN(hours)) {
            until.setTime(until.getTime() + hours * 60 * 60 * 1000);
        } else {
            const daysNumber = typeof days === 'number' && !Number.isNaN(days) ? days : 1;
            until.setDate(until.getDate() + daysNumber);
        }

        user.muted_until = until;
        user.mute_reason = reason;
        await user.save();

        res.status(200).json({ success: true, data: { id: user._id, muted_until: until, reason } });
    } catch (err) {
        console.error('Error en muteUser:', err);
        res.status(500).json({ success: false, message: 'Error al silenciar usuario' });
    }
};

// @desc    Banear / desbanear usuario
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
exports.banUser = async (req, res) => {
    try {
        const { isBanned, reason } = req.body || {};
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: `Usuario no encontrado con ID ${req.params.id}` });
        }

        const shouldBan = typeof isBanned === 'boolean' ? isBanned : true;
        user.isBanned = shouldBan;
        user.banReason = shouldBan ? (reason || 'Violación de términos de servicio') : undefined;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                isBanned: user.isBanned,
                banReason: user.banReason,
            },
        });
    } catch (err) {
        console.error('Error en banUser:', err);
        res.status(500).json({ success: false, message: 'Error al banear usuario' });
    }
};

// @desc    Listar solicitudes de verificación
// @route   GET /api/admin/verifications
// @access  Private/Admin
exports.getVerifications = async (req, res) => {
    try {
        const list = await VerificationRequest.find()
            .populate('user', 'username')
            .sort('-createdAt');

        res.status(200).json({ success: true, data: list });
    } catch (err) {
        console.error('Error en getVerifications:', err);
        res.status(500).json({ success: false, message: 'Error al obtener verificaciones' });
    }
};

// @desc    Aprobar / rechazar verificación
// @route   PUT /api/admin/verifications/:id
// @access  Private/Admin
exports.updateVerification = async (req, res) => {
    try {
        const { approve } = req.body;
        const request = await VerificationRequest.findById(req.params.id).populate('user');

        if (!request) {
            return res.status(404).json({ success: false, message: `Solicitud no encontrada con ID ${req.params.id}` });
        }

        request.status = approve ? 'approved' : 'rejected';
        await request.save();

        if (approve && request.user) {
            request.user.is_verified = true;
            if (!request.user.badges.includes(request.badge)) {
                request.user.badges.push(request.badge);
            }
            await request.user.save();
        }

        res.status(200).json({ success: true, data: request });
    } catch (err) {
        console.error('Error en updateVerification:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar verificación' });
    }
};

// @desc    Crear anuncio
// @route   POST /api/admin/announcements
// @access  Private/Admin
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, message, categories, pinned } = req.body;
        const ann = await Announcement.create({
            title,
            message,
            categories: categories || [],
            pinned: !!pinned,
        });

        try {
            const tokens = await DeviceToken.find().distinct('deviceToken');
            if (tokens && tokens.length) {
                await FCMClient.sendToMany(tokens, title, message, {
                    type: 'announcement',
                    announcementId: ann._id.toString(),
                });
            }
        } catch (notifyErr) {
            console.error('Error al enviar notificaciones de anuncio:', notifyErr);
        }

        res.status(201).json({ success: true, data: ann });
    } catch (err) {
        console.error('Error en createAnnouncement:', err);
        res.status(500).json({ success: false, message: 'Error al crear anuncio' });
    }
};

// @desc    Subir foto de lugar con marca de agua
// @route   POST /api/admin/places/:id/photos
// @access  Private/Admin
// Espera: multipart/form-data con campo `file` y opcional `type` = 'cover' | 'gallery'
exports.uploadPlacePhoto = async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);
        if (!place) {
            return res.status(404).json({ success: false, message: `Lugar no encontrado con ID ${req.params.id}` });
        }

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ success: false, message: 'No se envió archivo' });
        }

        const username = (req.user && (req.user.username || req.user.name)) || 'bedic';

        let processedBuffer = req.file.buffer;
        try {
            processedBuffer = await addWatermark(req.file.buffer, username);
        } catch (wmError) {
            console.error('addWatermark falló, usando imagen original:', wmError);
        }

        const uploadsDir = path.join(__dirname, '..', 'uploads', 'places');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const ext = '.png';
        const filename = `${place._id}-${Date.now()}${ext}`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, processedBuffer);

        const urlPath = `/uploads/places/${filename}`;
        place.officialImages = place.officialImages || [];
        // Insertar nuevas fotos oficiales al inicio para que tengan prioridad
        place.officialImages.unshift(urlPath);
        await place.save();

        res.status(201).json({ success: true, data: { url: urlPath, placeId: place._id } });
    } catch (err) {
        console.error('Error en uploadPlacePhoto:', err);
        res.status(500).json({ success: false, message: 'Error al subir foto del lugar' });
    }
};

// @desc    Eliminar una foto oficial de un lugar
// @route   DELETE /api/admin/places/:id/photos
// @access  Private/Admin
// Body: { photoUrl: string }
exports.deletePlacePhoto = async (req, res) => {
    try {
        const { photoUrl } = req.body || {};
        if (!photoUrl) {
            return res.status(400).json({ success: false, message: 'photoUrl es obligatorio' });
        }

        const place = await Place.findById(req.params.id);
        if (!place) {
            return res.status(404).json({ success: false, message: `Lugar no encontrado con ID ${req.params.id}` });
        }

        place.officialImages = place.officialImages || [];
        const originalCount = place.officialImages.length;
        place.officialImages = place.officialImages.filter((url) => url !== photoUrl);

        if (place.officialImages.length === originalCount) {
            return res.status(404).json({ success: false, message: 'La foto indicada no está registrada en este lugar' });
        }

        // Intentar borrar el archivo físico si existe
        try {
            const relativePath = photoUrl.startsWith('/') ? photoUrl.slice(1) : photoUrl;
            const filePath = path.join(__dirname, '..', relativePath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (fsError) {
            console.error('No se pudo eliminar el archivo físico de la foto:', fsError);
        }

        await place.save();

        res.status(200).json({ success: true, data: { placeId: place._id, officialImages: place.officialImages } });
    } catch (err) {
        console.error('Error en deletePlacePhoto:', err);
        res.status(500).json({ success: false, message: 'Error al eliminar foto del lugar' });
    }
};