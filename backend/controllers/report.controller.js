// controllers/report.controller.js
const Report = require("../models/Report");
const User = require("../models/User");
const ReportComment = require("../models/ReportComment");
const Rating = require("../models/Rating");
const RatingComment = require("../models/RatingComment");

// ---------------------------------------------------------------------------
// SISTEMA DE XP / NIVELES
// ---------------------------------------------------------------------------
async function addUserPoints(userId, points) {
    const user = await User.findById(userId);
    if (!user) return;

    user.reputation_score = (user.reputation_score || 0) + points;
    user.calculateLevel();
    await user.save();
}

// ---------------------------------------------------------------------------
// MARCAR CONTENIDO REPORTADO EN EL USUARIO OBJETIVO
// ---------------------------------------------------------------------------
async function incrementReportedContentForTarget(contentType, contentId, reporterId) {
    try {
        if (!contentType || !contentId) return;

        let targetUserId = null;

        if (contentType === 'USER') {
            targetUserId = contentId;
        } else if (contentType === 'REVIEW') {
            const rating = await Rating.findById(contentId).select('user');
            if (rating) targetUserId = rating.user;
        } else if (contentType === 'COMMENT') {
            let comment = await RatingComment.findById(contentId).select('user');
            if (!comment) {
                comment = await ReportComment.findById(contentId).select('user');
            }
            if (comment) targetUserId = comment.user;
        }

        if (!targetUserId) return;

        // No incrementar reportes contra uno mismo
        if (reporterId && targetUserId.toString() === reporterId.toString()) {
            return;
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) return;

        targetUser.reportedContent = (targetUser.reportedContent || 0) + 1;
        await targetUser.save();
    } catch (err) {
        console.error('incrementReportedContentForTarget error:', err);
    }
}

// ---------------------------------------------------------------------------
// CREAR REPORTE
// ---------------------------------------------------------------------------
exports.createReport = async (req, res) => {
    try {
        const { place, type, description, photo_url, contentType, contentId, reason } = req.body;

        // Compatibilidad hacia atrás: el frontend actual envía solo place, type, description, photo_url
        if ((!place && !contentId) || !description) {
            return res.status(400).json({ success: false, message: "Faltan datos obligatorios." });
        }

        // Resolver tipo de contenido y contenido asociado
        const resolvedContentType = contentType || 'PLACE';
        const resolvedContentId = contentId || place;

        // Mapear tipo libre a razón estándar cuando no se envía explícita
        const validReasons = [
            'SPAM',
            'HARASSMENT',
            'HATE_SPEECH',
            'VIOLENCE',
            'SEXUAL_CONTENT',
            'FALSE_INFO',
            'COPYRIGHT',
            'OTHER',
        ];

        let resolvedReason = reason;
        if (!resolvedReason || !validReasons.includes(resolvedReason)) {
            const legacy = String(type || '').trim().toLowerCase();
            const mapLegacyToReason = (v) => {
                if (!v) return null;
                if (v.includes('spam')) return 'SPAM';
                if (v.includes('acoso') || v.includes('harass')) return 'HARASSMENT';
                if (v.includes('odio') || v.includes('hate')) return 'HATE_SPEECH';
                if (v.includes('viol')) return 'VIOLENCE';
                if (v.includes('sex')) return 'SEXUAL_CONTENT';
                if (v.includes('fals') || v.includes('fake') || v.includes('info')) return 'FALSE_INFO';
                if (v.includes('copy') || v.includes('autor') || v.includes('copyright')) return 'COPYRIGHT';
                if (v === 'other') return 'OTHER';
                return null;
            };

            // Si no viene reason o no es válido, inferimos desde 'type' legado; si no, OTHER.
            resolvedReason = mapLegacyToReason(legacy) || 'OTHER';
        }

        const newReport = await Report.create({
            contentType: resolvedContentType,
            contentId: resolvedContentId,
            // Seguimos guardando place para compatibilidad con el frontend existente
            place: resolvedContentType === 'PLACE' ? resolvedContentId : place,
            user: req.user.id,
            reason: resolvedReason,
            type,
            description,
            photo_url,
        });

        // Operaciones secundarias: no deben romper la creación del reporte
        try {
            await addUserPoints(req.user.id, 5); // XP por reporte
        } catch (xpErr) {
            console.error('addUserPoints error (createReport):', xpErr);
        }

        try {
            // Intentar marcar al usuario dueño del contenido reportado
            await incrementReportedContentForTarget(resolvedContentType, resolvedContentId, req.user.id);
        } catch (targetErr) {
            console.error('incrementReportedContentForTarget error:', targetErr);
        }

        res.status(201).json({ success: true, data: newReport });

    } catch (err) {
        console.error("createReport ERROR:", err);
        res.status(500).json({ success: false, message: "Error interno al crear el reporte." });
    }
};

