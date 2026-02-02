/**
 * Script para poblar la BD con títulos e insignias predefinidos
 */

const mongoose = require('mongoose');
const Title = require('../models/Title');
const Badge = require('../models/Badge');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Conectar a MongoDB
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB conectado');
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    }
}

// Títulos predefinidos
const TITLES = [
    // Títulos por Nivel
    {
        name: 'Novato',
        description: 'Estás comenzando tu viaje en BEDIC',
        icon: '👶',
        color: '#6C757D',
        category: 'level',
        rarity: 'common',
        unlockConditions: { minXP: 0 }
    },
    {
        name: 'Explorador',
        description: 'Has explorado activamente tu ciudad',
        icon: '🧭',
        color: '#17A2B8',
        category: 'level',
        rarity: 'uncommon',
        unlockConditions: { minXP: 100 }
    },
    {
        name: 'Colaborador Activo',
        description: 'Eres un colaborador constante de la comunidad',
        icon: '🤝',
        color: '#28A745',
        category: 'level',
        rarity: 'uncommon',
        unlockConditions: { minXP: 500 }
    },
    {
        name: 'Reportero Experto',
        description: 'Eres una fuente confiable de información',
        icon: '📰',
        color: '#FFC107',
        category: 'level',
        rarity: 'rare',
        unlockConditions: { minXP: 2000 }
    },
    {
        name: 'Maestro de la Comunidad',
        description: 'Tu actividad y reputación son legendarias',
        icon: '👑',
        color: '#9B5CFF',
        category: 'level',
        rarity: 'epic',
        unlockConditions: { minXP: 5000 }
    },

    // Títulos de Contribución
    {
        name: 'Fotógrafo Urbano',
        description: 'Has compartido 50+ fotos de lugares',
        icon: '📸',
        color: '#E83E8C',
        category: 'contributor',
        rarity: 'rare',
        unlockConditions: { minPhotosShared: 50 }
    },
    {
        name: 'Crítico de Lugares',
        description: 'Has calificado 100+ lugares',
        icon: '⭐',
        color: '#FFC107',
        category: 'contributor',
        rarity: 'rare',
        unlockConditions: { minRatingsGiven: 100 }
    },
    {
        name: 'Guardián de la Comunidad',
        description: 'Has hecho 25+ reportes útiles',
        icon: '🛡️',
        color: '#28A745',
        category: 'contributor',
        rarity: 'epic',
        unlockConditions: { minUsefulReports: 25 }
    },

    // Títulos de Exploración
    {
        name: 'Explorador Urbano',
        description: 'Has visitado 10+ categorías diferentes',
        icon: '🌆',
        color: '#17A2B8',
        category: 'explorer',
        rarity: 'uncommon',
        unlockConditions: { minPhotosShared: 10 }
    },
    {
        name: 'Viajero Incansable',
        description: 'Has visitado 100+ lugares diferentes',
        icon: '✈️',
        color: '#007BFF',
        category: 'explorer',
        rarity: 'epic',
        unlockConditions: { minPhotosShared: 100 }
    },

    // Títulos de Referidos
    {
        name: 'Embajador BEDIC',
        description: 'Has referido 5+ amigos exitosamente',
        icon: '🎖️',
        color: '#9B5CFF',
        category: 'referral',
        rarity: 'epic',
        unlockConditions: { minSuccessfulReferrals: 5 }
    },
    {
        name: 'Reclutador Estrella',
        description: 'Has referido 10+ amigos exitosamente',
        icon: '⭐',
        color: '#FFD700',
        category: 'referral',
        rarity: 'legendary',
        unlockConditions: { minSuccessfulReferrals: 10 }
    },

    // Títulos Especiales
    {
        name: 'Miembro Fundador',
        description: 'Eres parte de los primeros usuarios de BEDIC',
        icon: '🏆',
        color: '#FFD700',
        category: 'special',
        rarity: 'legendary',
        isLimited: true
    },
    {
        name: 'Verificado',
        description: 'Tu cuenta ha sido verificada',
        icon: '✅',
        color: '#28A745',
        category: 'special',
        rarity: 'rare'
    }
];

