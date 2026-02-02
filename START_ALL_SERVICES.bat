@echo off
REM Script para encender todos los servicios de BEDIC en Windows
REM Uso: START_ALL_SERVICES.bat

setlocal enabledelayedexpansion

REM Colores (usando color de Windows)
cls

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     INICIANDO TODOS LOS SERVICIOS DE BEDIC                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar que estamos en el directorio correcto
if not exist "backend\server.js" (
    echo ❌ Error: Ejecutar desde el directorio raíz del proyecto
    pause
    exit /b 1
)

REM ============================================
REM PASO 1: VERIFICAR DEPENDENCIAS
REM ============================================
echo 📦 Paso 1: Verificando dependencias...
echo.

if not exist "backend\node_modules" (
    echo Instalando dependencias del backend...
    cd backend
    call npm install
    cd ..
    echo ✅ Dependencias del backend instaladas
) else (
    echo ✅ Backend dependencies OK
)

if not exist "bedic-admin-panel\node_modules" (
    echo Instalando dependencias de Angular...
    cd bedic-admin-panel
    call npm install
    cd ..
    echo ✅ Dependencias de Angular instaladas
) else (
    echo ✅ Angular dependencies OK
)

echo.

REM ============================================
REM PASO 2: VERIFICAR VARIABLES DE ENTORNO
REM ============================================
echo 🔐 Paso 2: Verificando variables de entorno...
echo.

if not exist "backend\.env" (
    echo ⚠️  Archivo .env no encontrado en backend
    echo    Por favor, crear backend\.env con tus credenciales
    echo.
    echo    Ejemplo:
    echo    MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/bedic
    echo    NODE_ENV=development
    echo    PORT=5000
    echo.
) else (
    echo ✅ Variables de entorno configuradas
)

echo.

REM ============================================
REM PASO 3: CREAR CARPETAS NECESARIAS
REM ============================================
echo 📁 Paso 3: Creando carpetas necesarias...
echo.

if not exist "backend\uploads" mkdir backend\uploads
if not exist "backend\logs" mkdir backend\logs
if not exist "backend\temp" mkdir backend\temp

echo ✅ Carpetas creadas
echo.

REM ============================================
REM PASO 4: MOSTRAR INSTRUCCIONES
REM ============================================
echo ╔════════════════════════════════════════════════════════════╗
echo ║           INSTRUCCIONES PARA ENCENDER SERVICIOS            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo ✅ BACKEND (Express - Puerto 5000)
echo    En una terminal nueva (CMD), ejecuta:
echo    cd backend ^&^& npm start
echo.

echo ✅ ANGULAR ADMIN PANEL (Puerto 4200)
echo    En otra terminal nueva (CMD), ejecuta:
echo    cd bedic-admin-panel ^&^& npm start
echo.

echo ✅ APLICACIÓN MÓVIL (Flutter)
echo    En otra terminal nueva (CMD), ejecuta:
echo    cd flutter_app ^&^& flutter pub get ^&^& flutter run
echo.

echo ╔════════════════════════════════════════════════════════════╗
echo ║                    URLS DE ACCESO                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo Backend API:
echo    http://localhost:5000
echo    http://localhost:5000/api/admin/moderation/dashboard
echo.

echo Admin Panel:
echo    http://localhost:4200
echo    http://localhost:4200/admin/moderation-dashboard
echo.

echo ╔════════════════════════════════════════════════════════════╗
echo ║                    PRUEBAS DISPONIBLES                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo Validar sistema de moderación:
echo    node backend\scripts\validate-moderation.js
echo.

echo Setup del sistema:
echo    node backend\scripts\setup-moderation.js
echo.

echo Pruebas automatizadas:
echo    npm test -- backend\tests\moderation.test.js
echo.

echo ╔════════════════════════════════════════════════════════════╗
echo ║                    PRÓXIMOS PASOS                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 1. Abre 3 terminales (CMD) nuevas
echo 2. En terminal 1: cd backend ^&^& npm start
echo 3. En terminal 2: cd bedic-admin-panel ^&^& npm start
echo 4. En terminal 3: cd flutter_app ^&^& flutter run
echo.

echo 5. Accede a:
echo    Backend: http://localhost:5000
echo    Admin: http://localhost:4200
echo    Dashboard: http://localhost:4200/admin/moderation-dashboard
echo.

echo ✅ ✅ ✅ PREPARACIÓN COMPLETADA ✅ ✅ ✅
echo.

pause
