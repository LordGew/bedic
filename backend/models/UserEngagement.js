const mongoose = require('mongoose');

/**
 * Modelo para rastrear el engagement detallado del usuario con lugares
 */
const UserEngagementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  place: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place',
    required: true
  },
  
  // Puntos totales de engagement
  totalPoints: {
    type: Number,
    default: 0
  },
  
  // Contador de eventos específicos
  events: {
    view: { type: Number, default: 0 },           // Vio en el mapa
    popupOpen: { type: Number, default: 0 },      // Abrió popup
    detailView: { type: Number, default: 0 },     // Vio detalles
    photoView: { type: Number, default: 0 },      // Vio fotos
    share: { type: Number, default: 0 },          // Compartió
    rating: { type: Number, default: 0 },         // Calificó
    review: { type: Number, default: 0 },         // Dejó reseña
    save: { type: Number, default: 0 },           // Guardó
    navigate: { type: Number, default: 0 },       // Navegó
    skip: { type: Number, default: 0 },           // Cerró rápido
    hide: { type: Number, default: 0 }            // Ocultó
  },
  
  // Tiempo total de interacción (segundos)
  totalTimeSpent: {
    type: Number,
    default: 0
  },
  
  // Última interacción
  lastInteraction: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Índices para búsquedas rápidas
UserEngagementSchema.index({ user: 1, place: 1 }, { unique: true });
UserEngagementSchema.index({ user: 1, totalPoints: -1 });
UserEngagementSchema.index({ lastInteraction: -1 });

module.exports = mongoose.model('UserEngagement', UserEngagementSchema);
