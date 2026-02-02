const User = require('../models/User');

const XP_REWARDS = {
    REPORT_SUBMIT: 10,
    REPORT_VERIFIED: 50,
    RATING_SUBMIT: 5,
    POSITIVE_COMMENT: 2,
    VERIFY_ACCOUNT: 200 // Bonus por verificación (teléfono/social)
};

/**
 * Incrementa la XP del usuario y actualiza su nivel/badges.
 * @param {string} userId - ID del usuario.
 * @param {string} type - Tipo de contribución (clave de XP_REWARDS).
 */
exports.addContributionXP = async (userId, type) => {
    const user = await User.findById(userId);

    if (!user) return;

    const xpToAdd = XP_REWARDS[type] || 0;
    
    if (xpToAdd > 0) {
        user.reputation_score += xpToAdd;

        // El hook pre-save en el modelo User calculará el nuevo nivel
        await user.save();
        
        console.log(`XP Añadida a ${user.username} por ${type}: +${xpToAdd}. Nivel actual: ${user.current_level}`);
    }
};

/**
 * Asigna la insignia de verificación y otorga XP.
 * @param {string} userId - ID del usuario.
 */
exports.verifyUserAccount = async (userId) => {
    const user = await User.findById(userId);

    if (!user || user.is_verified) return;

    user.is_verified = true;
    
    if (!user.badges.includes('verificado')) {
        user.badges.push('verificado');
        user.reputation_score += XP_REWARDS.VERIFY_ACCOUNT;
    }

    await user.save();
    console.log(`Usuario ${user.username} verificado y recibió bonus XP. Nivel: ${user.current_level}`);
};