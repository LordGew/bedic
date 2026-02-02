/**
 * Controlador de Insignias
 * Gestiona las insignias/medallas del usuario
 */

const User = require('../models/User');
const Badge = require('../models/Badge');

// Obtener todas las insignias disponibles
exports.getAllBadges = async (req, res) => {
    try {
        const badges = await Badge.find({ active: true })
            .sort({ rarity: -1, type: 1 });

        res.json({
            success: true,
            data: badges
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener insignias desbloqueadas del usuario
exports.getUserBadges = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        const user = await User.findById(userId)
            .populate('badges.badgeId');

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            success: true,
            data: {
                unlockedBadges: user.badges,
                selectedBadges: user.profileSettings.selectedBadges,
                totalBadges: user.badges.length
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Seleccionar insignias para mostrar en perfil
exports.selectBadges = async (req, res) => {
    try {
        const { badgeIds } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar que el usuario tiene todas estas insignias
        for (const badgeId of badgeIds) {
            const hasBadge = user.badges.find(b => b.badgeId.toString() === badgeId);
            if (!hasBadge) {
                return res.status(400).json({ error: `No tienes la insignia ${badgeId}` });
            }
        }

        user.profileSettings.selectedBadges = badgeIds;
        await user.save();

        const badges = await Badge.find({ _id: { $in: badgeIds } });
        res.json({
            success: true,
            message: 'Insignias seleccionadas',
            data: badges
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Desbloquear insignia (admin o automático)
exports.unlockBadge = async (req, res) => {
    try {
        const { userId, badgeId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const badge = await Badge.findById(badgeId);
        if (!badge) {
            return res.status(404).json({ error: 'Insignia no encontrada' });
        }

        // Verificar que no la tenga ya
        if (user.badges.find(b => b.badgeId.toString() === badgeId)) {
            return res.status(400).json({ error: 'El usuario ya tiene esta insignia' });
        }

        user.badges.push({
            badgeId: badgeId,
            unlockedAt: new Date()
        });

        // Dar recompensa
        user.reputation_score += badge.reward.xp;

        badge.totalUnlocked += 1;
        await badge.save();
        await user.save();

        res.json({
            success: true,
            message: 'Insignia desbloqueada',
            data: {
                badge,
                reward: badge.reward
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Verificar y desbloquear insignias automáticamente
exports.checkAndUnlockBadges = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        const badges = await Badge.find({ active: true });

        for (const badge of badges) {
            // Verificar si ya la tiene
            if (user.badges.find(b => b.badgeId.toString() === badge._id.toString())) {
                continue;
            }

            const conditions = badge.unlockConditions;
            let shouldUnlock = true;

            // Verificar todas las condiciones
            if (conditions.reportsMilestone > 0 && user.reportedContent < conditions.reportsMilestone) shouldUnlock = false;
            if (conditions.photosMilestone > 0 && user.photoCount < conditions.photosMilestone) shouldUnlock = false;
            if (conditions.ratingsMilestone > 0 && user.reviewCount < conditions.ratingsMilestone) shouldUnlock = false;
            if (conditions.commentsMilestone > 0 && user.helpfulVotes < conditions.commentsMilestone) shouldUnlock = false;
            if (conditions.usefulReports > 0 && user.helpfulVotes < conditions.usefulReports) shouldUnlock = false;
            if (conditions.successfulReferrals > 0 && user.referral.completedReferrals < conditions.successfulReferrals) shouldUnlock = false;
            if (conditions.minLevel > 0 && user.current_level < conditions.minLevel) shouldUnlock = false;
            if (conditions.minXP > 0 && user.reputation_score < conditions.minXP) shouldUnlock = false;

            if (shouldUnlock) {
                user.badges.push({
                    badgeId: badge._id,
                    unlockedAt: new Date()
                });
                badge.totalUnlocked += 1;
                await badge.save();
            }
        }

        await user.save();
    } catch (error) {
        console.error('Error checking badges:', error);
    }
};

// Obtener insignias por tipo
exports.getBadgesByType = async (req, res) => {
    try {
        const { type } = req.params;
        const badges = await Badge.find({ type, active: true })
            .sort({ rarity: -1 });

        res.json({
            success: true,
            data: badges
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear insignia (admin)
exports.createBadge = async (req, res) => {
    try {
        const { name, description, icon, image, type, rarity, unlockConditions, reward } = req.body;

        const badge = new Badge({
            name,
            description,
            icon,
            image,
            type,
            rarity,
            unlockConditions,
            reward
        });

        await badge.save();

        res.json({
            success: true,
            message: 'Insignia creada',
            data: badge
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener leaderboard de insignias
exports.getBadgeLeaderboard = async (req, res) => {
    try {
        const leaderboard = await User.find()
            .select('username avatar_url badges')
            .sort({ 'badges': -1 })
            .limit(10)
            .populate('badges.badgeId');

        res.json({
            success: true,
            data: leaderboard.map(user => ({
                username: user.username,
                avatar: user.avatar_url,
                badgeCount: user.badges.length,
                badges: user.badges
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = exports;
