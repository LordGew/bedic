# 🏗️ ARQUITECTURA BEDIC - 100% AUTÓNOMA

## 🎯 Filosofía del Sistema

**BEDIC es completamente autónomo y no depende de servicios externos de terceros.**

- ✅ **Datos propios** - Todos los lugares son creados manualmente
- ✅ **API propia** - Backend Node.js/Express/MongoDB
- ✅ **Imágenes propias** - Almacenadas en nuestro servidor
- ✅ **Sin dependencias externas** - Solo usamos Flutter Map para visualización

---

## 📊 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    BEDIC ECOSYSTEM                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  1. ANGULAR ADMIN PANEL (Puerto 4200)                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Propósito: Gestión manual de contenido                         │
│                                                                  │
│  Funcionalidades:                                                │
│  • Crear/editar/eliminar lugares manualmente                    │
│  • Subir imágenes propias (convertidas a WebP)                  │
│  • Gestionar categorías                                         │
│  • Moderar reportes y comentarios                               │
│  • Crear anuncios                                               │
│  • Ver estadísticas                                             │
│                                                                  │
│  Tecnologías:                                                    │
│  • Angular 18 (Standalone Components)                           │
│  • Angular Material                                             │
│  • Reactive Forms                                               │
│  • HttpClient para consumir API                                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    Envía datos via HTTP
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  2. BACKEND API (Puerto 5000)                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Propósito: API REST completamente autónoma                     │
│                                                                  │
│  Endpoints Principales:                                          │
│  • GET    /api/places              - Listar lugares             │
│  • GET    /api/places/:id          - Detalle de lugar           │
│  • POST   /api/places              - Crear lugar (Admin)        │
│  • PUT    /api/places/:id          - Actualizar lugar (Admin)   │
│  • DELETE /api/places/:id          - Eliminar lugar (Admin)     │
│  • POST   /api/places/:id/images   - Subir imagen (Admin)       │
│  • DELETE /api/places/:id/images   - Eliminar imagen (Admin)    │
│  • GET    /api/recommendations     - Recomendaciones            │
│  • POST   /api/reports             - Crear reporte              │
│  • GET    /api/announcements       - Listar anuncios            │
│                                                                  │
│  Tecnologías:                                                    │
│  • Node.js + Express                                            │
│  • MongoDB + Mongoose                                           │
│  • JWT para autenticación                                       │
│  • Multer para subida de archivos                               │
│  • Sharp para procesamiento de imágenes                         │
│  • Helmet + CORS para seguridad                                 │
│                                                                  │
│  SIN dependencias externas:                                      │
│  ❌ Google Places API                                            │
│  ❌ OpenStreetMap Overpass API                                   │
│  ❌ Servicios de geocodificación externos                        │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    Almacena en
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  3. MONGODB (Atlas Cloud)                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Propósito: Base de datos propia                                │
│                                                                  │
│  Colecciones:                                                    │
│  • places          - Lugares creados manualmente                │
│  • users           - Usuarios de la app                         │
│  • reports         - Reportes de usuarios                       │
│  • comments        - Comentarios en lugares                     │
│  • announcements   - Anuncios del sistema                       │
│  • badges          - Insignias y logros                         │
│  • titles          - Títulos de usuarios                        │
│                                                                  │
│  Índices Geoespaciales:                                          │
│  • places.coordinates (2dsphere) - Búsquedas por proximidad     │
└──────────────────────────────────────────────────────────────────┘
                              ↑
                    Consulta desde
                              ↑
┌──────────────────────────────────────────────────────────────────┐
│  4. FLUTTER APP (Web/Mobile)                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Propósito: Aplicación de usuario final                         │
│                                                                  │
│  Funcionalidades:                                                │
│  • Ver mapa interactivo (Flutter Map + OSM tiles)               │
│  • Buscar lugares por nombre/categoría                          │
│  • Ver detalles de lugares                                      │
│  • Crear reportes                                               │
│  • Comentar y valorar                                           │
│  • Ver recomendaciones personalizadas                           │
│  • Sistema de gamificación (XP, badges, títulos)                │
│                                                                  │
│  Tecnologías:                                                    │
│  • Flutter 3.x                                                  │
│  • flutter_map (para mapa)                                      │
│  • http package (para consumir API)                             │
│  • Tiles de OpenStreetMap (solo visualización)                  │
│                                                                  │
│  SIN dependencias externas de datos:                             │
│  ❌ Google Maps API                                              │
│  ❌ Google Places API                                            │
│  ✅ Solo consume NUESTRA API                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos

### **Creación de un Lugar:**

```
1. Admin abre Angular Panel
   ↓
2. Completa formulario:
   - Nombre
   - Categoría
   - Descripción
   - Coordenadas (lat/lng)
   - Dirección
   - Sube imágenes
   ↓
3. Angular envía POST a /api/places
   ↓
4. Backend:
   - Valida datos
   - Procesa imágenes (resize, WebP)
   - Guarda en MongoDB
   ↓
5. MongoDB almacena el lugar
   ↓
6. Flutter App consulta GET /api/places
   ↓
7. Usuario ve el lugar en el mapa
```

### **Visualización en el Mapa:**

```
1. Usuario abre Flutter App
   ↓
2. App obtiene ubicación del usuario
   ↓
3. App consulta GET /api/places?lat=X&lng=Y&radius=5000
   ↓
4. Backend busca lugares cercanos en MongoDB
   ↓
5. Backend retorna JSON con lugares
   ↓
6. Flutter muestra marcadores en Flutter Map
   ↓
7. Tiles del mapa se cargan desde OSM (solo visualización)
```

