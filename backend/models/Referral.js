/**
 * Modelo de Referidos
 * Sistema de referidos con códigos únicos y tracking
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const ReferralSchema = new mongoose.Schema({
    // Usuario que refiere
    referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Código único de referido
    code: {
        type: String,
        unique: true,
        required: true,
        uppercase: true,
        trim: true
    },

    // URL amigable del referido
    referralUrl: {
        type: String,
        unique: true,
        required: true
    },

    // Descripción personalizada del referido
    description: {
        type: String,
        default: 'Únete a BEDIC y descubre lugares increíbles'
    },

    // Usuarios referidos
    referredUsers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        referredAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'cancelled'],
            default: 'pending'
        },
        completedAt: Date,
        rewardClaimed: {
            type: Boolean,
            default: false
        }
    }],

    // Estadísticas
    stats: {
        totalReferrals: {
            type: Number,
            default: 0
        },
        completedReferrals: {
            type: Number,
            default: 0
        },
        pendingReferrals: {
            type: Number,
            default: 0
        },
        totalRewardsEarned: {
            type: Number,
            default: 0
        }
    },

    // Recompensas
    rewards: {
        perReferral: {
            xp: {
                type: Number,
                default: 500
            },
            coins: {
                type: Number,
                default: 100
            }
        },
        milestoneRewards: [{
            milestone: Number, // 5, 10, 25, 50 referidos
            reward: {
                xp: Number,
                coins: Number,
                badge: mongoose.Schema.Types.ObjectId, // Badge a desbloquear
                title: mongoose.Schema.Types.ObjectId, // Título a desbloquear
                achievement: mongoose.Schema.Types.ObjectId // Logro a desbloquear
            }
        }],
        exclusiveRewards: [{
            minReferrals: { type: Number, required: true },
            reward: {
                type: String,
                enum: ['EXCLUSIVE_BADGE', 'EXCLUSIVE_TITLE', 'PREMIUM_FEATURES', 'CUSTOM_REWARD'],
                required: true
            },
            rewardId: mongoose.Schema.Types.ObjectId,
            description: String
        }]
    },

    // Configuración
    isActive: {
        type: Boolean,
        default: true
    },
    maxReferrals: {
        type: Number,
        default: null // null = sin límite
    },

    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Generar código único antes de guardar
ReferralSchema.pre('save', async function(next) {
    if (!this.code) {
        let code;
        let exists = true;
        
        // Generar código único
        while (exists) {
            code = crypto.randomBytes(4).toString('hex').toUpperCase();
            exists = await mongoose.model('Referral').findOne({ code });
        }
        
        this.code = code;
    }

    // Generar URL amigable
    if (!this.referralUrl) {
        const referrerUsername = await mongoose.model('User').findById(this.referrer).select('username');
        this.referralUrl = `${process.env.APP_URL}/ref/${this.code}`;
    }

    next();
});

// Índices
ReferralSchema.index({ referrer: 1 });
ReferralSchema.index({ code: 1 });
ReferralSchema.index({ referralUrl: 1 });
ReferralSchema.index({ 'referredUsers.userId': 1 });
ReferralSchema.index({ isActive: 1 });

module.exports = mongoose.model('Referral', ReferralSchema);
