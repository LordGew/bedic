const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const verificationService = require('../services/verification.service');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// REGISTRO CON PREFERENCIAS, REFERIDOS Y VERIFICACIÓN
exports.register = async (req, res) => {
    const { name, username, email, password, language, theme, corporate_color, referralCode } = req.body;

    try {
        // NIVEL 2: Validar nombre real antes de crear usuario
        const nameValidation = verificationService.validateRealName(name);
        if (!nameValidation.valid) {
            return res.status(400).json({ 
                success: false, 
                message: `Nombre inválido: ${nameValidation.reason}` 
            });
        }

        let referredBy = null;
        let referrer = null;

        // Buscar referidor por código, si se envió uno
        if (referralCode) {
            referrer = await User.findOne({ referralCode }).exec();
            if (referrer) {
                referredBy = referrer._id;
            }
        }

        // Generar un código de referido único para el nuevo usuario
        const generateReferralCode = async () => {
            for (let i = 0; i < 5; i++) {
                const candidate = crypto.randomBytes(3).toString('hex');
                const existing = await User.findOne({ referralCode: candidate }).select('_id').exec();
                if (!existing) return candidate;
            }
            return null;
        };

        const newReferralCode = await generateReferralCode();

        // NIVEL 1: Generar token de verificación de email
        const emailVerificationToken = verificationService.generateEmailVerificationToken();
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        const user = await User.create({
            name,
            username,
            email,
            password,
            language: language || 'es',
            theme: theme || 'light',
            corporate_color: corporate_color || '#007BFF',
            referralCode: newReferralCode,
            ...(referredBy ? { referredBy } : {}),
            verification: {
                emailVerificationToken,
                emailVerificationExpires,
                nameValidationStatus: 'valid',
                nameValidatedAt: new Date(),
                verificationLevel: 'partially_verified',
                actionsToAutoVerify: 5,
                actionsCompleted: 0,
                verificationHistory: [
                    {
                        level: 'name_validated',
                        completedAt: new Date(),
                        method: 'name_validation'
                    }
                ]
            }
        });

        // Enviar token de verificación de email
        await verificationService.sendEmailVerificationToken(user, emailVerificationToken);

        // Actualizar contador de referidos y posibles insignias
        if (referrer) {
            referrer.referralsCount = (referrer.referralsCount || 0) + 1;
            referrer.badges = referrer.badges || [];
            if (referrer.referralsCount >= 1 && !referrer.badges.includes('Invitó a un amigo')) {
                referrer.badges.push('Invitó a un amigo');
            }
            if (referrer.referralsCount >= 5 && !referrer.badges.includes('Promotor de la comunidad')) {
                referrer.badges.push('Promotor de la comunidad');
            }
            if (referrer.referralsCount >= 10 && !referrer.badges.includes('Embajador BEDIC')) {
                referrer.badges.push('Embajador BEDIC');
            }
            await referrer.save();
        }

        res.status(201).json({
            success: true,
            token: generateToken(user._id),
            data: { 
                id: user._id, 
                name: user.name,
                username: user.username, 
                email: user.email, 
                role: user.role,
                language: user.language,
                theme: user.theme,
                corporate_color: user.corporate_color,
                referralCode: user.referralCode,
                referralsCount: user.referralsCount,
                verification: {
                    verificationLevel: user.verification.verificationLevel,
                    emailVerified: user.verification.emailVerified,
                    nameValidationStatus: user.verification.nameValidationStatus
                }
            },
            message: 'Registro exitoso. Por favor, verifica tu email.'
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// LOGIN: DEVUELVE PREFERENCIAS
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Por favor, proporcione email y contraseña.' });
    }
    
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    if (user.isDeleted) {
        return res.status(403).json({ success: false, message: 'Tu cuenta ha sido eliminada.' });
    }

    if (user.isBanned) {
        return res.status(403).json({
            success: false,
            message: 'Tu cuenta ha sido baneada por incumplir las normas de la comunidad.',
        });
    }

    res.status(200).json({
        success: true,
        token: generateToken(user._id),
        data: { 
            id: user._id, 
            name: user.name,
            username: user.username, 
            email: user.email, 
            role: user.role,
            language: user.language,
            theme: user.theme,
            corporate_color: user.corporate_color
        }
    });
};

// Google Sign-In (placeholder)
exports.googleSignIn = async (req, res) => {
    res.status(501).json({ success: false, message: 'Google Sign-In not implemented.' });
};

// RECUPERACIÓN DE CONTRASEÑA (Deshabilitado - requiere servicio de email)
exports.forgotPassword = async (req, res) => {
    res.status(501).json({ 
        success: false, 
        message: 'Recuperación de contraseña no disponible. Contacta al administrador.' 
    });
};

exports.resetPassword = async (req, res) => {
    res.status(501).json({ 
        success: false, 
        message: 'Recuperación de contraseña no disponible. Contacta al administrador.' 
    });
};

// ========== FUNCIONES DE VERIFICACIÓN ==========

// NIVEL 1: Verificar email con token
exports.verifyEmail = async (req, res) => {
    const { token } = req.body;
    const userId = req.user?.id;

    if (!userId || !token) {
        return res.status(400).json({ 
            success: false, 
            message: 'Token y usuario requeridos' 
        });
    }

    const result = await verificationService.verifyEmailToken(userId, token);
    
    if (!result.success) {
        return res.status(400).json({ success: false, message: result.message });
    }

    res.status(200).json({ 
        success: true, 
        message: result.message,
        verification: {
            emailVerified: result.user.verification.emailVerified,
            verificationLevel: result.user.verification.verificationLevel
        }
    });
};

// NIVEL 1: Reenviar token de verificación de email
exports.resendEmailVerification = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Usuario no autenticado' 
        });
    }

    const result = await verificationService.resendEmailVerificationToken(userId);
    
    if (!result.success) {
        return res.status(400).json({ success: false, message: result.message });
    }

    res.status(200).json({ success: true, message: result.message });
};

// NIVEL 4: Obtener estado de verificación del usuario actual
exports.getMyVerificationStatus = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Usuario no autenticado' 
        });
    }

    const result = await verificationService.getVerificationStatus(userId);
    
    if (!result.success) {
        return res.status(400).json({ success: false, message: result.message });
    }

    res.status(200).json({ success: true, data: result.verification });
};