---

## 📦 Dependencias del Sistema

### **Backend (Node.js):**

#### ✅ **Dependencias Necesarias:**
```json
{
  "bcryptjs": "Encriptación de contraseñas",
  "cors": "Permitir peticiones desde Angular/Flutter",
  "dotenv": "Variables de entorno",
  "express": "Framework web",
  "express-rate-limit": "Protección contra spam",
  "helmet": "Seguridad HTTP",
  "joi": "Validación de datos",
  "jsonwebtoken": "Autenticación JWT",
  "mongoose": "ODM para MongoDB",
  "multer": "Subida de archivos",
  "sharp": "Procesamiento de imágenes",
  "winston": "Logging"
}
```

#### ❌ **Dependencias a ELIMINAR:**
```json
{
  "axios": "No necesitamos hacer peticiones HTTP externas",
  "google-auth-library": "No usamos Google Sign-In",
  "node-cron": "No necesitamos tareas programadas",
  "nodemailer": "No enviamos emails (opcional)",
  "socket.io": "No usamos WebSockets (opcional)"
}
```

### **Angular Admin:**

#### ✅ **Dependencias Necesarias:**
```json
{
  "@angular/core": "Framework",
  "@angular/material": "UI Components",
  "@angular/forms": "Formularios reactivos",
  "@angular/common/http": "Consumir API"
}
```

### **Flutter App:**

#### ✅ **Dependencias Necesarias:**
```yaml
dependencies:
  flutter_map: "Mapa interactivo"
  latlong2: "Coordenadas"
  http: "Consumir API"
  geolocator: "Ubicación del usuario"
```

#### ❌ **NO necesitamos:**
```yaml
# NO usar:
google_maps_flutter  # Usamos flutter_map
google_places_api    # Usamos nuestra API
```

---

## 🗺️ Sobre el Mapa

### **¿Por qué Flutter Map y no Google Maps?**

1. ✅ **Gratis** - Sin límites de uso
2. ✅ **Open Source** - Totalmente personalizable
3. ✅ **Sin API Key** - No requiere configuración externa
4. ✅ **Tiles de OSM** - Solo para visualización del mapa base
5. ✅ **Datos propios** - Los marcadores son de nuestra API

### **¿Qué es OSM Tiles?**

- **OSM (OpenStreetMap)** proporciona los "tiles" (imágenes del mapa base)
- Es como usar Google Maps solo para ver calles y edificios
- **NO usamos datos de lugares de OSM**
- Solo usamos las imágenes del mapa de fondo
- Es completamente gratuito y sin límites

---

## 🎨 Modelo de Datos

### **Lugar (Place):**

```javascript
{
  _id: ObjectId,
  name: String,              // Nombre del lugar
  category: String,          // Categoría (restaurant, cafe, etc.)
  description: String,       // Descripción manual
  coordinates: {             // Coordenadas ingresadas manualmente
    type: "Point",
    coordinates: [lng, lat]
  },
  address: String,           // Dirección manual
  city: String,              // Ciudad
  department: String,        // Departamento
  officialImages: [String],  // URLs de imágenes subidas
  rating: Number,            // Calculado de valoraciones
  verified: Boolean,         // Verificado por admin
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Seguridad

1. **Autenticación JWT** - Tokens para usuarios
2. **Roles** - Admin vs Usuario normal
3. **Rate Limiting** - Protección contra spam
4. **Helmet** - Headers de seguridad
5. **CORS** - Solo dominios permitidos
6. **Validación** - Joi para validar inputs
7. **Sanitización** - Prevenir XSS/SQL injection

---

## 🚀 Escalabilidad

### **Crecimiento del Sistema:**

1. **Fase 1 (Actual):**
   - 100-500 lugares creados manualmente
   - 1 admin creando contenido
   - Usuarios consultando

2. **Fase 2 (Futuro):**
   - 1,000-5,000 lugares
   - Múltiples admins
   - Sistema de contribución de usuarios (reportes)

3. **Fase 3 (Largo plazo):**
   - 10,000+ lugares
   - API pública para terceros
   - Caché con Redis
   - CDN para imágenes

---

## 💡 Ventajas de esta Arquitectura

1. ✅ **Control total** - Todos los datos son nuestros
2. ✅ **Sin costos de APIs** - No pagamos a Google/otros
3. ✅ **Sin límites** - No hay quotas ni restricciones
4. ✅ **Privacidad** - No compartimos datos con terceros
5. ✅ **Personalización** - Podemos agregar campos propios
6. ✅ **Calidad** - Control manual de la información
7. ✅ **Independencia** - No dependemos de servicios externos

---

## 📝 Conclusión

**BEDIC es un sistema completamente autónomo donde:**

- Los **lugares** se crean manualmente en Angular
- Los **datos** se almacenan en nuestra MongoDB
- La **API** es nuestra (Node.js/Express)
- Las **imágenes** son nuestras (almacenadas en servidor)
- El **mapa** usa Flutter Map (gratis, sin API key)
- Los **tiles** vienen de OSM (solo visualización, gratis)

**NO dependemos de:**
- ❌ Google Places API
- ❌ Google Maps API (para datos)
- ❌ APIs de geocodificación
- ❌ Servicios de terceros

**Solo usamos:**
- ✅ Nuestra propia API REST
- ✅ Nuestra propia base de datos
- ✅ Flutter Map para visualización
- ✅ OSM tiles para el mapa base (gratis)
