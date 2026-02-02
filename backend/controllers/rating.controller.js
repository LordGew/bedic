// controllers/rating.controller.js
const Rating = require('../models/Rating');
const Place = require('../models/Place');
const RatingComment = require('../models/RatingComment');
const User = require('../models/User');
const { addContributionXP } = require('../services/reputation.service');

/**
 * Recalcular rating promedio del lugar en base a todas las calificaciones.
 */
async function recalcPlaceRating(placeId) {
  const agg = await Rating.aggregate([
    { $match: { place: placeId } },
    {
      $group: {
        _id: '$place',
        avgScore: { $avg: '$score' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (!agg.length) {
    // Si no hay ratings, reseteamos a 0
    await Place.findByIdAndUpdate(placeId, { rating: 0 });
    return;
  }

  const { avgScore } = agg[0];
  await Place.findByIdAndUpdate(placeId, { rating: avgScore });
}

/**
 * @desc   Crear o actualizar una calificación (Rating)
 * @route  POST /api/ratings
 * @access Private
 *
 * Body: { placeId, score (1-5), comment? }
 */
exports.addRating = async (req, res) => {
  const { placeId, score, comment } = req.body;
  const userId = req.user.id;

  if (!placeId || !score) {
    return res.status(400).json({
      success: false,
      message: 'Se requieren placeId y score.',
    });
  }

  try {
    // Asegurar que el lugar existe (opcional pero recomendado)
    const placeExists = await Place.findById(placeId).select('_id');
    if (!placeExists) {
      return res.status(404).json({
        success: false,
        message: 'Lugar no encontrado.',
      });
    }

    // Crear o actualizar rating del usuario para ese lugar
    const rating = await Rating.findOneAndUpdate(
      { place: placeId, user: userId },
      { place: placeId, user: userId, score, comment },
      { new: true, upsert: true, runValidators: true }
    );

    // Otorgar XP por la contribución
    try {
      if (comment && comment.trim().length > 10) {
        await addContributionXP(userId, 'POSITIVE_COMMENT');
      } else {
        await addContributionXP(userId, 'RATING_SUBMIT');
      }
    } catch (xpErr) {
      console.error('Error otorgando XP en addRating:', xpErr);
      // no rompemos la respuesta por fallo de XP
    }

    // Recalcular rating promedio del lugar
    await recalcPlaceRating(placeId);

    res.status(201).json({ success: true, data: rating });
  } catch (error) {
    console.error('Error en addRating:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          'Ya existe una calificación para este lugar por este usuario. (El upsert falló por índice único).',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error del servidor al registrar la calificación.',
    });
  }
};

/**
 * @desc   Obtener calificaciones de un lugar
 * @route  GET /api/ratings/:placeId
 * @access Public
 *
 * Responde con usuario + info de reputación para que el front pinte nivel/badges.
 */
exports.getRatingsForPlace = async (req, res) => {
  try {
    const { placeId } = req.params;

    const ratings = await Rating.find({ place: placeId })
      .populate('user', 'username name role current_level badges corporate_color reputation_score avatar_url')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: ratings });
  } catch (error) {
    console.error('Error en getRatingsForPlace:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener calificaciones.',
    });
  }
};

/**
 * @desc   Marcar comentario/calificación como "útil" (upvote)
 * @route  PUT /api/ratings/:id/upvote
 * @access Private
 */
exports.upvoteRating = async (req, res) => {
  try {
    const ratingId = req.params.id;
    const userId = req.user.id;

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({ success: false, message: 'Rating no encontrado.' });
    }

    // Quitar downvote si existía
    rating.downvotes = rating.downvotes.filter(
      (u) => u.toString() !== userId
    );

    // Añadir upvote si no estaba
    const alreadyUpvoted = rating.upvotes.some(
      (u) => u.toString() === userId
    );
    if (!alreadyUpvoted) {
      rating.upvotes.push(userId);

      // Dar XP al autor del comentario marcado como útil
      try {
        await addContributionXP(rating.user, 'COMMENT_UPVOTED');
      } catch (xpErr) {
        console.error('Error otorgando XP en upvoteRating:', xpErr);
      }

      // Emitir notificación en tiempo real
      try {
        const user = await User.findById(userId).select('username');
        if (global.wsService && rating.user.toString() !== userId) {
          global.wsService.emitCommentLikeNotification(
            rating.user.toString(),
            user?.username || 'Usuario',
            rating
          );
        }
      } catch (wsErr) {
        console.error('Error emitiendo notificación de upvote:', wsErr);
      }
    }

    await rating.save();

    res.status(200).json({ success: true, data: rating });
  } catch (error) {
    console.error('Error en upvoteRating:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al votar como útil.',
    });
  }
};

