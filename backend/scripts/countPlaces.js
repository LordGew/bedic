const mongoose = require('mongoose');
const Place = require('../models/Place');
require('dotenv').config();

async function countPlaces() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bedic');
    console.log('✅ Conectado a MongoDB\n');

    // Total de lugares
    const total = await Place.countDocuments();
    
    // Por categoría
    const byCategory = await Place.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Por ciudad (basado en dirección)
    const byCityPattern = await Place.aggregate([
      {
        $group: {
          _id: {
            $regexFind: {
              input: '$address',
              regex: /(Bogotá|Medellín|Cali|Cartagena|Barranquilla|Bucaramanga|Pereira|Santa Marta|Cúcuta|Manizales|Ibagué|Pasto)/i
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          '_id.match': { $ne: null }
        }
      },
      {
        $project: {
          city: '$_id.match',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Lugares verificados
    const verified = await Place.countDocuments({ verified: true });
    
    // Lugares creados por admin
    const adminCreated = await Place.countDocuments({ adminCreated: true });

    console.log('📊 RESUMEN DE LUGARES EN LA BASE DE DATOS');
    console.log('='.repeat(50));
    console.log(`\n🔢 TOTAL DE LUGARES: ${total}`);
    console.log(`   ✓ Verificados: ${verified}`);
    console.log(`   👤 Creados por admin: ${adminCreated}`);
    
    console.log('\n📋 POR CATEGORÍA:');
    console.log('-'.repeat(50));
    byCategory.forEach(c => {
      console.log(`   ${c._id || 'Sin categoría'}: ${c.count} lugares`);
    });

    if (byCityPattern.length > 0) {
      console.log('\n🏙️ POR CIUDAD:');
      console.log('-'.repeat(50));
      byCityPattern.forEach(c => {
        console.log(`   ${c.city}: ${c.count} lugares`);
      });
    }

    console.log('\n' + '='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

countPlaces();
