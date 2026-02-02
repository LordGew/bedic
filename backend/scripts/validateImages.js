const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Place = require('../models/Place');

/**
 * Script para validar todas las imágenes de lugares
 * Detecta: archivos faltantes, formatos incompatibles, imágenes corruptas
 */
async function validateImages() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    const places = await Place.find({});
    console.log(`📊 Total de lugares: ${places.length}\n`);

    const issues = {
      missingFiles: [],
      incompatibleFormats: [],
      corruptedImages: [],
      externalUrls: [],
      validImages: []
    };

    for (const place of places) {
      if (place.officialImages.length === 0) continue;

      console.log(`📍 Validando: "${place.name}"`);

      for (const imagePath of place.officialImages) {
        // URLs externas
        if (imagePath.startsWith('http')) {
          console.log(`   🌐 URL externa: ${imagePath}`);
          issues.externalUrls.push({ place: place.name, path: imagePath });
          continue;
        }

        const fullPath = path.join(__dirname, '..', imagePath);
        const ext = path.extname(imagePath).toLowerCase();

        // Verificar si existe
        try {
          await fs.access(fullPath);
        } catch {
          console.log(`   ❌ FALTA: ${imagePath}`);
          issues.missingFiles.push({ place: place.name, path: imagePath });
          continue;
        }

        // Verificar formato
        const incompatibleFormats = ['.avif', '.heic', '.heif', '.tiff', '.bmp'];
        if (incompatibleFormats.includes(ext)) {
          console.log(`   ⚠️  INCOMPATIBLE: ${imagePath} (${ext})`);
          issues.incompatibleFormats.push({ 
            place: place.name, 
            path: imagePath, 
            format: ext 
          });
          continue;
        }

        // Verificar si está corrupta
        try {
          const metadata = await sharp(fullPath).metadata();
          const stats = await fs.stat(fullPath);
          console.log(`   ✅ OK: ${path.basename(imagePath)} (${metadata.format}, ${(stats.size / 1024).toFixed(0)} KB)`);
          issues.validImages.push({ 
            place: place.name, 
            path: imagePath,
            format: metadata.format,
            size: stats.size,
            width: metadata.width,
            height: metadata.height
          });
        } catch (error) {
          console.log(`   💥 CORRUPTA: ${imagePath}`);
          issues.corruptedImages.push({ 
            place: place.name, 
            path: imagePath, 
            error: error.message 
          });
        }
      }
    }

    // Reporte final
    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORTE DE VALIDACIÓN:');
    console.log('='.repeat(60));
    
    console.log(`\n✅ Imágenes válidas: ${issues.validImages.length}`);
    
    if (issues.externalUrls.length > 0) {
      console.log(`\n🌐 URLs externas: ${issues.externalUrls.length}`);
      issues.externalUrls.forEach(item => {
        console.log(`   - ${item.place}: ${item.path}`);
      });
    }

    if (issues.incompatibleFormats.length > 0) {
      console.log(`\n⚠️  Formatos incompatibles: ${issues.incompatibleFormats.length}`);
      issues.incompatibleFormats.forEach(item => {
        console.log(`   - ${item.place}: ${item.path} (${item.format})`);
      });
      console.log(`\n   💡 Solución: Ejecuta 'node scripts/convertImagesToWebP.js'`);
    }

    if (issues.missingFiles.length > 0) {
      console.log(`\n❌ Archivos faltantes: ${issues.missingFiles.length}`);
      issues.missingFiles.forEach(item => {
        console.log(`   - ${item.place}: ${item.path}`);
      });
      console.log(`\n   💡 Solución: Re-sube las imágenes desde el panel admin`);
    }

    if (issues.corruptedImages.length > 0) {
      console.log(`\n💥 Imágenes corruptas: ${issues.corruptedImages.length}`);
      issues.corruptedImages.forEach(item => {
        console.log(`   - ${item.place}: ${item.path}`);
        console.log(`     Error: ${item.error}`);
      });
      console.log(`\n   💡 Solución: Elimina y re-sube estas imágenes`);
    }

    console.log('\n' + '='.repeat(60));
    
    // Guardar reporte en archivo
    const reportPath = path.join(__dirname, '..', 'image-validation-report.json');
    await fs.writeFile(reportPath, JSON.stringify(issues, null, 2));
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);

    console.log('\n✅ Validación completada');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar
validateImages();