/**
 * @desc   Marcar comentario/calificación como "no útil" (downvote)
 * @route  PUT /api/ratings/:id/downvote
 * @access Private
 */
exports.downvoteRating = async (req, res) => {
  try {
    const ratingId = req.params.id;
    const userId = req.user.id;

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({ success: false, message: 'Rating no encontrado.' });
    }

    // Quitar upvote si existía
    rating.upvotes = rating.upvotes.filter(
      (u) => u.toString() !== userId
    );

    const alreadyDownvoted = rating.downvotes.some(
      (u) => u.toString() === userId
    );
    if (!alreadyDownvoted) {
      rating.downvotes.push(userId);
      
      // Emitir notificación en tiempo real
      try {
        const user = await User.findById(userId).select('username');
        if (global.wsService && rating.user.toString() !== userId) {
          global.wsService.emitCommentDislikeNotification(
            rating.user.toString(),
            user?.username || 'Usuario',
            rating
          );
        }
      } catch (wsErr) {
        console.error('Error emitiendo notificación de downvote:', wsErr);
      }
    }

    await rating.save();

    res.status(200).json({ success: true, data: rating });
  } catch (error) {
    console.error('Error en downvoteRating:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al votar como no útil.',
    });
  }
};

/**
 * @desc   Obtener comentarios de una calificación
 * @route  GET /api/ratings/:id/comments
 * @access Public
 */
exports.getCommentsForRating = async (req, res) => {
  try {
    const ratingId = req.params.id;

    const comments = await RatingComment.find({ rating: ratingId })
      .populate('user', 'username name avatar_url')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    console.error('Error en getCommentsForRating:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener comentarios de la calificación.',
    });
  }
};

/**
 * @desc   Agregar comentario a una calificación
 * @route  POST /api/ratings/:id/comments
 * @access Private
 */
exports.addCommentToRating = async (req, res) => {
  try {
    const ratingId = req.params.id;
    const { text } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El texto del comentario es obligatorio.',
      });
    }

    const rating = await Rating.findById(ratingId).select('_id user place');
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating no encontrado para comentar.',
      });
    }

    const comment = await RatingComment.create({
      rating: ratingId,
      user: req.user.id,
      text: text.trim(),
    });

    const populated = await comment.populate('user', 'username name avatar_url');

    try {
      await addContributionXP(req.user.id, 'POSITIVE_COMMENT');
    } catch (xpErr) {
      console.error('Error otorgando XP en addCommentToRating:', xpErr);
    }

    // Emitir notificación en tiempo real al autor del rating
    try {
      if (global.wsService && rating.user.toString() !== req.user.id) {
        const commenter = await User.findById(req.user.id).select('username');
        global.wsService.emitCommentReplyNotification(
          rating.user.toString(),
          {
            _id: comment._id,
            username: commenter?.username || 'Usuario',
            text: text.trim()
          },
          { _id: ratingId }
        );
      }
    } catch (wsErr) {
      console.error('Error emitiendo notificación de comentario:', wsErr);
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Error en addCommentToRating:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al agregar comentario a la calificación.',
    });
  }
};
