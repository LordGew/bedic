const mongoose = require('mongoose');

const RatingCommentSchema = new mongoose.Schema(
  {
    rating: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rating',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    censored: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RatingComment', RatingCommentSchema);
