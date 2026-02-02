/**
 * Modelo de Títulos
 * Títulos dinámicos que los usuarios pueden desbloquear y mostrar en su perfil
 */

const mongoose = require('mongoose');

const TitleSchema = new mongoose.Schema({
    // Información básica
    name: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    icon: { 
        type: String, 
        default: '👑' 
    },
    color: { 
        type: String, 
        default: '#9B5CFF' // Color por defecto BEDIC
    },

    // Condiciones para desbloquear
    unlockConditions: {
        // Por nivel de usuario
        minLevel: { 
            type: Number, 
            default: 0 
        },
        
        // Por XP acumulado
        minXP: { 
            type: Number, 
            default: 0 
        },
        
        // Por reportes útiles
        minUsefulReports: { 
            type: Number, 
            default: 0 
        },
        
        // Por fotos compartidas
        minPhotosShared: { 
            type: Number, 
            default: 0 
        },
        
        // Por calificaciones dadas
        minRatingsGiven: { 
            type: Number, 
            default: 0 
        },
        
        // Por comentarios de calidad
        minQualityComments: { 
            type: Number, 
            default: 0 
        },
        
        // Por referidos exitosos
        minSuccessfulReferrals: { 
            type: Number, 
            default: 0 
        },
        
        // Por días activo consecutivos
        minConsecutiveDays: { 
            type: Number, 
            default: 0 
        },
        
        // Por insignias obtenidas
        minBadgesUnlocked: { 
            type: Number, 
            default: 0 
        }
    },

    // Categoría del título
    category: {
        type: String,
        enum: [
            'level',           // Por nivel
            'contributor',     // Por contribuciones
            'explorer',        // Por exploración
            'community',       // Por participación comunitaria
            'referral',        // Por referidos
            'special',         // Especiales/limitados
            'seasonal'         // Temporales
        ],
        default: 'special'
    },

    // Rarity/Rareza
    rarity: {
        type: String,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
        default: 'common'
    },

    // Si es limitado en tiempo
    isLimited: { 
        type: Boolean, 
        default: false 
    },
    limitedUntil: { 
        type: Date 
    },

    // Estadísticas
    totalUnlocked: { 
        type: Number, 
        default: 0 
    },
    
    // Activo o no
    active: { 
        type: Boolean, 
        default: true 
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

// Índices
TitleSchema.index({ category: 1 });
TitleSchema.index({ rarity: 1 });
TitleSchema.index({ active: 1 });

module.exports = mongoose.model('Title', TitleSchema);
