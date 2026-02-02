const mongoose = require('mongoose');

const ModerationLogSchema = new mongoose.Schema({
  // Tipo de acción
  actionType: {
    type: String,
    enum: [
      'COMMENT_HIDDEN',      // Comentario ocultado
      'COMMENT_DELETED',     // Comentario eliminado
      'USER_MUTED',          // Usuario silenciado
      'USER_BANNED',         // Usuario baneado
      'CONTENT_FLAGGED',     // Contenido marcado para revisión
      'SPAM_DETECTED',       // Spam detectado
      'BAD_WORDS_DETECTED'   // Malas palabras detectadas
    ],
    required: true
  },

  // Razón de la acción
  reason: {
    type: String,
    enum: [
      'BAD_WORDS_SEVERE',
      'BAD_WORDS_MODERATE',
      'BAD_WORDS_MILD',
      'SPAM_REPEATED_CHARS',
      'SPAM_EXCESSIVE_CAPS',
      'SPAM_MULTIPLE_URLS',
      'SPAM_PHONE_NUMBERS',
      'SPAM_EMAILS',
      'HIGH_TOXICITY',
      'MODERATE_TOXICITY',
      'REPEATED_VIOLATIONS',
      'USER_REPORTS'
    ],
    required: true
  },

  // Severidad
  severity: {
    type: String,
    enum: ['LEVE', 'MODERADO', 'SEVERO'],
    default: 'MODERADO'
  },

  // Contenido afectado
  contentType: {
    type: String,
    enum: ['COMMENT', 'RATING', 'REVIEW', 'REPORT', 'USER_PROFILE'],
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  contentText: {
    type: String,
    maxlength: 1000
  },

  // Usuario afectado
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  userEmail: String,

  // Detalles de la moderación
  detectedIssues: [{
    type: String,
    enum: [
      'bad_word',
      'repeated_chars',
      'excessive_caps',
      'multiple_urls',
      'phone_number',
      'email',
      'high_toxicity',
      'spam_pattern'
    ]
  }],

  // Scores y métricas
  toxicityScore: {
    type: Number,
    min: 0,
    max: 1
  },
  spamScore: {
    type: Number,
    min: 0,
    max: 100
  },
  trustScore: {
    type: Number,
    min: 0
  },

  // Información del usuario en el momento de la acción
  userStats: {
    totalComments: Number,
    deletedComments: Number,
    strikes: Number,
    accountAge: Number, // en días
    reputationLevel: String
  },

  // Acción tomada
  actionDetails: {
    // Para comentarios
    commentHidden: Boolean,
    commentDeleted: Boolean,
    
    // Para usuarios
    mutedUntil: Date,
    banReason: String,
    banPermanent: Boolean,
    
    // Para revisión manual
    flaggedForReview: Boolean,
    reviewPriority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    }
  },

  // Notificación al usuario
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationMessage: String,

  // Información de auditoría
  automatedAction: {
    type: Boolean,
    default: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String,

  // Apelación
  appealable: {
    type: Boolean,
    default: true
  },
  appealed: {
    type: Boolean,
    default: false
  },
  appealedAt: Date,
  appealReason: String,
  appealStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED']
  },

  // Metadata
  ipAddress: String,
  userAgent: String,

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Índices para búsquedas rápidas
ModerationLogSchema.index({ userId: 1, createdAt: -1 });
ModerationLogSchema.index({ actionType: 1, createdAt: -1 });
ModerationLogSchema.index({ contentType: 1, contentId: 1 });
ModerationLogSchema.index({ severity: 1 });
ModerationLogSchema.index({ automatedAction: 1 });
ModerationLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ModerationLog', ModerationLogSchema);
