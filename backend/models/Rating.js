const mongoose = require('mongoose');

// Modelo para manejar Calificaciones y Comentarios (positivos/negativos)
const RatingSchema = new mongoose.Schema({
    place: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Puntuación de 1 a 5 estrellas
    score: { 
        type: Number, 
        min: 1, 
        max: 5, 
        required: [true, 'Se requiere una puntuación (1-5).'] 
    },
    
    // Comentario asociado (Positivo o Negativo)
    comment: { 
        type: String, 
        trim: true,
        maxlength: [500, 'El comentario no puede exceder los 500 caracteres.']
    },
    
    // Votos (para que otros usuarios validen el comentario)
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Moderación
    is_moderated: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },

}, { timestamps: true });

// Asegurar que un usuario solo pueda calificar un lugar una vez
RatingSchema.index({ place: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);