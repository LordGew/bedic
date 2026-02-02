const mongoose = require('mongoose');

const communityPolicySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['TERMS', 'PRIVACY', 'MODERATION_POLICY', 'APPEALS_PROCESS', 'CODE_OF_CONDUCT'],
      required: true,
      unique: true
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    version: {
      type: Number,
      default: 1
    },
    language: {
      type: String,
      enum: ['es', 'en'],
      default: 'es'
    },
    effectiveDate: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Índice para búsquedas rápidas
communityPolicySchema.index({ type: 1, language: 1 });

module.exports = mongoose.model('CommunityPolicy', communityPolicySchema);
