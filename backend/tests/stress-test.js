/**
 * PRUEBA DE ESTRÉS - BACKEND BEDIC
 * 
 * Este script realiza pruebas de carga y estrés en el backend
 * para identificar cuellos de botella, fugas de memoria y problemas de rendimiento.
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bedic';

// Configuración de pruebas
const TEST_CONFIG = {
  // Usuarios concurrentes simulados
  CONCURRENT_USERS: 100,
  
  // Duración de la prueba en segundos
  TEST_DURATION: 60,
  
  // Requests por segundo por usuario
  REQUESTS_PER_SECOND: 2,
  
  // Timeout para requests (ms)
  REQUEST_TIMEOUT: 5000
};

// Métricas globales
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  timeouts: 0,
  errors: {},
  responseTimes: [],
  startTime: null,
  endTime: null
};

// Datos de prueba
const testUsers = [];
const testTokens = [];

console.log('🔥 PRUEBA DE ESTRÉS - BACKEND BEDIC\n');
console.log('='.repeat(70));
console.log(`📊 Configuración:`);
console.log(`   - Usuarios concurrentes: ${TEST_CONFIG.CONCURRENT_USERS}`);
console.log(`   - Duración: ${TEST_CONFIG.TEST_DURATION}s`);
console.log(`   - Requests/seg por usuario: ${TEST_CONFIG.REQUESTS_PER_SECOND}`);
console.log(`   - Total requests esperados: ${TEST_CONFIG.CONCURRENT_USERS * TEST_CONFIG.REQUESTS_PER_SECOND * TEST_CONFIG.TEST_DURATION}`);
console.log('='.repeat(70));
console.log('');

// ============ FUNCIONES DE PRUEBA ============

async function createTestUser(index) {
  const userData = {
    name: `Test User ${index}`,
    username: `testuser${index}_${Date.now()}`,
    email: `test${index}_${Date.now()}@test.com`,
    password: 'Test123456!',
    acceptedTerms: true,
    acceptedPrivacy: true
  };

  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, userData, {
      timeout: TEST_CONFIG.REQUEST_TIMEOUT
    });
    
    testUsers.push(userData);
    testTokens.push(response.data.token);
    return response.data.token;
  } catch (error) {
    console.error(`❌ Error creando usuario ${index}:`, error.message);
    return null;
  }
}

async function testEndpoint(endpoint, method = 'GET', data = null, token = null) {
  const startTime = Date.now();
  
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: TEST_CONFIG.REQUEST_TIMEOUT,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    
    metrics.totalRequests++;
    metrics.successfulRequests++;
    metrics.responseTimes.push(responseTime);
    
    return { success: true, responseTime, status: response.status };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    metrics.totalRequests++;
    metrics.failedRequests++;
    
    if (error.code === 'ECONNABORTED') {
      metrics.timeouts++;
    }
    
    const errorType = error.response?.status || error.code || 'UNKNOWN';
    metrics.errors[errorType] = (metrics.errors[errorType] || 0) + 1;
    
    return { success: false, responseTime, error: errorType };
  }
}

// ============ ESCENARIOS DE PRUEBA ============

async function testAuthEndpoints(token) {
  const tests = [
    { endpoint: '/auth/profile', method: 'GET', token },
    { endpoint: '/auth/check', method: 'GET', token }
  ];

  for (const test of tests) {
    await testEndpoint(test.endpoint, test.method, null, test.token);
  }
}

async function testPlacesEndpoints(token) {
  const tests = [
    { endpoint: '/places/nearby?lat=4.7110&lng=-74.0721&radius=5000', method: 'GET' },
    { endpoint: '/places/search?query=restaurante&lat=4.7110&lng=-74.0721', method: 'GET' },
    { endpoint: '/places/categories', method: 'GET' }
  ];

  for (const test of tests) {
    await testEndpoint(test.endpoint, test.method, null, token);
  }
}

async function testRatingsEndpoints(token) {
  // Obtener un lugar aleatorio primero
  const placesResponse = await testEndpoint('/places/nearby?lat=4.7110&lng=-74.0721&radius=5000', 'GET', null, token);
  
  if (placesResponse.success) {
    const tests = [
      { endpoint: '/ratings/place/507f1f77bcf86cd799439011', method: 'GET' }
    ];

    for (const test of tests) {
      await testEndpoint(test.endpoint, test.method, null, token);
    }
  }
}

async function testRecommendationsEndpoints(token) {
  const tests = [
    { endpoint: '/recommendations?lat=4.7110&lng=-74.0721', method: 'GET', token }
  ];

  for (const test of tests) {
    await testEndpoint(test.endpoint, test.method, null, test.token);
  }
}

async function testAnnouncementsEndpoints(token) {
  const tests = [
    { endpoint: '/announcements?lat=4.7110&lng=-74.0721', method: 'GET' }
  ];

  for (const test of tests) {
    await testEndpoint(test.endpoint, test.method, null, token);
  }
}

// ============ SIMULACIÓN DE USUARIO ============

async function simulateUser(userId, token) {
  const scenarios = [
    testAuthEndpoints,
    testPlacesEndpoints,
    testRatingsEndpoints,
    testRecommendationsEndpoints,
    testAnnouncementsEndpoints
  ];

  const interval = 1000 / TEST_CONFIG.REQUESTS_PER_SECOND;
  const endTime = Date.now() + (TEST_CONFIG.TEST_DURATION * 1000);

  while (Date.now() < endTime) {
    // Seleccionar escenario aleatorio
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    try {
      await scenario(token);
    } catch (error) {
      // Error ya registrado en testEndpoint
    }

    // Esperar antes del siguiente request
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

// ============ ANÁLISIS DE RESULTADOS ============

function analyzeResults() {
  metrics.endTime = Date.now();
  const duration = (metrics.endTime - metrics.startTime) / 1000;

  console.log('\n');
  console.log('='.repeat(70));
  console.log('📊 RESULTADOS DE LA PRUEBA DE ESTRÉS');
  console.log('='.repeat(70));
  console.log('');

  // Estadísticas generales
  console.log('📈 ESTADÍSTICAS GENERALES:');
  console.log(`   Total de requests: ${metrics.totalRequests}`);
  console.log(`   Requests exitosos: ${metrics.successfulRequests} (${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`   Requests fallidos: ${metrics.failedRequests} (${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`   Timeouts: ${metrics.timeouts}`);
  console.log(`   Duración real: ${duration.toFixed(2)}s`);
  console.log(`   Throughput: ${(metrics.totalRequests / duration).toFixed(2)} req/s`);
  console.log('');

  // Tiempos de respuesta
  if (metrics.responseTimes.length > 0) {
    const sortedTimes = metrics.responseTimes.sort((a, b) => a - b);
    const avg = sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length;
    const min = sortedTimes[0];
    const max = sortedTimes[sortedTimes.length - 1];
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

    console.log('⏱️  TIEMPOS DE RESPUESTA:');
    console.log(`   Promedio: ${avg.toFixed(2)}ms`);
    console.log(`   Mínimo: ${min}ms`);
    console.log(`   Máximo: ${max}ms`);
    console.log(`   Percentil 50 (mediana): ${p50}ms`);
    console.log(`   Percentil 95: ${p95}ms`);
    console.log(`   Percentil 99: ${p99}ms`);
    console.log('');
  }

  // Errores
  if (Object.keys(metrics.errors).length > 0) {
    console.log('❌ ERRORES ENCONTRADOS:');
    Object.entries(metrics.errors).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} (${((count / metrics.totalRequests) * 100).toFixed(2)}%)`);
    });
    console.log('');
  }

  // Evaluación de salud
  console.log('🏥 EVALUACIÓN DE SALUD:');
  const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
  const avgResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;

  if (successRate >= 99 && avgResponseTime < 200) {
    console.log('   ✅ EXCELENTE - El sistema maneja la carga sin problemas');
  } else if (successRate >= 95 && avgResponseTime < 500) {
    console.log('   ✅ BUENO - El sistema funciona bien bajo carga');
  } else if (successRate >= 90 && avgResponseTime < 1000) {
    console.log('   ⚠️  ACEPTABLE - El sistema muestra signos de estrés');
  } else if (successRate >= 80) {
    console.log('   ⚠️  DEGRADADO - El sistema tiene problemas bajo carga');
  } else {
    console.log('   ❌ CRÍTICO - El sistema no puede manejar la carga');
  }
  console.log('');

  // Recomendaciones
  console.log('💡 RECOMENDACIONES:');
  if (avgResponseTime > 500) {
    console.log('   - Considerar optimizar consultas a la base de datos');
    console.log('   - Implementar caché para endpoints frecuentes');
  }
  if (metrics.timeouts > 0) {
    console.log('   - Aumentar timeout o mejorar rendimiento del servidor');
  }
  if (successRate < 95) {
    console.log('   - Revisar logs del servidor para identificar errores');
    console.log('   - Considerar escalar horizontalmente');
  }
  if (metrics.errors['429']) {
    console.log('   - Ajustar límites de rate limiting');
  }
  if (metrics.errors['500'] || metrics.errors['502'] || metrics.errors['503']) {
    console.log('   - Revisar errores del servidor y estabilidad');
  }
  console.log('');
  console.log('='.repeat(70));
}

// ============ PRUEBA DE CONEXIÓN A BASE DE DATOS ============

async function testDatabaseConnection() {
  console.log('🔍 Verificando conexión a MongoDB...');
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conexión a MongoDB exitosa\n');
    
    // Obtener estadísticas de la base de datos
    const stats = await mongoose.connection.db.stats();
    console.log('📊 Estadísticas de la base de datos:');
    console.log(`   Colecciones: ${stats.collections}`);
    console.log(`   Tamaño de datos: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Tamaño de índices: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    console.log('⚠️  Continuando sin verificación de base de datos...\n');
    return false;
  }
}

// ============ EJECUCIÓN PRINCIPAL ============

async function runStressTest() {
  try {
    // Verificar conexión a base de datos
    await testDatabaseConnection();

    console.log('🚀 Iniciando prueba de estrés...\n');
    console.log('📝 Fase 1: Creando usuarios de prueba...');
    
    // Crear usuarios de prueba
    const userPromises = [];
    for (let i = 0; i < TEST_CONFIG.CONCURRENT_USERS; i++) {
      userPromises.push(createTestUser(i));
      
      // Mostrar progreso cada 10 usuarios
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`   Creados ${i + 1}/${TEST_CONFIG.CONCURRENT_USERS} usuarios...\r`);
      }
    }
    
    const tokens = await Promise.all(userPromises);
    const validTokens = tokens.filter(t => t !== null);
    
    console.log(`\n✅ ${validTokens.length}/${TEST_CONFIG.CONCURRENT_USERS} usuarios creados exitosamente\n`);

    if (validTokens.length === 0) {
      console.error('❌ No se pudo crear ningún usuario. Abortando prueba.');
      process.exit(1);
    }

    console.log('📝 Fase 2: Ejecutando prueba de carga...');
    console.log('⏳ Esto tomará aproximadamente', TEST_CONFIG.TEST_DURATION, 'segundos...\n');

    metrics.startTime = Date.now();

    // Simular usuarios concurrentes
    const userSimulations = validTokens.map((token, index) => 
      simulateUser(index, token)
    );

    // Mostrar progreso en tiempo real
    const progressInterval = setInterval(() => {
      const elapsed = ((Date.now() - metrics.startTime) / 1000).toFixed(0);
      const progress = ((elapsed / TEST_CONFIG.TEST_DURATION) * 100).toFixed(1);
      process.stdout.write(`   Progreso: ${progress}% | Requests: ${metrics.totalRequests} | Exitosos: ${metrics.successfulRequests} | Fallidos: ${metrics.failedRequests}\r`);
    }, 1000);

    await Promise.all(userSimulations);
    clearInterval(progressInterval);

    console.log('\n\n✅ Prueba de carga completada\n');

    // Analizar resultados
    analyzeResults();

    // Cerrar conexión a MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la prueba de estrés:', error);
    process.exit(1);
  }
}

// Ejecutar prueba
runStressTest();
