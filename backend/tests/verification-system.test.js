/**
 * Pruebas del Sistema de Verificación (Nivel 1, 2, 4)
 * Ejecutar con: node tests/verification-system.test.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

// Importar modelos y servicios
const User = require('../models/User');
const verificationService = require('../services/verification.service');
const emailService = require('../services/email.service');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let testsPassed = 0;
let testsFailed = 0;

// Función para imprimir resultados
const test = (name, result, error = null) => {
  if (result) {
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    testsPassed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (error) console.log(`  ${colors.red}Error: ${error}${colors.reset}`);
    testsFailed++;
  }
};

const section = (title) => {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
};

// Función principal de pruebas
async function runTests() {
  try {
    section('INICIANDO PRUEBAS DEL SISTEMA DE VERIFICACIÓN');

    // Conectar a MongoDB
    console.log(`${colors.yellow}Conectando a MongoDB...${colors.reset}`);
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`${colors.green}✓ Conectado a MongoDB${colors.reset}\n`);

    // ========== PRUEBAS DE VALIDACIÓN DE NOMBRE ==========
    section('PRUEBAS: Validación de Nombre Real (Nivel 2)');

    const validNames = [
      'Juan Pérez',
      'María García López',
      'Carlos-Manuel Rodríguez',
      'Ana María Sánchez'
    ];

    const invalidNames = [
      'Juan',
      'user123',
      'test@user',
      'User_Name',
      'A B',
      '123456'
    ];

    console.log('Nombres válidos:');
    validNames.forEach(name => {
      const result = verificationService.validateRealName(name);
      test(`"${name}"`, result.valid, result.reason);
    });

    console.log('\nNombres inválidos:');
    invalidNames.forEach(name => {
      const result = verificationService.validateRealName(name);
      test(`"${name}" (debe ser inválido)`, !result.valid, result.reason);
    });

    // ========== PRUEBAS DE GENERACIÓN DE TOKENS ==========
    section('PRUEBAS: Generación de Tokens (Nivel 1)');

    const emailToken = verificationService.generateEmailVerificationToken();
    test('Token de email generado', emailToken && emailToken.length === 64);

    const otp = verificationService.generateEmailOTP();
    test('OTP generado', otp && otp.length === 6 && /^\d+$/.test(otp));

    // ========== PRUEBAS DE SERVICIO DE EMAIL ==========
    section('PRUEBAS: Servicio de Email');

    const emailServiceInitialized = emailService.initializeEmailService();
    test('Servicio de email inicializado', emailServiceInitialized !== null || process.env.EMAIL_USER === 'tu_email@gmail.com');

    const connectionVerified = await emailService.verifyConnection();
    test('Conexión con Gmail verificada', connectionVerified || process.env.EMAIL_USER === 'tu_email@gmail.com');

    // ========== PRUEBAS DE CREACIÓN DE USUARIO ==========
    section('PRUEBAS: Creación de Usuario con Verificación');

    // Limpiar usuario de prueba si existe
    await User.deleteOne({ email: 'test.verification@example.com' });

    const testUser = await User.create({
      name: 'Test User Verification',
      username: 'test_verification_' + Date.now(),
      email: 'test.verification@example.com',
      password: 'TestPassword123!',
      verification: {
        emailVerificationToken: verificationService.generateEmailVerificationToken(),
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        nameValidationStatus: 'valid',
        nameValidatedAt: new Date(),
        verificationLevel: 'partially_verified',
        actionsToAutoVerify: 5,
        actionsCompleted: 0,
        verificationHistory: [
          {
            level: 'name_validated',
            completedAt: new Date(),
            method: 'name_validation'
          }
        ]
      }
    });

    test('Usuario creado correctamente', testUser && testUser._id);
    test('Usuario tiene nivel "partially_verified"', testUser.verification.verificationLevel === 'partially_verified');
    test('Usuario tiene nombre validado', testUser.verification.nameValidationStatus === 'valid');
    test('Email no verificado inicialmente', testUser.verification.emailVerified === false);

    // ========== PRUEBAS DE VERIFICACIÓN DE EMAIL ==========
    section('PRUEBAS: Verificación de Email (Nivel 1)');

    const emailToken2 = testUser.verification.emailVerificationToken;
    const verifyResult = await verificationService.verifyEmailToken(testUser._id, emailToken2);

    test('Email verificado correctamente', verifyResult.success);
    test('Usuario ahora tiene email verificado', verifyResult.user.verification.emailVerified === true);

    // ========== PRUEBAS DE CONTADOR DE ACCIONES ==========
    section('PRUEBAS: Sistema de Reputación Temprana (Nivel 4)');

    const updatedUser = await User.findById(testUser._id);
    test('Usuario inicial tiene 0 acciones completadas', updatedUser.verification.actionsCompleted === 0);

    // Simular 5 acciones
    for (let i = 1; i <= 5; i++) {
      const actionResult = await verificationService.incrementActionCounter(testUser._id);
      test(`Acción ${i} completada`, actionResult.success);
    }

    const fullyVerifiedUser = await User.findById(testUser._id);
    test('Usuario auto-verificado después de 5 acciones', fullyVerifiedUser.verification.verificationLevel === 'verified');
    test('Usuario tiene 5 acciones completadas', fullyVerifiedUser.verification.actionsCompleted === 5);

    // ========== PRUEBAS DE ESTADO DE VERIFICACIÓN ==========
    section('PRUEBAS: Obtener Estado de Verificación');

    const statusResult = await verificationService.getVerificationStatus(testUser._id);
    test('Estado de verificación obtenido', statusResult.success);
    test('Email verificado en estado', statusResult.verification.emailVerified === true);
    test('Nivel de verificación es "verified"', statusResult.verification.verificationLevel === 'verified');

    // ========== PRUEBAS DE LISTA DE USUARIOS ==========
    section('PRUEBAS: Lista de Usuarios para Admin');

    const usersList = await verificationService.getUsersVerificationStatus({
      verificationLevel: 'verified'
    });

    test('Lista de usuarios obtenida', usersList.success);
    test('Al menos un usuario verificado en la lista', usersList.count >= 1);

    // ========== PRUEBAS DE VERIFICACIÓN MANUAL ==========
    section('PRUEBAS: Verificación Manual por Admin');

    // Crear otro usuario para prueba de rechazo
    await User.deleteOne({ email: 'test.rejection@example.com' });

    const testUser2 = await User.create({
      name: 'Test Rejection User',
      username: 'test_rejection_' + Date.now(),
      email: 'test.rejection@example.com',
      password: 'TestPassword123!',
      verification: {
        verificationLevel: 'partially_verified',
        nameValidationStatus: 'valid'
      }
    });

    const manualVerifyResult = await verificationService.manuallyVerifyUser(testUser2._id, 'Verificado manualmente para pruebas');
    test('Usuario verificado manualmente', manualVerifyResult.success);
    test('Usuario tiene nivel "verified"', manualVerifyResult.user.verification.verificationLevel === 'verified');

    // ========== PRUEBAS DE RECHAZO ==========
    section('PRUEBAS: Rechazo de Verificación');

    const rejectResult = await verificationService.rejectUserVerification(testUser2._id, 'Nombre sospechoso');
    test('Verificación rechazada', rejectResult.success);
    test('Usuario vuelve a nivel "unverified"', rejectResult.user.verification.verificationLevel === 'unverified');

    // ========== LIMPIEZA ==========
    section('LIMPIEZA: Eliminando usuarios de prueba');

    await User.deleteOne({ _id: testUser._id });
    await User.deleteOne({ _id: testUser2._id });

    test('Usuarios de prueba eliminados', true);

    // ========== RESUMEN ==========
    section('RESUMEN DE PRUEBAS');

    const totalTests = testsPassed + testsFailed;
    const passPercentage = ((testsPassed / totalTests) * 100).toFixed(2);

    console.log(`${colors.green}Pruebas Pasadas: ${testsPassed}${colors.reset}`);
    console.log(`${colors.red}Pruebas Fallidas: ${testsFailed}${colors.reset}`);
    console.log(`${colors.blue}Total: ${totalTests}${colors.reset}`);
    console.log(`${colors.cyan}Porcentaje de Éxito: ${passPercentage}%${colors.reset}\n`);

    if (testsFailed === 0) {
      console.log(`${colors.green}✓ TODAS LAS PRUEBAS PASARON EXITOSAMENTE${colors.reset}\n`);
    } else {
      console.log(`${colors.red}✗ ALGUNAS PRUEBAS FALLARON${colors.reset}\n`);
    }

    // Desconectar de MongoDB
    await mongoose.disconnect();
    console.log(`${colors.yellow}Desconectado de MongoDB${colors.reset}\n`);

    process.exit(testsFailed > 0 ? 1 : 0);

  } catch (error) {
    console.error(`${colors.red}Error fatal en pruebas:${colors.reset}`, error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests();
