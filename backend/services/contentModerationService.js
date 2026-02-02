// backend/services/contentModerationService.js
// const axios = require('axios'); // No necesario - no usamos APIs externas de moderación
const badWordsDict = require('../config/badWordsDict');

// Importar diccionario estructurado por niveles
const badWords = badWordsDict;

// Patrones de spam
const spamPatterns = {
  repeatedChars: /(.)\1{4,}/g,           // "aaaaaaa"
  excessiveCaps: /[A-Z]{10,}/g,          // "COMPRAAAA"
  urls: /(https?:\/\/[^\s]+)/g,          // Links
  phoneNumbers: /\d{10,}/g,              // Teléfonos
  emails: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
};

/**
 * Detecta palabras prohibidas en el texto y devuelve nivel de severidad
 */
function detectBadWords(text, language = 'es') {
  if (!text) return { detected: false };
  
  const dict = badWords[language] || badWords.es;
  const textLower = text.toLowerCase();
  
  // Buscar en orden de severidad (SEVERO > MODERADO > LEVE)
  for (const level of ['SEVERO', 'MODERADO', 'LEVE']) {
    const words = dict[level] || [];
    for (const word of words) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(textLower)) {
        return { detected: true, level, word };
      }
    }
  }
  
  return { detected: false };
}

/**
 * Detecta spam en el texto
 */
function detectSpam(text) {
  if (!text) return { isSpam: false, score: 0 };
  
  let score = 0;
  const indicators = [];
  
  if (spamPatterns.repeatedChars.test(text)) {
    score += 20;
    indicators.push('repeated_chars');
  }
  
  if (spamPatterns.excessiveCaps.test(text)) {
    score += 15;
    indicators.push('excessive_caps');
  }
  
  const urlMatches = text.match(spamPatterns.urls);
  if (urlMatches && urlMatches.length > 2) {
    score += 30;
    indicators.push('multiple_urls');
  }
  
  if (spamPatterns.phoneNumbers.test(text)) {
    score += 25;
    indicators.push('phone_number');
  }
  
  if (spamPatterns.emails.test(text)) {
    score += 25;
    indicators.push('email');
  }
  
  return {
    isSpam: score >= 50,
    score,
    indicators
  };
}

/**
 * Analiza contenido con Perspective API (Google)
 * Requiere: PERSPECTIVE_API_KEY en .env
 */