// Insignias predefinidas
const BADGES = [
    // Hitos de Reportes
    {
        name: 'Primer Reporte',
        description: 'Has hecho tu primer reporte',
        icon: '🚩',
        type: 'milestone',
        rarity: 'common',
        unlockConditions: { reportsMilestone: 1 },
        reward: { xp: 50, coins: 10 }
    },
    {
        name: 'Reportero Activo',
        description: 'Has hecho 10 reportes',
        icon: '🚩',
        type: 'milestone',
        rarity: 'uncommon',
        unlockConditions: { reportsMilestone: 10 },
        reward: { xp: 200, coins: 50 }
    },
    {
        name: 'Reportero Dedicado',
        description: 'Has hecho 50 reportes',
        icon: '🚩',
        type: 'milestone',
        rarity: 'rare',
        unlockConditions: { reportsMilestone: 50 },
        reward: { xp: 500, coins: 100 }
    },

    // Hitos de Fotos
    {
        name: 'Primera Foto',
        description: 'Has compartido tu primera foto',
        icon: '📸',
        type: 'milestone',
        rarity: 'common',
        unlockConditions: { photosMilestone: 1 },
        reward: { xp: 50, coins: 10 }
    },
    {
        name: 'Fotógrafo Aficionado',
        description: 'Has compartido 10 fotos',
        icon: '📸',
        type: 'milestone',
        rarity: 'uncommon',
        unlockConditions: { photosMilestone: 10 },
        reward: { xp: 200, coins: 50 }
    },
    {
        name: 'Fotógrafo Profesional',
        description: 'Has compartido 50 fotos',
        icon: '📸',
        type: 'milestone',
        rarity: 'rare',
        unlockConditions: { photosMilestone: 50 },
        reward: { xp: 500, coins: 100 }
    },

    // Hitos de Calificaciones
    {
        name: 'Primera Calificación',
        description: 'Has calificado tu primer lugar',
        icon: '⭐',
        type: 'milestone',
        rarity: 'common',
        unlockConditions: { ratingsMilestone: 1 },
        reward: { xp: 50, coins: 10 }
    },
    {
        name: 'Crítico Activo',
        description: 'Has calificado 25 lugares',
        icon: '⭐',
        type: 'milestone',
        rarity: 'uncommon',
        unlockConditions: { ratingsMilestone: 25 },
        reward: { xp: 200, coins: 50 }
    },
    {
        name: 'Crítico Experto',
        description: 'Has calificado 100 lugares',
        icon: '⭐',
        type: 'milestone',
        rarity: 'rare',
        unlockConditions: { ratingsMilestone: 100 },
        reward: { xp: 500, coins: 100 }
    },

    // Logros de Referidos
    {
        name: 'Primer Referido',
        description: 'Has referido tu primer amigo',
        icon: '🎖️',
        type: 'referral',
        rarity: 'uncommon',
        unlockConditions: { successfulReferrals: 1 },
        reward: { xp: 100, coins: 25 }
    },
    {
        name: 'Reclutador Novato',
        description: 'Has referido 5 amigos',
        icon: '🎖️',
        type: 'referral',
        rarity: 'rare',
        unlockConditions: { successfulReferrals: 5 },
        reward: { xp: 300, coins: 75 }
    },
    {
        name: 'Reclutador Maestro',
        description: 'Has referido 10 amigos',
        icon: '🎖️',
        type: 'referral',
        rarity: 'epic',
        unlockConditions: { successfulReferrals: 10 },
        reward: { xp: 500, coins: 150 }
    },

    // Logros de Exploración
    {
        name: 'Explorador Principiante',
        description: 'Has visitado 10 lugares',
        icon: '🗺️',
        type: 'explorer',
        rarity: 'common',
        unlockConditions: { citiesExplored: 1 },
        reward: { xp: 100, coins: 25 }
    },
    {
        name: 'Explorador Experimentado',
        description: 'Has visitado 50 lugares',
        icon: '🗺️',
        type: 'explorer',
        rarity: 'rare',
        unlockConditions: { citiesExplored: 3 },
        reward: { xp: 300, coins: 75 }
    },

    // Logros de Comunidad
    {
        name: 'Miembro Activo',
        description: 'Has participado activamente en la comunidad',
        icon: '🤝',
        type: 'community',
        rarity: 'uncommon',
        unlockConditions: { minXP: 500 },
        reward: { xp: 100, coins: 25 }
    },
    {
        name: 'Líder de Comunidad',
        description: 'Eres un líder reconocido en la comunidad',
        icon: '👑',
        type: 'community',
        rarity: 'epic',
        unlockConditions: { minXP: 5000 },
        reward: { xp: 500, coins: 150 }
    },

    // Logros Especiales
    {
        name: 'Verificado',
        description: 'Tu cuenta ha sido verificada',
        icon: '✅',
        type: 'special',
        rarity: 'rare',
        reward: { xp: 200, coins: 50 }
    }
];

// Función para poblar
async function seedData() {
    try {
        console.log('\n🌱 Poblando títulos e insignias...\n');

        // Limpiar datos existentes
        await Title.deleteMany({});
        await Badge.deleteMany({});
        console.log('✅ Datos anteriores eliminados');

        // Insertar títulos
        const insertedTitles = await Title.insertMany(TITLES);
        console.log(`✅ ${insertedTitles.length} títulos creados`);

        // Insertar insignias
        const insertedBadges = await Badge.insertMany(BADGES);
        console.log(`✅ ${insertedBadges.length} insignias creadas`);

        console.log('\n✅ Población completada exitosamente\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error poblando datos:', error);
        process.exit(1);
    }
}

// Ejecutar
connectDB().then(() => seedData());
