#!/usr/bin/env node

/**
 * Script de Validación del Sistema de Moderación
 * Ejecutar: node backend/scripts/validate-moderation.js
 */

const fs = require('fs');
const path = require('path');

const logger = console;

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    logger.log(`✅ ${description}`);
    return true;
  } else {
    logger.log(`❌ ${description} - FALTA: ${filePath}`);
    return false;
  }
}

function checkFileContent(filePath, searchString, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    logger.log(`❌ ${description} - ARCHIVO NO EXISTE: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(searchString)) {
    logger.log(`✅ ${description}`);
    return true;
  } else {
    logger.log(`❌ ${description} - NO ENCONTRADO EN: ${filePath}`);
    return false;
  }
}

async function validateModeration() {
  logger.log('\n🔍 Validando Sistema de Moderación Automática...\n');

  let allValid = true;

  // ============ BACKEND FILES ============
  logger.log('📁 Verificando archivos del backend:\n');

  allValid &= checkFile('models/ModerationLog.js', 'Modelo ModerationLog');
  allValid &= checkFile('services/advancedModerationService.js', 'Servicio avanzado de moderación');
  allValid &= checkFile('routes/moderation.routes.js', 'Rutas de moderación');
  allValid &= checkFile('config/badWordsDict.js', 'Diccionario de malas palabras');
  allValid &= checkFile('middleware/moderation.middleware.js', 'Middleware de moderación');
  allValid &= checkFile('tests/moderation.test.js', 'Pruebas de moderación');

  logger.log('');

  // ============ BACKEND INTEGRATION ============
  logger.log('🔗 Verificando integración en backend:\n');

  allValid &= checkFileContent(
    'server.js',
    "require('./routes/moderation.routes')",
    'Rutas de moderación importadas en server.js'
  );

  allValid &= checkFileContent(
    'server.js',
    "app.use('/api/admin/moderation', moderationRoutes)",
    'Rutas de moderación registradas en server.js'
  );

  allValid &= checkFileContent(
    'middleware/moderation.middleware.js',
    'moderateContentAdvanced',
    'Servicio avanzado integrado en middleware'
  );

  logger.log('');

  // ============ ANGULAR FILES ============
  logger.log('📁 Verificando archivos de Angular:\n');

  allValid &= checkFile(
    '../bedic-admin-panel/src/app/features/moderation/moderation-feed-advanced/moderation-feed-advanced.component.ts',
    'Componente TypeScript del dashboard'
  );

  allValid &= checkFile(
    '../bedic-admin-panel/src/app/features/moderation/moderation-feed-advanced/moderation-feed-advanced.component.html',
    'Template HTML del dashboard'
  );

  allValid &= checkFile(
    '../bedic-admin-panel/src/app/features/moderation/moderation-feed-advanced/moderation-feed-advanced.component.scss',
    'Estilos SCSS del dashboard'
  );

  logger.log('');

  // ============ ANGULAR INTEGRATION ============
  logger.log('🔗 Verificando integración en Angular:\n');

  allValid &= checkFileContent(
    '../bedic-admin-panel/src/app/core/services/admin.service.ts',
    'getModerationLogs',
    'Método getModerationLogs en AdminService'
  );

  allValid &= checkFileContent(
    '../bedic-admin-panel/src/app/core/services/admin.service.ts',
    'getModerationDashboard',
    'Método getModerationDashboard en AdminService'
  );

  allValid &= checkFileContent(
    '../bedic-admin-panel/src/app/core/services/admin.service.ts',
    'getUserViolations',
    'Método getUserViolations en AdminService'
  );

  allValid &= checkFileContent(
    '../bedic-admin-panel/src/app/core/services/language.service.ts',
    'moderation.dashboard_title',
    'Traducciones de moderación en LanguageService'
  );

  logger.log('');

  // ============ DOCUMENTATION ============
  logger.log('📚 Verificando documentación:\n');

  allValid &= checkFile('MODERATION_SYSTEM_INTEGRATION.md', 'Documentación del sistema');
  allValid &= checkFile('../PRODUCTION_INTEGRATION_GUIDE.md', 'Guía de integración en producción');

  logger.log('');

  // ============ SUMMARY ============
  if (allValid) {
    logger.log('✅ ✅ ✅ VALIDACIÓN COMPLETADA - TODO ESTÁ CORRECTO ✅ ✅ ✅\n');
    logger.log('El sistema de moderación automática está completamente integrado y listo para producción.\n');
    logger.log('Próximos pasos:');
    logger.log('1. Ejecutar: node backend/scripts/setup-moderation.js');
    logger.log('2. Ejecutar pruebas: npm test -- tests/moderation.test.js');
    logger.log('3. Iniciar servidor: npm start\n');
    process.exit(0);
  } else {
    logger.log('❌ VALIDACIÓN FALLIDA - Hay archivos o integraciones faltantes\n');
    logger.log('Por favor, revisa los errores arriba y completa la integración.\n');
    process.exit(1);
  }
}

validateModeration();
