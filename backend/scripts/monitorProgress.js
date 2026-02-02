const mongoose = require('mongoose');
const Place = require('../models/Place');
const ScriptActivity = require('../models/ScriptActivity');
require('dotenv').config();

async function monitorProgress() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bedic');
    
    console.clear();
    console.log('📊 MONITOREO DE PROGRESO - POBLACIÓN DE LUGARES\n');
    console.log('='.repeat(70));

    // Total de lugares
    const total = await Place.countDocuments();
    const adminCreated = await Place.countDocuments({ adminCreated: true });
    const osmCreated = await Place.countDocuments({ source: 'OpenStreetMap' });
    const googleEnriched = await Place.countDocuments({ googlePlaceId: { $exists: true } });

    console.log('\n🔢 TOTALES GENERALES:');
    console.log(`   Total de lugares: ${total.toLocaleString()}`);
    console.log(`   Creados por admin (script inicial): ${adminCreated.toLocaleString()}`);
    console.log(`   Descubiertos de OSM: ${osmCreated.toLocaleString()}`);
    console.log(`   Enriquecidos con Google: ${googleEnriched.toLocaleString()}`);

    // Por categoría
    const byCategory = await Place.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('\n📋 POR CATEGORÍA:');
    console.log('-'.repeat(70));
    byCategory.forEach(c => {
      const rating = c.avgRating ? c.avgRating.toFixed(1) : 'N/A';
      console.log(`   ${c._id?.padEnd(20)} ${String(c.count).padStart(6)} lugares  (Rating: ${rating})`);
    });

    // Por ciudad
    const byCityPattern = await Place.aggregate([
      {
        $project: {
          city: {
            $regexFind: {
              input: '$address',
              regex: /(Bogotá|Medellín|Cali|Cartagena|Barranquilla|Bucaramanga|Pereira|Santa Marta|Cúcuta|Manizales|Ibagué|Pasto|Villavicencio|Armenia|Neiva|Popayán|Valledupar|Montería|Sincelejo)/i
            }
          }
        }
      },
      {
        $match: {
          'city.match': { $ne: null }
        }
      },
      {
        $group: {
          _id: '$city.match',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('\n🏙️ POR CIUDAD:');
    console.log('-'.repeat(70));
    byCityPattern.forEach(c => {
      console.log(`   ${c._id.padEnd(20)} ${String(c.count).padStart(6)} lugares`);
    });

    // Última actividad del script
    const lastActivity = await ScriptActivity.findOne({ 
      scriptName: 'autoDiscoverPlaces' 
    }).sort({ timestamp: -1 });

    if (lastActivity) {
      console.log('\n📅 ÚLTIMA EJECUCIÓN DEL SCRIPT:');
      console.log('-'.repeat(70));
      console.log(`   Estado: ${lastActivity.status}`);
      console.log(`   Fecha: ${new Date(lastActivity.timestamp).toLocaleString('es-CO')}`);
      console.log(`   Mensaje: ${lastActivity.message}`);
      
      if (lastActivity.stats) {
        console.log(`   Encontrados: ${lastActivity.stats.totalFound || 0}`);
        console.log(`   Agregados: ${lastActivity.stats.totalAdded || 0}`);
        console.log(`   Existentes: ${lastActivity.stats.totalSkipped || 0}`);
      }
    }

    // Estadísticas de calidad
    const withRating = await Place.countDocuments({ rating: { $gt: 0 } });
    const withPhone = await Place.countDocuments({ phone: { $exists: true, $ne: '' } });
    const withWebsite = await Place.countDocuments({ website: { $exists: true, $ne: '' } });
    const withPhotos = await Place.countDocuments({ 'photos.0': { $exists: true } });

    console.log('\n📈 CALIDAD DE DATOS:');
    console.log('-'.repeat(70));
    console.log(`   Con rating: ${withRating.toLocaleString()} (${((withRating/total)*100).toFixed(1)}%)`);
    console.log(`   Con teléfono: ${withPhone.toLocaleString()} (${((withPhone/total)*100).toFixed(1)}%)`);
    console.log(`   Con sitio web: ${withWebsite.toLocaleString()} (${((withWebsite/total)*100).toFixed(1)}%)`);
    console.log(`   Con fotos: ${withPhotos.toLocaleString()} (${((withPhotos/total)*100).toFixed(1)}%)`);

    console.log('\n' + '='.repeat(70));
    console.log(`⏰ Actualizado: ${new Date().toLocaleString('es-CO')}`);
    console.log('='.repeat(70));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

monitorProgress();
