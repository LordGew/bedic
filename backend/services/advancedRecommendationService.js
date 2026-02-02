const Place = require('../models/Place');
const Recommendation = require('../models/Recommendation');
const UserEngagement = require('../models/UserEngagement');
const Event = require('../models/Event');

/**
 * Puntos de engagement por tipo de evento
 */
const ENGAGEMENT_POINTS = {
  VIEW: 1,
  POPUP_OPEN: 2,
  DETAIL_VIEW: 5,
  PHOTO_VIEW: 3,
  SHARE: 8,
  RATING: 10,
  REVIEW: 15,
  SAVE: 12,
  NAVIGATE: 20,
  SKIP: -2,
  HIDE: -5
};

/**
 * Registra un evento de engagement del usuario
 */
async function trackEngagement(userId, placeId, eventType, duration = 0) {
  const points = ENGAGEMENT_POINTS[eventType] || 0;
  const timeBonus = Math.min(duration / 60, 5); // Máx 5 puntos por 1 min
  
  const eventKey = eventType.toLowerCase().replace('_', '');
  
  await UserEngagement.findOneAndUpdate(
    { user: userId, place: placeId },
    {
      $inc: {
        totalPoints: points + timeBonus,
        [`events.${eventKey}`]: 1,
        totalTimeSpent: duration
      },
      $set: { lastInteraction: new Date() }
    },
    { upsert: true, new: true }
  );
  
  return { success: true, points: points + timeBonus };
}

/**
 * Calcula el score de un lugar para un usuario específico
 */
async function calculatePlaceScore(place, userProfile, context) {
  let score = 0;
  
  // FACTOR 1: Afinidad de Categoría (40%)
  const categories = Array.isArray(userProfile?.preferences?.categories)
    ? userProfile.preferences.categories
    : [];
  const categoryIndex = categories.indexOf(place.category);
  if (categoryIndex !== -1) {
    const recencyScore = (12 - categoryIndex) / 12;
    score += recencyScore * 0.4;
  }
  
  // FACTOR 2: Engagement Histórico (25%)
  const engagement = await UserEngagement.findOne({
    user: userProfile.user,
    place: place._id
  });
  
  if (engagement) {
    const engagementScore = Math.min(engagement.totalPoints / 100, 1);
    score += engagementScore * 0.25;
  }
  
  // FACTOR 3: Rating del Lugar (15%)
  const rating = typeof place.rating === 'number' ? place.rating : (place.rating?.average || 0);
  score += (rating / 5.0) * 0.15;
  
  // FACTOR 4: Distancia Óptima (10%)
  if (context.userLocation && userProfile?.preferences?.avgDistance) {
    const distanceToPlace = calculateDistance(
      context.userLocation,
      place.coordinates.coordinates
    );
    const userAvgDistance = userProfile.preferences.avgDistance;
    const distanceScore = 1 - Math.abs(distanceToPlace - userAvgDistance) / userAvgDistance;
    score += Math.max(distanceScore, 0) * 0.10;
  }
  
  // FACTOR 5: Novedad (5%)
  if (!engagement || engagement.totalPoints < 10) {
    score += 0.05;
  }
  
  // FACTOR 6: Contexto Temporal (5%)
  const currentPeriod = getTimePeriod(new Date());
  const dominantPeriod = getDominantPeriod(userProfile.preferences.timePatterns || []);
  if (currentPeriod === dominantPeriod) {
    score += 0.05;
  }
  
  if (context && context.eventsByPlace) {
    const key = place._id.toString();
    const count = context.eventsByPlace[key];
    if (count && count > 0) {
      const capped = Math.min(count, 3);
      const eventBoost = (capped / 3) * 0.05;
      score += eventBoost;
    }
  }
  
  return score;
}

/**
 * Calcula distancia entre dos puntos (en metros)
 */
