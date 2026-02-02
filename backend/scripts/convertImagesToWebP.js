const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Place = require('../models/Place');

/**
 * Script para convertir todas las imágenes de lugares a WebP
 * Útil cuando hay imágenes en formatos incompatibles (AVIF, PNG, JPG, etc.)
 */
async function convertImagesToWebP() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener todos los lugares
    const places = await Place.find({});
    console.log(`📊 Total de lugares encontrados: ${places.length}\n`);

    let totalImagesProcessed = 0;
    let totalImagesConverted = 0;
    let totalImagesFailed = 0;

    for (const place of places) {
      if (place.officialImages.length === 0) {
        console.log(`⏭️  Saltando "${place.name}" - Sin imágenes`);
        continue;
      }

      console.log(`\n📍 Procesando: "${place.name}"`);
      console.log(`   Imágenes: ${place.officialImages.length}`);

      const newImagePaths = [];

      for (const imagePath of place.officialImages) {
        totalImagesProcessed++;

        // Saltar URLs externas (Unsplash, etc.)
        if (imagePath.startsWith('http')) {
          console.log(`   ⏭️  Saltando URL externa: ${imagePath}`);
          newImagePaths.push(imagePath);
          continue;
        }

        // Saltar si ya es WebP
        if (imagePath.endsWith('.webp')) {
          console.log(`   ✅ Ya es WebP: ${imagePath}`);
          newImagePaths.push(imagePath);
          continue;
        }

        try {
          // Construir rutas
          const fullPath = path.join(__dirname, '..', imagePath);
          const parsedPath = path.parse(fullPath);
          const webpFilename = `${parsedPath.name}.webp`;
          const webpPath = path.join(parsedPath.dir, webpFilename);
          const relativeWebpPath = imagePath.replace(parsedPath.base, webpFilename);

          // Verificar si el archivo existe
          try {
            await fs.access(fullPath);
          } catch {
            console.log(`   ⚠️  Archivo no encontrado: ${imagePath}`);
            totalImagesFailed++;
            continue;
          }

          console.log(`   🔄 Convirtiendo: ${parsedPath.base} → ${webpFilename}`);

          // Convertir a WebP
          await sharp(fullPath)
            .resize(1200, 1200, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .webp({ 
              quality: 85,
              effort: 6 
            })
            .toFile(webpPath);

          // Obtener tamaños
          const originalStats = await fs.stat(fullPath);
          const webpStats = await fs.stat(webpPath);
          const reduction = ((1 - (webpStats.size / originalStats.size)) * 100).toFixed(1);

          console.log(`   ✅ Convertido: ${(originalStats.size / 1024).toFixed(0)} KB → ${(webpStats.size / 1024).toFixed(0)} KB (${reduction}% reducción)`);

          // Eliminar archivo original
          await fs.unlink(fullPath);
          console.log(`   🗑️  Eliminado original: ${parsedPath.base}`);

          newImagePaths.push(relativeWebpPath);
          totalImagesConverted++;

        } catch (error) {
          console.error(`   ❌ Error convirtiendo ${imagePath}:`, error.message);
          totalImagesFailed++;
          newImagePaths.push(imagePath); // Mantener la original si falla
        }
      }

      // Actualizar lugar en BD
      if (newImagePaths.length !== place.officialImages.length || 
          JSON.stringify(newImagePaths) !== JSON.stringify(place.officialImages)) {
        place.officialImages = newImagePaths;
        await place.save();
        console.log(`   💾 Base de datos actualizada`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN:');
    console.log('='.repeat(60));
    console.log(`✅ Lugares procesados: ${places.length}`);
    console.log(`📸 Imágenes procesadas: ${totalImagesProcessed}`);
    console.log(`🔄 Imágenes convertidas: ${totalImagesConverted}`);
    console.log(`❌ Imágenes fallidas: ${totalImagesFailed}`);
    console.log('='.repeat(60));

    console.log('\n✅ Conversión completada');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar
convertImagesToWebP();