async function analyzeToxicity(text, language = 'es') {
  const apiKey = process.env.PERSPECTIVE_API_KEY;
  
  // Si no hay API key, usar solo filtros básicos
  if (!apiKey) {
    console.warn('PERSPECTIVE_API_KEY not configured, using basic filters only');
    return {
      toxicity: 0,
      severe_toxicity: 0,
      insult: 0,
      profanity: 0,
      threat: 0,
      usingBasicFilters: true
    };
  }
  
  try {
    const response = await axios.post(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`,
      {
        comment: { text },
        languages: [language],
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          INSULT: {},
          PROFANITY: {},
          THREAT: {}
        }
      },
      { timeout: 5000 }
    );
    
    const scores = response.data.attributeScores;
    
    return {
      toxicity: scores.TOXICITY?.summaryScore?.value || 0,
      severe_toxicity: scores.SEVERE_TOXICITY?.summaryScore?.value || 0,
      insult: scores.INSULT?.summaryScore?.value || 0,
      profanity: scores.PROFANITY?.summaryScore?.value || 0,
      threat: scores.THREAT?.summaryScore?.value || 0,
      usingBasicFilters: false
    };
  } catch (error) {
    console.error('Perspective API error:', error.message);
    // Fallback a filtros básicos
    return {
      toxicity: 0,
      severe_toxicity: 0,
      insult: 0,
      profanity: 0,
      threat: 0,
      usingBasicFilters: true,
      error: error.message
    };
  }
}

/**
 * Moderación completa de contenido
 */
async function moderateContent(text, language = 'es', userId = null) {
  if (!text || text.trim().length === 0) {
    return {
      approved: false,
      reason: 'EMPTY_CONTENT',
      action: 'REJECT'
    };
  }
  
  // 1. Filtro de palabras prohibidas (instantáneo)
  const badWordCheck = detectBadWords(text, language);
  if (badWordCheck.detected) {
    const thresholds = { LEVE: 0.3, MODERADO: 0.7, SEVERO: 1.0 };
    const severity = thresholds[badWordCheck.level] || 0.5;
    
    // Palabras severas siempre se rechazan
    if (severity >= 0.7) {
      return {
        approved: false,
        reason: 'BAD_WORDS',
        action: 'REJECT',
        badWordLevel: badWordCheck.level,
        badWord: badWordCheck.word,
        message: 'Tu comentario contiene lenguaje inapropiado'
      };
    }
    
    // Palabras leves se marcan para revisión
    return {
      approved: true,
      reason: 'MILD_LANGUAGE',
      action: 'FLAG_FOR_REVIEW',
      badWordLevel: badWordCheck.level,
      badWord: badWordCheck.word,
      requiresReview: true,
      message: 'Tu comentario contiene lenguaje que podría ser inapropiado'
    };
  }
  
  // 2. Detector de spam
  const spamCheck = detectSpam(text);
  if (spamCheck.isSpam) {
    return {
      approved: false,
      reason: 'SPAM',
      action: 'REJECT',
      spamScore: spamCheck.score,
      indicators: spamCheck.indicators,
      message: 'Tu comentario parece spam'
    };
  }
  
  // 3. Análisis de toxicidad con IA
  const toxicityScores = await analyzeToxicity(text, language);
  
  // Umbrales de moderación
  const THRESHOLDS = {
    AUTO_REJECT: 0.85,    // Bloqueo automático
    AUTO_FLAG: 0.65,      // Marcar para revisión
    AUTO_APPROVE: 0.50    // Aprobado automático
  };
  
  const maxScore = Math.max(
    toxicityScores.toxicity,
    toxicityScores.severe_toxicity,
    toxicityScores.insult,
    toxicityScores.threat
  );
  
  // Decisión de moderación
  if (maxScore >= THRESHOLDS.AUTO_REJECT) {
    return {
      approved: false,
      reason: 'HIGH_TOXICITY',
      action: 'REJECT',
      toxicityScore: maxScore,
      scores: toxicityScores,
      message: 'Tu comentario viola nuestras políticas de comunidad'
    };
  }
  
  if (maxScore >= THRESHOLDS.AUTO_FLAG) {
    return {
      approved: true,
      reason: 'MODERATE_TOXICITY',
      action: 'FLAG_FOR_REVIEW',
      toxicityScore: maxScore,
      scores: toxicityScores,
      requiresReview: true
    };
  }
  
  // Contenido aprobado
  return {
    approved: true,
    reason: 'CLEAN_CONTENT',
    action: 'APPROVE',
    toxicityScore: maxScore,
    scores: toxicityScores
  };
}

/**
 * Calcula el trust score de un usuario
 */
function calculateTrustScore(user) {
  let score = 0;
  
  // Factores positivos
  score += user.emailVerified ? 10 : 0;
  score += user.phoneVerified ? 20 : 0;
  
  // Antigüedad de la cuenta (días)
  const accountAge = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  score += Math.min(accountAge * 2, 200); // Max 200 puntos por antigüedad
  
  // Contribuciones positivas
  score += (user.reviewCount || 0) * 5;
  score += (user.photoCount || 0) * 3;
  score += (user.helpfulVotes || 0) * 2;
  
  // Factores negativos
  score -= (user.strikes || 0) * 50;
  score -= (user.deletedComments || 0) * 10;
  score -= (user.reportedContent || 0) * 20;
  
  return Math.max(0, score);
}

/**
 * Determina el nivel de moderación según reputación
 */
function getModerationLevel(trustScore) {
  if (trustScore < 50) return 'STRICT';      // Usuario nuevo
  if (trustScore < 200) return 'NORMAL';     // Usuario regular
  if (trustScore < 500) return 'RELAXED';    // Usuario confiable
  return 'MINIMAL';                          // Usuario verificado
}

module.exports = {
  detectBadWords,
  detectSpam,
  analyzeToxicity,
  moderateContent,
  calculateTrustScore,
  getModerationLevel
};
