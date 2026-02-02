// controllers/profile.controller.js
const User = require('../models/User');
const VerificationRequest = require('../models/VerificationRequest');
const DeviceToken = require('../models/DeviceToken');
const crypto = require('crypto');

// PERFIL DEL USUARIO AUTENTICADO
exports.getProfile = async (req, res) => {
    const user = await User.findById(req.user.id);

    const settings = user.profileSettings || {};

    res.status(200).json({
        success: true,
        data: {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            language: user.language,
            theme: user.theme,
            corporate_color: user.corporate_color,
            reputation_score: user.reputation_score,
            current_level: user.current_level,
            badges: user.badges,
            avatar_url: user.avatar_url,
            favoritePlaces: (user.favoritePlaces || []).map((p) => p.toString()),
            referralCode: user.referralCode || '',
            referralsCount: user.referralsCount || 0,
            profile_settings: {
                showLevel: settings.showLevel !== false,
                showBadges: settings.showBadges !== false,
                selectedTitle: settings.selectedTitle || '',
            },
        }
    });
};

// PERFIL PÚBLICO POR ID
exports.getPublicProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const settings = user.profileSettings || {};

        return res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                username: user.username,
                role: user.role,
                language: user.language,
                theme: user.theme,
                corporate_color: user.corporate_color,
                reputation_score: user.reputation_score,
                current_level: user.current_level,
                badges: user.badges,
                avatar_url: user.avatar_url,
                referralCode: user.referralCode || '',
                referralsCount: user.referralsCount || 0,
                profile_settings: {
                    showLevel: settings.showLevel !== false,
                    showBadges: settings.showBadges !== false,
                    selectedTitle: settings.selectedTitle || '',
                },
            },
        });
    } catch (err) {
        console.error('getPublicProfile ERROR:', err);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

// ACTUALIZAR
exports.updateProfile = async (req, res) => {
    try {
        const fields = {};

        if (typeof req.body.name === 'string' && req.body.name.trim().length > 0) {
            fields.name = req.body.name.trim();
        }
        if (typeof req.body.username === 'string' && req.body.username.trim().length > 0) {
            fields.username = req.body.username.trim();
        }
        if (typeof req.body.language === 'string') {
            fields.language = req.body.language;
        }
        if (typeof req.body.theme === 'string') {
            fields.theme = req.body.theme;
        }
        if (typeof req.body.corporate_color === 'string') {
            fields.corporate_color = req.body.corporate_color;
        }

        if (typeof req.body.showLevel === 'boolean') {
            fields['profileSettings.showLevel'] = req.body.showLevel;
        }
        if (typeof req.body.showBadges === 'boolean') {
            fields['profileSettings.showBadges'] = req.body.showBadges;
        }
        if (typeof req.body.selectedTitle === 'string') {
            fields['profileSettings.selectedTitle'] = req.body.selectedTitle.trim();
        }

        const user = await User.findByIdAndUpdate(req.user.id, fields, {
            new: true,
            runValidators: true,
        });

        const settings = user.profileSettings || {};

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                language: user.language,
                theme: user.theme,
                corporate_color: user.corporate_color,
                reputation_score: user.reputation_score,
                current_level: user.current_level,
                badges: user.badges,
                avatar_url: user.avatar_url,
                favoritePlaces: (user.favoritePlaces || []).map((p) => p.toString()),
                referralCode: user.referralCode || '',
                referralsCount: user.referralsCount || 0,
                profile_settings: {
                    showLevel: settings.showLevel !== false,
                    showBadges: settings.showBadges !== false,
                    selectedTitle: settings.selectedTitle || '',
                },
            }
        });
    } catch (err) {
        console.error('updateProfile ERROR:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
    }
};

