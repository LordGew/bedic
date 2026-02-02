/**
 * Script de Limpieza de Datos
 * Se ejecuta cada 7 días para mantener la BD optimizada
 * - Elimina imágenes antiguas
 * - Elimina lugares duplicados
 * - Optimiza índices
 * - Genera reportes de limpieza
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const Place = require('../models/Place');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const IMAGES_DIR = path.join(__dirname, '../uploads/places');
const LOGS_DIR = path.join(__dirname, '../logs');

// Conectar a MongoDB
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB conectado para limpieza');
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    }
}

// Crear directorio de logs si no existe
function ensureLogsDir() {
    if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
}

// Eliminar imágenes antiguas (más de 30 días)
async function cleanOldImages() {
    console.log('\n🗑️  Limpiando imágenes antiguas...');
    
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        let deletedCount = 0;

        if (!fs.existsSync(IMAGES_DIR)) {
            console.log('⏭️  Directorio de imágenes no existe');
            return 0;
        }

        const files = fs.readdirSync(IMAGES_DIR);

        for (const file of files) {
            const filepath = path.join(IMAGES_DIR, file);
            const stats = fs.statSync(filepath);

            if (stats.mtime < thirtyDaysAgo) {
                fs.unlinkSync(filepath);
                deletedCount++;
            }
        }

        console.log(`✅ ${deletedCount} imágenes antiguas eliminadas`);
        return deletedCount;
    } catch (error) {
        console.error('❌ Error limpiando imágenes:', error.message);
        return 0;
    }
}

// Eliminar lugares duplicados
async function removeDuplicates() {
    console.log('\n🔄 Eliminando lugares duplicados...');
    
    try {
        let deletedCount = 0;

        // Encontrar duplicados por nombre y coordenadas
        const duplicates = await Place.aggregate([
            {
                $group: {
                    _id: {
                        name: '$name',
                        category: '$category',
                        coordinates: '$coordinates.coordinates'
                    },
                    ids: { $push: '$_id' },
                    count: { $sum: 1 }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]);

        for (const duplicate of duplicates) {
            // Mantener el primero, eliminar los demás
            const idsToDelete = duplicate.ids.slice(1);
            
            for (const id of idsToDelete) {
                await Place.findByIdAndDelete(id);
                deletedCount++;
            }
        }

        console.log(`✅ ${deletedCount} lugares duplicados eliminados`);
        return deletedCount;
    } catch (error) {
        console.error('❌ Error eliminando duplicados:', error.message);
        return 0;
    }
}

// Optimizar índices
async function optimizeIndexes() {
    console.log('\n⚡ Optimizando índices...');
    
    try {
        // Reindexar colección
        await Place.collection.reIndex();
        
        console.log('✅ Índices optimizados');
        return true;
    } catch (error) {
        console.error('❌ Error optimizando índices:', error.message);
        return false;
    }
}

// Generar reporte de estadísticas
async function generateReport() {
    console.log('\n📊 Generando reporte de estadísticas...');
    
    try {
        const totalPlaces = await Place.countDocuments();
        const placesWithImages = await Place.countDocuments({ 
            officialImages: { $ne: [], $exists: true } 
        });
        
        const placesByCategory = await Place.aggregate([
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

        const placesBySource = await Place.aggregate([
            {
                $group: {
                    _id: '$source',
                    count: { $sum: 1 }
                }
            }
        ]);

        const report = {
            timestamp: new Date().toISOString(),
            statistics: {
                totalPlaces,
                placesWithImages,
                percentageWithImages: ((placesWithImages / totalPlaces) * 100).toFixed(2) + '%',
                placesByCategory,
                placesBySource
            }
        };

        // Guardar reporte
        const reportPath = path.join(LOGS_DIR, `cleanup-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log(`✅ Reporte guardado: ${reportPath}`);
        console.log(`\n📈 Estadísticas:`);
        console.log(`   Total de lugares: ${totalPlaces}`);
        console.log(`   Lugares con imágenes: ${placesWithImages} (${report.statistics.percentageWithImages})`);

        return report;
    } catch (error) {
        console.error('❌ Error generando reporte:', error.message);
        return null;
    }
}

// Función principal de limpieza
async function runCleanup() {
    console.log('\n' + '='.repeat(50));
    console.log('🧹 INICIANDO LIMPIEZA DE DATOS');
    console.log('='.repeat(50));
    console.log(`⏰ ${new Date().toLocaleString()}\n`);

    try {
        let totalDeleted = 0;

        // Ejecutar limpiezas
        const imagesDeleted = await cleanOldImages();
        totalDeleted += imagesDeleted;

        const duplicatesDeleted = await removeDuplicates();
        totalDeleted += duplicatesDeleted;

        const indexesOptimized = await optimizeIndexes();

        // Generar reporte
        const report = await generateReport();

        console.log('\n' + '='.repeat(50));
        console.log('✅ LIMPIEZA COMPLETADA');
        console.log('='.repeat(50));
        console.log(`📊 Total de elementos eliminados: ${totalDeleted}`);
        console.log(`⚡ Índices optimizados: ${indexesOptimized ? 'Sí' : 'No'}`);
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        console.error('❌ Error en limpieza:', error);
    }
}

// Scheduler para ejecutar cada 7 días
function scheduleCleanup() {
    // Ejecutar cada domingo a las 3:00 AM
    cron.schedule('0 3 * * 0', async () => {
        console.log('\n⏰ Ejecutando limpieza programada...');
        await runCleanup();
    });

    console.log('✅ Scheduler configurado: Se ejecutará cada domingo a las 3:00 AM');
}

// Ejecutar limpieza manual
async function runManualCleanup() {
    await connectDB();
    ensureLogsDir();
    await runCleanup();
    process.exit(0);
}

// Iniciar con scheduler
async function startWithScheduler() {
    await connectDB();
    ensureLogsDir();
    scheduleCleanup();
    
    // Ejecutar una vez al iniciar
    await runCleanup();
    
    console.log('\n✅ Sistema de limpieza de datos activo');
    console.log('📌 Presiona Ctrl+C para detener\n');
}

// Exportar funciones
module.exports = {
    runCleanup,
    scheduleCleanup,
    startWithScheduler,
    runManualCleanup
};

// Si se ejecuta directamente
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--manual')) {
        runManualCleanup();
    } else if (args.includes('--scheduler')) {
        startWithScheduler();
    } else {
        console.log('Uso:');
        console.log('  node dataCleanup.js --manual    (Ejecutar una vez)');
        console.log('  node dataCleanup.js --scheduler (Ejecutar con scheduler)');
        process.exit(0);
    }
}
