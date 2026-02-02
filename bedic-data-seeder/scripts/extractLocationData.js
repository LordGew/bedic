/**
 * Script para extraer información de ubicación (departamento, ciudad, sector)
 * de las direcciones de los lugares existentes
 */

const mongoose = require('mongoose');
const Place = require('../models/Place');
require('dotenv').config();

// Mapeo de ciudades a departamentos en Colombia
const CITY_TO_DEPARTMENT = {
  // Atlántico
  'Barranquilla': 'Atlántico',
  'Soledad': 'Atlántico',
  'Malambo': 'Atlántico',
  
  // Bogotá D.C.
  'Bogotá': 'Bogotá D.C.',
  'Bogota': 'Bogotá D.C.',
  
  // Antioquia
  'Medellín': 'Antioquia',
  'Medellin': 'Antioquia',
  'Bello': 'Antioquia',
  'Itagüí': 'Antioquia',
  'Envigado': 'Antioquia',
  
  // Valle del Cauca
  'Cali': 'Valle del Cauca',
  'Palmira': 'Valle del Cauca',
  'Buenaventura': 'Valle del Cauca',
  
  // Santander
  'Bucaramanga': 'Santander',
  'Floridablanca': 'Santander',
  'Girón': 'Santander',
  
  // Bolívar
  'Cartagena': 'Bolívar',
  
  // Norte de Santander
  'Cúcuta': 'Norte de Santander',
  'Cucuta': 'Norte de Santander',
  
  // Risaralda
  'Pereira': 'Risaralda',
  
  // Caldas
  'Manizales': 'Caldas',
  
  // Quindío
  'Armenia': 'Quindío',
  
  // Tolima
  'Ibagué': 'Tolima',
  'Ibague': 'Tolima',
  
  // Huila
  'Neiva': 'Huila',
  
  // Meta
  'Villavicencio': 'Meta',
  
  // Nariño
  'Pasto': 'Nariño',
  
  // Cauca
  'Popayán': 'Cauca',
  'Popayan': 'Cauca',
  
  // Magdalena
  'Santa Marta': 'Magdalena',
  
  // Cesar
  'Valledupar': 'Cesar',
  
  // Córdoba
  'Montería': 'Córdoba',
  'Monteria': 'Córdoba',
  
  // Sucre
  'Sincelejo': 'Sucre'
};

// Sectores comunes en ciudades colombianas
const SECTORS = [
  'Norte', 'Sur', 'Oriente', 'Occidente', 'Centro',
  'Noroccidente', 'Nororiente', 'Suroccidente', 'Suroriente',
  'Nororiental', 'Noroccidental', 'Suroriental', 'Suroccidental'
];

/**
 * Extrae la ciudad de una dirección
 */
function extractCity(address) {
  if (!address) return null;
  
  const addressLower = address.toLowerCase();
  
  // Buscar coincidencias de ciudades
  for (const [city, dept] of Object.entries(CITY_TO_DEPARTMENT)) {
    if (addressLower.includes(city.toLowerCase())) {
      return city;
    }
  }
  
  return null;
}

/**
 * Extrae el departamento basado en la ciudad
 */
function extractDepartment(city) {
  if (!city) return null;
  return CITY_TO_DEPARTMENT[city] || null;
}

/**
 * Extrae el sector de una dirección
 */
function extractSector(address) {
  if (!address) return null;
  
  const addressLower = address.toLowerCase();
  
  for (const sector of SECTORS) {
    if (addressLower.includes(sector.toLowerCase())) {
      return sector;
    }
  }
  
  return null;
}

/**
 * Procesa todos los lugares y extrae la información de ubicación
 */
async function extractLocationData() {
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
    });

    console.log(`   Encontrados ${places.length} lugares para procesar\n`);

    let updated = 0;
    let skipped = 0;

    for (const place of places) {
      const city = extractCity(place.address);
      
      if (city) {
        const department = extractDepartment(city);
        const sector = extractSector(place.address);

        await Place.findByIdAndUpdate(place._id, {
          city,
          department,
          sector
        });

        updated++;
        console.log(`✅ ${place.name} → ${city}, ${department}${sector ? ` (${sector})` : ''}`);
      } else {
        skipped++;
        if (skipped <= 10) {
          console.log(`⚠️  ${place.name} → No se pudo extraer ciudad de: ${place.address}`);
        }
      }
    }

    console.log('\n');
    console.log('='.repeat(70));
    console.log('📊 RESUMEN');
    console.log('='.repeat(70));
    console.log(`✅ Lugares actualizados: ${updated}`);
    console.log(`⚠️  Lugares sin ciudad identificada: ${skipped}`);
    console.log('');

    // Mostrar estadísticas por ciudad
    console.log('📈 LUGARES POR CIUDAD:');
    const citiesStats = await Place.aggregate([
      { $match: { city: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    citiesStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} lugares`);
    });

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
extractLocationData();
