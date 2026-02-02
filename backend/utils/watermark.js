let sharpOptional = null;
try {
  // sharp puede no estar instalado en algunos entornos
  // En ese caso, simplemente devolvemos la imagen original
  // sin lanzar error.
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  sharpOptional = require('sharp');
} catch (e) {
  sharpOptional = null;
}

/**
 * Agrega una marca de agua de texto en la esquina inferior derecha.
 * Si sharp no está disponible o algo falla, devuelve el buffer original.
 * @param {Buffer} buffer - Buffer de imagen original
 * @param {string} username - Nombre de usuario (sin @, se agrega aquí)
 * @returns {Promise<Buffer>} - Buffer de imagen procesada (PNG) o el original en fallback
 */
async function addWatermark(buffer, username) {
  try {
    if (!sharpOptional) {
      return buffer;
    }

    const image = sharpOptional(buffer).png();
    const metadata = await image.metadata();
    const width = metadata.width || 512;
    const height = metadata.height || 512;

    const label = `Bedic by @${username || 'bedic'}`;
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .wm { fill: rgba(255,255,255,0.9); font-size: 24px; font-family: Arial, sans-serif; }
        </style>
        <text x="20" y="${height - 20}" class="wm">${label}</text>
      </svg>
    `;

    const svgBuffer = Buffer.from(svg);

    return await image
      .composite([{ input: svgBuffer, gravity: 'southwest' }])
      .png()
      .toBuffer();
  } catch (err) {
    console.error('addWatermark fallback (returning original buffer):', err);
    return buffer;
  }
}

module.exports = { addWatermark };
