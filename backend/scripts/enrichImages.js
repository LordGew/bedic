#!/usr/bin/env node
/**
 * Script para enriquecer lugares con imágenes de Unsplash
 * Uso: node scripts/enrichImages.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { enrichPlacesWithImages } = require('../services/imageEnricher');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bedic';

async function main() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    console.log('🖼️  Iniciando enriquecimiento de imágenes...\n');
    const count = await enrichPlacesWithImages(100); // Enriquecer hasta 100 lugares

    console.log(`\n✅ Proceso completado. ${count} lugares enriquecidos.\n`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

main();
