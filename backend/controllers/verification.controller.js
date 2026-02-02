const verificationService = require('../services/verification.service');

/**
 * Controlador de Verificación para Administradores
 */

// Obtener lista de usuarios con estado de verificación
exports.getUsersVerificationList = async (req, res) => {
  try {
    const { verificationLevel, emailVerified, nameValidationStatus } = req.query;

    const filters = {};
    if (verificationLevel) filters.verificationLevel = verificationLevel;
    if (emailVerified !== undefined) filters.emailVerified = emailVerified === 'true';
    if (nameValidationStatus) filters.nameValidationStatus = nameValidationStatus;

    const result = await verificationService.getUsersVerificationStatus(filters);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.status(200).json({
      success: true,
      count: result.count,
      data: result.users
    });
  } catch (error) {
    console.error('Error obteniendo lista de verificación:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener estado de verificación de un usuario específico
exports.getUserVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await verificationService.getVerificationStatus(userId);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.status(200).json({
      success: true,
      data: result.verification
    });
  } catch (error) {
    console.error('Error obteniendo estado de verificación:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verificar manualmente a un usuario (admin)
exports.manuallyVerifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const result = await verificationService.manuallyVerifyUser(userId, reason);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        userId: result.user._id,
        verificationLevel: result.user.verification.verificationLevel,
        verificationHistory: result.user.verification.verificationHistory
      }
    });
  } catch (error) {
    console.error('Error verificando usuario manualmente:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Rechazar verificación de un usuario (admin)
exports.rejectUserVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const result = await verificationService.rejectUserVerification(userId, reason);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        userId: result.user._id,
        verificationLevel: result.user.verification.verificationLevel,
        verificationHistory: result.user.verification.verificationHistory
      }
    });
  } catch (error) {
    console.error('Error rechazando verificación:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener estadísticas de verificación
exports.getVerificationStats = async (req, res) => {
  try {
    const User = require('../models/User');

    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          verifiedUsers: {
            $sum: {
              $cond: [{ $eq: ['$verification.verificationLevel', 'verified'] }, 1, 0]
            }
          },
          partiallyVerifiedUsers: {
            $sum: {
              $cond: [{ $eq: ['$verification.verificationLevel', 'partially_verified'] }, 1, 0]
            }
          },
          unverifiedUsers: {
            $sum: {
              $cond: [{ $eq: ['$verification.verificationLevel', 'unverified'] }, 1, 0]
            }
          },
          emailVerifiedUsers: {
            $sum: {
              $cond: ['$verification.emailVerified', 1, 0]
            }
          },
          nameValidatedUsers: {
            $sum: {
              $cond: [{ $eq: ['$verification.nameValidationStatus', 'valid'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const data = stats[0] || {
      totalUsers: 0,
      verifiedUsers: 0,
      partiallyVerifiedUsers: 0,
      unverifiedUsers: 0,
      emailVerifiedUsers: 0,
      nameValidatedUsers: 0
    };

    res.status(200).json({
      success: true,
      data: {
        ...data,
        verificationRate: data.totalUsers > 0 ? Math.round((data.verifiedUsers / data.totalUsers) * 100) : 0,
        emailVerificationRate: data.totalUsers > 0 ? Math.round((data.emailVerifiedUsers / data.totalUsers) * 100) : 0,
        nameValidationRate: data.totalUsers > 0 ? Math.round((data.nameValidatedUsers / data.totalUsers) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
