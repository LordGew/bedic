/**
 * Controlador de Referidos
 * Gestiona el sistema de referidos, códigos y recompensas
 */

const User = require('../models/User');
const Referral = require('../models/Referral');
const Badge = require('../models/Badge');
const crypto = require('crypto');

// Crear o obtener código de referido para un usuario
exports.getOrCreateReferralCode = async (req, res) => {
    try {
        const userId = req.user.id;
        let referral = await Referral.findOne({ referrer: userId });

        if (!referral) {
            // Crear nuevo código de referido
            referral = new Referral({
                referrer: userId,
                rewards: {
                    perReferral: {
                        xp: 500,
                        coins: 100
                    }
                }
            });
            await referral.save();
        }

        res.json({
            success: true,
            data: {
                code: referral.code,
                referralUrl: referral.referralUrl,
                stats: referral.stats,
                description: referral.description
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener información del referido
exports.getReferralInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const referral = await Referral.findOne({ referrer: userId })
            .populate('referredUsers.userId', 'username avatar_url');

        if (!referral) {
            return res.status(404).json({ error: 'Código de referido no encontrado' });
        }

        res.json({
            success: true,
            data: {
                code: referral.code,
                referralUrl: referral.referralUrl,
                stats: referral.stats,
                referredUsers: referral.referredUsers,
                rewards: referral.rewards
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Usar código de referido al registrarse
exports.applyReferralCode = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        // Validar que el código existe
        const referral = await Referral.findOne({ code: code.toUpperCase() });
        if (!referral) {
            return res.status(404).json({ error: 'Código de referido inválido' });
        }

        // Validar que no sea el mismo usuario
        if (referral.referrer.toString() === userId) {
            return res.status(400).json({ error: 'No puedes usar tu propio código de referido' });
        }

        // Validar que no haya sido referido antes
        const user = await User.findById(userId);
        if (user.referral.referredBy) {
            return res.status(400).json({ error: 'Ya has sido referido anteriormente' });
        }

        // Agregar usuario a la lista de referidos
        const referredEntry = {
            userId: userId,
            status: 'pending'
        };

        referral.referredUsers.push(referredEntry);
        referral.stats.totalReferrals += 1;
        referral.stats.pendingReferrals += 1;
        await referral.save();

        // Actualizar usuario
        user.referral.referredBy = referral.referrer;
        await user.save();

        res.json({
            success: true,
            message: 'Código de referido aplicado exitosamente',
            data: {
                referrer: referral.referrer,
                code: referral.code
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Completar referido (cuando el usuario referido completa acciones)
exports.completeReferral = async (req, res) => {
    try {
        const { referredUserId } = req.body;
        const referrerId = req.user.id;

        // Obtener referral del usuario que refirió
        const referral = await Referral.findOne({ referrer: referrerId });
        if (!referral) {
            return res.status(404).json({ error: 'Código de referido no encontrado' });
        }

        // Encontrar el referido en la lista
        const referredEntry = referral.referredUsers.find(
            r => r.userId.toString() === referredUserId
        );

        if (!referredEntry) {
            return res.status(404).json({ error: 'Referido no encontrado' });
        }

        if (referredEntry.status === 'completed') {
            return res.status(400).json({ error: 'Este referido ya fue completado' });
        }

        // Marcar como completado
        referredEntry.status = 'completed';
        referredEntry.completedAt = new Date();
        referral.stats.completedReferrals += 1;
        referral.stats.pendingReferrals -= 1;

        // Dar recompensa al referidor
        const referrer = await User.findById(referrerId);
        referrer.reputation_score += referral.rewards.perReferral.xp;
        referrer.referral.completedReferrals += 1;
        referrer.referral.totalRewardsEarned += referral.rewards.perReferral.xp;
        await referrer.save();

        // Dar recompensa al referido
        const referred = await User.findById(referredUserId);
        referred.reputation_score += 250; // Recompensa menor para el referido
        await referred.save();

        // Verificar si se desbloqueó algún hito
        await checkReferralMilestones(referral, referrer);

        await referral.save();

        res.json({
            success: true,
            message: 'Referido completado',
            data: {
                referrerReward: referral.rewards.perReferral.xp,
                referredReward: 250
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Verificar hitos de referidos y desbloquear recompensas exclusivas
async function checkReferralMilestones(referral, referrer) {
    const completedCount = referral.stats.completedReferrals;
    const Achievement = require('../models/Achievement');
    const Title = require('../models/Title');

    // Verificar hitos estándar
    const milestones = [5, 10, 25, 50];
    for (const milestone of milestones) {
        if (completedCount === milestone) {
            const badge = await Badge.findOne({
                type: 'referral',
                'unlockConditions.successfulReferrals': milestone
            });

            if (badge && !referrer.badges.find(b => b.badgeId.toString() === badge._id.toString())) {
                referrer.badges.push({
                    badgeId: badge._id,
                    unlockedAt: new Date()
                });
                referrer.reputation_score += badge.reward.xp;
            }
        }
    }

    // Verificar recompensas exclusivas
    if (referral.rewards.exclusiveRewards && referral.rewards.exclusiveRewards.length > 0) {
        for (const exclusiveReward of referral.rewards.exclusiveRewards) {
            if (completedCount >= exclusiveReward.minReferrals) {
                switch (exclusiveReward.reward) {
                    case 'EXCLUSIVE_BADGE':
                        if (!referrer.badges.find(b => b.badgeId.toString() === exclusiveReward.rewardId.toString())) {
                            referrer.badges.push({
                                badgeId: exclusiveReward.rewardId,
                                unlockedAt: new Date()
                            });
                        }
                        break;

                    case 'EXCLUSIVE_TITLE':
                        if (!referrer.titles.find(t => t.titleId.toString() === exclusiveReward.rewardId.toString())) {
                            referrer.titles.push({
                                titleId: exclusiveReward.rewardId,
                                unlockedAt: new Date()
                            });
                        }
                        break;

                    case 'EXCLUSIVE_ACHIEVEMENT':
                        if (!referrer.achievements.find(a => a.achievementId.toString() === exclusiveReward.rewardId.toString())) {
                            referrer.achievements.push({
                                achievementId: exclusiveReward.rewardId,
                                unlockedAt: new Date(),
                                progress: 100
                            });
                        }
                        break;

                    case 'PREMIUM_FEATURES':
                        referrer.profileSettings.premiumFeatures = true;
                        referrer.premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
                        break;
                }
            }
        }
    }

    await referrer.save();
}

// Obtener recompensas exclusivas disponibles
exports.getExclusiveRewards = async (req, res) => {
    try {
        const referral = await Referral.findOne({ referrer: req.user.id });
        
        if (!referral) {
            return res.json({
                success: true,
                data: {
                    currentReferrals: 0,
                    exclusiveRewards: [],
                    unlockedRewards: []
                }
            });
        }

        const completedCount = referral.stats.completedReferrals;
        const exclusiveRewards = referral.rewards.exclusiveRewards || [];
        
        const unlockedRewards = exclusiveRewards.filter(r => completedCount >= r.minReferrals);
        const nextRewards = exclusiveRewards.filter(r => completedCount < r.minReferrals);

        res.json({
            success: true,
            data: {
                currentReferrals: completedCount,
                unlockedRewards: unlockedRewards,
                nextRewards: nextRewards,
                progressToNextReward: nextRewards.length > 0 ? {
                    current: completedCount,
                    required: nextRewards[0].minReferrals,
                    remaining: nextRewards[0].minReferrals - completedCount
                } : null
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Obtener referidos de un usuario
exports.getUserReferrals = async (req, res) => {
    try {
        const userId = req.user.id;
        const referral = await Referral.findOne({ referrer: userId })
            .populate('referredUsers.userId', 'username avatar_url current_level');

        if (!referral) {
            return res.json({
                success: true,
                data: {
                    referrals: [],
                    stats: {
                        totalReferrals: 0,
                        completedReferrals: 0,
                        pendingReferrals: 0
                    }
                }
            });
        }

        res.json({
            success: true,
            data: {
                referrals: referral.referredUsers,
                stats: referral.stats
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar descripción del referido
exports.updateReferralDescription = async (req, res) => {
    try {
        const { description } = req.body;
        const userId = req.user.id;

        const referral = await Referral.findOne({ referrer: userId });
        if (!referral) {
            return res.status(404).json({ error: 'Código de referido no encontrado' });
        }

        referral.description = description;
        await referral.save();

        res.json({
            success: true,
            message: 'Descripción actualizada',
            data: { description: referral.description }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener leaderboard de referidos
exports.getReferralLeaderboard = async (req, res) => {
    try {
        const leaderboard = await Referral.find()
            .sort({ 'stats.completedReferrals': -1 })
            .limit(10)
            .populate('referrer', 'username avatar_url current_level');

        res.json({
            success: true,
            data: leaderboard.map(r => ({
                username: r.referrer.username,
                avatar: r.referrer.avatar_url,
                level: r.referrer.current_level,
                completedReferrals: r.stats.completedReferrals,
                totalRewards: r.stats.totalRewardsEarned
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = exports;
