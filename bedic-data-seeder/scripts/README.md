# 🗺️ Scripts de Gestión de Lugares - BEDIC

Sistema completo de población automática de lugares para Colombia con **cobertura total** de ciudades principales.

## 🎯 Resumen del Sistema

- 📍 **30,000-50,000 lugares** reales de Colombia
- 🏙️ **59 zonas** en 20+ ciudades (cobertura completa)
- 📋 **15 categorías** de lugares
- ⭐ **Enriquecimiento automático** con Google Places
- 💰 **100% GRATIS** usando tiers gratuitos

## 📋 Scripts Disponibles

### 1. `seedPlaces.js` - Población Inicial
Pobla la base de datos con 116 lugares reales de las principales ciudades de Colombia.

**Uso:**
```bash
npm run seed
```

**Características:**
- Limpia lugares existentes creados por admin
- Inserta lugares en 6 ciudades principales
- 10 categorías diferentes
- Todos los lugares tienen coordenadas reales

### 2. `autoDiscoverPlaces.js` - Auto-Descubrimiento (OSM)
Busca automáticamente nuevos lugares usando OpenStreetMap Overpass API.

**Uso:**
```bash
npm run discover
```

**Características:**
- 🌍 **59 zonas** en 20+ ciudades de Colombia
- 📏 **Radio de 15-20 km** por zona (cobertura completa de cada ciudad)
- 📋 **15 categorías** diferentes
- 🔍 Evita duplicados (verifica por nombre y proximidad <100m)
- 📊 Registra actividad en la base de datos
- 💰 **GRATIS** (OpenStreetMap)
- ⏱️ **Delay de 2 segundos** entre peticiones (evita límites de velocidad)
- 🎯 **Estimado**: 30,000-50,000 lugares

### 3. `enrichWithGooglePlaces.js` - Enriquecimiento con Google
Enriquece lugares existentes con datos completos de Google Places API.

**Uso:**
```bash
npm run enrich
```

**Características:**
- ⭐ Agrega: ratings, teléfonos, horarios, fotos, sitio web
- 🎯 Prioriza lugares verificados y con más concurrencia
- 📊 **900 lugares/día** (límite gratuito)
- 💰 **GRATIS** (28,000 peticiones/mes)
- 🔄 Se puede ejecutar diariamente sin costo

**Requisito:**
```bash
# Agregar al archivo .env
GOOGLE_PLACES_API_KEY=tu_api_key_aqui
```

### 4. `monitorProgress.js` - Monitoreo en Tiempo Real
Muestra estadísticas actualizadas de la base de datos.

**Uso:**
```bash
npm run monitor
```

**Muestra:**
- Total de lugares por fuente (admin, OSM, Google)
- Distribución por categoría
- Distribución por ciudad
- Calidad de datos (% con ratings, teléfonos, fotos)
- Última actividad del script

### 5. `createGeoIndex.js` - Crear Índice Geoespacial
Crea el índice geoespacial necesario para búsquedas por proximidad.

**Uso:**
```bash
npm run create-geo-index
```

**Nota:** Ejecutar una vez antes de usar el auto-descubrimiento.

### 6. `scheduler.js` - Programador Automático
Ejecuta el script de auto-descubrimiento cada 24 horas a las 3:00 AM.

**Uso:**
```bash
npm run scheduler
```

**Características:**
- Ejecución automática diaria
- Zona horaria: America/Bogota
- Mantiene el proceso activo
- Logs detallados de cada ejecución

## 🗄️ Modelo de Actividad

Cada ejecución del script se registra en la colección `ScriptActivity` con:

```javascript
{
  scriptName: 'autoDiscoverPlaces',
  status: 'success' | 'error' | 'running' | 'warning',
  message: 'Descripción del resultado',
  stats: {
    totalFound: 150,
    totalAdded: 45,
    totalSkipped: 105,
    citiesProcessed: [...],
    duration: '120.5s'
  },
  timestamp: Date
}
```

## 🌐 API Endpoints

### GET `/api/script-activity/activities`
Obtiene el historial de ejecuciones del script.

**Query params:**
- `page`: Número de página (default: 1)
- `limit`: Resultados por página (default: 50)
- `scriptName`: Filtrar por nombre de script

