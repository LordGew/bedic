require('dotenv').config();
const mongoose = require('mongoose');
const { importPlacesFromOSM } = require('../services/osmImporter');
const { enrichPlacesWithImages } = require('../services/imageEnricher');

/**
 * Script para poblar la base de datos con lugares desde OpenStreetMap
 */
async function populateDatabase() {
  try {
    // Conectar a MongoDB
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    console.log('🚀 Iniciando importación de lugares desde OpenStreetMap...\n');
    console.log('=' .repeat(60));
    
    // Ciudades principales de Colombia para importar
    const cities = [
      { name: 'Bogotá Centro', lat: 4.6097, lon: -74.0817, radius: 3 },
      { name: 'Bogotá Norte (Usaquén)', lat: 4.6951, lon: -74.0309, radius: 2 },
      { name: 'Bogotá Chapinero', lat: 4.6533, lon: -74.0631, radius: 2 },
      { name: 'Medellín Centro', lat: 6.2442, lon: -75.5812, radius: 3 },
      { name: 'Medellín Poblado', lat: 6.2077, lon: -75.5658, radius: 2 },
      { name: 'Cali Centro', lat: 3.4516, lon: -76.5320, radius: 3 },
      { name: 'Cartagena Centro Histórico', lat: 10.4236, lon: -75.5478, radius: 2 },
      { name: 'Barranquilla Centro', lat: 10.9685, lon: -74.7813, radius: 2 }
    ];
    
    let totalImported = 0;
    
    for (const city of cities) {
      console.log('\n' + '='.repeat(60));
      console.log(`📍 IMPORTANDO: ${city.name.toUpperCase()}`);
      console.log('='.repeat(60));
      
      try {
        const count = await importPlacesFromOSM(city.lat, city.lon, city.radius);
        totalImported += count;
        console.log(`✅ ${count} lugares nuevos importados de ${city.name}`);
      } catch (error) {
        console.error(`❌ Error importando ${city.name}:`, error.message);
      }
      
      // Pequeña pausa entre ciudades para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 TOTAL IMPORTADO: ${totalImported} lugares nuevos`);
    console.log('='.repeat(60));
    
    // Enriquecer con imágenes
    console.log('\n🖼️  ENRIQUECIENDO LUGARES CON IMÁGENES...\n');
    console.log('='.repeat(60));
    
    try {
      const enrichedCount = await enrichPlacesWithImages(50);
      console.log(`✅ ${enrichedCount} lugares enriquecidos con imágenes`);
    } catch (error) {
      console.error('❌ Error enriqueciendo imágenes:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ PROCESO COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n💡 Tip: Puedes ejecutar este script nuevamente para importar más lugares');
    console.log('💡 Tip: Configura UNSPLASH_ACCESS_KEY en .env para imágenes reales\n');
    
  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar el script
populateDatabase();
