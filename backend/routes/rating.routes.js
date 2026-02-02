const express = require('express');
const { protect } = require('../utils/authMiddleware');
const { moderateBeforeSave, rateLimit } = require('../middleware/moderation.middleware');

const { 
    addRating, 
    getRatingsForPlace, 
    upvoteRating,
    downvoteRating,
    getCommentsForRating,
    addCommentToRating,
} = require('../controllers/rating.controller');

const router = express.Router();

// Crear o actualizar rating (con moderación y rate limiting)
router.post('/', protect, rateLimit('rating', { perMinute: 3 }), moderateBeforeSave, addRating);

// Obtener ratings de un lugar
router.get('/:placeId', getRatingsForPlace);

// Votar ratings
router.put('/:id/upvote', protect, upvoteRating);
router.put('/:id/downvote', protect, downvoteRating);

// Comentarios de calificaciones (con moderación y rate limiting)
router.get('/:id/comments', getCommentsForRating);
router.post('/:id/comments', protect, rateLimit('comment', { perMinute: 5 }), moderateBeforeSave, addCommentToRating);

module.exports = router;
