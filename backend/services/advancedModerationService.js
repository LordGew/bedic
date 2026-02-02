// backend/services/advancedModerationService.js
const ModerationLog = require('../models/ModerationLog');
const User = require('../models/User');
const contentModerationService = require('./contentModerationService');
const badWordsDict = require('../config/badWordsDict');

/**
 * Servicio avanzado de moderación automática
 * Incluye: detección de malas palabras, spam, toxicidad, sanciones progresivas
 */

/**
 * Obtiene el historial de infracciones del usuario
 */
async function getUserViolationHistory(userId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const violations = await ModerationLog.find({
    userId,
    createdAt: { $gte: startDate },
    automatedAction: true
  }).sort({ createdAt: -1 });

  return {
    totalViolations: violations.length,
    byType: {
      badWords: violations.filter(v => v.reason.includes('BAD_WORDS')).length,
      spam: violations.filter(v => v.reason.includes('SPAM')).length,
      toxicity: violations.filter(v => v.reason.includes('TOXICITY')).length
    },
    bySeverity: {
      leve: violations.filter(v => v.severity === 'LEVE').length,
      moderado: violations.filter(v => v.severity === 'MODERADO').length,
      severo: violations.filter(v => v.severity === 'SEVERO').length
    },
    violations
  };
}

/**
 * Calcula el nivel de sanción basado en historial
 */
function calculateSanctionLevel(violationHistory, currentSeverity) {
  const totalViolations = violationHistory.totalViolations;
  const severeCounts = violationHistory.bySeverity.severo;
  
  // Matriz de decisión
  if (severeCounts >= 3) {
    return { level: 'BAN', duration: null, permanent: true };
  }
  
  if (totalViolations >= 10) {
    return { level: 'PERMANENT_MUTE', duration: null, permanent: true };
  }
  
  if (totalViolations >= 7) {
    return { level: 'LONG_MUTE', duration: 7 * 24 * 60 * 60 * 1000 }; // 7 días
  }
  
  if (totalViolations >= 5) {
    return { level: 'MEDIUM_MUTE', duration: 3 * 24 * 60 * 60 * 1000 }; // 3 días
  }
  
  if (totalViolations >= 3) {
    return { level: 'SHORT_MUTE', duration: 24 * 60 * 60 * 1000 }; // 24 horas
  }
  
  if (currentSeverity === 'SEVERO') {
    return { level: 'SHORT_MUTE', duration: 24 * 60 * 60 * 1000 };
  }
  
  return { level: 'FLAG_FOR_REVIEW', duration: null };
}

/**
 * Registra una acción de moderación en el log
 */
async function logModerationAction(data) {
  const log = new ModerationLog({
    actionType: data.actionType,
    reason: data.reason,
    severity: data.severity,
    contentType: data.contentType,
    contentId: data.contentId,
    contentText: data.contentText,
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    detectedIssues: data.detectedIssues,
    toxicityScore: data.toxicityScore,
    spamScore: data.spamScore,
    trustScore: data.trustScore,
    userStats: data.userStats,
    actionDetails: data.actionDetails,
    automatedAction: data.automatedAction !== false,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent
  });

  return await log.save();
}

/**
 * Aplica sanciones al usuario
 */
