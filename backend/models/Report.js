const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    // Contenido reportado (flexible)
    contentType: { 
        type: String, 
        enum: ['PLACE', 'REVIEW', 'COMMENT', 'USER', 'PHOTO'],
        required: true 
    },
    contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    
    // Backward compatibility
    place: { type: mongoose.Schema.Types.ObjectId, ref: 'Place' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Razón del reporte
    reason: { 
        type: String,
        enum: [
            'SPAM', 'HARASSMENT', 'HATE_SPEECH', 'VIOLENCE',
            'SEXUAL_CONTENT', 'FALSE_INFO', 'COPYRIGHT', 'OTHER'
        ],
        required: true 
    },
    type: { type: String }, // Backward compatibility
    description: { type: String, required: true },

    photo_url: { type: String },

    // Imágenes de evidencia
    evidenceImages: [{
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        caption: String,
        size: Number, // en bytes
        mimeType: String
    }],

    // Estado del reporte
    status: {
        type: String,
        enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED'],
        default: 'PENDING'
    },

    // Moderación automática
    autoModerated: { type: Boolean, default: false },
    moderationAction: { 
        type: String,
        enum: ['PENDING', 'APPROVED', 'HIDDEN', 'DELETED', 'USER_BANNED', 'CONTENT_WARNING', 'NO_ACTION']
    },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
    moderationNotes: { type: String },

    // Acciones tomadas
    actions: [{
        type: {
            type: String,
            enum: ['CONTENT_HIDDEN', 'CONTENT_DELETED', 'USER_WARNED', 'USER_MUTED', 'USER_BANNED', 'CONTENT_WARNING_ADDED']
        },
        takenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        takenAt: { type: Date, default: Date.now },
        reason: String,
        duration: Number // en horas, para muteos/suspensiones temporales
    }],

    // Seguimiento del usuario
    userNotified: { type: Boolean, default: false },
    notificationSentAt: { type: Date },

    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    is_moderated: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
