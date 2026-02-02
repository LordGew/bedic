const mongoose = require('mongoose');

const ScriptActivitySchema = new mongoose.Schema({
  scriptName: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'error', 'running', 'warning'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  stats: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Índice para búsquedas rápidas
ScriptActivitySchema.index({ scriptName: 1, timestamp: -1 });

module.exports = mongoose.model('ScriptActivity', ScriptActivitySchema);