**Respuesta:**
```json
{
  "activities": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

### GET `/api/script-activity/stats`
Obtiene estadísticas generales del script.

**Respuesta:**
```json
{
  "totalRuns": 30,
  "successRuns": 28,
  "errorRuns": 2,
  "successRate": "93.33",
  "lastRun": {
    "timestamp": "2024-12-02T08:00:00.000Z",
    "status": "success",
    "message": "Descubrimiento completado: 45 lugares nuevos agregados",
    "stats": {...}
  },
  "nextRun": "2024-12-03T08:00:00.000Z",
  "last30Days": {
    "totalPlacesAdded": 1250,
    "totalPlacesFound": 3500,
    "runs": 30
  }
}
```

### POST `/api/script-activity/run`
Ejecuta manualmente el script de auto-descubrimiento.

**Respuesta:**
```json
{
  "message": "Script de auto-descubrimiento iniciado en segundo plano",
  "timestamp": "2024-12-02T10:00:00.000Z"
}
```

### DELETE `/api/script-activity/clean`
Elimina actividades antiguas (más de 90 días).

**Respuesta:**
```json
{
  "message": "Actividades antiguas eliminadas",
  "deletedCount": 45
}
```

## 🏙️ Ciudades Incluidas (59 zonas totales)

### Ciudades Principales con Cobertura Completa:

#### 🏙️ **Bogotá** (16 zonas - ~1,775 km²)
Usaquén, Chapinero, Santa Fe, San Cristóbal, Usme, Tunjuelito, Bosa, Kennedy, Fontibón, Engativá, Suba, Barrios Unidos, Teusaquillo, Los Mártires, Antonio Nariño, Puente Aranda

#### 🏙️ **Medellín** (10 zonas - ~380 km²)
El Poblado, Laureles, La Candelaria, Buenos Aires, Castilla, Aranjuez, Manrique, Belén, Robledo, Bello

#### 🏙️ **Cali** (8 zonas - ~560 km²)
Norte, Centro, Sur, Oeste, Este, Aguablanca, Jamundí, Yumbo

#### 🏙️ **Barranquilla** (4 zonas - ~154 km²)
Norte, Centro, Sur, Soledad

#### 🏙️ **Cartagena** (4 zonas - ~572 km²)
Centro Histórico, Bocagrande, Norte, Sureste

#### 🏙️ **Bucaramanga** (4 zonas - ~165 km²)
Centro, Norte, Floridablanca, Girón

#### 🏙️ **Pereira** (3 zonas - ~702 km²)
Centro, Norte, Dosquebradas

### Otras Ciudades (10 ciudades adicionales):
Santa Marta, Cúcuta, Manizales, Ibagué, Pasto, Villavicencio, Armenia, Neiva, Popayán, Valledupar, Montería, Sincelejo, Tunja, Palmira, Riohacha

## 📊 Categorías

- Restaurante
- Bar
- Cafetería
- Parque
- Hotel
- Museo
- Cine
- Hospital
- Farmacia
- Banco
- Supermercado
- Centro Comercial
- Gimnasio
- Biblioteca
- Tienda

## 🔧 Configuración

### Variables de Entorno
```env
MONGO_URI=mongodb://...
```

### Producción
Para ejecutar el scheduler en producción, usa un gestor de procesos como PM2:

```bash
pm2 start scripts/scheduler.js --name "bedic-scheduler"
pm2 save
pm2 startup
```

## 📝 Notas Importantes

- El script de auto-descubrimiento usa OpenStreetMap Overpass API (gratuita)
- Hay un delay de **2 segundos** entre cada búsqueda para no saturar la API
- Los lugares duplicados se detectan por nombre y proximidad (<100m)
- Todos los endpoints requieren autenticación de administrador
- Las actividades se mantienen por 90 días
- **Radio de búsqueda**: 15-20 km por zona (cubre toda el área urbana)
- **Cobertura total**: Los usuarios pueden buscar en cualquier parte de la ciudad

## 🚀 Inicio Rápido

### 1️⃣ Crear índice geoespacial (una sola vez):
```bash
npm run create-geo-index
```

### 2️⃣ Poblar base de datos inicial:
```bash
npm run seed
```

### 3️⃣ Auto-descubrimiento masivo (30,000-50,000 lugares):
```bash
npm run discover
```
⏱️ **Tiempo estimado**: 3-4 horas
💰 **Costo**: $0

### 4️⃣ Monitorear progreso:
```bash
npm run monitor
```

### 5️⃣ Configurar Google Places API (opcional pero recomendado):
```bash
# 1. Obtener API Key en: https://console.cloud.google.com/
# 2. Agregar al archivo .env:
echo "GOOGLE_PLACES_API_KEY=tu_api_key_aqui" >> .env
```

### 6️⃣ Enriquecer lugares con Google (900/día gratis):
```bash
npm run enrich
```
⏱️ **Tiempo**: ~2 horas/día
💰 **Costo**: $0 (dentro del tier gratuito)

### 7️⃣ Automatizar con scheduler:
```bash
npm run scheduler
```

O en producción con PM2:
```bash
pm2 start scripts/scheduler.js --name "bedic-scheduler"
pm2 save
pm2 startup
```

## 📊 Resultados Esperados

### Después de Fase 1 (OSM):
- 📍 30,000-50,000 lugares reales
- 🏙️ 20+ ciudades cubiertas completamente
- 📋 15 categorías
- 💰 Costo: $0

### Después de Fase 2 (Google - 1 mes):
- ⭐ ~25,000 lugares enriquecidos
- 📞 Teléfonos, horarios, sitios web
- 📸 Fotos oficiales
- ⭐ Ratings reales
- 💰 Costo: $0

## 📖 Documentación Completa

Para más detalles, consulta: `POPULATION_GUIDE.md`

---

## 📸 GESTIÓN DE IMÁGENES

### Scripts de Validación y Conversión

#### 1. `validateImages.js` - Validar Imágenes
**Propósito**: Detecta problemas con las imágenes de lugares.

**Detecta**:
- ❌ Archivos faltantes
- ⚠️ Formatos incompatibles (AVIF, HEIC, TIFF, etc.)
- 💥 Imágenes corruptas
- 🌐 URLs externas

**Uso**:
```bash
node scripts/validateImages.js
```

**Salida**:
- Reporte en consola
- Archivo `image-validation-report.json` con detalles

---

#### 2. `convertImagesToWebP.js` - Convertir a WebP
**Propósito**: Convierte todas las imágenes a formato WebP (compatible con Flutter).

**Características**:
- ✅ Convierte AVIF, PNG, JPG, etc. → WebP
- 🗜️ Comprime automáticamente (85% calidad)
- 📏 Redimensiona a máximo 1200x1200px
- 🗑️ Elimina archivos originales
- 💾 Actualiza base de datos
- ⏭️ Salta URLs externas

**Uso**:
```bash
node scripts/convertImagesToWebP.js
```

**Ejemplo de salida**:
```
📍 Procesando: "Danny Fast Food"
   🔄 Convirtiendo: image_123.avif → image_123.webp
   ✅ Convertido: 850 KB → 180 KB (78.8% reducción)
   🗑️ Eliminado original
   💾 Base de datos actualizada

