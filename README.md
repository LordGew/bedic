# 🗺️ BEDIC - Sistema de Geolocalización Colaborativo

**BEDIC** es una plataforma 100% autónoma para descubrir y compartir lugares en Colombia.

---

## 🎯 Filosofía del Proyecto

**Independencia Total:**
- ✅ **Sin APIs externas** - No dependemos de Google Places, OSM data, etc.
- ✅ **Datos propios** - Todos los lugares son creados manualmente
- ✅ **Control total** - Gestión completa de contenido e imágenes
- ✅ **Sin costos** - No pagamos por servicios de terceros
- ✅ **Sin límites** - No hay quotas ni restricciones

---

## 📦 Estructura del Proyecto

```
bedic_project/
├── 📂 backend/                    # API REST (Node.js + Express + MongoDB)
│   ├── controllers/               # Lógica de negocio
│   ├── models/                    # Modelos de MongoDB
│   ├── routes/                    # Rutas de la API
│   ├── middleware/                # Autenticación, validación
│   ├── scripts/                   # Scripts de utilidad
│   └── uploads/                   # Imágenes subidas
│
├── 📂 bedic-admin-panel/          # Panel de administración (Angular 18)
│   ├── src/app/features/         # Módulos de funcionalidades
│   │   ├── places/               # Gestión de lugares
│   │   ├── announcements/        # Gestión de anuncios
│   │   └── reports/              # Moderación de reportes
│   └── src/environments/         # Configuración
│
├── 📂 flutter_app/                # App móvil/web (Flutter)
│   ├── lib/screens/              # Pantallas
│   ├── lib/services/             # Servicios (API, auth)
│   ├── lib/components/           # Componentes reutilizables
│   └── assets/i18n/              # Traducciones (es/en)
│
├── 📂 bedic-data-seeder/          # (Opcional) Scripts de población masiva
│   └── scripts/                  # Solo para desarrollo/testing
│
├── 📄 ARQUITECTURA.md             # Documentación de arquitectura
└── 📄 README.md                   # Este archivo
```

---

## 🚀 Instalación y Ejecución

### **1. Backend (Puerto 5000)**

```bash
cd backend
npm install
```

**Configurar `.env`:**
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=tu_secret_aqui
PORT=5000
```

**Ejecutar:**
```bash
npm start
```

### **2. Angular Admin Panel (Puerto 4200)**

```bash
cd bedic-admin-panel
npm install
ng serve
```

**Acceder:** http://localhost:4200

### **3. Flutter App**

```bash
cd flutter_app
flutter pub get
flutter run -d edge  # Para web
flutter run -d chrome  # Alternativa
```

---

## 🔑 Funcionalidades Principales

### **Panel de Administración (Angular):**
- ✅ Crear/editar/eliminar lugares manualmente
- ✅ Subir y gestionar imágenes (convertidas a WebP)
- ✅ Moderar reportes de usuarios
- ✅ Crear anuncios del sistema
- ✅ Ver estadísticas y métricas

### **App de Usuario (Flutter):**
- ✅ Mapa interactivo con Flutter Map
- ✅ Buscar lugares por nombre/categoría
- ✅ Ver detalles completos de lugares
- ✅ Crear reportes y comentarios
- ✅ Sistema de valoraciones
- ✅ Recomendaciones personalizadas
- ✅ Gamificación (XP, badges, títulos)
- ✅ Multiidioma (ES/EN)

### **Backend API:**
- ✅ CRUD completo de lugares
- ✅ Autenticación JWT
- ✅ Subida y procesamiento de imágenes
- ✅ Búsqueda geoespacial
- ✅ Sistema de reportes
- ✅ Recomendaciones basadas en preferencias

---

## 🗺️ Sobre el Mapa

### **Flutter Map + OpenStreetMap Tiles**

- **Flutter Map**: Librería open source para mapas interactivos
- **OSM Tiles**: Solo para visualización del mapa base (calles, edificios)
- **Marcadores**: 100% de nuestra API
- **Datos de lugares**: 100% propios, creados manualmente

**NO usamos:**
- ❌ Google Maps API (para datos)
- ❌ Google Places API
- ❌ Datos de lugares de OSM

---

## 📊 Modelo de Datos

### **Lugar (Place):**
```javascript
{
  name: "Nombre del lugar",
  category: "restaurant | cafe | bar | park | ...",
  description: "Descripción manual",
  coordinates: {
    type: "Point",
    coordinates: [lng, lat]  // Ingresadas manualmente
  },
  address: "Dirección completa",
  city: "Ciudad",
  department: "Departamento",
  officialImages: ["url1.webp", "url2.webp"],  // Subidas manualmente
  rating: 4.5,  // Calculado de valoraciones de usuarios
  verified: true  // Verificado por admin
}
```

---

## 🔐 Seguridad

- ✅ **JWT** para autenticación
- ✅ **Bcrypt** para contraseñas
- ✅ **Helmet** para headers de seguridad
- ✅ **CORS** configurado
- ✅ **Rate Limiting** contra spam
- ✅ **Joi** para validación de inputs
- ✅ **Roles** (Admin vs Usuario)

---

## 📦 Dependencias del Backend

### **Esenciales (mantenidas):**
```json
{
  "express": "Framework web",
  "mongoose": "ODM para MongoDB",
  "jsonwebtoken": "Autenticación",
  "bcryptjs": "Encriptación",
  "multer": "Subida de archivos",
  "sharp": "Procesamiento de imágenes",
  "helmet": "Seguridad",
  "cors": "CORS",
  "joi": "Validación",
  "winston": "Logging"
}
```

### **Eliminadas (no necesarias):**
```json
{
  "axios": "No hacemos peticiones HTTP externas",
  "google-auth-library": "No usamos Google Sign-In",
  "node-cron": "No necesitamos tareas programadas",
  "nodemailer": "No enviamos emails",
  "socket.io": "No usamos WebSockets"
}
```

---

## 🎨 Flujo de Trabajo

### **Creación de un Lugar:**

```
1. Admin abre Angular Panel
   ↓
