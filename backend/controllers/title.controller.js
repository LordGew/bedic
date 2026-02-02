/**
 * Controlador de Títulos
 * Gestiona los títulos desbloqueables del usuario
 */

const User = require('../models/User');
const Title = require('../models/Title');

// Obtener todos los títulos disponibles
exports.getAllTitles = async (req, res) => {
    try {
        const titles = await Title.find({ active: true })
            .sort({ rarity: -1, category: 1 });

        res.json({
            success: true,
            data: titles
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener títulos desbloqueados del usuario
exports.getUserTitles = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        const user = await User.findById(userId)
            .populate('titles.titleId');

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            success: true,
            data: {
                unlockedTitles: user.titles,
                selectedTitle: user.profileSettings.selectedTitle
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Seleccionar título para mostrar en perfil
exports.selectTitle = async (req, res) => {
    try {
        const { titleId } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar que el usuario tiene este título desbloqueado
        const hasTitle = user.titles.find(t => t.titleId.toString() === titleId);
        if (!hasTitle) {
            return res.status(400).json({ error: 'No tienes este título desbloqueado' });
        }

        user.profileSettings.selectedTitle = titleId;
        await user.save();

        const title = await Title.findById(titleId);
        res.json({
            success: true,
            message: 'Título seleccionado',
            data: title
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Desbloquear título (admin)
exports.unlockTitle = async (req, res) => {
    try {
        const { userId, titleId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const title = await Title.findById(titleId);
        if (!title) {
            return res.status(404).json({ error: 'Título no encontrado' });
        }

        // Verificar que no lo tenga ya
        if (user.titles.find(t => t.titleId.toString() === titleId)) {
            return res.status(400).json({ error: 'El usuario ya tiene este título' });
        }

        user.titles.push({
            titleId: titleId,
            unlockedAt: new Date()
        });

        title.totalUnlocked += 1;
        await title.save();
        await user.save();

        res.json({
            success: true,
            message: 'Título desbloqueado',
            data: title
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Verificar y desbloquear títulos automáticamente
exports.checkAndUnlockTitles = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        const titles = await Title.find({ active: true });

        for (const title of titles) {
            // Verificar si ya lo tiene
            if (user.titles.find(t => t.titleId.toString() === title._id.toString())) {
                continue;
            }

            const conditions = title.unlockConditions;
            let shouldUnlock = true;

            // Verificar todas las condiciones
            if (conditions.minLevel > 0 && user.current_level < conditions.minLevel) shouldUnlock = false;
            if (conditions.minXP > 0 && user.reputation_score < conditions.minXP) shouldUnlock = false;
            if (conditions.minUsefulReports > 0 && user.helpfulVotes < conditions.minUsefulReports) shouldUnlock = false;
            if (conditions.minPhotosShared > 0 && user.photoCount < conditions.minPhotosShared) shouldUnlock = false;
            if (conditions.minRatingsGiven > 0 && user.reviewCount < conditions.minRatingsGiven) shouldUnlock = false;
            if (conditions.minSuccessfulReferrals > 0 && user.referral.completedReferrals < conditions.minSuccessfulReferrals) shouldUnlock = false;
            if (conditions.minBadgesUnlocked > 0 && user.badges.length < conditions.minBadgesUnlocked) shouldUnlock = false;

            if (shouldUnlock) {
                user.titles.push({
                    titleId: title._id,
                    unlockedAt: new Date()
                });
                title.totalUnlocked += 1;
                await title.save();
            }
        }

        await user.save();
    } catch (error) {
        console.error('Error checking titles:', error);
    }
};

// Obtener títulos por categoría
exports.getTitlesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const titles = await Title.find({ category, active: true })
            .sort({ rarity: -1 });

        res.json({
            success: true,
            data: titles
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear título (admin)
exports.createTitle = async (req, res) => {
    try {
        const { name, description, icon, color, category, rarity, unlockConditions } = req.body;

        const title = new Title({
            name,
            description,
            icon,
            color,
            category,
            rarity,
            unlockConditions
        });

        await title.save();

        res.json({
            success: true,
            message: 'Título creado',
            data: title
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = exports;
