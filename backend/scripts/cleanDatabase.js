/**
 * Script para limpiar la base de datos y preparar para el nuevo modelo BDIC
 * Elimina lugares de APIs de terceros y mantiene solo lugares propios
 */

const mongoose = require('mongoose');
const Place = require('../models/Place');
const Report = require('../models/Report');
const Rating = require('../models/Rating');
require('dotenv').config();

async function cleanDatabase() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    console.log('='.repeat(70));
    console.log('🧹 LIMPIEZA DE BASE DE DATOS - BDIC');
    console.log('='.repeat(70));
    console.log('');

    // 1. Contar lugares actuales
    console.log('📊 ESTADÍSTICAS ACTUALES:');
    const totalPlaces = await Place.countDocuments();
    const adminPlaces = await Place.countDocuments({ adminCreated: true });
    const googlePlaces = await Place.countDocuments({ source: 'Google Places' });
    const osmPlaces = await Place.countDocuments({ source: 'OpenStreetMap' });
    const communityPlaces = await Place.countDocuments({ source: 'Community' });

    console.log(`   Total de lugares: ${totalPlaces}`);
    console.log(`   ├─ Creados por admin: ${adminPlaces}`);
    console.log(`   ├─ Google Places: ${googlePlaces}`);
    console.log(`   ├─ OpenStreetMap: ${osmPlaces}`);
    console.log(`   └─ Community: ${communityPlaces}`);
    console.log('');

    // 2. Mostrar lugares por ciudad
    console.log('📍 LUGARES POR CIUDAD:');
    const citiesStats = await Place.aggregate([
      { $match: { city: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    citiesStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} lugares`);
    });
    console.log('');

    // 3. Preguntar confirmación
    console.log('⚠️  ADVERTENCIA:');
    console.log('   Este script eliminará TODOS los lugares que NO sean creados por admin.');
    console.log('   Esto incluye:');
    console.log(`   - ${googlePlaces} lugares de Google Places`);
    console.log(`   - ${osmPlaces} lugares de OpenStreetMap`);
    console.log(`   - ${communityPlaces - adminPlaces} lugares de Community (no admin)`);
    console.log('');
    console.log(`   Se mantendrán: ${adminPlaces} lugares creados por admin`);
    console.log('');

    // En producción, aquí deberías pedir confirmación del usuario
    // Por ahora, comentamos la eliminación para seguridad
    const CONFIRM_DELETE = process.env.CONFIRM_DELETE === 'true';

    if (!CONFIRM_DELETE) {
      console.log('❌ ELIMINACIÓN CANCELADA');
      console.log('   Para ejecutar la limpieza, establece CONFIRM_DELETE=true');
      console.log('   Ejemplo: CONFIRM_DELETE=true node scripts/cleanDatabase.js');
      console.log('');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('🗑️  INICIANDO LIMPIEZA...');
    console.log('');

    // 4. Eliminar lugares de terceros
    console.log('🔄 Eliminando lugares de Google Places...');
    const deletedGoogle = await Place.deleteMany({ source: 'Google Places' });
    console.log(`   ✅ Eliminados: ${deletedGoogle.deletedCount} lugares`);

    console.log('🔄 Eliminando lugares de OpenStreetMap...');
    const deletedOSM = await Place.deleteMany({ source: 'OpenStreetMap' });
    console.log(`   ✅ Eliminados: ${deletedOSM.deletedCount} lugares`);

    console.log('🔄 Eliminando lugares de Community (no admin)...');
    const deletedCommunity = await Place.deleteMany({ 
      source: 'Community',
      adminCreated: { $ne: true }
    });
    console.log(`   ✅ Eliminados: ${deletedCommunity.deletedCount} lugares`);
    console.log('');

    // 5. Limpiar reportes y ratings huérfanos
    console.log('🔄 Limpiando reportes huérfanos...');
    const allPlaceIds = await Place.distinct('_id');
    const deletedReports = await Report.deleteMany({
      contentId: { $nin: allPlaceIds },
      contentType: 'place'
    });
    console.log(`   ✅ Eliminados: ${deletedReports.deletedCount} reportes`);

    console.log('🔄 Limpiando ratings huérfanos...');
    const deletedRatings = await Rating.deleteMany({
      placeId: { $nin: allPlaceIds }
    });
    console.log(`   ✅ Eliminados: ${deletedRatings.deletedCount} ratings`);
    console.log('');

    // 6. Estadísticas finales
    console.log('='.repeat(70));
    console.log('📊 ESTADÍSTICAS FINALES:');
    console.log('='.repeat(70));

    const finalTotal = await Place.countDocuments();
    const finalAdmin = await Place.countDocuments({ adminCreated: true });
    const finalBarranquilla = await Place.countDocuments({ city: 'Barranquilla' });

    console.log(`   Total de lugares: ${finalTotal}`);
    console.log(`   ├─ Creados por admin: ${finalAdmin}`);
    console.log(`   └─ En Barranquilla: ${finalBarranquilla}`);
    console.log('');

    console.log('📍 LUGARES RESTANTES POR CIUDAD:');
    const finalCitiesStats = await Place.aggregate([
      { $match: { city: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    finalCitiesStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} lugares`);
    });
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ LIMPIEZA COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(70));
    console.log('');
    console.log('💡 PRÓXIMOS PASOS:');
    console.log('   1. Verificar lugares restantes en el panel de Angular');
    console.log('   2. Comenzar a poblar Barranquilla con lugares propios');
    console.log('   3. Usar la API /api/management/places para agregar lugares');
    console.log('');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar
cleanDatabase();
