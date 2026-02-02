const Announcement = require('../models/Announcement');

// @desc    Obtener anuncios activos (no expirados)
// @route   GET /api/announcements
// @access  Public
exports.getAnnouncements = async (req, res) => {
  try {
    const { category } = req.query;
    const now = new Date();

    // Marcar como expirados los anuncios cuyo endDate ya pasó
    try {
      await Announcement.updateMany(
        { endDate: { $lt: now }, status: 'active' },
        { $set: { status: 'expired' } }
      );
    } catch (updateErr) {
      console.error('Error actualizando estado de anuncios expirados:', updateErr);
    }

    const q = {
      status: 'active',
      // Mostrar solo anuncios con fecha de fin en el futuro o sin endDate (compatibilidad antigua)
      $or: [
        { endDate: { $gt: now } },
        { endDate: { $exists: false } },
      ],
    };

    if (category) {
      q.categories = category;
    }

    const items = await Announcement.find(q)
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error('Error en getAnnouncements:', err);
    res.status(500).json({ success: false, message: 'Error al obtener anuncios' });
  }
};
