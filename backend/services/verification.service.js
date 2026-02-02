const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('./email.service');

/**
 * Servicio de Verificación de Usuarios (Nivel 1, 2, 4)
 */

// ========== NIVEL 1: VERIFICACIÓN DE EMAIL ==========

/**
 * Genera un token OTP de 6 dígitos para verificación de email
 */
const generateEmailOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Genera un token de verificación de email
 */
const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Envía token de verificación de email usando Nodemailer + Gmail
 */
const sendEmailVerificationToken = async (user, token) => {
  try {
    const result = await emailService.sendEmailVerificationToken(user, token);
    return result;
  } catch (error) {
    console.error('Error enviando token de verificación:', error);
    return false;
  }
};

/**
 * Verifica el token de email del usuario
 */
const verifyEmailToken = async (userId, token) => {
  try {
    const user = await User.findById(userId).select('+verification.emailVerificationToken');
    
    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    if (user.verification.emailVerified) {
      return { success: false, message: 'Email ya verificado' };
    }

    if (!user.verification.emailVerificationToken) {
      return { success: false, message: 'No hay token de verificación pendiente' };
    }

    if (user.verification.emailVerificationExpires < new Date()) {
      return { success: false, message: 'Token expirado' };
    }

    if (user.verification.emailVerificationToken !== token) {
      return { success: false, message: 'Token inválido' };
    }

    // Marcar email como verificado
    user.verification.emailVerified = true;
    user.verification.emailVerifiedAt = new Date();
    user.verification.emailVerificationToken = undefined;
    user.verification.emailVerificationExpires = undefined;

    // Agregar al historial
    user.verification.verificationHistory.push({
      level: 'email_verified',
      completedAt: new Date(),
      method: 'email'
    });

    // Actualizar nivel de verificación a "partially_verified"
    if (user.verification.verificationLevel === 'unverified') {
      user.verification.verificationLevel = 'partially_verified';
    }

    await user.save();

    return { success: true, message: 'Email verificado correctamente', user };
  } catch (error) {
    console.error('Error verificando email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Reenvía token de verificación de email
 */
const resendEmailVerificationToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    if (user.verification.emailVerified) {
      return { success: false, message: 'Email ya verificado' };
    }

    const token = generateEmailVerificationToken();
    user.verification.emailVerificationToken = token;
    user.verification.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await user.save();
    await sendEmailVerificationToken(user, token);

    return { success: true, message: 'Token reenviado al email' };
  } catch (error) {
    console.error('Error reenviando token:', error);
    return { success: false, message: error.message };
  }
};

// ========== NIVEL 2: VALIDACIÓN DE NOMBRE REAL ==========

/**
 * Valida si el nombre es un nombre real (no pseudónimo)
 * Reglas:
 * - Mínimo 2 palabras (nombre + apellido)
 * - Sin números
 * - Sin caracteres especiales excepto espacios y guiones
 * - Longitud mínima 5 caracteres
 */
const validateRealName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, reason: 'Nombre inválido' };
  }

  const trimmedName = name.trim();

  // Verificar longitud mínima
  if (trimmedName.length < 5) {
    return { valid: false, reason: 'El nombre debe tener al menos 5 caracteres' };
  }

  // Verificar que no contenga números
  if (/\d/.test(trimmedName)) {
    return { valid: false, reason: 'El nombre no puede contener números' };
  }

  // Verificar caracteres válidos (letras, espacios, guiones, acentos)
  if (!/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s\-']+$/.test(trimmedName)) {
    return { valid: false, reason: 'El nombre contiene caracteres no permitidos' };
  }

  // Verificar que tenga al menos 2 palabras
  const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
  if (words.length < 2) {
    return { valid: false, reason: 'El nombre debe contener al menos nombre y apellido' };
  }

  // Verificar que cada palabra tenga al menos 2 caracteres
  if (words.some(word => word.length < 2)) {
    return { valid: false, reason: 'Cada palabra del nombre debe tener al menos 2 caracteres' };
  }

  return { valid: true, reason: null };
};

/**
 * Valida el nombre durante el registro
 */
const validateNameOnRegistration = async (userId, name) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    const validation = validateRealName(name);

    user.verification.nameValidationStatus = validation.valid ? 'valid' : 'invalid';
    user.verification.nameValidatedAt = new Date();
    user.verification.nameValidationReason = validation.reason;

    if (validation.valid) {
      // Agregar al historial
      user.verification.verificationHistory.push({
        level: 'name_validated',
        completedAt: new Date(),
        method: 'name_validation'
      });
    }

    await user.save();

    return { success: true, valid: validation.valid, reason: validation.reason, user };
  } catch (error) {
    console.error('Error validando nombre:', error);
    return { success: false, message: error.message };
  }
};

