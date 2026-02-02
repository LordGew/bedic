const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Place = require('../models/Place');

async function deleteAllPlaces() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    const count = await Place.countDocuments();
    console.log(`📊 Lugares encontrados: ${count}`);

    if (count > 0) {
      await Place.deleteMany({});
      console.log('🗑️  TODOS los lugares han sido eliminados');
    } else {
      console.log('✅ No hay lugares para eliminar');
    }

    console.log('\n✅ Limpieza completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteAllPlaces();
