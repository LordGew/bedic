// const axios = require('axios'); // No necesario - no importamos datos de OSM
const Place = require('../models/Place');

/**
 * Importa lugares desde OpenStreetMap usando Overpass API
 * @param {number} lat - Latitud central
 * @param {number} lon - Longitud central
 * @param {number} radiusKm - Radio de búsqueda en kilómetros
 * @returns {Promise<number>} Cantidad de lugares importados
 */
async function importPlacesFromOSM(lat, lon, radiusKm = 5) {
  const radiusMeters = radiusKm * 1000;
  
  console.log(`📍 Buscando lugares en radio de ${radiusKm}km desde (${lat}, ${lon})...`);
  
  // Query Overpass API para obtener POIs
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"restaurant|cafe|bar|pub|fast_food|bank|hospital|pharmacy|cinema|theatre|library"](around:${radiusMeters},${lat},${lon});
      way["amenity"~"restaurant|cafe|bar|pub|fast_food|bank|hospital|pharmacy|cinema|theatre|library"](around:${radiusMeters},${lat},${lon});
      node["tourism"~"hotel|museum|attraction|viewpoint|artwork|gallery"](around:${radiusMeters},${lat},${lon});
      way["tourism"~"hotel|museum|attraction|viewpoint|artwork|gallery"](around:${radiusMeters},${lat},${lon});
      node["leisure"~"park|garden|playground|sports_centre|stadium"](around:${radiusMeters},${lat},${lon});
      way["leisure"~"park|garden|playground|sports_centre|stadium"](around:${radiusMeters},${lat},${lon});
      node["shop"~"supermarket|mall|convenience|clothes|books"](around:${radiusMeters},${lat},${lon});
      way["shop"~"supermarket|mall|convenience|clothes|books"](around:${radiusMeters},${lat},${lon});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      query,
      { 
        headers: { 'Content-Type': 'text/plain' },
        timeout: 30000
      }
    );

    console.log(`✅ Recibidos ${response.data.elements.length} elementos de OSM`);

    // Filtrar y mapear lugares
    const places = response.data.elements
      .filter(el => el.tags && el.tags.name && (el.lat || el.center))
      .map(el => {
        const latitude = el.lat || el.center?.lat;
        const longitude = el.lon || el.center?.lon;
        
        if (!latitude || !longitude) return null;

        return {
          name: el.tags.name,
          category: mapOSMCategory(el.tags),
          description: buildDescription(el.tags),
          coordinates: {
            type: 'Point',
            coordinates: [longitude, latitude] // GeoJSON format: [lon, lat]
          },
          address: buildAddress(el.tags),
          phone: el.tags.phone || el.tags['contact:phone'] || '',
          website: el.tags.website || el.tags['contact:website'] || '',
          openingHours: el.tags.opening_hours || '',
          rating: 3.5, // Rating inicial por defecto
          officialImages: [], // Se llenarán después con Unsplash
          createdBy: 'system',
          source: 'OpenStreetMap',
          externalId: `osm_${el.type}_${el.id}`
        };
      })
      .filter(Boolean);

    console.log(`📦 Procesados ${places.length} lugares válidos`);

    // Guardar en MongoDB (evitar duplicados)
    let importedCount = 0;
    let skippedCount = 0;

    for (const placeData of places) {
      try {
        const existing = await Place.findOne({
          externalId: placeData.externalId
        });
        
        if (!existing) {
          await Place.create(placeData);
          console.log(`  ✅ ${placeData.name} (${placeData.category})`);
          importedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`  ❌ Error al guardar ${placeData.name}:`, error.message);
      }
    }

    console.log(`\n📊 Resumen: ${importedCount} importados, ${skippedCount} ya existían\n`);
    return importedCount;

  } catch (error) {
    console.error('❌ Error al consultar Overpass API:', error.message);
    throw error;
  }
}

/**
 * Mapea las categorías de OSM a las categorías de BEDIC
 */
function mapOSMCategory(tags) {
  const categoryMap = {
    // Comida y bebida
    'restaurant': 'Restaurante',
    'cafe': 'Cafetería',
    'bar': 'Bar',
    'pub': 'Bar',
    'fast_food': 'Comida Rápida',
    'food_court': 'Comida Rápida',
    
    // Entretenimiento
    'cinema': 'Cine',
    'theatre': 'Teatro',
    'nightclub': 'Discoteca',
    
    // Turismo
    'museum': 'Museo',
    'attraction': 'Atracción Turística',
    'viewpoint': 'Mirador',
    'artwork': 'Arte',
    'gallery': 'Galería',
    'hotel': 'Hotel',
    
    // Recreación
    'park': 'Parque',
    'garden': 'Jardín',
    'playground': 'Parque Infantil',
    'sports_centre': 'Centro Deportivo',
    'stadium': 'Estadio',
    
    // Compras
    'supermarket': 'Supermercado',
    'mall': 'Centro Comercial',
    'convenience': 'Tienda',
    'clothes': 'Tienda de Ropa',
    'books': 'Librería',
    'shop': 'Tienda',
    
    // Servicios
    'bank': 'Banco',
    'atm': 'Cajero Automático',
    'hospital': 'Hospital',
    'pharmacy': 'Farmacia',
    'library': 'Biblioteca'
  };

  const type = tags.amenity || tags.tourism || tags.leisure || tags.shop;
  return categoryMap[type] || 'Otro';
}

/**
 * Construye una descripción del lugar
 */
function buildDescription(tags) {
  const parts = [];
  
  if (tags.description) {
    return tags.description;
  }
  
  const type = tags.amenity || tags.tourism || tags.leisure || tags.shop;
  const category = mapOSMCategory(tags);
  
  parts.push(category);
  
  if (tags['addr:city']) {
    parts.push(`en ${tags['addr:city']}`);
  }
  
  if (tags.cuisine) {
    parts.push(`- Cocina: ${tags.cuisine}`);
  }
  
  return parts.join(' ') || `${tags.name}`;
}

/**
 * Construye la dirección del lugar
 */
function buildAddress(tags) {
  const parts = [];
  
  if (tags['addr:street']) {
    let street = tags['addr:street'];
    if (tags['addr:housenumber']) {
      street += ` #${tags['addr:housenumber']}`;
    }
    parts.push(street);
  }
  
  if (tags['addr:city']) {
    parts.push(tags['addr:city']);
  }
  
  if (tags['addr:postcode']) {
    parts.push(tags['addr:postcode']);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'Dirección no disponible';
}

module.exports = { importPlacesFromOSM };
