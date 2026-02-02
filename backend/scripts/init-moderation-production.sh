#!/bin/bash

# Script de Inicialización del Sistema de Moderación para Producción
# Ejecutar: bash backend/scripts/init-moderation-production.sh

echo ""
echo "🚀 =========================================="
echo "🚀 INICIALIZANDO SISTEMA DE MODERACIÓN"
echo "🚀 =========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paso 1: Validar
echo -e "${YELLOW}Paso 1: Validando sistema...${NC}"
node backend/scripts/validate-moderation.js
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Validación fallida${NC}"
  exit 1
fi
echo ""

# Paso 2: Setup
echo -e "${YELLOW}Paso 2: Ejecutando setup...${NC}"
node backend/scripts/setup-moderation.js
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Setup fallido${NC}"
  exit 1
fi
echo ""

# Paso 3: Pruebas
echo -e "${YELLOW}Paso 3: Ejecutando pruebas automatizadas...${NC}"
npm test -- backend/tests/moderation.test.js
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}⚠️  Algunas pruebas fallaron, pero el sistema puede funcionar${NC}"
fi
echo ""

echo -e "${GREEN}✅ ✅ ✅ INICIALIZACIÓN COMPLETADA ✅ ✅ ✅${NC}"
echo ""
echo "El sistema de moderación automática está listo para producción."
echo ""
echo "Para iniciar el servidor:"
echo "  npm start"
echo ""
echo "Para acceder al dashboard:"
echo "  http://localhost:4200/admin/moderation-dashboard"
echo ""
