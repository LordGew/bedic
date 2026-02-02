const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Place = require('../models/Place');

async function cleanDuplicatePlaces() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('URI:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Buscar todos los lugares con el mismo nombre
    const allPlaces = await Place.find({}).sort({ createdAt: 1 });
    
    console.log(`📊 Total de lugares encontrados: ${allPlaces.length}`);

    // Agrupar por nombre
    const placesByName = {};
    allPlaces.forEach(place => {
      if (!placesByName[place.name]) {
        placesByName[place.name] = [];
      }
      placesByName[place.name].push(place);
    });

    // Encontrar duplicados
    let duplicatesFound = 0;
    let duplicatesRemoved = 0;

    for (const [name, places] of Object.entries(placesByName)) {
      if (places.length > 1) {
        duplicatesFound++;
        console.log(`\n🔍 Duplicados encontrados para: "${name}"`);
        console.log(`   Total: ${places.length} lugares`);

        // Ordenar por fecha de creación y mantener el más antiguo
        places.sort((a, b) => a.createdAt - b.createdAt);
        
        const keepPlace = places[0];
        const duplicates = places.slice(1);

        console.log(`   ✅ Manteniendo: ${keepPlace._id} (Creado: ${keepPlace.createdAt})`);
        console.log(`   ❌ Eliminando ${duplicates.length} duplicados:`);

        for (const dup of duplicates) {
          console.log(`      - ${dup._id} (Creado: ${dup.createdAt})`);
          await Place.findByIdAndDelete(dup._id);
          duplicatesRemoved++;
        }
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   - Lugares únicos: ${Object.keys(placesByName).length}`);
    console.log(`   - Grupos con duplicados: ${duplicatesFound}`);
    console.log(`   - Duplicados eliminados: ${duplicatesRemoved}`);
    console.log(`   - Lugares restantes: ${allPlaces.length - duplicatesRemoved}`);

    console.log('\n✅ Limpieza completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanDuplicatePlaces();
