// controllers/appeal.controller.js

const ModerationAppeal = require('../models/ModerationAppeal');
const User = require('../models/User');

// ---------------------------------------------------------------------------
// Crear apelación (usuario autenticado)
// ---------------------------------------------------------------------------
exports.createAppeal = async (req, res) => {
  try {
    const { reason, type } = req.body || {};

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'La razón de la apelación es obligatoria.',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado.',
      });
    }

    // Evitar múltiples apelaciones pendientes a la vez
    const existingPending = await ModerationAppeal.findOne({
      user: user._id,
      status: 'PENDING',
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una apelación pendiente.',
      });
    }

    let inferredType = type;
    if (!inferredType) {
      // Si el usuario está suspendido actualmente, asumimos apelación de suspensión
      if (user.suspendedUntil && user.suspendedUntil > new Date()) {
        inferredType = 'SUSPENSION';
      } else {
        inferredType = 'STRIKES';
      }
    }

    const appeal = await ModerationAppeal.create({
      user: user._id,
      type: inferredType,
      reason: reason.trim(),
      strikesAtCreation: user.strikes || 0,
      suspendedUntilAtCreation: user.suspendedUntil || null,
    });

    return res.status(201).json({ success: true, data: appeal });
  } catch (err) {
    console.error('createAppeal ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al crear la apelación.',
    });
  }
};

// ---------------------------------------------------------------------------
// Listar apelaciones del usuario autenticado
// ---------------------------------------------------------------------------
exports.getMyAppeals = async (req, res) => {
  try {
    const appeals = await ModerationAppeal.find({ user: req.user.id })
      .sort('-createdAt')
      .lean();

    return res.status(200).json({ success: true, data: appeals });
  } catch (err) {
    console.error('getMyAppeals ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al cargar tus apelaciones.',
    });
  }
};
