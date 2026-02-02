const mongoose = require('mongoose');
const Place = require('../models/Place');
require('dotenv').config();

async function createGeoIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bedic');
    console.log('✅ Conectado a MongoDB\n');

    console.log('🔧 Creando índice geoespacial...');
    
    // Eliminar índices existentes problemáticos
    try {
      await Place.collection.dropIndex('coordinates_2dsphere');
      console.log('   Índice anterior eliminado');
    } catch (e) {
      console.log('   No había índice anterior');
    }

    // Crear nuevo índice geoespacial
    await Place.collection.createIndex({ 
      'coordinates.coordinates': '2dsphere' 
    });
    
    console.log('✅ Índice geoespacial creado exitosamente\n');
    
    // Verificar índices
    const indexes = await Place.collection.indexes();
    console.log('📋 Índices actuales:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createGeoIndex();