// ELIMINAR
exports.deleteAccount = async (req, res) => {
    try {
        const { password, confirmation } = req.body || {};

        if (!password || typeof password !== 'string') {
            return res.status(400).json({ success: false, message: 'Contraseña requerida.' });
        }

        if (confirmation !== 'ELIMINAR') {
            return res.status(400).json({
                success: false,
                message: 'Confirmación inválida. Debes enviar confirmation="ELIMINAR".',
            });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        if (user.isDeleted) {
            return res.status(200).json({ success: true });
        }

        const ok = await user.matchPassword(password);
        if (!ok) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
        }

        await DeviceToken.deleteMany({ user: user._id });
        await VerificationRequest.deleteMany({ user: user._id });

        user.isDeleted = true;
        user.deletedAt = new Date();

        const suffix = `${user._id.toString()}_${Date.now()}`;
        user.email = `deleted_${suffix}@deleted.local`;
        user.username = `deleted_${suffix}`;
        user.name = 'Usuario eliminado';

        user.avatar_url = undefined;
        user.favoritePlaces = [];
        user.favoriteCategories = [];
        user.searchHistory = [];
        user.notificationsEnabled = false;
        user.muted_until = undefined;
        user.mute_reason = undefined;
        user.isBanned = false;
        user.banReason = undefined;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        user.password = crypto.randomBytes(32).toString('hex');
        await user.save();

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('deleteAccount ERROR:', err);
        res.status(500).json({ success: false, message: 'Error al eliminar la cuenta' });
    }
};

// SOLICITAR VERIFICACIÓN DE PERFIL
exports.requestVerification = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        if (user.is_verified) {
            return res.status(400).json({ success: false, message: 'Tu cuenta ya está verificada.' });
        }

        const existing = await VerificationRequest.findOne({
            user: user._id,
            status: 'pending',
        });

        // Hacemos la operación idempotente: si ya hay una solicitud pendiente,
        // devolvemos éxito reutilizando esa misma solicitud para no romper el
        // flujo en el cliente.
        if (existing) {
            return res.status(201).json({
                success: true,
                data: existing,
                alreadyPending: true,
                message: 'Ya tienes una solicitud de verificación pendiente.',
            });
        }

        const { badge, evidence } = req.body || {};

        const request = await VerificationRequest.create({
            user: user._id,
            badge: badge || 'Verificado',
            evidence: evidence || '',
        });

        return res.status(201).json({ success: true, data: request });
    } catch (err) {
        console.error('requestVerification ERROR:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al enviar la solicitud de verificación',
        });
    }
};

exports.getFavoritePlaces = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('favoritePlaces');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        return res.status(200).json({
            success: true,
            data: user.favoritePlaces || [],
        });
    } catch (err) {
        console.error('getFavoritePlaces ERROR:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener lugares favoritos',
        });
    }
};

exports.addFavoritePlace = async (req, res) => {
    try {
        const { placeId } = req.params || {};
        if (!placeId) {
            return res.status(400).json({ success: false, message: 'placeId es obligatorio' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        if (!Array.isArray(user.favoritePlaces)) {
            user.favoritePlaces = [];
        }

        const exists = user.favoritePlaces.some((p) => p.toString() === placeId);
        if (!exists) {
            user.favoritePlaces.push(placeId);
            await user.save();
        }

        const ids = (user.favoritePlaces || []).map((p) => p.toString());
        return res.status(200).json({ success: true, data: ids });
    } catch (err) {
        console.error('addFavoritePlace ERROR:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al agregar lugar a favoritos',
        });
    }
};

exports.removeFavoritePlace = async (req, res) => {
    try {
        const { placeId } = req.params || {};
        if (!placeId) {
            return res.status(400).json({ success: false, message: 'placeId es obligatorio' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        if (Array.isArray(user.favoritePlaces)) {
            user.favoritePlaces = user.favoritePlaces.filter((p) => p.toString() !== placeId);
            await user.save();
        }

        const ids = (user.favoritePlaces || []).map((p) => p.toString());
        return res.status(200).json({ success: true, data: ids });
    } catch (err) {
        console.error('removeFavoritePlace ERROR:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al quitar lugar de favoritos',
        });
    }
};