async function applySanction(userId, sanctionLevel, reason, moderationLogId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const updateData = {};

  switch (sanctionLevel.level) {
    case 'SHORT_MUTE':
      updateData.mutedUntil = new Date(Date.now() + sanctionLevel.duration);
      updateData.strikes = (user.strikes || 0) + 1;
      break;

    case 'MEDIUM_MUTE':
      updateData.mutedUntil = new Date(Date.now() + sanctionLevel.duration);
      updateData.strikes = (user.strikes || 0) + 2;
      break;

    case 'LONG_MUTE':
      updateData.mutedUntil = new Date(Date.now() + sanctionLevel.duration);
      updateData.strikes = (user.strikes || 0) + 3;
      break;

    case 'PERMANENT_MUTE':
      updateData.mutedUntil = new Date('2099-12-31');
      updateData.strikes = (user.strikes || 0) + 4;
      break;

    case 'BAN':
      updateData.isBanned = true;
      updateData.banReason = reason;
      updateData.bannedAt = new Date();
      updateData.strikes = (user.strikes || 0) + 5;
      break;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

  // Actualizar el log con la sanción aplicada
  if (moderationLogId) {
    await ModerationLog.findByIdAndUpdate(moderationLogId, {
      'actionDetails.mutedUntil': updateData.mutedUntil,
      'actionDetails.banPermanent': sanctionLevel.permanent
    });
  }

  return updatedUser;
}

/**
 * Moderación completa de contenido con sanciones progresivas
 */
async function moderateContentAdvanced(data) {
  const {
    text,
    userId,
    contentType,
    contentId,
    language = 'es',
    ipAddress,
    userAgent
  } = data;

  try {
    // 1. Obtener información del usuario
    const user = await User.findById(userId);
    if (!user) {
      return {
        approved: false,
        reason: 'USER_NOT_FOUND',
        action: 'REJECT'
      };
    }

    // 2. Verificar si el usuario está baneado o silenciado
    if (user.isBanned) {
      return {
        approved: false,
        reason: 'USER_BANNED',
        action: 'REJECT',
        message: 'Tu cuenta ha sido suspendida'
      };
    }

    if (user.mutedUntil && new Date(user.mutedUntil) > new Date()) {
      return {
        approved: false,
        reason: 'USER_MUTED',
        action: 'REJECT',
        message: `Tu cuenta está silenciada hasta ${new Date(user.mutedUntil).toLocaleString()}`
      };
    }

    // 3. Obtener historial de violaciones
    const violationHistory = await getUserViolationHistory(userId, 30);

    // 4. Análisis de contenido
    const badWordCheck = contentModerationService.detectBadWords(text, language);
    const spamCheck = contentModerationService.detectSpam(text);
    const toxicityScores = await contentModerationService.analyzeToxicity(text, language);

    // 5. Calcular scores
    const trustScore = contentModerationService.calculateTrustScore(user);
    const maxToxicity = Math.max(
      toxicityScores.toxicity,
      toxicityScores.severe_toxicity,
      toxicityScores.insult,
      toxicityScores.threat
    );

    // 6. Determinar severidad
    let severity = 'LEVE';
    let detectedIssues = [];
    let reason = 'CLEAN_CONTENT';
    let shouldReject = false;
    let shouldMute = false;

    if (badWordCheck.detected) {
      severity = badWordCheck.level;
      detectedIssues.push('bad_word');
      reason = `BAD_WORDS_${badWordCheck.level}`;
      
      if (severity === 'SEVERO') {
        shouldReject = true;
      }
    }

    if (spamCheck.isSpam) {
      severity = 'MODERADO';
      detectedIssues.push(...spamCheck.indicators);
      reason = 'SPAM_DETECTED';
      shouldReject = true;
    }

    if (maxToxicity >= 0.85) {
      severity = 'SEVERO';
      detectedIssues.push('high_toxicity');
      reason = 'HIGH_TOXICITY';
      shouldReject = true;
    } else if (maxToxicity >= 0.65) {
      severity = 'MODERADO';
      detectedIssues.push('moderate_toxicity');
      reason = 'MODERATE_TOXICITY';
    }

    // 7. Calcular sanción basada en historial
    const sanctionLevel = calculateSanctionLevel(violationHistory, severity);

    // 8. Crear log de moderación
    const logData = {
      actionType: shouldReject ? 'COMMENT_HIDDEN' : 'CONTENT_FLAGGED',
      reason,
      severity,
      contentType,
      contentId,
      contentText: text.substring(0, 1000),
      userId: user._id,
      userName: user.username,
      userEmail: user.email,
      detectedIssues,
      toxicityScore: maxToxicity,
      spamScore: spamCheck.score,
      trustScore,
      userStats: {
        totalComments: user.commentCount || 0,
        deletedComments: user.deletedComments || 0,
        strikes: user.strikes || 0,
        accountAge: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        reputationLevel: contentModerationService.getModerationLevel(trustScore)
      },
      actionDetails: {
        commentHidden: shouldReject,
        flaggedForReview: !shouldReject && severity !== 'LEVE',
        reviewPriority: severity === 'SEVERO' ? 'CRITICAL' : severity === 'MODERADO' ? 'HIGH' : 'MEDIUM'
      },
      ipAddress,
      userAgent
    };

    const moderationLog = await logModerationAction(logData);

    // 9. Aplicar sanciones si es necesario
    if (shouldReject && sanctionLevel.level !== 'FLAG_FOR_REVIEW') {
      await applySanction(userId, sanctionLevel, reason, moderationLog._id);
    }

    // 10. Respuesta
    if (shouldReject) {
      return {
        approved: false,
        reason,
        action: 'REJECT',
        severity,
        message: 'Tu comentario viola nuestras políticas de comunidad',
        moderationLogId: moderationLog._id,
        sanctionApplied: sanctionLevel.level !== 'FLAG_FOR_REVIEW' ? sanctionLevel.level : null
      };
    }

    if (severity !== 'LEVE' || sanctionLevel.level === 'FLAG_FOR_REVIEW') {
      return {
        approved: true,
        reason,
        action: 'FLAG_FOR_REVIEW',
        severity,
        requiresReview: true,
        moderationLogId: moderationLog._id,
        message: 'Tu comentario ha sido marcado para revisión'
      };
    }

    return {
      approved: true,
      reason: 'CLEAN_CONTENT',
      action: 'APPROVE',
      severity: 'LEVE',
      moderationLogId: moderationLog._id
    };

  } catch (error) {
    console.error('Error in moderateContentAdvanced:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de moderación para el dashboard
 */
async function getModerationStats(days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const stats = await ModerationLog.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        automatedAction: true
      }
    },
    {
      $group: {
        _id: null,
        totalActions: { $sum: 1 },
        byActionType: {
          $push: {
            type: '$actionType',
            count: 1
          }
        },
        bySeverity: {
          $push: {
            severity: '$severity',
            count: 1
          }
        },
        byReason: {
          $push: {
            reason: '$reason',
            count: 1
          }
        },
        uniqueUsers: { $addToSet: '$userId' },
        avgToxicityScore: { $avg: '$toxicityScore' },
        avgSpamScore: { $avg: '$spamScore' }
      }
    }
  ]);

  return stats[0] || {
    totalActions: 0,
    byActionType: [],
    bySeverity: [],
    byReason: [],
    uniqueUsers: [],
    avgToxicityScore: 0,
    avgSpamScore: 0
  };
}

module.exports = {
  getUserViolationHistory,
  calculateSanctionLevel,
  logModerationAction,
  applySanction,
  moderateContentAdvanced,
  getModerationStats
};
