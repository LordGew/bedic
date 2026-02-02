const mongoose = require('mongoose');

// Estructura de datos base para Places
const PlaceSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    description: { type: String, trim: true },

    coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitud, latitud]
    },
    address: { type: String },
    
    // Campos de ubicación para filtros
    department: { type: String, trim: true },
    city: { type: String, trim: true },
    sector: { type: String, trim: true },
    
    rating: { type: Number, default: 0 },
    verified: { type: Boolean, default: false }, 
    source: { type: String, enum: ['Google Places', 'OpenStreetMap', 'Community'], required: true }, 
    concurrence: { type: Number, default: 0 },
    adminCreated: { type: Boolean, default: false },
    
    // Campo para fotos oficiales
    officialImages: {
        type: [String], 
        default: []
    }
}, { timestamps: true }); 

PlaceSchema.index({ coordinates: '2dsphere' });

// --- NUEVO: ÍNDICE DE TEXTO para búsqueda por palabras clave (q) ---
PlaceSchema.index({ name: 'text', category: 'text' });
// ----------------------------------------------------------------

module.exports = mongoose.model('Place', PlaceSchema);