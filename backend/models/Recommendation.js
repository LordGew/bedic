// models/Recommendation.js
const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  preferences: {
    categories: [{ type: String }],  // ordenadas por preferencia
    timePatterns: [{
      period: String,
      frequency: Number
    }],
    avgDistance: { type: Number, default: 0 }, // metros
    categoryTimestamps: { type: Map, of: Date },
  },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recommendation', RecommendationSchema);
