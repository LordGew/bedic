// const axios = require('axios'); // No necesario - no enriquecemos con APIs externas
const Place = require('../models/Place');

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'demo_key';

/**
 * Enriquece lugares sin imágenes usando Unsplash API
 * @param {number} limit - Cantidad máxima de lugares a procesar
 * @returns {Promise<number>} Cantidad de lugares enriquecidos
 */
async function enrichPlacesWithImages(limit = 30) {
  console.log('🖼️  Buscando lugares sin imágenes...');
  
  const placesWithoutImages = await Place.find({
    $or: [
      { officialImages: { $exists: false } },
      { officialImages: { $size: 0 } }
    ]
  }).limit(limit);

  console.log(`📦 Encontrados ${placesWithoutImages.length} lugares sin imágenes`);

  if (UNSPLASH_ACCESS_KEY === 'demo_key') {
    console.log('⚠️  UNSPLASH_ACCESS_KEY no configurado, usando imágenes placeholder');
    
    // Usar imágenes placeholder de Unsplash
    for (const place of placesWithoutImages) {
      const categoryImages = {
        'Restaurante': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        'Cafetería': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
        'Bar': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
        'Parque': 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&q=80',
        'Museo': 'https://images.unsplash.com/photo-1565173953406-4b2e1b1f9c0f?w=800&q=80',
        'Hotel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
        'Tienda': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
        'Banco': 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=800&q=80',
        'Cine': 'https://images.unsplash.com/photo-1489599849228-ed4dc902ba4a?w=800&q=80',
        'Seguridad': 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80'
      };
      
      const defaultImage = categoryImages[place.category] || 
                          'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80';
      
      place.officialImages = [defaultImage];
      await place.save();
      console.log(`  ✅ ${place.name} - Imagen placeholder añadida`);
    }
    
    return placesWithoutImages.length;
  }

  // Usar Unsplash API real
  let enrichedCount = 0;

  for (const place of placesWithoutImages) {
    try {
      // Construir query de búsqueda inteligente
      const searchTerms = [
        place.name,
        place.category,
        place.address.split(',')[1]?.trim() || ''
      ].filter(Boolean).join(' ');
      
      const response = await axios.get(
        'https://api.unsplash.com/search/photos',
        {
          params: {
            query: searchTerms,
            per_page: 3,
            orientation: 'landscape'
          },
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
          }
        }
      );

      if (response.data.results && response.data.results.length > 0) {
        const imageUrls = response.data.results.map(img => img.urls.regular);
        
        place.officialImages = imageUrls;
        await place.save();
        
        console.log(`  ✅ ${place.name} - ${imageUrls.length} imágenes añadidas`);
        enrichedCount++;
      } else {
        console.log(`  ⚠️  ${place.name} - Sin resultados en Unsplash`);
      }

      // Rate limit: 50 requests/hour en tier gratuito de Unsplash
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`  ❌ Error con ${place.name}:`, error.message);
    }
  }

  console.log(`\n📊 ${enrichedCount} lugares enriquecidos con imágenes\n`);
  return enrichedCount;
}

module.exports = { enrichPlacesWithImages };
