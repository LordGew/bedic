const mongoose = require('mongoose');
const Place = require('../models/Place');
const ScriptActivity = require('../models/ScriptActivity');
const axios = require('axios');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bedic')
.then(() => console.log('✅ Conectado a MongoDB para auto-descubrimiento'))
.catch(err => {
  console.error('❌ Error conectando a MongoDB:', err);
  process.exit(1);
});

// Configuración de ciudades principales de Colombia
// COBERTURA COMPLETA: Múltiples zonas superpuestas para cubrir TODA el área urbana
// Radio máximo de OSM: 20km (suficiente para que usuarios busquen en cualquier parte)
const CITIES = [
  // ==================== BOGOTÁ (Área: ~1,775 km²) ====================
  // Cobertura completa con 16 zonas superpuestas
  { name: 'Bogotá - Usaquén', lat: 4.7110, lon: -74.0300, radius: 20000 },
  { name: 'Bogotá - Chapinero', lat: 4.6533, lon: -74.0636, radius: 20000 },
  { name: 'Bogotá - Santa Fe', lat: 4.6097, lon: -74.0700, radius: 20000 },
  { name: 'Bogotá - San Cristóbal', lat: 4.5709, lon: -74.0800, radius: 20000 },
  { name: 'Bogotá - Usme', lat: 4.4800, lon: -74.1200, radius: 20000 },
  { name: 'Bogotá - Tunjuelito', lat: 4.5800, lon: -74.1300, radius: 20000 },
  { name: 'Bogotá - Bosa', lat: 4.6200, lon: -74.1900, radius: 20000 },
  { name: 'Bogotá - Kennedy', lat: 4.6280, lon: -74.1470, radius: 20000 },
  { name: 'Bogotá - Fontibón', lat: 4.6800, lon: -74.1470, radius: 20000 },
  { name: 'Bogotá - Engativá', lat: 4.7000, lon: -74.1100, radius: 20000 },
  { name: 'Bogotá - Suba', lat: 4.7500, lon: -74.0800, radius: 20000 },
  { name: 'Bogotá - Barrios Unidos', lat: 4.6700, lon: -74.0800, radius: 20000 },
  { name: 'Bogotá - Teusaquillo', lat: 4.6400, lon: -74.0900, radius: 20000 },
  { name: 'Bogotá - Los Mártires', lat: 4.6100, lon: -74.0900, radius: 20000 },
  { name: 'Bogotá - Antonio Nariño', lat: 4.5900, lon: -74.1100, radius: 20000 },
  { name: 'Bogotá - Puente Aranda', lat: 4.6200, lon: -74.1200, radius: 20000 },
  
  // ==================== MEDELLÍN (Área: ~380 km²) ====================
  // Cobertura completa con 10 zonas
  { name: 'Medellín - El Poblado', lat: 6.2100, lon: -75.5700, radius: 20000 },
  { name: 'Medellín - Laureles', lat: 6.2450, lon: -75.5900, radius: 20000 },
  { name: 'Medellín - La Candelaria', lat: 6.2476, lon: -75.5658, radius: 20000 },
  { name: 'Medellín - Buenos Aires', lat: 6.2350, lon: -75.5550, radius: 20000 },
  { name: 'Medellín - Castilla', lat: 6.2900, lon: -75.5800, radius: 20000 },
  { name: 'Medellín - Aranjuez', lat: 6.2700, lon: -75.5500, radius: 20000 },
  { name: 'Medellín - Manrique', lat: 6.2600, lon: -75.5400, radius: 20000 },
  { name: 'Medellín - Belén', lat: 6.2300, lon: -75.6000, radius: 20000 },
  { name: 'Medellín - Robledo', lat: 6.2700, lon: -75.6200, radius: 20000 },
  { name: 'Medellín - Bello', lat: 6.3370, lon: -75.5547, radius: 20000 },
  
  // ==================== CALI (Área: ~560 km²) ====================
  // Cobertura completa con 8 zonas
  { name: 'Cali - Norte', lat: 3.4700, lon: -76.5200, radius: 20000 },
  { name: 'Cali - Centro', lat: 3.4516, lon: -76.5320, radius: 20000 },
  { name: 'Cali - Sur', lat: 3.4000, lon: -76.5400, radius: 20000 },
  { name: 'Cali - Oeste', lat: 3.4400, lon: -76.5600, radius: 20000 },
  { name: 'Cali - Este', lat: 3.4300, lon: -76.5000, radius: 20000 },
  { name: 'Cali - Aguablanca', lat: 3.4200, lon: -76.4900, radius: 20000 },
  { name: 'Cali - Jamundí', lat: 3.2644, lon: -76.5394, radius: 15000 },
  { name: 'Cali - Yumbo', lat: 3.5833, lon: -76.4833, radius: 15000 },
  
  // ==================== BARRANQUILLA (Área: ~154 km²) ====================
  { name: 'Barranquilla - Norte', lat: 11.0200, lon: -74.8100, radius: 20000 },
  { name: 'Barranquilla - Centro', lat: 10.9685, lon: -74.7813, radius: 20000 },
  { name: 'Barranquilla - Sur', lat: 10.9200, lon: -74.7900, radius: 20000 },
  { name: 'Barranquilla - Soledad', lat: 10.9185, lon: -74.7694, radius: 15000 },
  
  // ==================== CARTAGENA (Área: ~572 km²) ====================
  { name: 'Cartagena - Centro Histórico', lat: 10.3910, lon: -75.4794, radius: 20000 },
  { name: 'Cartagena - Bocagrande', lat: 10.3950, lon: -75.5500, radius: 20000 },
  { name: 'Cartagena - Norte', lat: 10.4400, lon: -75.5200, radius: 20000 },
  { name: 'Cartagena - Sureste', lat: 10.3500, lon: -75.4600, radius: 20000 },
  
  // ==================== BUCARAMANGA (Área: ~165 km²) ====================
  { name: 'Bucaramanga - Centro', lat: 7.1193, lon: -73.1227, radius: 20000 },
  { name: 'Bucaramanga - Norte', lat: 7.1400, lon: -73.1200, radius: 20000 },
  { name: 'Floridablanca', lat: 7.0621, lon: -73.0875, radius: 20000 },
  { name: 'Girón', lat: 7.0697, lon: -73.1697, radius: 15000 },
  
  // ==================== PEREIRA (Área: ~702 km²) ====================
  { name: 'Pereira - Centro', lat: 4.8133, lon: -75.6961, radius: 20000 },
  { name: 'Pereira - Norte', lat: 4.8400, lon: -75.6900, radius: 20000 },
  { name: 'Dosquebradas', lat: 4.8395, lon: -75.6697, radius: 20000 },
  
  // ==================== OTRAS CIUDADES ====================
  { name: 'Santa Marta', lat: 11.2408, lon: -74.2120, radius: 20000 },
  { name: 'Cúcuta', lat: 7.8939, lon: -72.5078, radius: 20000 },
  { name: 'Manizales', lat: 5.0689, lon: -75.5174, radius: 20000 },
  { name: 'Ibagué', lat: 4.4389, lon: -75.2322, radius: 20000 },
  { name: 'Pasto', lat: 1.2136, lon: -77.2811, radius: 20000 },
  { name: 'Villavicencio', lat: 4.1420, lon: -73.6266, radius: 20000 },
  { name: 'Armenia', lat: 4.5339, lon: -75.6811, radius: 20000 },
  { name: 'Neiva', lat: 2.9273, lon: -75.2819, radius: 20000 },
  { name: 'Popayán', lat: 2.4419, lon: -76.6063, radius: 20000 },
  { name: 'Valledupar', lat: 10.4631, lon: -73.2532, radius: 20000 },
  { name: 'Montería', lat: 8.7479, lon: -75.8814, radius: 20000 },
  { name: 'Sincelejo', lat: 9.3047, lon: -75.3978, radius: 20000 },
  { name: 'Tunja', lat: 5.5353, lon: -73.3678, radius: 15000 },
  { name: 'Palmira', lat: 3.5394, lon: -76.3036, radius: 15000 },
  { name: 'Riohacha', lat: 11.5444, lon: -72.9072, radius: 15000 },
];

