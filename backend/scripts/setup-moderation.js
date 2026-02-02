#!/usr/bin/env node

/**
 * Script de Setup para Sistema de Moderación Automática
 * Ejecutar: node backend/scripts/setup-moderation.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const logger = console;

async function setupModeration() {
  try {
    logger.log('\n🚀 Iniciando setup del sistema de moderación automática...\n');

    // Conectar a MongoDB
    logger.log('📡 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('✅ Conectado a MongoDB\n');

    // Importar modelos
    const ModerationLog = require('../models/ModerationLog');
    const User = require('../models/User');

    // Crear índices en ModerationLog
    logger.log('📑 Creando índices en ModerationLog...');
    await ModerationLog.collection.createIndex({ userId: 1, createdAt: -1 });
    await ModerationLog.collection.createIndex({ actionType: 1 });
    await ModerationLog.collection.createIndex({ severity: 1 });
    await ModerationLog.collection.createIndex({ createdAt: -1 });
    logger.log('✅ Índices creados\n');

    // Verificar que el modelo está funcionando
    logger.log('🧪 Probando modelo ModerationLog...');
    const testLog = new ModerationLog({
      userId: new mongoose.Types.ObjectId(),
      actionType: 'TEST',
      reason: 'SETUP_TEST',
      severity: 'LEVE',
      contentDetails: {
        type: 'comment',
        text: 'Test content'
      },
      detectedIssues: {
        badWords: [],
        spam: false,
        toxicityScore: 0
      },
      userStats: {
        totalViolations: 0,
        severeViolations: 0,
        trustScore: 100
      },
      actionDetails: {
        status: 'APPROVED'
      },
      notificationSent: false
    });

    await testLog.save();
    await ModerationLog.deleteOne({ _id: testLog._id });
    logger.log('✅ Modelo ModerationLog funcionando correctamente\n');

    // Verificar que el middleware está disponible
    logger.log('🔧 Verificando middleware de moderación...');
    try {
      const { moderateBeforeSave, rateLimit } = require('../middleware/moderation.middleware');
      logger.log('✅ Middleware de moderación disponible\n');
    } catch (error) {
      logger.error('❌ Error al cargar middleware:', error.message);
      throw error;
    }

    // Verificar que el servicio avanzado está disponible
    logger.log('⚙️  Verificando servicio avanzado de moderación...');
    try {
      const { moderateContentAdvanced } = require('../services/advancedModerationService');
      logger.log('✅ Servicio avanzado de moderación disponible\n');
    } catch (error) {
      logger.error('❌ Error al cargar servicio avanzado:', error.message);
      throw error;
    }

    // Verificar que las rutas están disponibles
    logger.log('🛣️  Verificando rutas de moderación...');
    try {
      const moderationRoutes = require('../routes/moderation.routes');
      logger.log('✅ Rutas de moderación disponibles\n');
    } catch (error) {
      logger.error('❌ Error al cargar rutas:', error.message);
      throw error;
    }

    // Verificar diccionario de malas palabras
    logger.log('📚 Verificando diccionario de malas palabras...');
    try {
      const badWordsDict = require('../config/badWordsDict');
      const severCount = badWordsDict.es.SEVERO.length;
      const moderateCount = badWordsDict.es.MODERADO.length;
      const mildCount = badWordsDict.es.LEVE.length;
      logger.log(`✅ Diccionario cargado:`);
      logger.log(`   - Palabras severas: ${severCount}`);
      logger.log(`   - Palabras moderadas: ${moderateCount}`);
      logger.log(`   - Palabras leves: ${mildCount}\n`);
    } catch (error) {
      logger.error('❌ Error al cargar diccionario:', error.message);
      throw error;
    }

    // Resumen de estadísticas
    logger.log('📊 Estadísticas del sistema:\n');
    const logCount = await ModerationLog.countDocuments();
    const userCount = await User.countDocuments();
    logger.log(`   - Logs de moderación: ${logCount}`);
    logger.log(`   - Usuarios en sistema: ${userCount}\n`);

    logger.log('✅ ✅ ✅ SETUP COMPLETADO EXITOSAMENTE ✅ ✅ ✅\n');
    logger.log('El sistema de moderación automática está listo para producción.\n');
    logger.log('Próximos pasos:');
    logger.log('1. Revisar PRODUCTION_INTEGRATION_GUIDE.md');
    logger.log('2. Ejecutar pruebas: npm test -- tests/moderation.test.js');
    logger.log('3. Iniciar servidor: npm start\n');

    process.exit(0);
  } catch (error) {
    logger.error('\n❌ Error durante el setup:', error.message);
    logger.error(error.stack);
    process.exit(1);
  }
}

setupModeration();
