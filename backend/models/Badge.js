/**
 * Modelo de Insignias
 * Medallas/insignias que los usuarios desbloquean por hitos y logros
 */

const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
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
        default: '🏅' 
    },
    image: { 
        type: String // URL a imagen de la insignia
    },

    // Tipo de insignia
    type: {
        type: String,
        enum: [
            'milestone',        // Hitos (1er reporte, 10 fotos, etc)
            'achievement',      // Logros especiales
            'explorer',         // Exploración (ciudades visitadas)
            'contributor',      // Contribuciones (reportes útiles)
            'community',        // Participación comunitaria
            'referral',         // Sistema de referidos
            'seasonal',         // Temporales/eventos
            'special'           // Especiales/limitados
        ],
        default: 'achievement'
    },

    // Condiciones para desbloquear
    unlockConditions: {
        // Hito de reportes
        reportsMilestone: { 
            type: Number, 
            default: 0 
        },
        
        // Hito de fotos
        photosMilestone: { 
            type: Number, 
            default: 0 
        },
        
        // Hito de calificaciones
        ratingsMilestone: { 
            type: Number, 
            default: 0 
        },
        
        // Hito de comentarios
        commentsMilestone: { 
            type: Number, 
            default: 0 
        },
        
        // Ciudades exploradas
        citiesExplored: { 
            type: Number, 
            default: 0 
        },
        
        // Lugares visitados
        placesVisited: { 
            type: Number, 
            default: 0 
        },
        
        // Categorías exploradas
        categoriesExplored: { 
            type: Number, 
            default: 0 
        },
        
        // Reportes útiles
        usefulReports: { 
            type: Number, 
            default: 0 
        },
        
        // Referidos exitosos
        successfulReferrals: { 
            type: Number, 
            default: 0 
        },
        
        // Días consecutivos activo
        consecutiveDaysActive: { 
            type: Number, 
            default: 0 
        },
        
        // Nivel mínimo requerido
        minLevel: { 
            type: Number, 
            default: 0 
        },
        
        // XP mínimo requerido
        minXP: { 
            type: Number, 
            default: 0 
        }
    },

    // Rareza
    rarity: {
        type: String,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
        default: 'common'
    },

    // Recompensa por desbloquear
    reward: {
        xp: { 
            type: Number, 
            default: 0 
        },
        coins: { 
            type: Number, 
            default: 0 
        }
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
BadgeSchema.index({ type: 1 });
BadgeSchema.index({ rarity: 1 });
BadgeSchema.index({ active: 1 });

module.exports = mongoose.model('Badge', BadgeSchema);
