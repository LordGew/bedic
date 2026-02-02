/**
 * EJECUTOR MAESTRO DE PRUEBAS - BACKEND BEDIC
 * 
 * Este script ejecuta todas las pruebas de manera secuencial:
 * 1. Análisis de código
 * 2. Pruebas de seguridad
 * 3. Pruebas de estrés
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 SUITE COMPLETA DE PRUEBAS - BACKEND BEDIC\n');
console.log('='.repeat(70));
console.log('');

const results = {
  codeAnalysis: null,
  securityTests: null,
  stressTests: null
};

function runTest(name, script, description) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 ${name}`);
  console.log(`${description}`);
  console.log('='.repeat(70));
  console.log('');
  
  const startTime = Date.now();
  
  try {
    execSync(`node ${script}`, { 
      stdio: 'inherit',
      cwd: __dirname
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ ${name} completado en ${duration}s`);
    return { success: true, duration };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n❌ ${name} falló después de ${duration}s`);
    return { success: false, duration, error: error.message };
  }
}

async function runAllTests() {
  const startTime = Date.now();
  
  console.log('📋 Se ejecutarán las siguientes pruebas:');
  console.log('   1. Análisis de Código y Mejores Prácticas');
  console.log('   2. Pruebas de Seguridad y Vulnerabilidades');
  console.log('   3. Pruebas de Estrés y Rendimiento');
  console.log('');
  console.log('⏱️  Tiempo estimado: 2-5 minutos');
  console.log('');
  
  // Esperar confirmación
  console.log('Presiona Ctrl+C para cancelar o espera 5 segundos para continuar...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 1. Análisis de código
  results.codeAnalysis = runTest(
    'ANÁLISIS DE CÓDIGO',
    'code-analysis.js',
    'Busca secretos hardcodeados, malas prácticas y code smells'
  );
  
  // 2. Pruebas de seguridad
  results.securityTests = runTest(
    'PRUEBAS DE SEGURIDAD',
    'security-test.js',
    'Prueba vulnerabilidades comunes: SQL/NoSQL injection, XSS, CSRF, etc.'
  );
  
  // 3. Pruebas de estrés
  results.stressTests = runTest(
    'PRUEBAS DE ESTRÉS',
    'stress-test.js',
    'Simula carga alta para identificar cuellos de botella'
  );
  
  // Resumen final
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n\n');
  console.log('='.repeat(70));
  console.log('📊 RESUMEN FINAL DE TODAS LAS PRUEBAS');
  console.log('='.repeat(70));
  console.log('');
  
  console.log('📈 RESULTADOS:');
  console.log(`   Análisis de Código: ${results.codeAnalysis.success ? '✅ PASÓ' : '❌ FALLÓ'} (${results.codeAnalysis.duration}s)`);
  console.log(`   Pruebas de Seguridad: ${results.securityTests.success ? '✅ PASÓ' : '❌ FALLÓ'} (${results.securityTests.duration}s)`);
  console.log(`   Pruebas de Estrés: ${results.stressTests.success ? '✅ PASÓ' : '❌ FALLÓ'} (${results.stressTests.duration}s)`);
  console.log('');
  
  const passedTests = [results.codeAnalysis, results.securityTests, results.stressTests]
    .filter(r => r.success).length;
  
  console.log('🏥 EVALUACIÓN GENERAL:');
  if (passedTests === 3) {
    console.log('   ✅ EXCELENTE - Todas las pruebas pasaron');
  } else if (passedTests === 2) {
    console.log('   ⚠️  ACEPTABLE - Una prueba falló, revisar detalles');
  } else if (passedTests === 1) {
    console.log('   ⚠️  POBRE - Múltiples pruebas fallaron');
  } else {
    console.log('   ❌ CRÍTICO - Todas las pruebas fallaron');
  }
  
  console.log(`   Tiempo total: ${totalDuration}s`);
  console.log('');
  
  console.log('💡 PRÓXIMOS PASOS:');
  if (!results.codeAnalysis.success) {
    console.log('   1. Revisar y corregir problemas de código detectados');
  }
  if (!results.securityTests.success) {
    console.log('   2. Corregir vulnerabilidades de seguridad críticas');
  }
  if (!results.stressTests.success) {
    console.log('   3. Optimizar rendimiento y escalabilidad');
  }
  if (passedTests === 3) {
    console.log('   ✅ La aplicación está lista para producción');
  }
  
  console.log('');
  console.log('📝 REPORTES DETALLADOS:');
  console.log('   - Revisa la salida de cada prueba arriba para más detalles');
  console.log('   - Considera ejecutar pruebas individuales para análisis profundo');
  console.log('');
  console.log('='.repeat(70));
  
  process.exit(passedTests === 3 ? 0 : 1);
}

// Ejecutar todas las pruebas
runAllTests().catch(error => {
  console.error('\n❌ Error ejecutando suite de pruebas:', error);
  process.exit(1);
});