📊 RESUMEN:
✅ Lugares procesados: 5
📸 Imágenes procesadas: 15
🔄 Imágenes convertidas: 12
```

---

### 🔧 Flujo de Trabajo para Problemas de Imágenes

**Problema: "Flutter no muestra imágenes"**

**Paso 1**: Validar
```bash
node scripts/validateImages.js
```

**Paso 2**: Revisar reporte
```bash
cat image-validation-report.json
```

**Paso 3**: Convertir si hay formatos incompatibles
```bash
node scripts/convertImagesToWebP.js
```

**Paso 4**: Reiniciar backend
```bash
# Windows
taskkill /F /IM node.exe
node server.js
```

---

### 📋 Formatos de Imagen Soportados

| Formato | Flutter Web | Flutter Mobile | Recomendado |
|---------|-------------|----------------|-------------|
| **WebP** | ✅ | ✅ | ✅ **SÍ** |
| **PNG** | ✅ | ✅ | ⚠️ Pesado |
| **JPG** | ✅ | ✅ | ⚠️ Sin transparencia |
| **AVIF** | ❌ | ❌ | ❌ **NO** |
| **HEIC** | ❌ | ❌ | ❌ **NO** |

---

### 💡 Tips de Mantenimiento

1. **Siempre usa WebP** para nuevas imágenes
2. **Valida mensualmente** con `validateImages.js`
3. **Mantén backups** antes de ejecutar scripts de conversión
4. **Revisa los logs** para detectar problemas temprano
