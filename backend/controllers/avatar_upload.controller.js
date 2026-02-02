const path = require('path');
const fs = require('fs');
const { addWatermark } = require('../utils/watermark');
const User = require('../models/User');

// Sube avatar con marca de agua "Bedic by @username" y actualiza user.avatar_url
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No se envió archivo' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const username = user.username || user.name || 'bedic';
    const processed = await addWatermark(req.file.buffer, username);

    const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = '.png';
    const filename = `${user._id}-${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, processed);

    const urlPath = `/uploads/avatars/${filename}`;
    user.avatar_url = urlPath;
    await user.save();

    res.status(201).json({ success: true, data: { url: urlPath } });
  } catch (err) {
    console.error('uploadAvatar ERROR:', err);
    res.status(500).json({ success: false, message: 'Error al subir avatar' });
  }
};