// ---------------------------------------------------------------------------
// LISTA DE REPORTES POR LUGAR
// ---------------------------------------------------------------------------
exports.getReportsByPlace = async (req, res) => {
    try {
        const reports = await Report.find({ place: req.params.placeId })
            .populate("user", "username name current_level badges role avatar_url corporate_color")
            .lean();

        const reportIds = reports.map((r) => r._id);

        const countsAgg = await ReportComment.aggregate([
            { $match: { report: { $in: reportIds } } },
            { $group: { _id: "$report", count: { $sum: 1 } } },
        ]);

        const countsMap = {};
        countsAgg.forEach((c) => {
            countsMap[c._id.toString()] = c.count;
        });

        const enriched = reports.map((r) => ({
            ...r,
            commentsCount: countsMap[r._id.toString()] || 0,
        }));

        res.status(200).json({ success: true, data: enriched });

    } catch (err) {
        console.error("getReportsByPlace ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// ---------------------------------------------------------------------------
// LISTA DE REPORTES CREADOS POR UN USUARIO
// ---------------------------------------------------------------------------
exports.getReportsByUser = async (req, res) => {
    try {
        const reports = await Report.find({ user: req.params.userId })
            .populate("user", "username name current_level badges role avatar_url corporate_color")
            .lean();

        const reportIds = reports.map((r) => r._id);

        const countsAgg = await ReportComment.aggregate([
            { $match: { report: { $in: reportIds } } },
            { $group: { _id: "$report", count: { $sum: 1 } } },
        ]);

        const countsMap = {};
        countsAgg.forEach((c) => {
            countsMap[c._id.toString()] = c.count;
        });

        const enriched = reports.map((r) => ({
            ...r,
            commentsCount: countsMap[r._id.toString()] || 0,
        }));

        res.status(200).json({ success: true, data: enriched });

    } catch (err) {
        console.error("getReportsByUser ERROR:", err);
        res.status(500).json({ success: false, message: 'Error al cargar reportes del usuario' });
    }
};

// ---------------------------------------------------------------------------
// OBTENER TODOS LOS REPORTES (para admin)
// ---------------------------------------------------------------------------
exports.getAllReports = async (req, res) => {
    try {
        const { status, contentType, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (status) query.status = status;
        if (contentType) query.contentType = contentType;

        const reports = await Report.find(query)
            .populate("user", "username name avatar_url")
            .populate("moderatedBy", "username name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Report.countDocuments(query);

        res.status(200).json({ 
            success: true, 
            data: reports,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error("getAllReports ERROR:", err);
        res.status(500).json({ success: false, message: 'Error al cargar reportes' });
    }
};

// ---------------------------------------------------------------------------
// OBTENER REPORTE POR ID
// ---------------------------------------------------------------------------
exports.getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate("user", "username name avatar_url email")
            .populate("moderatedBy", "username name")
            .populate("actions.takenBy", "username name");

        if (!report) {
            return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
        }

        res.status(200).json({ success: true, data: report });
    } catch (err) {
        console.error("getReportById ERROR:", err);
        res.status(500).json({ success: false, message: 'Error al cargar reporte' });
    }
};

// ---------------------------------------------------------------------------
// TOMAR ACCIÓN MANUAL EN UN REPORTE (Admin)
// ---------------------------------------------------------------------------
exports.takeReportAction = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { actionType, reason, duration, moderationNotes } = req.body;

        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
        }

        // Validar tipo de acción
        const validActions = ['CONTENT_HIDDEN', 'CONTENT_DELETED', 'USER_WARNED', 'USER_MUTED', 'USER_BANNED', 'CONTENT_WARNING_ADDED'];
        if (!validActions.includes(actionType)) {
            return res.status(400).json({ success: false, message: 'Tipo de acción inválido' });
        }

        // Agregar acción
        report.actions.push({
            type: actionType,
            takenBy: req.user.id,
            reason,
            duration
        });

        // Actualizar estado
        report.status = 'RESOLVED';
        report.moderatedBy = req.user.id;
        report.moderatedAt = new Date();
        report.moderationNotes = moderationNotes;

        // Ejecutar acciones según el tipo
        if (actionType === 'USER_BANNED') {
            const targetUser = await User.findById(report.contentId);
            if (targetUser) {
                targetUser.isBanned = true;
                targetUser.banReason = reason;
                await targetUser.save();
            }
        } else if (actionType === 'USER_MUTED') {
            const targetUser = await User.findById(report.contentId);
            if (targetUser && duration) {
                const muteUntil = new Date();
                muteUntil.setHours(muteUntil.getHours() + duration);
                targetUser.muted_until = muteUntil;
                targetUser.mute_reason = reason;
                await targetUser.save();
            }
        } else if (actionType === 'CONTENT_DELETED') {
            // Marcar contenido como eliminado según su tipo
            if (report.contentType === 'REVIEW') {
                await Rating.findByIdAndUpdate(report.contentId, { deleted: true });
            } else if (report.contentType === 'COMMENT') {
                await RatingComment.findByIdAndUpdate(report.contentId, { deleted: true });
            }
        }

        // Notificar al usuario reportado
        report.userNotified = true;
        report.notificationSentAt = new Date();

        await report.save();

        res.status(200).json({ 
            success: true, 
            message: 'Acción tomada exitosamente',
            data: report 
        });
    } catch (err) {
        console.error("takeReportAction ERROR:", err);
        res.status(500).json({ success: false, message: 'Error al tomar acción' });
    }
};

// ---------------------------------------------------------------------------
// ACTUALIZAR ESTADO DE REPORTE
// ---------------------------------------------------------------------------
exports.updateReportStatus = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status } = req.body;

        const validStatuses = ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Estado inválido' });
        }

        const report = await Report.findByIdAndUpdate(
            reportId,
            { status },
            { new: true }
        ).populate("user", "username name");

        res.status(200).json({ success: true, data: report });
    } catch (err) {
        console.error("updateReportStatus ERROR:", err);
        res.status(500).json({ success: false, message: 'Error al actualizar estado' });
    }
};

