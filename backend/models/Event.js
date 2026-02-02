const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    place: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    image: { type: String }, // URL o path de la imagen del evento
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
          type: String,
          enum: ['interested', 'not_interested', 'maybe', 'going'],
          required: true
        },
        updatedAt: { type: Date, default: Date.now }
      }
    ]
}, { timestamps: true });

EventSchema.index({ place: 1, date: 1 });

module.exports = mongoose.model('Event', EventSchema);
