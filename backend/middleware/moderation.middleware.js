// backend/middleware/moderation.middleware.js
const { moderateContent, calculateTrustScore, getModerationLevel } = require('../services/contentModerationService');
const { moderateContentAdvanced } = require('../services/advancedModerationService');
const User = require('../models/User');

/**
 * Middleware para moderar contenido antes de guardarlo
 */
async function moderateBeforeSave(req, res, next) {
  try {
    // Si es una solicitud multipart (con archivos), saltar moderación por ahora
    if (req.is('multipart')) {
      return next();
    }
    
    const { text, comment, content, description, review, title } = req.body;
    const contentText = text || comment || content || description || review || title;
    
    if (!contentText) {
      return next(); // No hay contenido para moderar
    }
    
    // Obtener usuario y calcular trust score
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const now = new Date();

    // Verificar si está baneado permanentemente
    if (user.isBanned) {
      return res.status(403).json({
        error: 'Tu cuenta ha sido baneada por incumplir las normas de la comunidad',
        reason: user.banReason,
      });
    }

    // Verificar si está suspendido (modo antiguo)
    if (user.suspendedUntil && user.suspendedUntil > now) {
      return res.status(403).json({
        error: 'Tu cuenta está suspendida',
        suspendedUntil: user.suspendedUntil,
        reason: user.suspensionReason
      });
    }

    // Verificar si está silenciado temporalmente
    if (user.muted_until && user.muted_until > now) {
      return res.status(403).json({
        error: 'Tu cuenta está silenciada temporalmente',
        muted_until: user.muted_until,
        reason: user.mute_reason,
      });
    }
    
    const trustScore = calculateTrustScore(user);
    const moderationLevel = getModerationLevel(trustScore);

    // Usar el servicio avanzado de moderación con sanciones progresivas
    const language = user.language || 'es';
    const contentType = req.body.contentType || 'comment';
    const contentId = req.body.contentId || null;
    
    const result = await moderateContentAdvanced(
      contentText,
      user.id,
      language,
      contentType,
      contentId
    );

    // Si la moderación rechaza el contenido
    if (!result.approved) {
      // Actualizar usuario con información de violación
      if (result.sanction) {
        if (result.sanction.type === 'MUTE') {
          user.muted_until = result.sanction.until;
          user.mute_reason = result.sanction.reason;
        } else if (result.sanction.type === 'BAN') {
          user.isBanned = true;
          user.banReason = result.sanction.reason;
        }
        await user.save();
      }

      // Retornar error según el tipo de sanción
      if (result.sanction && result.sanction.type === 'BAN') {
        return res.status(403).json({
          error: 'Tu cuenta ha sido baneada por incumplir las normas de la comunidad',
          reason: result.sanction.reason,
          moderationLogId: result.logId,
        });
      }

      if (result.sanction && result.sanction.type === 'MUTE') {
        return res.status(403).json({
          error: 'Tu cuenta ha sido silenciada temporalmente',
          muted_until: result.sanction.until,
          reason: result.sanction.reason,
          moderationLogId: result.logId,
        });
      }

      return res.status(400).json({
        error: result.message || 'Contenido rechazado por moderación',
        reason: result.reason,
        severity: result.severity,
        moderationLogId: result.logId,
      });
    }
    
    // Contenido aprobado - almacenar información de moderación
    req.moderationResult = {
      ...result,
      trustScore,
      moderationLevel,
      logId: result.logId
    };
    
    // Si requiere revisión, marcarlo
    if (result.requiresReview) {
      req.body.requiresReview = true;
      req.body.moderationScore = result.toxicityScore;
      req.body.moderationLogId = result.logId;
    }
    
    next();
  } catch (error) {
    console.error('Error en middleware de moderación:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
}

/**
 * Middleware para verificar rate limiting
 */
const rateLimitStore = new Map();

function rateLimit(action, limits) {
  return (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const userId = req.user.id;
    const key = `${action}:${userId}`;
    const now = Date.now();
    
    // Obtener o crear registro
    let record = rateLimitStore.get(key);
    if (!record) {
      record = { count: 0, resetAt: now + 60000 }; // 1 minuto
      rateLimitStore.set(key, record);
    }
    
    // Reset si pasó el tiempo
    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + 60000;
    }
    
    // Incrementar contador
    record.count++;
    
    // Verificar límite
    if (record.count > limits.perMinute) {
      return res.status(429).json({
        error: 'Demasiadas solicitudes',
        retryAfter: Math.ceil((record.resetAt - now) / 1000)
      });
    }
    
    next();
  };
}

// Limpiar rate limit store cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt + 300000) { // 5 minutos después del reset
      rateLimitStore.delete(key);
    }
  }
}, 300000);

module.exports = {
  moderateBeforeSave,
  rateLimit
};