function calculateDistance(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Obtiene el período del día
 */
function getTimePeriod(date) {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night';
}

/**
 * Obtiene el período dominante del usuario
 */
function getDominantPeriod(timePatterns) {
  if (!timePatterns || timePatterns.length === 0) return null;
  
  return timePatterns.reduce((max, current) =>
    current.frequency > max.frequency ? current : max
  ).period;
}

/**
 * Aplica decay temporal a las preferencias
 */
function applyTemporalDecay(preferences) {
  const now = Date.now();
  const DECAY_DAYS = 30;
  
  if (!preferences.categoryTimestamps) {
    preferences.categoryTimestamps = {};
  }
  
  const baseCategories = Array.isArray(preferences.categories)
    ? preferences.categories
    : [];

  const decayedCategories = baseCategories.map((cat, index) => {
    const timestamp = preferences.categoryTimestamps[cat] || now;
    const daysSince = (now - timestamp) / (1000 * 60 * 60 * 24);
    const decay = Math.exp(-daysSince / DECAY_DAYS);
    
    return {
      category: cat,
      weight: ((12 - index) / 12) * decay
    };
  })
  .sort((a, b) => b.weight - a.weight)
  .map(item => item.category);
  
  preferences.categories = decayedCategories;
  return preferences;
}

/**
 * Asegura diversidad en las recomendaciones
 */
function ensureDiversity(recommendations) {
  const result = [];
  const categoryCount = {};
  const MAX_PER_CATEGORY = 3;
  
  for (const rec of recommendations) {
    const cat = rec.place.category;
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    
    if (categoryCount[cat] <= MAX_PER_CATEGORY) {
      result.push(rec);
    }
    
    // Cada 5 lugares, intentar diversificar
    if (result.length > 0 && result.length % 5 === 0) {
      const usedCategories = Object.keys(categoryCount);
      const nextRec = recommendations.find(r =>
        !usedCategories.includes(r.place.category) &&
        !result.includes(r)
      );
      if (nextRec) {
        result.push(nextRec);
        categoryCount[nextRec.place.category] = 1;
      }
    }
  }
  
  return result;
}

/**
 * Mezcla un array (Fisher-Yates shuffle)
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Obtiene recomendaciones avanzadas (estilo TikTok)
 */
async function getAdvancedRecommendations(userId, location, radius = 5000, count = 20) {
  // Normalizar ubicación
  let safeLocation = Array.isArray(location) && location.length === 2
    ? location
    : [0, 0];

  // Obtener perfil del usuario
  let userProfile = await Recommendation.findOne({ user: userId });
  
  if (!userProfile) {
    // Usuario nuevo: recomendaciones generales
    return getDefaultRecommendations(safeLocation, radius, count);
  }
  
  // Aplicar decay temporal
  if (!userProfile.preferences) {
    userProfile.preferences = {
      categories: [],
      avgDistance: null,
      timePatterns: [],
      categoryTimestamps: {}
    };
  }

  userProfile.preferences = applyTemporalDecay(userProfile.preferences);
  
  // 80% Explotación (lo que le gusta)
  // 20% Exploración (cosas nuevas)
  const exploitCount = Math.floor(count * 0.8);
  const exploreCount = count - exploitCount;
  
  // EXPLOTACIÓN: Lugares con alto score
  const exploitPlaces = await Place.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: safeLocation
        },
        $maxDistance: radius
      }
    }
  }).limit(exploitCount * 3);
  
  const placeIds = exploitPlaces.map(p => p._id);
  const now = new Date();
  let eventsByPlace = {};
  
  if (placeIds.length) {
    const upcoming = await Event.aggregate([
      {
        $match: {
          place: { $in: placeIds },
          date: { $gte: now }
        }
      },
      {
        $group: {
          _id: '$place',
          count: { $sum: 1 }
        }
      }
    ]);
    upcoming.forEach((doc) => {
      eventsByPlace[doc._id.toString()] = doc.count;
    });
  }
  
  const scoredExploit = await Promise.all(
    exploitPlaces.map(async place => ({
      place,
      score: await calculatePlaceScore(place, userProfile, { userLocation: location, eventsByPlace }),
      isExploration: false
    }))
  );
  
  scoredExploit.sort((a, b) => b.score - a.score);
  const topExploit = scoredExploit.slice(0, exploitCount);
  
  // EXPLORACIÓN: Categorías no exploradas
  const allCategories = [
    'Restaurante', 'Cafetería', 'Bar', 'Parque', 'Museo',
    'Hotel', 'Tienda', 'Supermercado', 'Farmacia', 'Cine',
    'Teatro', 'Biblioteca', 'Banco', 'Centro Deportivo'
  ];
  
  const unexploredCategories = allCategories.filter(
    cat => !userProfile.preferences.categories.includes(cat)
  );
  
  let explorePlaces = [];
  if (unexploredCategories.length > 0) {
    explorePlaces = await Place.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: safeLocation },
          distanceField: 'distance',
          maxDistance: radius * 1.5,
          spherical: true,
          query: { category: { $in: unexploredCategories } }
        }
      },
      { $sample: { size: exploreCount } }
    ]);
  }
  
  const scoredExplore = explorePlaces.map(place => ({
    place,
    score: 0.5,
    isExploration: true
  }));
  
  // Mezclar y aplicar diversidad
  let allRecommendations = shuffle([...topExploit, ...scoredExplore]);
  allRecommendations = ensureDiversity(allRecommendations);
  
  return allRecommendations.slice(0, count).map(rec => ({
    ...rec.place.toObject ? rec.place.toObject() : rec.place,
    _score: rec.score,
    _isExploration: rec.isExploration
  }));
}

/**
 * Recomendaciones por defecto para usuarios nuevos
 */
async function getDefaultRecommendations(location, radius, count) {
  const places = await Place.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: location },
        distanceField: 'distance',
        maxDistance: radius,
        spherical: true
      }
    },
    { $sort: { rating: -1, distance: 1 } },
    { $limit: count }
  ]);
  
  return places.map(place => ({
    ...place,
    _score: place.rating / 5.0,
    _isExploration: false
  }));
}

/**
 * Obtiene engagement por categoría para el usuario
 */
async function getEngagementByCategory(userId) {
  const engagements = await UserEngagement.aggregate([
    { $match: { user: userId } },
    {
      $lookup: {
        from: 'places',
        localField: 'place',
        foreignField: '_id',
        as: 'placeData'
      }
    },
    { $unwind: '$placeData' },
    {
      $group: {
        _id: '$placeData.category',
        totalPoints: { $sum: '$totalPoints' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalPoints: -1 } }
  ]);
  
  const result = {};
  engagements.forEach(eng => {
    result[eng._id] = eng.totalPoints;
  });
  
  return result;
}

module.exports = {
  trackEngagement,
  getAdvancedRecommendations,
  getEngagementByCategory,
  calculatePlaceScore
};
