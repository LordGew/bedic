const mongoose = require('mongoose');
const Place = require('../models/Place');
const axios = require('axios');
require('dotenv').config();

// IMPORTANTE: Necesitas una API Key de Google Places
// Obtén una gratis en: https://console.cloud.google.com/
// Límite gratuito: 28,000 peticiones/mes
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'TU_API_KEY_AQUI';

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bedic')
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => {
  console.error('❌ Error conectando a MongoDB:', err);
  process.exit(1);
});

// Función para buscar lugar en Google Places
async function enrichPlaceWithGoogle(place) {
  try {
    // Buscar por nombre y coordenadas
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: `${place.coordinates.coordinates[1]},${place.coordinates.coordinates[0]}`,
        radius: 100, // 100 metros de radio
        keyword: place.name,
        key: GOOGLE_API_KEY
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const googlePlace = response.data.results[0];
      
      // Obtener detalles completos
      const detailsResponse = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: googlePlace.place_id,
          fields: 'name,rating,user_ratings_total,formatted_phone_number,website,opening_hours,photos,price_level,formatted_address',
          key: GOOGLE_API_KEY
        }
      });

      const details = detailsResponse.data.result;

      return {
        rating: details.rating || place.rating,
        totalRatings: details.user_ratings_total || 0,
        phone: details.formatted_phone_number || '',
        website: details.website || '',
        openingHours: details.opening_hours?.weekday_text || [],
        priceLevel: details.price_level || 0,
        googlePlaceId: googlePlace.place_id,
        photos: details.photos?.slice(0, 5).map(photo => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height
        })) || [],
        lastEnriched: new Date()
      };
    }

    return null;
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('   ⚠️  Límite de API alcanzado, esperando...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Esperar 1 minuto
      return enrichPlaceWithGoogle(place); // Reintentar
    }
    return null;
  }
}

// Función principal de enriquecimiento
async function enrichPlaces() {
  const startTime = Date.now();
  let totalEnriched = 0;
  let totalSkipped = 0;
  let apiCallsUsed = 0;
  const maxApiCalls = 900; // Límite diario conservador (28,000/mes ≈ 900/día)

  console.log('🔍 Iniciando enriquecimiento con Google Places API...\n');
  console.log(`📊 Límite diario: ${maxApiCalls} llamadas`);
  console.log(`💡 Priorizando lugares más importantes\n`);

  try {
    // Obtener lugares sin enriquecer, priorizando por importancia
    const places = await Place.find({
      $or: [
        { googlePlaceId: { $exists: false } },
        { lastEnriched: { $exists: false } }
      ],
      // Priorizar lugares verificados y con más concurrencia
      verified: true
    })
    .sort({ concurrence: -1, rating: -1 })
    .limit(maxApiCalls);

    console.log(`📍 Lugares a enriquecer: ${places.length}\n`);

    for (const place of places) {
      if (apiCallsUsed >= maxApiCalls) {
        console.log('\n⚠️  Límite diario alcanzado. Continuará mañana.');
        break;
      }

      try {
        console.log(`🔍 Enriqueciendo: ${place.name} (${place.category})`);
        
        const enrichedData = await enrichPlaceWithGoogle(place);
        apiCallsUsed += 2; // Nearby + Details = 2 llamadas

        if (enrichedData) {
          // Actualizar lugar con datos enriquecidos
          await Place.findByIdAndUpdate(place._id, {
            $set: enrichedData
          });
          
          totalEnriched++;
          console.log(`   ✅ Enriquecido: Rating ${enrichedData.rating}/5 (${enrichedData.totalRatings} reseñas)`);
        } else {
          totalSkipped++;
          console.log(`   ⚠️  No encontrado en Google Places`);
        }

        // Delay para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        totalSkipped++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE ENRIQUECIMIENTO');
    console.log('='.repeat(60));
    console.log(`✅ Lugares enriquecidos: ${totalEnriched}`);
    console.log(`⚠️  Lugares sin datos: ${totalSkipped}`);
    console.log(`📞 Llamadas API usadas: ${apiCallsUsed}/${maxApiCalls}`);
    console.log(`⏱️  Duración: ${duration}s`);
    console.log(`💰 Costo: $0 (dentro del tier gratuito)`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    process.exit(1);
  }
}

// Verificar API Key antes de empezar
if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'TU_API_KEY_AQUI') {
  console.error('❌ ERROR: No se ha configurado GOOGLE_PLACES_API_KEY');
  console.log('\n📝 Para obtener una API Key gratuita:');
  console.log('1. Ve a: https://console.cloud.google.com/');
  console.log('2. Crea un proyecto nuevo');
  console.log('3. Habilita "Places API"');
  console.log('4. Crea credenciales (API Key)');
  console.log('5. Agrega la key al archivo .env: GOOGLE_PLACES_API_KEY=tu_key_aqui');
  console.log('\n💡 Límite gratuito: 28,000 peticiones/mes (~900/día)');
  process.exit(1);
}

enrichPlaces();
