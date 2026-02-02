/**
 * Script para obtener información de ubicación usando geocodificación inversa
 * Usa las coordenadas de los lugares para obtener ciudad, departamento y sector
 */

const mongoose = require('mongoose');
const axios = require('axios');
const Place = require('../models/Place');
require('dotenv').config();

// Configuración
const DELAY_BETWEEN_REQUESTS = 1000; // 1 segundo entre requests para no saturar la API
const BATCH_SIZE = 100; // Procesar en lotes

/**
 * Obtiene información de ubicación usando Nominatim (OpenStreetMap)
 */
async function reverseGeocode(lat, lng) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat,
        lon: lng,
        format: 'json',
        addressdetails: 1,
        'accept-language': 'es'
      },
      headers: {
        'User-Agent': 'BEDIC-App/1.0'
      }
    });

    if (response.data && response.data.address) {
      const addr = response.data.address;
      
      return {
        city: addr.city || addr.town || addr.village || addr.municipality || null,
        department: addr.state || null,
        country: addr.country || null,
        suburb: addr.suburb || addr.neighbourhood || null
      };
    }
    
    return null;
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('⚠️  Rate limit alcanzado, esperando 5 segundos...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return reverseGeocode(lat, lng); // Reintentar
    }
    console.error(`Error en geocodificación: ${error.message}`);
    return null;
  }
}

/**
 * Normaliza nombres de departamentos colombianos
 */
function normalizeDepartment(department) {
  if (!department) return null;
  
  const departmentMap = {
    'Distrito Capital de Bogotá': 'Bogotá D.C.',
    'Bogotá, D.C.': 'Bogotá D.C.',
    'Bogotá': 'Bogotá D.C.',
    'Valle del Cauca': 'Valle del Cauca',
    'Antioquia': 'Antioquia',
    'Atlántico': 'Atlántico',
    'Bolívar': 'Bolívar',
    'Santander': 'Santander',
    'Norte de Santander': 'Norte de Santander',
    'Cundinamarca': 'Cundinamarca',
    'Risaralda': 'Risaralda',
    'Caldas': 'Caldas',
    'Quindío': 'Quindío',
    'Tolima': 'Tolima',
    'Huila': 'Huila',
    'Meta': 'Meta',
    'Nariño': 'Nariño',
    'Cauca': 'Cauca',
    'Magdalena': 'Magdalena',
    'Cesar': 'Cesar',
    'Córdoba': 'Córdoba',
    'Sucre': 'Sucre'
  };
  
  return departmentMap[department] || department;
}

/**
 * Procesa un lote de lugares
 */
async function processBatch(places) {
  let updated = 0;
  let failed = 0;
  
  for (const place of places) {
    try {
      const [lng, lat] = place.coordinates.coordinates;
      
      console.log(`🔍 Procesando: ${place.name}...`);
      
      const location = await reverseGeocode(lat, lng);
      
      if (location && location.city) {
        const updateData = {
          city: location.city,
          department: normalizeDepartment(location.department),
          sector: location.suburb || null
        };
        
        await Place.findByIdAndUpdate(place._id, updateData);
        
        updated++;
        console.log(`✅ ${place.name} → ${location.city}, ${updateData.department}${location.suburb ? ` (${location.suburb})` : ''}`);
      } else {
        failed++;
        console.log(`⚠️  ${place.name} → No se pudo obtener ubicación`);
      }
      
      // Esperar entre requests
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      
    } catch (error) {
      failed++;
      console.error(`❌ Error procesando ${place.name}:`, error.message);
    }
  }
  
  return { updated, failed };
}

/**
 * Función principal
 */
async function geocodeAllPlaces() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    console.log('📍 Obteniendo lugares sin información de ubicación...');
    const places = await Place.find({
      $or: [
        { city: { $exists: false } },
        { city: null },
        { city: '' }
      ]
    }).limit(BATCH_SIZE);

    console.log(`   Encontrados ${places.length} lugares para procesar`);
    console.log(`   Procesando en lotes de ${BATCH_SIZE}`);
    console.log(`   Tiempo estimado: ~${Math.ceil(places.length * DELAY_BETWEEN_REQUESTS / 1000 / 60)} minutos\n`);

    const { updated, failed } = await processBatch(places);

    console.log('\n');
    console.log('='.repeat(70));
    console.log('📊 RESUMEN');
    console.log('='.repeat(70));
    console.log(`✅ Lugares actualizados: ${updated}`);
    console.log(`❌ Lugares fallidos: ${failed}`);
    console.log('');

    // Mostrar estadísticas por ciudad
    console.log('📈 LUGARES POR CIUDAD (Top 20):');
    const citiesStats = await Place.aggregate([
      { $match: { city: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    citiesStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} lugares`);
    });

    console.log('');
    
    // Contar lugares pendientes
    const pending = await Place.countDocuments({
      $or: [
        { city: { $exists: false } },
        { city: null },
        { city: '' }
      ]
    });
    
    console.log(`⏳ Lugares pendientes de procesar: ${pending}`);
    
    if (pending > 0) {
      console.log('\n💡 Para continuar procesando, ejecuta el comando nuevamente:');
      console.log('   npm run geocode-locations');
    }
    
    console.log('');
    console.log('✅ Proceso completado');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar
geocodeAllPlaces();
