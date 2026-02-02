const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  categories: [{ type: String }],
  pinned: { type: Boolean, default: false },
  
  // Ubicación en el mapa
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: false
    },
    address: { type: String }
  },
  
  // Duración del anuncio
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  durationDays: { type: Number, default: 7 }, // días de duración
  
  // Estado
  status: { 
    type: String, 
    enum: ['active', 'expired', 'draft', 'archived'],
    default: 'active'
  },
  
  // Creador
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  
  // Estadísticas
  views: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  
  // Imagen/foto del anuncio
  imageUrl: { type: String },
  
  // Enlace externo (opcional)
  externalLink: { type: String },
  
  // Tipo de anuncio
  type: {
    type: String,
    enum: ['promotion', 'event', 'alert', 'general'],
    default: 'general'
  }
}, { timestamps: true });

// Índice geoespacial para búsquedas por ubicación
AnnouncementSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
