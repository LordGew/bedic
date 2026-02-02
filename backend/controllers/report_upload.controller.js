const path = require('path');
const fs = require('fs');
const { addWatermark } = require('../utils/watermark');

// Sube una foto de reporte aplicando marca de agua "Bedic by @username".
// Espera multipart/form-data con campo `file`.
exports.uploadReportPhoto = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No se envió archivo' });
    }

    const username = req.user.username || req.user.name || 'bedic';
    const processed = await addWatermark(req.file.buffer, username);

    const uploadsDir = path.join(__dirname, '..', 'uploads', 'reports');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = '.png';
    const filename = `${req.user.id}-${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, processed);

    const urlPath = `/uploads/reports/${filename}`;

    res.status(201).json({ success: true, data: { url: urlPath } });
  } catch (err) {
    console.error('uploadReportPhoto ERROR:', err);
    res.status(500).json({ success: false, message: 'Error al subir la foto del reporte' });
  }
};
