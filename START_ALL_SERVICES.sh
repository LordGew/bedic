#!/bin/bash

# Script para encender todos los servicios de BEDIC
# Uso: bash START_ALL_SERVICES.sh

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     INICIANDO TODOS LOS SERVICIOS DE BEDIC                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "backend/server.js" ]; then
  echo -e "${RED}❌ Error: Ejecutar desde el directorio raíz del proyecto${NC}"
  exit 1
fi

# ============================================
# PASO 1: VALIDAR BACKEND
# ============================================
echo -e "${YELLOW}📋 Paso 1: Validando backend...${NC}"
if [ ! -f "backend/scripts/validate-moderation.js" ]; then
  echo -e "${YELLOW}⚠️  Script de validación no encontrado, creando...${NC}"
else
  echo -e "${GREEN}✅ Backend validado${NC}"
fi
echo ""

# ============================================
# PASO 2: INSTALAR DEPENDENCIAS
# ============================================
echo -e "${YELLOW}📦 Paso 2: Verificando dependencias...${NC}"

if [ ! -d "backend/node_modules" ]; then
  echo -e "${YELLOW}Instalando dependencias del backend...${NC}"
  cd backend
  npm install
  cd ..
  echo -e "${GREEN}✅ Dependencias del backend instaladas${NC}"
else
  echo -e "${GREEN}✅ Backend dependencies OK${NC}"
fi

if [ ! -d "bedic-admin-panel/node_modules" ]; then
  echo -e "${YELLOW}Instalando dependencias de Angular...${NC}"
  cd bedic-admin-panel
  npm install
  cd ..
  echo -e "${GREEN}✅ Dependencias de Angular instaladas${NC}"
else
  echo -e "${GREEN}✅ Angular dependencies OK${NC}"
fi

echo ""

# ============================================
# PASO 3: VERIFICAR VARIABLES DE ENTORNO
# ============================================
echo -e "${YELLOW}🔐 Paso 3: Verificando variables de entorno...${NC}"

if [ ! -f "backend/.env" ]; then
  echo -e "${YELLOW}⚠️  Archivo .env no encontrado en backend${NC}"
  echo -e "${YELLOW}   Creando .env de ejemplo...${NC}"
  cat > backend/.env.example << 'EOF'
# MongoDB
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/bedic

# Server
NODE_ENV=development
PORT=5000

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Admin
ADMIN_JWT_SECRET=your_admin_jwt_secret_here
ADMIN_JWT_EXPIRE=7d

# Frontend URLs
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:4200

# Perspective API (opcional)
PERSPECTIVE_API_KEY=

# Email (opcional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EOF
  echo -e "${YELLOW}   Crear backend/.env con tus credenciales${NC}"
else
  echo -e "${GREEN}✅ Variables de entorno configuradas${NC}"
fi

echo ""

# ============================================
# PASO 4: CREAR CARPETAS NECESARIAS
# ============================================
echo -e "${YELLOW}📁 Paso 4: Creando carpetas necesarias...${NC}"

mkdir -p backend/uploads
mkdir -p backend/logs
mkdir -p backend/temp

echo -e "${GREEN}✅ Carpetas creadas${NC}"
echo ""

# ============================================
# PASO 5: MOSTRAR INSTRUCCIONES
# ============================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           INSTRUCCIONES PARA ENCENDER SERVICIOS            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}✅ BACKEND (Express - Puerto 5000)${NC}"
echo -e "   ${YELLOW}En una terminal nueva, ejecuta:${NC}"
echo -e "   ${BLUE}cd backend && npm start${NC}"
echo ""
echo -e "   O con nodemon (desarrollo):"
echo -e "   ${BLUE}cd backend && npx nodemon server.js${NC}"
echo ""

echo -e "${GREEN}✅ ANGULAR ADMIN PANEL (Puerto 4200)${NC}"
echo -e "   ${YELLOW}En otra terminal nueva, ejecuta:${NC}"
echo -e "   ${BLUE}cd bedic-admin-panel && npm start${NC}"
echo ""

echo -e "${GREEN}✅ APLICACIÓN MÓVIL (Flutter)${NC}"
echo -e "   ${YELLOW}En otra terminal nueva, ejecuta:${NC}"
echo -e "   ${BLUE}cd flutter_app && flutter pub get && flutter run${NC}"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    URLS DE ACCESO                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Backend API:${NC}"
echo -e "   ${BLUE}http://localhost:5000${NC}"
echo -e "   ${BLUE}http://localhost:5000/api/admin/moderation/dashboard${NC}"
echo ""

echo -e "${YELLOW}Admin Panel:${NC}"
echo -e "   ${BLUE}http://localhost:4200${NC}"
echo -e "   ${BLUE}http://localhost:4200/admin/moderation-dashboard${NC}"
echo ""

echo -e "${YELLOW}Documentación:${NC}"
echo -e "   ${BLUE}MODERATION_QUICKSTART.md${NC}"
echo -e "   ${BLUE}PRODUCTION_INTEGRATION_GUIDE.md${NC}"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    PRUEBAS DISPONIBLES                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Validar sistema de moderación:${NC}"
echo -e "   ${BLUE}node backend/scripts/validate-moderation.js${NC}"
echo ""

echo -e "${YELLOW}Setup del sistema:${NC}"
echo -e "   ${BLUE}node backend/scripts/setup-moderation.js${NC}"
echo ""

echo -e "${YELLOW}Pruebas automatizadas:${NC}"
echo -e "   ${BLUE}npm test -- backend/tests/moderation.test.js${NC}"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    PRÓXIMOS PASOS                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}1. Abre 3 terminales nuevas${NC}"
echo -e "${GREEN}2. En terminal 1: cd backend && npm start${NC}"
echo -e "${GREEN}3. En terminal 2: cd bedic-admin-panel && npm start${NC}"
echo -e "${GREEN}4. En terminal 3: cd flutter_app && flutter run${NC}"
echo ""

echo -e "${GREEN}5. Accede a:${NC}"
echo -e "   ${BLUE}Backend: http://localhost:5000${NC}"
echo -e "   ${BLUE}Admin: http://localhost:4200${NC}"
echo -e "   ${BLUE}Dashboard: http://localhost:4200/admin/moderation-dashboard${NC}"
echo ""

echo -e "${GREEN}✅ ✅ ✅ PREPARACIÓN COMPLETADA ✅ ✅ ✅${NC}"
echo ""