// Categorías a buscar
const CATEGORIES = [
  { name: 'Restaurante', types: ['restaurant', 'food'] },
  { name: 'Bar', types: ['bar', 'night_club'] },
  { name: 'Cafetería', types: ['cafe', 'bakery'] },
  { name: 'Parque', types: ['park'] },
  { name: 'Hotel', types: ['lodging', 'hotel'] },
  { name: 'Museo', types: ['museum', 'art_gallery'] },
  { name: 'Cine', types: ['movie_theater'] },
  { name: 'Hospital', types: ['hospital', 'health'] },
  { name: 'Farmacia', types: ['pharmacy', 'drugstore'] },
  { name: 'Banco', types: ['bank', 'atm'] },
  { name: 'Supermercado', types: ['supermarket', 'grocery_or_supermarket'] },
  { name: 'Centro Comercial', types: ['shopping_mall'] },
  { name: 'Gimnasio', types: ['gym'] },
  { name: 'Biblioteca', types: ['library'] },
  { name: 'Tienda', types: ['store', 'clothing_store', 'electronics_store'] },
];

// El radio se define por ciudad ahora

// Función para buscar lugares usando OpenStreetMap Overpass API (gratis)
async function searchPlacesOSM(lat, lon, category, radius) {
  try {
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    
    // Mapeo de categorías a tags de OSM
    const osmTags = {
      'Restaurante': 'amenity=restaurant',
      'Bar': 'amenity=bar',
      'Cafetería': 'amenity=cafe',
      'Parque': 'leisure=park',
      'Hotel': 'tourism=hotel',
      'Museo': 'tourism=museum',
      'Cine': 'amenity=cinema',
      'Hospital': 'amenity=hospital',
      'Farmacia': 'amenity=pharmacy',
      'Banco': 'amenity=bank',
      'Supermercado': 'shop=supermarket',
      'Centro Comercial': 'shop=mall',
      'Gimnasio': 'leisure=fitness_centre',
      'Biblioteca': 'amenity=library',
      'Tienda': 'shop=*',
    };

    const tag = osmTags[category] || 'amenity=*';
    const radiusKm = radius / 1000;
    
    const query = `
      [out:json][timeout:25];
      (
        node[${tag}](around:${radius},${lat},${lon});
        way[${tag}](around:${radius},${lat},${lon});
        relation[${tag}](around:${radius},${lat},${lon});
      );
      out center;
    `;

    const response = await axios.post(overpassUrl, `data=${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000
    });

    const elements = response.data.elements || [];
    
    return elements.map(element => {
      const lat = element.lat || (element.center && element.center.lat);
      const lon = element.lon || (element.center && element.center.lon);
      
      return {
        name: element.tags?.name || element.tags?.['name:es'] || 'Sin nombre',
        category: category,
        description: element.tags?.description || element.tags?.['description:es'] || '',
        coordinates: [lon, lat],
        address: element.tags?.['addr:street'] || element.tags?.['addr:full'] || '',
        rating: 0,
        verified: false,
        source: 'OpenStreetMap',
        concurrence: 0,
        adminCreated: false,
        osmId: element.id
      };
    }).filter(place => place.name !== 'Sin nombre' && place.coordinates[0] && place.coordinates[1]);

  } catch (error) {
    console.error(`Error buscando en OSM para ${category}:`, error.message);
    return [];
  }
}

// Función para registrar actividad del script
async function logActivity(status, message, stats = {}) {
  try {
    await ScriptActivity.create({
      scriptName: 'autoDiscoverPlaces',
      status,
      message,
      stats,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error registrando actividad:', error);
  }
}

// Función principal de descubrimiento
async function discoverNewPlaces() {
  const startTime = Date.now();
  let totalFound = 0;
  let totalAdded = 0;
  let totalSkipped = 0;
  const citiesProcessed = [];

  console.log('🔍 Iniciando búsqueda automática de lugares...\n');

  try {
    for (const city of CITIES) {
      console.log(`📍 Procesando ${city.name}...`);
      let cityAdded = 0;
      let citySkipped = 0;

      for (const category of CATEGORIES) {
        try {
          // Pausa más larga para evitar límites de velocidad (429)
          await new Promise(resolve => setTimeout(resolve, 2000));

          const radius = city.radius || 10000;
          const places = await searchPlacesOSM(city.lat, city.lon, category.name, radius);
          totalFound += places.length;

          console.log(`   ${category.name}: ${places.length} encontrados`);

          for (const place of places) {
            try {
              // Verificar si el lugar ya existe
              const existing = await Place.findOne({
                name: place.name,
                category: place.category,
                'coordinates.coordinates': {
                  $near: {
                    $geometry: {
                      type: 'Point',
                      coordinates: place.coordinates
                    },
                    $maxDistance: 100 // 100 metros de tolerancia
                  }
                }
              });

              if (!existing) {
                // Crear nuevo lugar
                await Place.create({
                  ...place,
                  coordinates: {
                    type: 'Point',
                    coordinates: place.coordinates
                  }
                });
                totalAdded++;
                cityAdded++;
              } else {
                totalSkipped++;
                citySkipped++;
              }
            } catch (error) {
              // Error al insertar lugar individual, continuar
              console.error(`   ⚠️  Error insertando ${place.name}:`, error.message);
            }
          }
        } catch (error) {
          console.error(`   ⚠️  Error procesando categoría ${category.name}:`, error.message);
        }
      }

      citiesProcessed.push({
        name: city.name,
        added: cityAdded,
        skipped: citySkipped
      });

      console.log(`   ✅ ${city.name}: ${cityAdded} nuevos, ${citySkipped} existentes\n`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    const summary = {
      totalFound,
      totalAdded,
      totalSkipped,
      citiesProcessed,
      duration: `${duration}s`
    };

    console.log('📊 Resumen de ejecución:');
    console.log(`   Total encontrados: ${totalFound}`);
    console.log(`   Nuevos agregados: ${totalAdded}`);
    console.log(`   Ya existentes: ${totalSkipped}`);
    console.log(`   Duración: ${duration}s`);

    await logActivity('success', `Descubrimiento completado: ${totalAdded} lugares nuevos agregados`, summary);

    return summary;

  } catch (error) {
    console.error('❌ Error en el proceso de descubrimiento:', error);
    await logActivity('error', `Error: ${error.message}`, { error: error.stack });
    throw error;
  }
}

// Función para ejecutar el script
async function run() {
  try {
    await discoverNewPlaces();
    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Proceso terminado con errores');
    process.exit(1);
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  run();
}

module.exports = { discoverNewPlaces };
