const recommendationEngine = require('../services/recommendationEngine');
const User = require('../models/User');
const Place = require('../models/Place');

/**
 * Obtiene una recomendación avanzada basada en ubicación (para Flutter)
 * @route GET /api/recommendations/advanced
 * @access Private
 */
exports.getAdvancedRecommendation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lon, radius = 5000, count = 1 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ 
        success: false, 
        message: 'Latitud y longitud requeridas' 
      });
    }

    // Obtener usuario y su actividad
    const user = await User.findById(userId).select('activityLog hiddenPlaces');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const activityLog = user.activityLog || {};
    const hiddenPlaces = user.hiddenPlaces || [];

    // Buscar lugares cercanos usando el campo 'coordinates' (GeoJSON)
    const places = await Place.find({
      'coordinates.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lon), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      _id: { $nin: hiddenPlaces },
      verified: true
    }).limit(parseInt(count) || 1);

    if (!places || places.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No hay lugares disponibles' 
      });
    }

    // Retornar solo el primer lugar (una sola recomendación)
    const recommendation = places[0];

    res.status(200).json({ 
      success: true, 
      data: [recommendation]
    });
  } catch (error) {
    console.error('Error en getAdvancedRecommendation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener recomendación' 
    });
  }
};

/**
 * Obtiene una recomendación personalizada para el usuario
 * @route GET /api/recommendations/personalized
 * @access Private
 */
exports.getPersonalizedRecommendation = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Obtener actividad del usuario
    const user = await User.findById(userId).select('activityLog hiddenPlaces location');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const activityLog = user.activityLog || {};
    const isActiveUser = recommendationEngine.isActiveUser(activityLog);

    const userActivity = {
      lastSearch: activityLog.lastSearch,
      lastFilter: activityLog.lastFilter,
      lastCategory: activityLog.lastCategory,
      lastSearchTime: activityLog.lastSearchTime,
      lastFilterTime: activityLog.lastFilterTime,
      lastLocationTime: activityLog.lastLocationTime,
      hiddenPlaces: user.hiddenPlaces || [],
      isActiveUser
    };

    // Obtener recomendación
    const recommendation = await recommendationEngine.getPersonalizedRecommendation(userId, userActivity);

    if (!recommendation) {
      return res.status(404).json({ 
        success: false, 
        message: 'No hay recomendaciones disponibles en este momento' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: recommendation,
      criterion: recommendationEngine.determineCriterion(userActivity)
    });
  } catch (error) {
    console.error('Error en getPersonalizedRecommendation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener recomendación' 
    });
  }
};

/**
 * Registra una búsqueda del usuario
 * @route POST /api/recommendations/record-search
 * @access Private
 */
exports.recordSearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Query requerida' });
    }

    await recommendationEngine.recordUserActivity(userId, 'search', { query });

    res.status(200).json({ success: true, message: 'Búsqueda registrada' });
  } catch (error) {
    console.error('Error en recordSearch:', error);
    res.status(500).json({ success: false, message: 'Error al registrar búsqueda' });
  }
};

/**
 * Registra un filtro del usuario
 * @route POST /api/recommendations/record-filter
 * @access Private
 */
exports.recordFilter = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter, category } = req.body;

    if (!filter && !category) {
      return res.status(400).json({ success: false, message: 'Filter o category requerida' });
    }

    await recommendationEngine.recordUserActivity(userId, 'filter', { filter, category });

    res.status(200).json({ success: true, message: 'Filtro registrado' });
  } catch (error) {
    console.error('Error en recordFilter:', error);
    res.status(500).json({ success: false, message: 'Error al registrar filtro' });
  }
};

/**
 * Registra que el usuario ocultó un lugar
 * @route POST /api/recommendations/hide-place
 * @access Private
 */
exports.hidePlace = async (req, res) => {
  try {
    const userId = req.user.id;
    const { placeId } = req.body;

    if (!placeId) {
      return res.status(400).json({ success: false, message: 'PlaceId requerida' });
    }

    await recommendationEngine.recordUserActivity(userId, 'hide_place', { placeId });

    res.status(200).json({ success: true, message: 'Lugar ocultado' });
  } catch (error) {
    console.error('Error en hidePlace:', error);
    res.status(500).json({ success: false, message: 'Error al ocultar lugar' });
  }
};
