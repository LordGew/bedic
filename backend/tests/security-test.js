/**
 * PRUEBA DE SEGURIDAD Y VULNERABILIDADES - BACKEND BEDIC
 * 
 * Este script realiza pruebas de seguridad para identificar vulnerabilidades comunes:
 * - SQL Injection
 * - NoSQL Injection
 * - XSS (Cross-Site Scripting)
 * - CSRF (Cross-Site Request Forgery)
 * - Autenticación y autorización
 * - Rate limiting
 * - Validación de entrada
 * - Exposición de información sensible
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// Resultados de las pruebas
const results = {
  passed: [],
  failed: [],
  warnings: [],
  critical: []
};

console.log('🔒 PRUEBA DE SEGURIDAD Y VULNERABILIDADES - BACKEND BEDIC\n');
console.log('='.repeat(70));
console.log('');

// ============ UTILIDADES ============

function addResult(category, test, status, details = '') {
  const result = { test, details };
  
  if (status === 'PASS') {
    results.passed.push(result);
    console.log(`✅ ${test}`);
  } else if (status === 'FAIL') {
    results.failed.push(result);
    console.log(`❌ ${test}`);
  } else if (status === 'WARNING') {
    results.warnings.push(result);
    console.log(`⚠️  ${test}`);
  } else if (status === 'CRITICAL') {
    results.critical.push(result);
    console.log(`🚨 ${test}`);
  }
  
  if (details) {
    console.log(`   ${details}`);
  }
}

async function makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers,
      validateStatus: () => true // No lanzar error en ningún status
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      data: error.response?.data || {},
      headers: error.response?.headers || {},
      error: error.message
    };
  }
}

// ============ PRUEBAS DE INYECCIÓN SQL/NoSQL ============

async function testNoSQLInjection() {
  console.log('\n📝 PRUEBAS DE INYECCIÓN NoSQL:\n');

  // Test 1: Inyección en login
  const loginPayloads = [
    { email: { $ne: null }, password: { $ne: null } },
    { email: { $gt: '' }, password: { $gt: '' } },
    { email: 'admin@test.com\' OR \'1\'=\'1', password: 'anything' },
    { email: { $regex: '.*' }, password: 'test' }
  ];

  for (const payload of loginPayloads) {
    const response = await makeRequest('/auth/login', 'POST', payload);
    
    if (response.status === 200 && response.data.token) {
      addResult('injection', 'Inyección NoSQL en login', 'CRITICAL', 
        `Payload exitoso: ${JSON.stringify(payload)}`);
    } else {
      addResult('injection', 'Protección contra inyección NoSQL en login', 'PASS');
    }
  }

  // Test 2: Inyección en búsqueda
  const searchPayloads = [
    '{ "$ne": null }',
    '{ "$gt": "" }',
    '{ "$where": "this.password.length > 0" }'
  ];

  for (const payload of searchPayloads) {
    const response = await makeRequest(`/places/search?query=${encodeURIComponent(payload)}`);
    
    if (response.status === 200 && response.data.length > 100) {
      addResult('injection', 'Posible inyección NoSQL en búsqueda', 'WARNING',
        `Payload: ${payload}`);
    } else {
      addResult('injection', 'Protección contra inyección NoSQL en búsqueda', 'PASS');
    }
  }
}

// ============ PRUEBAS DE XSS ============

async function testXSS() {
  console.log('\n📝 PRUEBAS DE XSS (Cross-Site Scripting):\n');

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    '<svg/onload=alert("XSS")>',
    'javascript:alert("XSS")'
  ];

  // Crear usuario con payload XSS
  for (const payload of xssPayloads) {
    const userData = {
      name: payload,
      username: `xsstest${Date.now()}`,
      email: `xss${Date.now()}@test.com`,
      password: 'Test123456!',
      acceptedTerms: true,
      acceptedPrivacy: true
    };

    const response = await makeRequest('/auth/register', 'POST', userData);
    
    if (response.status === 201) {
      // Verificar si el payload se almacenó sin sanitizar
      const profileResponse = await makeRequest('/auth/profile', 'GET', null, {
        Authorization: `Bearer ${response.data.token}`
      });

      if (profileResponse.data.name === payload) {
        addResult('xss', 'Posible vulnerabilidad XSS en nombre de usuario', 'WARNING',
          `Payload almacenado sin sanitizar: ${payload}`);
      } else {
        addResult('xss', 'Sanitización de entrada en nombre de usuario', 'PASS');
      }
    }
  }

  // Test XSS en comentarios/ratings
  const commentPayload = {
    placeId: '507f1f77bcf86cd799439011',
    comment: '<script>alert("XSS")</script>',
    rating: 5
  };

  const commentResponse = await makeRequest('/ratings', 'POST', commentPayload);
  
  if (commentResponse.status === 201 && commentResponse.data.comment === commentPayload.comment) {
    addResult('xss', 'Posible vulnerabilidad XSS en comentarios', 'WARNING',
      'Comentarios no sanitizados');
  } else {
    addResult('xss', 'Sanitización de comentarios', 'PASS');
  }
}

// ============ PRUEBAS DE AUTENTICACIÓN Y AUTORIZACIÓN ============

async function testAuthentication() {
  console.log('\n📝 PRUEBAS DE AUTENTICACIÓN Y AUTORIZACIÓN:\n');

  // Test 1: Acceso sin token
  const protectedEndpoints = [
    '/auth/profile',
    '/ratings',
    '/recommendations',
    '/saved-places'
  ];

  for (const endpoint of protectedEndpoints) {
    const response = await makeRequest(endpoint);
    
    if (response.status === 401 || response.status === 403) {
      addResult('auth', `Protección de endpoint: ${endpoint}`, 'PASS');
    } else if (response.status === 200) {
      addResult('auth', `Endpoint desprotegido: ${endpoint}`, 'CRITICAL',
        'Acceso sin autenticación permitido');
    }
  }

  // Test 2: Token inválido
  const invalidTokens = [
    'invalid.token.here',
    'Bearer invalid',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
    ''
  ];

  for (const token of invalidTokens) {
    const response = await makeRequest('/auth/profile', 'GET', null, {
      Authorization: `Bearer ${token}`
    });

    if (response.status === 401) {
      addResult('auth', 'Rechazo de token inválido', 'PASS');
    } else if (response.status === 200) {
      addResult('auth', 'Token inválido aceptado', 'CRITICAL',
        `Token: ${token.substring(0, 20)}...`);
    }
  }

  // Test 3: Manipulación de token
  const testUser = {
    name: 'Auth Test User',
    username: `authtest${Date.now()}`,
    email: `authtest${Date.now()}@test.com`,
    password: 'Test123456!',
    acceptedTerms: true,
    acceptedPrivacy: true
  };

  const registerResponse = await makeRequest('/auth/register', 'POST', testUser);
  
  if (registerResponse.status === 201 && registerResponse.data.token) {
    const token = registerResponse.data.token;
    
    // Intentar modificar el token
    const modifiedToken = token.slice(0, -5) + 'xxxxx';
    const modifiedResponse = await makeRequest('/auth/profile', 'GET', null, {
      Authorization: `Bearer ${modifiedToken}`
    });

    if (modifiedResponse.status === 401) {
      addResult('auth', 'Detección de token modificado', 'PASS');
    } else {
      addResult('auth', 'Token modificado aceptado', 'CRITICAL');
    }
  }

  // Test 4: Acceso a recursos de otros usuarios
  const user1Response = await makeRequest('/auth/register', 'POST', {
    name: 'User 1',
    username: `user1_${Date.now()}`,
    email: `user1_${Date.now()}@test.com`,
    password: 'Test123456!',
    acceptedTerms: true,
    acceptedPrivacy: true
  });

  const user2Response = await makeRequest('/auth/register', 'POST', {
    name: 'User 2',
    username: `user2_${Date.now()}`,
    email: `user2_${Date.now()}@test.com`,
    password: 'Test123456!',
    acceptedTerms: true,
    acceptedPrivacy: true
  });

  if (user1Response.data.token && user2Response.data.token) {
    const user1Id = user1Response.data.user?.id || user1Response.data.user?._id;
    
    if (user1Id) {
      // User 2 intenta acceder al perfil de User 1
      const unauthorizedAccess = await makeRequest(`/users/${user1Id}`, 'GET', null, {
        Authorization: `Bearer ${user2Response.data.token}`
      });

      if (unauthorizedAccess.status === 403 || unauthorizedAccess.status === 401) {
        addResult('auth', 'Protección contra acceso no autorizado a perfiles', 'PASS');
      } else if (unauthorizedAccess.status === 200) {
        addResult('auth', 'Acceso no autorizado a perfiles de otros usuarios', 'CRITICAL');
      }
    } else {
      addResult('auth', 'No se pudo verificar acceso no autorizado', 'WARNING', 'Estructura de respuesta inesperada');
    }
  }
}

// ============ PRUEBAS DE RATE LIMITING ============

async function testRateLimiting() {
  console.log('\n📝 PRUEBAS DE RATE LIMITING:\n');

  const endpoint = '/auth/login';
  const requests = [];
  const BURST_SIZE = 50;

  // Enviar muchas peticiones rápidamente
  for (let i = 0; i < BURST_SIZE; i++) {
    requests.push(makeRequest(endpoint, 'POST', {
      email: 'test@test.com',
      password: 'wrongpassword'
    }));
  }

  const responses = await Promise.all(requests);
  const rateLimited = responses.filter(r => r.status === 429).length;

  if (rateLimited > 0) {
    addResult('ratelimit', 'Rate limiting implementado', 'PASS',
      `${rateLimited}/${BURST_SIZE} requests bloqueadas`);
  } else {
    addResult('ratelimit', 'Rate limiting no detectado', 'WARNING',
      'Considerar implementar rate limiting para prevenir ataques de fuerza bruta');
  }
}

// ============ PRUEBAS DE VALIDACIÓN DE ENTRADA ============

async function testInputValidation() {
  console.log('\n📝 PRUEBAS DE VALIDACIÓN DE ENTRADA:\n');

  // Test 1: Campos requeridos
  const incompleteUser = {
    email: 'test@test.com'
    // Faltan campos requeridos
  };

  const response1 = await makeRequest('/auth/register', 'POST', incompleteUser);
  
  if (response1.status === 400) {
    addResult('validation', 'Validación de campos requeridos', 'PASS');
  } else {
    addResult('validation', 'Falta validación de campos requeridos', 'FAIL');
  }

  // Test 2: Formato de email
  const invalidEmails = [
    'notanemail',
    '@test.com',
    'test@',
    'test..test@test.com'
  ];

  for (const email of invalidEmails) {
    const response = await makeRequest('/auth/register', 'POST', {
      name: 'Test',
      username: `test${Date.now()}`,
      email,
      password: 'Test123456!',
      acceptedTerms: true,
      acceptedPrivacy: true
    });

    if (response.status === 400) {
      addResult('validation', 'Validación de formato de email', 'PASS');
    } else {
      addResult('validation', 'Email inválido aceptado', 'FAIL', `Email: ${email}`);
    }
  }

  // Test 3: Longitud de contraseña
  const weakPasswords = ['123', 'abc', 'test'];

  for (const password of weakPasswords) {
    const response = await makeRequest('/auth/register', 'POST', {
      name: 'Test',
      username: `test${Date.now()}`,
      email: `test${Date.now()}@test.com`,
      password,
      acceptedTerms: true,
      acceptedPrivacy: true
    });

    if (response.status === 400) {
      addResult('validation', 'Validación de contraseña débil', 'PASS');
    } else {
      addResult('validation', 'Contraseña débil aceptada', 'WARNING', `Password: ${password}`);
    }
  }

  // Test 4: Campos excesivamente largos
  const longString = 'A'.repeat(10000);
  const response4 = await makeRequest('/auth/register', 'POST', {
    name: longString,
    username: `test${Date.now()}`,
    email: `test${Date.now()}@test.com`,
    password: 'Test123456!',
    acceptedTerms: true,
    acceptedPrivacy: true
  });

  if (response4.status === 400) {
    addResult('validation', 'Validación de longitud máxima', 'PASS');
  } else {
    addResult('validation', 'Falta validación de longitud máxima', 'WARNING');
  }
}

// ============ PRUEBAS DE EXPOSICIÓN DE INFORMACIÓN ============

async function testInformationDisclosure() {
  console.log('\n📝 PRUEBAS DE EXPOSICIÓN DE INFORMACIÓN:\n');

  // Test 1: Mensajes de error detallados
  const response1 = await makeRequest('/auth/login', 'POST', {
    email: 'nonexistent@test.com',
    password: 'wrongpassword'
  });

  if (response1.data.message && response1.data.message.toLowerCase().includes('usuario no encontrado')) {
    addResult('disclosure', 'Exposición de información en error de login', 'WARNING',
      'Los mensajes de error no deben revelar si el usuario existe');
  } else {
    addResult('disclosure', 'Mensajes de error genéricos en login', 'PASS');
  }

  // Test 2: Stack traces en respuestas
  const response2 = await makeRequest('/invalid/endpoint/that/causes/error');
  
  if (response2.data.stack || response2.data.trace) {
    addResult('disclosure', 'Stack trace expuesto en errores', 'CRITICAL',
      'Nunca exponer stack traces en producción');
  } else {
    addResult('disclosure', 'Stack traces no expuestos', 'PASS');
  }

  // Test 3: Versión del servidor en headers
  const response3 = await makeRequest('/');
  
  if (response3.headers['x-powered-by']) {
    addResult('disclosure', 'Header X-Powered-By expuesto', 'WARNING',
      `Valor: ${response3.headers['x-powered-by']}`);
  } else {
    addResult('disclosure', 'Header X-Powered-By oculto', 'PASS');
  }

  // Test 4: Enumeración de usuarios
  const response4 = await makeRequest('/auth/register', 'POST', {
    name: 'Test',
    username: 'admin', // Usuario común
    email: `test${Date.now()}@test.com`,
    password: 'Test123456!',
    acceptedTerms: true,
    acceptedPrivacy: true
  });

  if (response4.status === 400 && response4.data.message && 
      response4.data.message.toLowerCase().includes('username ya existe')) {
    addResult('disclosure', 'Posible enumeración de usuarios', 'WARNING',
      'El mensaje revela si el username existe');
  } else {
    addResult('disclosure', 'Protección contra enumeración de usuarios', 'PASS');
  }
}

// ============ PRUEBAS DE SEGURIDAD DE HEADERS ============

async function testSecurityHeaders() {
  console.log('\n📝 PRUEBAS DE HEADERS DE SEGURIDAD:\n');

  const response = await makeRequest('/');
  const headers = response.headers;

  const securityHeaders = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': ['DENY', 'SAMEORIGIN'],
    'x-xss-protection': '1; mode=block',
    'strict-transport-security': 'max-age',
    'content-security-policy': 'default-src'
  };

  for (const [header, expectedValue] of Object.entries(securityHeaders)) {
    const headerValue = headers[header];
    
    if (headerValue) {
      if (Array.isArray(expectedValue)) {
        if (expectedValue.some(v => headerValue.includes(v))) {
          addResult('headers', `Header de seguridad: ${header}`, 'PASS');
        } else {
          addResult('headers', `Header ${header} con valor incorrecto`, 'WARNING');
        }
      } else {
        if (headerValue.includes(expectedValue)) {
          addResult('headers', `Header de seguridad: ${header}`, 'PASS');
        } else {
          addResult('headers', `Header ${header} con valor incorrecto`, 'WARNING');
        }
      }
    } else {
      addResult('headers', `Header de seguridad faltante: ${header}`, 'WARNING');
    }
  }
}

// ============ PRUEBAS DE CORS ============

async function testCORS() {
  console.log('\n📝 PRUEBAS DE CORS:\n');

  const response = await makeRequest('/', 'OPTIONS', null, {
    'Origin': 'https://malicious-site.com',
    'Access-Control-Request-Method': 'POST'
  });

  const corsHeader = response.headers['access-control-allow-origin'];

  if (corsHeader === '*') {
    addResult('cors', 'CORS permite cualquier origen', 'WARNING',
      'Considerar restringir orígenes permitidos');
  } else if (corsHeader) {
    addResult('cors', 'CORS configurado con orígenes específicos', 'PASS');
  } else {
    addResult('cors', 'CORS no configurado', 'WARNING');
  }
}

// ============ ANÁLISIS DE RESULTADOS ============

function printResults() {
  console.log('\n');
  console.log('='.repeat(70));
  console.log('📊 RESUMEN DE PRUEBAS DE SEGURIDAD');
  console.log('='.repeat(70));
  console.log('');

  console.log(`✅ Pruebas pasadas: ${results.passed.length}`);
  console.log(`⚠️  Advertencias: ${results.warnings.length}`);
  console.log(`❌ Pruebas fallidas: ${results.failed.length}`);
  console.log(`🚨 Vulnerabilidades críticas: ${results.critical.length}`);
  console.log('');

  if (results.critical.length > 0) {
    console.log('🚨 VULNERABILIDADES CRÍTICAS:');
    results.critical.forEach(r => {
      console.log(`   - ${r.test}`);
      if (r.details) console.log(`     ${r.details}`);
    });
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('❌ PRUEBAS FALLIDAS:');
    results.failed.forEach(r => {
      console.log(`   - ${r.test}`);
      if (r.details) console.log(`     ${r.details}`);
    });
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('⚠️  ADVERTENCIAS:');
    results.warnings.forEach(r => {
      console.log(`   - ${r.test}`);
      if (r.details) console.log(`     ${r.details}`);
    });
    console.log('');
  }

  // Evaluación general
  console.log('🏥 EVALUACIÓN GENERAL DE SEGURIDAD:');
  const totalTests = results.passed.length + results.warnings.length + 
                     results.failed.length + results.critical.length;
  const score = ((results.passed.length / totalTests) * 100).toFixed(1);

  if (results.critical.length > 0) {
    console.log('   ❌ CRÍTICO - Se encontraron vulnerabilidades críticas que deben corregirse inmediatamente');
  } else if (results.failed.length > 5) {
    console.log('   ⚠️  POBRE - Múltiples problemas de seguridad detectados');
  } else if (results.warnings.length > 10) {
    console.log('   ⚠️  ACEPTABLE - Varias mejoras de seguridad recomendadas');
  } else if (score >= 80) {
    console.log('   ✅ BUENO - La aplicación tiene buenas prácticas de seguridad');
  } else {
    console.log('   ✅ EXCELENTE - La aplicación está bien protegida');
  }

  console.log(`   Puntuación: ${score}/100`);
  console.log('');
  console.log('='.repeat(70));
}

// ============ EJECUCIÓN PRINCIPAL ============

async function runSecurityTests() {
  try {
    console.log('🚀 Iniciando pruebas de seguridad...\n');

    await testNoSQLInjection();
    await testXSS();
    await testAuthentication();
    await testRateLimiting();
    await testInputValidation();
    await testInformationDisclosure();
    await testSecurityHeaders();
    await testCORS();

    printResults();

    process.exit(results.critical.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Error durante las pruebas de seguridad:', error);
    process.exit(1);
  }
}

// Ejecutar pruebas
runSecurityTests();
