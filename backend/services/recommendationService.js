const Recommendation = require('../models/Recommendation');

/**
 * Actualiza las preferencias del usuario según su interacción reciente.
 * @param {String} userId
 * @param {Object} data { category, distance, time }
 */
async function updateUserPreferences(userId, data) {
  const { category, distance, time } = data;
  const timePeriod = getTimePeriod(time);

  let rec = await Recommendation.findOne({ user: userId });
  if (!rec) {
    rec = new Recommendation({ user: userId, preferences: { categories: [], timePatterns: [] } });
  }

  // --- Actualiza categoría ---
  const catIndex = rec.preferences.categories.indexOf(category);
  if (catIndex === -1) rec.preferences.categories.push(category);

  // --- Actualiza patrón horario ---
  const timeIndex = rec.preferences.timePatterns.findIndex(p => p.period === timePeriod);
  if (timeIndex >= 0) rec.preferences.timePatterns[timeIndex].frequency += 1;
  else rec.preferences.timePatterns.push({ period: timePeriod, frequency: 1 });

  // --- Actualiza distancia promedio (suavizado exponencial) ---
  if (distance) {
    rec.preferences.avgDistance = rec.preferences.avgDistance
      ? (rec.preferences.avgDistance * 0.8 + distance * 0.2)
      : distance;
  }

  rec.lastUpdated = new Date();
  await rec.save();

  return rec;
}

/**
 * Retorna recomendaciones priorizadas según las preferencias del usuario.
 * Ejemplo: sugerir lugares cercanos o categorías populares para el usuario.
 */
async function getUserRecommendations(userId) {
  const rec = await Recommendation.findOne({ user: userId });
  if (!rec) return { message: "Sin datos de recomendación aún." };

  return {
    preferredCategories: rec.preferences.categories.slice(-3), // Últimas 3 categorías
    avgDistance: rec.preferences.avgDistance || 1000,
    activeTime: getMostActiveTime(rec.preferences.timePatterns)
  };
}

function getTimePeriod(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Mañana";
  if (hour < 18) return "Tarde";
  return "Noche";
}

function getMostActiveTime(patterns) {
  if (!patterns.length) return null;
  return patterns.reduce((a, b) => (a.frequency > b.frequency ? a : b)).period;
}

module.exports = { updateUserPreferences, getUserRecommendations };