// ========== NIVEL 4: SISTEMA DE REPUTACIÓN TEMPRANA ==========

/**
 * Incrementa el contador de acciones completadas
 * Si llega al límite, marca como verificado automáticamente
 */
const incrementActionCounter = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    // Solo aplica si el usuario no está completamente verificado
    if (user.verification.verificationLevel === 'verified') {
      return { success: true, message: 'Usuario ya verificado' };
    }

    user.verification.actionsCompleted = (user.verification.actionsCompleted || 0) + 1;

    // Verificar si alcanzó el límite de acciones
    if (
      user.verification.actionsCompleted >= user.verification.actionsToAutoVerify &&
      user.verification.emailVerified &&
      user.verification.nameValidationStatus === 'valid'
    ) {
      user.verification.verificationLevel = 'verified';
      user.verification.autoVerifiedAt = new Date();

      // Agregar al historial
      user.verification.verificationHistory.push({
        level: 'auto_verified',
        completedAt: new Date(),
        method: 'auto_reputation'
      });

      console.log(`✅ Usuario ${user.username} auto-verificado por reputación`);
    }

    await user.save();

    return {
      success: true,
      actionsCompleted: user.verification.actionsCompleted,
      actionsRequired: user.verification.actionsToAutoVerify,
      verificationLevel: user.verification.verificationLevel
    };
  } catch (error) {
    console.error('Error incrementando contador de acciones:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Obtiene el estado de verificación del usuario
 */
const getVerificationStatus = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    return {
      success: true,
      verification: {
        emailVerified: user.verification.emailVerified,
        emailVerifiedAt: user.verification.emailVerifiedAt,
        nameValidationStatus: user.verification.nameValidationStatus,
        nameValidatedAt: user.verification.nameValidatedAt,
        nameValidationReason: user.verification.nameValidationReason,
        verificationLevel: user.verification.verificationLevel,
        actionsCompleted: user.verification.actionsCompleted,
        actionsToAutoVerify: user.verification.actionsToAutoVerify,
        autoVerifiedAt: user.verification.autoVerifiedAt,
        verificationHistory: user.verification.verificationHistory
      }
    };
  } catch (error) {
    console.error('Error obteniendo estado de verificación:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Obtiene lista de usuarios con su estado de verificación (para admin)
 */
const getUsersVerificationStatus = async (filters = {}) => {
  try {
    const query = {};

    // Filtros opcionales
    if (filters.verificationLevel) {
      query['verification.verificationLevel'] = filters.verificationLevel;
    }

    if (filters.emailVerified !== undefined) {
      query['verification.emailVerified'] = filters.emailVerified;
    }

    if (filters.nameValidationStatus) {
      query['verification.nameValidationStatus'] = filters.nameValidationStatus;
    }

    const users = await User.find(query)
      .select('_id name username email verification.emailVerified verification.nameValidationStatus verification.verificationLevel verification.actionsCompleted verification.actionsToAutoVerify createdAt')
      .sort({ createdAt: -1 });

    return {
      success: true,
      count: users.length,
      users
    };
  } catch (error) {
    console.error('Error obteniendo usuarios para verificación:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Marca manualmente un usuario como verificado (admin)
 */
const manuallyVerifyUser = async (userId, reason = '') => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    user.verification.verificationLevel = 'verified';
    user.verification.autoVerifiedAt = new Date();

    user.verification.verificationHistory.push({
      level: 'manually_verified',
      completedAt: new Date(),
      method: 'admin_manual',
      reason
    });

    await user.save();

    return { success: true, message: 'Usuario verificado manualmente', user };
  } catch (error) {
    console.error('Error verificando usuario manualmente:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Rechaza la verificación de un usuario (admin)
 */
const rejectUserVerification = async (userId, reason = '') => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    user.verification.verificationLevel = 'unverified';
    user.verification.actionsCompleted = 0;

    user.verification.verificationHistory.push({
      level: 'verification_rejected',
      completedAt: new Date(),
      method: 'admin_rejection',
      reason
    });

    await user.save();

    return { success: true, message: 'Verificación rechazada', user };
  } catch (error) {
    console.error('Error rechazando verificación:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  // Nivel 1: Email
  generateEmailOTP,
  generateEmailVerificationToken,
  sendEmailVerificationToken,
  verifyEmailToken,
  resendEmailVerificationToken,

  // Nivel 2: Nombre
  validateRealName,
  validateNameOnRegistration,

  // Nivel 4: Reputación
  incrementActionCounter,
  getVerificationStatus,
  getUsersVerificationStatus,
  manuallyVerifyUser,
  rejectUserVerification
};
