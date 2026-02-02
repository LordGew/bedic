// backend/services/notificationScheduler.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const Place = require('../models/Place');

/**
 * Sistema de notificaciones automáticas y recomendaciones
 * 100% autónomo - sin dependencias externas
 */

class NotificationScheduler {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
    }

    /**
     * Inicia el scheduler de notificaciones
     * Se ejecuta cada hora para enviar recomendaciones personalizadas
     */
    start() {
        if (this.isRunning) {
            console.log('📬 Notification Scheduler ya está corriendo');
            return;
        }

        console.log('📬 Iniciando Notification Scheduler...');
        this.isRunning = true;

        // Ejecutar inmediatamente
        this.processNotifications();

        // Ejecutar cada hora
        this.intervalId = setInterval(() => {
            this.processNotifications();
        }, 60 * 60 * 1000); // 1 hora

        console.log('✅ Notification Scheduler iniciado - ejecutándose cada hora');
    }

    /**
     * Detiene el scheduler
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isRunning = false;
            console.log('🛑 Notification Scheduler detenido');
        }
    }

    /**
     * Procesa y envía notificaciones automáticas
     */
    async processNotifications() {
        try {
            console.log('\n📬 [NotificationScheduler] Procesando notificaciones...');

            // 1. Enviar recomendaciones basadas en búsquedas recientes
            await this.sendSearchBasedRecommendations();

            // 2. Enviar notificaciones de nuevos lugares en áreas de interés
            await this.sendNewPlaceNotifications();

            // 3. Limpiar notificaciones antiguas (más de 30 días)
            await this.cleanOldNotifications();

            console.log('✅ [NotificationScheduler] Proceso completado\n');
        } catch (error) {
            console.error('❌ [NotificationScheduler] Error:', error.message);
        }
    }

    /**
     * Envía recomendaciones basadas en búsquedas recientes del usuario
     */
    async sendSearchBasedRecommendations() {
        try {
            // Obtener usuarios activos (que han buscado en los últimos 7 días)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            const activeUsers = await User.find({
                lastSearchDate: { $gte: sevenDaysAgo },
                notificationsEnabled: { $ne: false } // Solo usuarios con notificaciones activas
            }).select('_id searchHistory favoriteCategories');

            console.log(`📊 Usuarios activos: ${activeUsers.length}`);

            for (const user of activeUsers) {
                // Verificar si ya tiene notificación reciente (últimas 24h)
                const recentNotification = await Notification.findOne({
                    userId: user._id,
                    type: 'recommendation',
                    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                });

                if (recentNotification) {
                    continue; // Ya tiene notificación reciente
                }

                // Obtener categorías de interés del usuario
                const categories = user.favoriteCategories || [];
                const searchHistory = user.searchHistory || [];

                // Si tiene historial, buscar lugares similares
                if (categories.length > 0 || searchHistory.length > 0) {
                    const recommendedPlace = await this.findRecommendedPlace(user, categories, searchHistory);

                    if (recommendedPlace) {
                        await this.createRecommendationNotification(user._id, recommendedPlace);
                    }
                }
            }

            console.log('✅ Recomendaciones basadas en búsquedas enviadas');
        } catch (error) {
            console.error('❌ Error enviando recomendaciones:', error.message);
        }
    }

    /**
     * Encuentra un lugar recomendado para el usuario
     */
    async findRecommendedPlace(user, categories, searchHistory) {
        try {
            // Buscar lugares que coincidan con las categorías favoritas
            const query = {
                verified: true,
                rating: { $gte: 4.0 } // Solo lugares con buena calificación
            };

            if (categories.length > 0) {
                query.category = { $in: categories };
            }

            // Excluir lugares que el usuario ya tiene en favoritos
            if (user.favoritePlaces && user.favoritePlaces.length > 0) {
                query._id = { $nin: user.favoritePlaces };
            }

            const places = await Place.find(query)
                .sort({ rating: -1, createdAt: -1 })
                .limit(5);

            // Retornar un lugar aleatorio de los top 5
            if (places.length > 0) {
                return places[Math.floor(Math.random() * places.length)];
            }

            return null;
        } catch (error) {
            console.error('Error buscando lugar recomendado:', error.message);
            return null;
        }
    }

    /**
     * Crea una notificación de recomendación
     */
    async createRecommendationNotification(userId, place) {
        try {
            const notification = await Notification.create({
                userId,
                type: 'recommendation',
                title: '🎯 Nuevo lugar que te puede interesar',
                message: `Descubre ${place.name} - ${place.category}. ¡Tiene ${place.rating.toFixed(1)} ⭐!`,
                data: {
                    placeId: place._id,
                    placeName: place.name,
                    placeCategory: place.category,
                    placeRating: place.rating
                },
                read: false
            });

            console.log(`📬 Notificación creada para usuario ${userId}: ${place.name}`);
            return notification;
        } catch (error) {
            console.error('Error creando notificación:', error.message);
            return null;
        }
    }

    /**
     * Envía notificaciones de nuevos lugares en áreas de interés
     */
    async sendNewPlaceNotifications() {
        try {
            // Buscar lugares creados en las últimas 24 horas
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            const newPlaces = await Place.find({
                createdAt: { $gte: yesterday },
                verified: true
            }).select('_id name category city rating');

            if (newPlaces.length === 0) {
                console.log('📭 No hay nuevos lugares para notificar');
                return;
            }

            console.log(`📍 Nuevos lugares encontrados: ${newPlaces.length}`);

            // Agrupar por categoría
            const placesByCategory = {};
            newPlaces.forEach(place => {
                if (!placesByCategory[place.category]) {
                    placesByCategory[place.category] = [];
                }
                placesByCategory[place.category].push(place);
            });

            // Buscar usuarios interesados en cada categoría
            for (const [category, places] of Object.entries(placesByCategory)) {
                const interestedUsers = await User.find({
                    favoriteCategories: category,
                    notificationsEnabled: { $ne: false }
                }).select('_id');

                for (const user of interestedUsers) {
                    // Verificar si ya tiene notificación de nuevo lugar hoy
                    const existingNotification = await Notification.findOne({
                        userId: user._id,
                        type: 'new_place',
                        createdAt: { $gte: yesterday }
                    });

                    if (!existingNotification) {
                        const place = places[0]; // Tomar el primer lugar de la categoría
                        await Notification.create({
                            userId: user._id,
                            type: 'new_place',
                            title: '🆕 Nuevo lugar agregado',
                            message: `¡Descubre ${place.name} en ${place.city}!`,
                            data: {
                                placeId: place._id,
                                placeName: place.name,
                                placeCategory: place.category
                            },
                            read: false
                        });
                    }
                }
            }

            console.log('✅ Notificaciones de nuevos lugares enviadas');
        } catch (error) {
            console.error('❌ Error enviando notificaciones de nuevos lugares:', error.message);
        }
    }

    /**
     * Limpia notificaciones antiguas (más de 30 días)
     */
    async cleanOldNotifications() {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            const result = await Notification.deleteMany({
                createdAt: { $lt: thirtyDaysAgo },
                read: true // Solo eliminar las leídas
            });

            if (result.deletedCount > 0) {
                console.log(`🗑️ Notificaciones antiguas eliminadas: ${result.deletedCount}`);
            }
        } catch (error) {
            console.error('❌ Error limpiando notificaciones:', error.message);
        }
    }
}

// Exportar instancia singleton
module.exports = new NotificationScheduler();
