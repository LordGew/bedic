const {
  trackEngagement,
  getAdvancedRecommendations,
  getEngagementByCategory
} = require('../services/advancedRecommendationService');

/**
 * POST /api/recommendations/track
 * Registra un evento de engagement del usuario
 */
exports.trackUserEngagement = async (req, res) => {
  try {
    const userId = req.user._id;
    const { placeId, eventType, duration } = req.body;
    
    if (!placeId || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'placeId y eventType son requeridos'
      });
    }
    
    const result = await trackEngagement(userId, placeId, eventType, duration || 0);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error tracking engagement:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/recommendations/advanced
 * Obtiene recomendaciones personalizadas avanzadas
 */
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { lat, lon, radius, count } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'lat y lon son requeridos'
      });
    }
    
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
      return res.status(400).json({
        success: false,
        message: 'lat y lon deben ser números válidos'
      });
    }

    const location = [parsedLon, parsedLat];
    const radiusMeters = parseInt(radius) || 5000;
    const resultCount = parseInt(count) || 20;
    
    const recommendations = await getAdvancedRecommendations(
      userId,
      location,
      radiusMeters,
      resultCount
    );
    
    res.json({
      success: true,
      data: recommendations,
      meta: {
        count: recommendations.length,
        location: { lat: parseFloat(lat), lon: parseFloat(lon) },
        radius: radiusMeters
      }
    });
  } catch (error) {
    console.error('Error getting recommendations (fallback to empty list):', error);
    res.status(200).json({
      success: true,
      data: [],
      meta: {
        count: 0,
        location: req.query?.lat && req.query?.lon
          ? { lat: parseFloat(req.query.lat), lon: parseFloat(req.query.lon) }
          : null,
        radius: req.query?.radius ? parseInt(req.query.radius) || 5000 : 5000,
        error: error.message
      }
    });
  }
};

/**
 * GET /api/recommendations/engagement-stats
 * Obtiene estadísticas de engagement del usuario
 */
exports.getEngagementStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const engagementByCategory = await getEngagementByCategory(userId);
    
    res.json({
      success: true,
      data: {
        byCategory: engagementByCategory
      }
    });
  } catch (error) {
    console.error('Error getting engagement stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;