2. Completa formulario:
   - Nombre, categoría, descripción
   - Coordenadas (lat/lng)
   - Dirección, ciudad
   - Sube imágenes
   ↓
3. Angular → POST /api/places
   ↓
4. Backend:
   - Valida datos
   - Procesa imágenes (resize, WebP)
   - Guarda en MongoDB
   ↓
5. Flutter App → GET /api/places
   ↓
6. Usuario ve el lugar en el mapa
```

---

## 🌐 Endpoints Principales

### **Lugares:**
```
GET    /api/places              # Listar lugares
GET    /api/places/:id          # Detalle
POST   /api/places              # Crear (Admin)
PUT    /api/places/:id          # Actualizar (Admin)
DELETE /api/places/:id          # Eliminar (Admin)
POST   /api/places/:id/images   # Subir imagen (Admin)
DELETE /api/places/:id/images   # Eliminar imagen (Admin)
```

### **Autenticación:**
```
POST   /api/auth/register       # Registro
POST   /api/auth/login          # Login
GET    /api/auth/me             # Perfil actual
```

### **Otros:**
```
GET    /api/recommendations     # Recomendaciones
POST   /api/reports             # Crear reporte
GET    /api/announcements       # Anuncios
```

---

## 📈 Escalabilidad

### **Fase Actual:**
- 100-500 lugares creados manualmente
- 1 admin gestionando contenido
- Usuarios consultando y reportando

### **Futuro:**
- 1,000-5,000 lugares
- Múltiples admins
- Sistema de contribución de usuarios
- Caché con Redis
- CDN para imágenes

---

## 🛠️ Scripts Útiles

### **Backend:**
```bash
npm start                    # Iniciar servidor
npm run create-geo-index     # Crear índice geoespacial (primera vez)
npm run validate-images      # Validar imágenes
npm run convert-images       # Convertir imágenes a WebP
```

### **Angular:**
```bash
ng serve                     # Desarrollo
ng build                     # Producción
```

### **Flutter:**
```bash
flutter run -d edge          # Web (Edge)
flutter run -d chrome        # Web (Chrome)
flutter build web            # Build producción
```

---

## 📖 Documentación

- **ARQUITECTURA.md** - Arquitectura completa del sistema
- **backend/scripts/README.md** - Documentación de scripts
- **flutter_app/README.md** - Documentación de la app

---

## 💡 Ventajas de BEDIC

1. ✅ **Control Total** - Todos los datos son nuestros
2. ✅ **Sin Costos** - No pagamos APIs externas
3. ✅ **Sin Límites** - No hay quotas
4. ✅ **Privacidad** - No compartimos datos
5. ✅ **Personalización** - Campos propios
6. ✅ **Calidad** - Control manual
7. ✅ **Independencia** - No dependemos de terceros

---

## 🚨 Importante

### **Primera vez:**
```bash
# 1. Crear índice geoespacial en MongoDB
cd backend
npm run create-geo-index

# 2. Crear primer admin manualmente en MongoDB
# O usar el endpoint de registro con role: 'admin'
```

### **Producción:**
- Configurar variables de entorno
- Usar HTTPS
- Configurar CORS correctamente
- Backups regulares de MongoDB
- CDN para imágenes

---

## 📞 Soporte

Para más información, consulta:
- `ARQUITECTURA.md` - Arquitectura detallada
- `backend/scripts/README.md` - Scripts disponibles
- Issues en el repositorio

---

## 📝 Licencia

Proyecto privado - BEDIC Team

---

## 🎯 Resumen

**BEDIC es un sistema completamente autónomo donde:**

- Los **lugares** se crean manualmente en Angular ✍️
- Los **datos** se almacenan en nuestra MongoDB 💾
- La **API** es nuestra (Node.js/Express) 🔌
- Las **imágenes** son nuestras (servidor propio) 📸
- El **mapa** usa Flutter Map (gratis) 🗺️
- Los **tiles** vienen de OSM (solo visualización) 🌍

**NO dependemos de Google, ni de servicios externos de datos.** 🎉