// ---------------------------------------------------------------------------
// OBTENER REPORTES DEL USUARIO ACTUAL (para seguimiento)
// ---------------------------------------------------------------------------
exports.getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({ user: req.user.id })
            .populate("moderatedBy", "username name")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: reports });
    } catch (err) {
        console.error("getMyReports ERROR:", err);
        res.status(500).json({ success: false, message: 'Error al cargar tus reportes' });
    }
};

// ---------------------------------------------------------------------------
// UPVOTE
// ---------------------------------------------------------------------------
exports.upvoteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ success: false });

        const userId = req.user.id;

        // Remover downvote si existía
        report.downvotes = report.downvotes.filter(
          (id) => id.toString() !== userId
        );

        // Agregar upvote si no existía
        const alreadyUpvoted = report.upvotes.some(
          (id) => id.toString() === userId
        );
        if (!alreadyUpvoted) {
            report.upvotes.push(userId);
            // XP para el autor (no debe romper el endpoint si falla)
            try {
                await addUserPoints(report.user, 1);
            } catch (xpErr) {
                console.error('addUserPoints error (upvoteReport):', xpErr);
            }
        }

        await report.save();
        res.status(200).json({ success: true, data: report });

    } catch (err) {
        console.error("upvoteReport ERROR:", err);
        res.status(500).json({ success: false, message: 'Error al procesar el voto positivo.' });
    }
};

