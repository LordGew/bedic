const Place = require('../models/Place');
const User = require('../models/User');
const mongoose = require('mongoose');

class RecommendationEngine {
  /**
   * Obtiene una recomendación personalizada para un usuario
   * @param {String} userId - ID del usuario
   * @param {Object} userActivity - Actividad del usuario {lastSearch, lastFilter, lastCategory, hiddenPlaces}
   * @returns {Promise<Object>} Lugar recomendado
   */
  async getPersonalizedRecommendation(userId, userActivity = {}) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.location) {
        return await this.getRandomRecommendation(userActivity.hiddenPlaces || []);
      }

      // Determinar el criterio principal basado en la actividad del usuario
      const criterion = this.determineCriterion(userActivity);
      
      console.log(`📍 Recomendación para usuario ${userId} usando criterio: ${criterion}`);

      let recommendation;

      switch (criterion) {
        case 'location':
          recommendation = await this.recommendByLocation(user.location, userActivity.hiddenPlaces);
          break;
        case 'category':
          recommendation = await this.recommendByCategory(userActivity.lastCategory, userActivity.hiddenPlaces);
          break;
        case 'keyword':
          recommendation = await this.recommendByKeyword(userActivity.lastSearch, userActivity.hiddenPlaces);
          break;
        case 'random':
          recommendation = await this.getRandomRecommendation(userActivity.hiddenPlaces);
          break;
        default:
          recommendation = await this.recommendByLocation(user.location, userActivity.hiddenPlaces);
      }

      return recommendation;
    } catch (error) {
      console.error('Error en getPersonalizedRecommendation:', error);
      return await this.getRandomRecommendation(userActivity.hiddenPlaces || []);
    }
  }

  /**
   * Determina el criterio principal basado en la actividad del usuario
   */
  determineCriterion(userActivity) {
    const { lastSearch, lastFilter, lastCategory, isActiveUser } = userActivity;

    // Si el usuario es activo (usa buscador, filtros y ubicación), recomendar al azar
    if (isActiveUser) {
      return 'random';
    }

    // Si usó el buscador, criterio principal es palabra clave
    if (lastSearch && lastSearch.trim().length > 0) {
      return 'keyword';
    }

    // Si usó el filtro, criterio principal es categoría
    if (lastFilter || lastCategory) {
      return 'category';
    }

    // Por defecto, criterio principal es ubicación
    return 'location';
  }

  /**
   * Recomienda un lugar basado en la ubicación del usuario
   */
  async recommendByLocation(userLocation, hiddenPlaces = []) {
    try {
      if (!userLocation || !userLocation.coordinates) {
        return null;
      }

      const [longitude, latitude] = userLocation.coordinates;

      // Buscar lugares cercanos (dentro de 5km)
      const nearbyPlaces = await Place.find({
        _id: { $nin: hiddenPlaces },
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: 5000 // 5km
          }
        }
      })
        .limit(10)
        .select('_id name category rating location');

      if (nearbyPlaces.length === 0) {
        return null;
      }

      // Seleccionar el primero (más cercano)
      return nearbyPlaces[0];
    } catch (error) {
      console.error('Error en recommendByLocation:', error);
      return null;
    }
  }

  /**
   * Recomienda un lugar basado en la categoría
   */
  async recommendByCategory(category, hiddenPlaces = []) {
    try {
      if (!category) {
        return null;
      }

      const place = await Place.findOne({
        _id: { $nin: hiddenPlaces },
        isActive: true,
        category: category
      })
        .select('_id name category rating location')
        .lean();

      return place || null;
    } catch (error) {
      console.error('Error en recommendByCategory:', error);
      return null;
    }
  }

  /**
   * Recomienda un lugar basado en palabra clave
   */
  async recommendByKeyword(keyword, hiddenPlaces = []) {
    try {
      if (!keyword || keyword.trim().length === 0) {
        return null;
      }

      // Buscar en nombre y descripción
      const place = await Place.findOne({
        _id: { $nin: hiddenPlaces },
        isActive: true,
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
          { category: { $regex: keyword, $options: 'i' } }
        ]
      })
        .select('_id name category rating location')
        .lean();

      return place || null;
    } catch (error) {
      console.error('Error en recommendByKeyword:', error);
      return null;
    }
  }

  /**
   * Obtiene una recomendación aleatoria
   */
  async getRandomRecommendation(hiddenPlaces = []) {
    try {
      const count = await Place.countDocuments({
        _id: { $nin: hiddenPlaces },
        isActive: true
      });

      if (count === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * count);

      const place = await Place.findOne({
        _id: { $nin: hiddenPlaces },
        isActive: true
      })
        .skip(randomIndex)
        .select('_id name category rating location')
        .lean();

      return place || null;
    } catch (error) {
      console.error('Error en getRandomRecommendation:', error);
      return null;
    }
  }

  /**
   * Registra la actividad del usuario (búsqueda, filtro, etc.)
   */
  async recordUserActivity(userId, activityType, activityData) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Inicializar objeto de actividad si no existe
      if (!user.activityLog) {
        user.activityLog = {};
      }

      switch (activityType) {
        case 'search':
          user.activityLog.lastSearch = activityData.query;
          user.activityLog.lastSearchTime = new Date();
          break;
        case 'filter':
          user.activityLog.lastFilter = activityData.filter;
          user.activityLog.lastCategory = activityData.category;
          user.activityLog.lastFilterTime = new Date();
          break;
        case 'location':
          user.activityLog.lastLocationSearch = activityData.location;
          user.activityLog.lastLocationTime = new Date();
          break;
        case 'hide_place':
          if (!user.hiddenPlaces) {
            user.hiddenPlaces = [];
          }
          if (!user.hiddenPlaces.includes(activityData.placeId)) {
            user.hiddenPlaces.push(activityData.placeId);
          }
          break;
      }

      await user.save();
    } catch (error) {
      console.error('Error en recordUserActivity:', error);
    }
  }

  /**
   * Determina si el usuario es activo
   */
  isActiveUser(userActivity) {
    const { lastSearch, lastFilter, lastLocationSearch, lastSearchTime, lastFilterTime, lastLocationTime } = userActivity;
    
    // Considerar activo si ha usado al menos 2 de los 3 criterios en los últimos 7 días
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    let criteriaUsed = 0;
    
    if (lastSearch && lastSearchTime && new Date(lastSearchTime) > sevenDaysAgo) criteriaUsed++;
    if (lastFilter && lastFilterTime && new Date(lastFilterTime) > sevenDaysAgo) criteriaUsed++;
    if (lastLocationSearch && lastLocationTime && new Date(lastLocationTime) > sevenDaysAgo) criteriaUsed++;
    
    return criteriaUsed >= 2;
  }
}

module.exports = new RecommendationEngine();
