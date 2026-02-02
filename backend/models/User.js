const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const MAX_REP_SCORE_FOR_MODERATOR = 5000;
const ROLE_COLORS = {
    'admin': '#FFD700',
    'moderator': '#1DA1F2',
    'user': '#6C757D'
};

const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'El nombre completo es obligatorio.'], 
        trim: true 
    }, 
    username: {
        type: String,
        required: [true, 'El nombre de usuario es obligatorio.'],
        unique: true,
        trim: true,
        minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres.']
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Por favor ingrese un correo electrónico válido.']
    },
    password: {
        type: String, 
        required: true,
        select: false 
    },
    role: { 
        type: String, 
        enum: ['user', 'moderator', 'admin'], 
        default: 'user'
    },
    // PREFERENCIAS DEL USUARIO
    language: { 
        type: String, 
        enum: ['es', 'en'], 
        default: 'es'
    },
    theme: { 
        type: String, 
        enum: ['light', 'dark'], 
        default: 'light'
    },
    corporate_color: { 
        type: String, 
        default: '#007BFF',
        match: [/^#[0-9A-F]{6}$/i, 'Color debe ser en formato HEX (#RRGGBB)']
    },
    preferences: {
        notifications_category: [String],
    },
    favoritePlaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Place' }],
    favoriteCategories: [{ type: String }], // Categorías de interés del usuario
    searchHistory: [{ type: String }], // Historial de búsquedas
    lastSearchDate: { type: Date }, // Última fecha de búsqueda
    notificationsEnabled: { type: Boolean, default: true }, // Notificaciones activadas
    reputation_score: { 
        type: Number, 
        default: 0 
    },
    current_level: {
        type: String,
        default: 'Novato' 
    },
    // Sistema de logros y títulos mejorado
    achievements: [{
        achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' },
        unlockedAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 }
    }],
    badges: [{
        badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
        unlockedAt: { type: Date, default: Date.now }
    }],
    titles: [{
        titleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Title' },
        unlockedAt: { type: Date, default: Date.now }
    }],
    profileSettings: {
        showLevel: { type: Boolean, default: true },
        showBadges: { type: Boolean, default: true },
        showTitles: { type: Boolean, default: true },
        showAchievements: { type: Boolean, default: true },
        selectedTitle: { type: mongoose.Schema.Types.ObjectId, ref: 'Title', default: null },
        selectedBadges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }]
    },
    // Estadísticas para logros
    stats: {
        reviewsCount: { type: Number, default: 0 },
        placesVisited: { type: Number, default: 0 },
        reportsFiledCount: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 },
        eventsAttended: { type: Number, default: 0 },
        ratingsGiven: { type: Number, default: 0 },
        photosShared: { type: Number, default: 0 },
        consecutiveDaysActive: { type: Number, default: 0 },
        lastActiveDate: { type: Date },
        totalDaysActive: { type: Number, default: 0 }
    },
    referral: {
        code: { type: String, unique: true, sparse: true },
        referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        referralsCount: { type: Number, default: 0 },
        completedReferrals: { type: Number, default: 0 },
        totalRewardsEarned: { type: Number, default: 0 }
    },
    is_verified: { 
        type: Boolean, 
        default: false 
    },
    // SISTEMA DE VERIFICACIÓN MEJORADO (Nivel 1, 2, 4)
    verification: {
        // Nivel 1: Verificación de Email
        emailVerificationToken: { type: String, select: false },
        emailVerificationExpires: { type: Date },
        emailVerified: { type: Boolean, default: false },
        emailVerifiedAt: { type: Date },
        
        // Nivel 2: Validación de Nombre Real
        nameValidationStatus: { 
            type: String, 
            enum: ['pending', 'valid', 'invalid'], 
            default: 'pending' 
        },
        nameValidatedAt: { type: Date },
        nameValidationReason: { type: String }, // Razón si es inválido
        
        // Nivel 4: Sistema de Reputación Temprana
        verificationLevel: {
            type: String,
            enum: ['unverified', 'partially_verified', 'verified'],
            default: 'unverified'
        },
        actionsToAutoVerify: { type: Number, default: 5 }, // Acciones requeridas
        actionsCompleted: { type: Number, default: 0 }, // Acciones realizadas
        autoVerifiedAt: { type: Date },
        
        // Historial de verificación
        verificationHistory: [{
            level: String,
            completedAt: { type: Date, default: Date.now },
            method: String // 'email', 'name_validation', 'auto_reputation'
        }]
    },
    // Estado de silenciamiento / bloqueo temporal
    muted_until: { type: Date },
    mute_reason: { type: String },

    // Avatar del usuario
    avatar_url: { type: String },

    // Moderación y reputación
    strikes: { type: Number, default: 0 },
    suspendedUntil: { type: Date },
    suspensionReason: { type: String },
    phoneVerified: { type: Boolean, default: false },
    reviewCount: { type: Number, default: 0 },
    photoCount: { type: Number, default: 0 },
    helpfulVotes: { type: Number, default: 0 },
    deletedComments: { type: Number, default: 0 },
    reportedContent: { type: Number, default: 0 },
    offensiveCommentsCount: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },

    // Seguridad adicional para centro de administración (PIN de 6 dígitos)
    adminPinHash: { type: String, select: false },
    adminPinExpiresAt: { type: Date },
    adminPinResetToken: { type: String, select: false },
    adminPinResetExpiresAt: { type: Date },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, { timestamps: true });

// --- LÓGICA DE NIVEL ---
UserSchema.methods.calculateLevel = function() {
    const xp = this.reputation_score;
    let levelName = 'Novato';

    if (xp >= MAX_REP_SCORE_FOR_MODERATOR) {
        levelName = 'Maestro de la Comunidad';
        if (this.role !== 'admin') {
            this.role = 'moderator';
            this.badges.addToSet('Star Contributor');
        }
    } else if (xp >= 2000) levelName = 'Reportero Experto';
    else if (xp >= 500) levelName = 'Colaborador Activo';
    else if (xp >= 100) levelName = 'Explorador';
    
    this.current_level = levelName;
};

UserSchema.statics.getRoleColor = (role) => ROLE_COLORS[role] || ROLE_COLORS['user'];

// --- HOOKS ---
UserSchema.pre('save', async function (next) {
    if (this.isModified('reputation_score')) {
        this.calculateLevel();
    }
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password); 
};

UserSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

module.exports = mongoose.model('User', UserSchema);