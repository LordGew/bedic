// backend/routes/moderation.routes.js
const express = require('express');
const router = express.Router();
const ModerationLog = require('../models/ModerationLog');
const User = require('../models/User');
const advancedModerationService = require('../services/advancedModerationService');
const { verifyToken, verifyRole } = require('../middleware/auth');

/**
 * GET /api/moderation/logs
 * Obtiene el historial de moderación (solo admins)
 */
router.get('/logs', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      actionType,
      severity,
      startDate,
      endDate,
      automatedOnly = true
    } = req.query;

    const filter = {};

    if (automatedOnly === 'true') {
      filter.automatedAction = true;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (actionType) {
      filter.actionType = actionType;
    }

    if (severity) {
      filter.severity = severity;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const logs = await ModerationLog.find(filter)
      .populate('userId', 'username email avatar')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ModerationLog.countDocuments(filter);

    res.json({
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching moderation logs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/moderation/logs/:id
 * Obtiene detalles de un log de moderación
 */
router.get('/logs/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const log = await ModerationLog.findById(req.params.id)
      .populate('userId', 'username email avatar')
      .populate('reviewedBy', 'username');

    if (!log) {
      return res.status(404).json({ error: 'Moderation log not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Error fetching moderation log:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/moderation/user/:userId/violations
 * Obtiene el historial de violaciones de un usuario
 */
router.get('/user/:userId/violations', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const violations = await advancedModerationService.getUserViolationHistory(
      req.params.userId,
      parseInt(days)
    );

    res.json(violations);
  } catch (error) {
    console.error('Error fetching user violations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/moderation/stats
 * Obtiene estadísticas de moderación
 */
router.get('/stats', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const stats = await advancedModerationService.getModerationStats(parseInt(days));

    res.json(stats);
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/moderation/review/:logId
 * Revisa manualmente un log de moderación
 */
router.post('/review/:logId', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { action, notes } = req.body;

    const log = await ModerationLog.findByIdAndUpdate(
      req.params.logId,
      {
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        reviewNotes: notes,
        'actionDetails.flaggedForReview': false
      },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({ error: 'Moderation log not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Error reviewing moderation log:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/moderation/appeal/:logId
 * Permite a un usuario apelar una acción de moderación
 */
router.post('/appeal/:logId', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;

    const log = await ModerationLog.findById(req.params.logId);

    if (!log) {
      return res.status(404).json({ error: 'Moderation log not found' });
    }

    if (log.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!log.appealable) {
      return res.status(400).json({ error: 'This action cannot be appealed' });
    }

    if (log.appealed) {
      return res.status(400).json({ error: 'This action has already been appealed' });
    }

    const updated = await ModerationLog.findByIdAndUpdate(
      req.params.logId,
      {
        appealed: true,
        appealedAt: new Date(),
        appealReason: reason,
        appealStatus: 'PENDING'
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.error('Error appealing moderation action:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/moderation/appeal/:logId/resolve
 * Resuelve una apelación (solo admins)
 */
router.put('/appeal/:logId/resolve', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const log = await ModerationLog.findByIdAndUpdate(
      req.params.logId,
      {
        appealStatus: status,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        reviewNotes: notes
      },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({ error: 'Moderation log not found' });
    }

    // Si la apelación fue aprobada, revertir la sanción
    if (status === 'APPROVED') {
      const user = await User.findById(log.userId);
      if (user) {
        if (log.actionDetails.mutedUntil) {
          user.mutedUntil = null;
        }
        if (log.actionDetails.banPermanent) {
          user.isBanned = false;
          user.banReason = null;
        }
        await user.save();
      }
    }

    res.json(log);
  } catch (error) {
    console.error('Error resolving appeal:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/moderation/dashboard
 * Obtiene datos para el dashboard de moderación
 */
router.get('/dashboard', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysInt = parseInt(days);
    const startDate = new Date(Date.now() - daysInt * 24 * 60 * 60 * 1000);

    // Estadísticas generales
    const stats = await advancedModerationService.getModerationStats(daysInt);

    // Acciones por tipo
    const actionsByType = await ModerationLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          automatedAction: true
        }
      },
      {
        $group: {
          _id: '$actionType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Usuarios más reportados
    const topViolators = await ModerationLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          automatedAction: true
        }
      },
      {
        $group: {
          _id: '$userId',
          violations: { $sum: 1 },
          userName: { $first: '$userName' },
          userEmail: { $first: '$userEmail' }
        }
      },
      { $sort: { violations: -1 } },
      { $limit: 10 }
    ]);

    // Razones más comunes
    const topReasons = await ModerationLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          automatedAction: true
        }
      },
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Apelaciones pendientes
    const pendingAppeals = await ModerationLog.countDocuments({
      appealed: true,
      appealStatus: 'PENDING'
    });

    // Logs pendientes de revisión
    const pendingReview = await ModerationLog.countDocuments({
      'actionDetails.flaggedForReview': true,
      reviewedBy: null
    });

    res.json({
      stats,
      actionsByType,
      topViolators,
      topReasons,
      pendingAppeals,
      pendingReview,
      period: {
        days: daysInt,
        startDate,
        endDate: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching moderation dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
