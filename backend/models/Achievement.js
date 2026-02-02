const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  category: {
    type: String,
    enum: ['CONTRIBUTION', 'COMMUNITY', 'EXPLORATION', 'ENGAGEMENT', 'SPECIAL'],
    required: true
  },
  requirements: {
    type: {
      type: String,
      enum: ['REVIEWS_COUNT', 'PLACES_VISITED', 'REPORTS_FILED', 'COMMENTS_COUNT', 'EVENTS_ATTENDED', 'RATINGS_GIVEN', 'CUSTOM'],
      required: true
    },
    value: Number,
    description: String
  },
  rewards: {
    xp: { type: Number, default: 0 },
    badge: { type: String },
    title: { type: String }
  },
  rarity: {
    type: String,
    enum: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'],
    default: 'COMMON'
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Achievement', AchievementSchema);