// ---------------------------------------------------------------------------
// DOWNVOTE
// ---------------------------------------------------------------------------
exports.downvoteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ success: false });

        const userId = req.user.id;

        // Remover upvote si existía
        report.upvotes = report.upvotes.filter(
          (id) => id.toString() !== userId
        );

        // Agregar downvote si no existía
        const alreadyDownvoted = report.downvotes.some(
          (id) => id.toString() === userId
        );
        if (!alreadyDownvoted) {
            report.downvotes.push(userId);
        }

        await report.save();
        res.status(200).json({ success: true, data: report });

    } catch (err) {
        console.error("downvoteReport ERROR:", err);
        res.status(500).json({ success: false, message: 'Error al procesar el voto negativo.' });
    }
};

// ---------------------------------------------------------------------------
// COMENTARIOS DE REPORTES
// ---------------------------------------------------------------------------

// GET /api/reports/:id/comments
exports.getCommentsForReport = async (req, res) => {
    try {
        const sort = req.query.sort || 'newest';

        let comments = await ReportComment.find({ report: req.params.id })
            .populate('user', 'username name avatar_url')
            .lean();

        comments = comments.map((c) => ({
            ...c,
            upvotesCount: (c.upvotes || []).length,
            downvotesCount: (c.downvotes || []).length,
        }));

        if (sort === 'oldest') {
            comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sort === 'most_upvotes') {
            comments.sort((a, b) => {
                const diff = (b.upvotesCount || 0) - (a.upvotesCount || 0);
                if (diff !== 0) return diff;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        } else if (sort === 'most_downvotes') {
            comments.sort((a, b) => {
                const diff = (b.downvotesCount || 0) - (a.downvotesCount || 0);
                if (diff !== 0) return diff;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        } else {
            // newest
            comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        res.status(200).json({ success: true, data: comments });
    } catch (err) {
        console.error('getCommentsForReport ERROR:', err);
        res.status(500).json({ success: false, message: 'Error al cargar comentarios del reporte' });
    }
};

// POST /api/reports/:id/comments
exports.addCommentToReport = async (req, res) => {
    try {
        const { text, parentCommentId, parentComment } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'Texto de comentario requerido.' });
        }

        const parent = parentCommentId || parentComment || null;

        const comment = await ReportComment.create({
            report: req.params.id,
            user: req.user.id,
            text: text.trim(),
            parentComment: parent,
        });

        const populated = await comment.populate('user', 'username name avatar_url');

        res.status(201).json({ success: true, data: populated });
    } catch (err) {
        console.error('addCommentToReport ERROR:', err);
        res.status(500).json({ success: false, message: 'Error al agregar comentario al reporte' });
    }
};

// Votos en comentarios de reportes
exports.upvoteReportComment = async (req, res) => {
    try {
        const comment = await ReportComment.findById(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
        }

        const userId = req.user.id;

        comment.downvotes = (comment.downvotes || []).filter(
          (id) => id.toString() !== userId
        );

        const alreadyUpvoted = (comment.upvotes || []).some(
          (id) => id.toString() === userId
        );
        if (!alreadyUpvoted) {
            comment.upvotes.push(userId);
        }

        await comment.save();
        const populated = await comment.populate('user', 'username name avatar_url');

        res.status(200).json({ success: true, data: populated });
    } catch (err) {
        console.error('upvoteReportComment ERROR:', err);
        res.status(500).json({ success: false, message: 'Error al votar comentario' });
    }
};

exports.downvoteReportComment = async (req, res) => {
    try {
        const comment = await ReportComment.findById(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
        }

        const userId = req.user.id;

        comment.upvotes = (comment.upvotes || []).filter(
          (id) => id.toString() !== userId
        );

        const alreadyDownvoted = (comment.downvotes || []).some(
          (id) => id.toString() === userId
        );
        if (!alreadyDownvoted) {
            comment.downvotes.push(userId);
        }

        await comment.save();
        const populated = await comment.populate('user', 'username name avatar_url');

        res.status(200).json({ success: true, data: populated });
    } catch (err) {
        console.error('downvoteReportComment ERROR:', err);
        res.status(500).json({ success: false, message: 'Error al votar comentario' });
    }
};
