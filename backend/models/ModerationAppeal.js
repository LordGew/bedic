const mongoose = require('mongoose');

const ModerationAppealSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Tipo principal de apelación
  type: {
    type: String,
    enum: ['SUSPENSION', 'STRIKES'],
    default: 'SUSPENSION',
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  adminResponse: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  // Snapshot del estado en el momento de la apelación
  strikesAtCreation: {
    type: Number,
    default: 0,
  },
  suspendedUntilAtCreation: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('ModerationAppeal', ModerationAppealSchema);
