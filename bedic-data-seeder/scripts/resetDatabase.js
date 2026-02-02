/**
 * Script para resetear la base de datos y prepararla para el nuevo sistema BDIC
 * Elimina todos los lugares y deja la BD lista para ser poblada desde Angular
 */

const mongoose = require('mongoose');
const Place = require('../models/Place');
const Report = require('../models/Report');
const Rating = require('../models/Rating');
const Event = require('../models/Event');
require('dotenv').config();

async function resetDatabase() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    console.log('='.repeat(70));
    console.log('🗑️  RESETEO COMPLETO DE BASE DE DATOS - BDIC');
    console.log('='.repeat(70));
    console.log('');

    // 1. Estadísticas antes del reseteo
    console.log('📊 ESTADÍSTICAS ANTES DEL RESETEO:');
    const totalPlaces = await Place.countDocuments();
    const totalReports = await Report.countDocuments();
    const totalRatings = await Rating.countDocuments();
    const totalEvents = await Event.countDocuments();

    console.log(`   Lugares: ${totalPlaces}`);
    console.log(`   Reportes: ${totalReports}`);
    console.log(`   Ratings: ${totalRatings}`);
    console.log(`   Eventos: ${totalEvents}`);
    console.log('');

    // 2. Confirmar acción
    const CONFIRM_RESET = process.env.CONFIRM_RESET === 'true';

    if (!CONFIRM_RESET) {
      console.log('❌ RESETEO CANCELADO');
      console.log('   Para ejecutar el reseteo, establece CONFIRM_RESET=true');
      console.log('   Ejemplo: CONFIRM_RESET=true node scripts/resetDatabase.js');
      console.log('');
      console.log('⚠️  ADVERTENCIA: Esta acción eliminará TODOS los lugares, reportes, ratings y eventos.');
      console.log('   Solo mantiene usuarios, badges, títulos y configuración del sistema.');
      console.log('');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('⚠️  INICIANDO RESETEO COMPLETO...');
    console.log('   Esta acción eliminará TODOS los datos de lugares.');
    console.log('');

    // 3. Eliminar todos los lugares
    console.log('🔄 Eliminando TODOS los lugares...');
    const deletedPlaces = await Place.deleteMany({});
    console.log(`   ✅ Eliminados: ${deletedPlaces.deletedCount} lugares`);

    // 4. Eliminar todos los reportes de lugares
    console.log('🔄 Eliminando reportes de lugares...');
    const deletedReports = await Report.deleteMany({ contentType: 'place' });
    console.log(`   ✅ Eliminados: ${deletedReports.deletedCount} reportes`);

    // 5. Eliminar todos los ratings
    console.log('🔄 Eliminando ratings...');
    const deletedRatings = await Rating.deleteMany({});
    console.log(`   ✅ Eliminados: ${deletedRatings.deletedCount} ratings`);

    // 6. Eliminar eventos relacionados con lugares
    console.log('🔄 Eliminando eventos de lugares...');
    const deletedEvents = await Event.deleteMany({});
    console.log(`   ✅ Eliminados: ${deletedEvents.deletedCount} eventos`);
    console.log('');

    // 7. Estadísticas finales
    console.log('='.repeat(70));
    console.log('📊 ESTADÍSTICAS DESPUÉS DEL RESETEO:');
    console.log('='.repeat(70));

    const finalPlaces = await Place.countDocuments();
    const finalReports = await Report.countDocuments({ contentType: 'place' });
    const finalRatings = await Rating.countDocuments();
    const finalEvents = await Event.countDocuments();

    console.log(`   Lugares: ${finalPlaces}`);
    console.log(`   Reportes de lugares: ${finalReports}`);
    console.log(`   Ratings: ${finalRatings}`);
    console.log(`   Eventos: ${finalEvents}`);
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ RESETEO COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(70));
    console.log('');
    console.log('💡 BASE DE DATOS LISTA PARA:');
    console.log('   1. Poblar desde Angular (Panel de Gestión de Lugares)');
    console.log('   2. Crear lugares manualmente con datos propios');
    console.log('   3. Usar la nueva API /api/management/places');
    console.log('');
    console.log('🎯 PRÓXIMOS PASOS:');
    console.log('   1. Abrir Angular: http://localhost:4200');
    console.log('   2. Ir a "Gestión de Lugares"');
    console.log('   3. Comenzar a agregar lugares de Barranquilla');
    console.log('');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar
resetDatabase();
