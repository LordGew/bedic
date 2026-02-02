# 🚀 Guía de Integración Completa - Sistema de Moderación Automática Avanzado

## Resumen Ejecutivo

Este documento proporciona instrucciones paso a paso para integrar completamente el sistema de moderación automática avanzado en producción. El sistema incluye:

- ✅ Detección automática de contenido ofensivo (malas palabras, spam, toxicidad)
- ✅ Sanciones progresivas inteligentes (flag, mute, ban)
- ✅ Dashboard administrativo informativo en Angular
- ✅ Logging detallado de todas las acciones
- ✅ Exportación de datos y reportes
- ✅ API completa para integración con aplicaciones móviles

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Paso 1: Backend - Integración de Rutas](#paso-1-backend---integración-de-rutas)
3. [Paso 2: Backend - Integración en Middleware](#paso-2-backend---integración-en-middleware)
4. [Paso 3: Angular - Registrar Componentes](#paso-3-angular---registrar-componentes)
5. [Paso 4: Angular - Actualizar Navegación](#paso-4-angular---actualizar-navegación)
6. [Paso 5: Configuración de Producción](#paso-5-configuración-de-producción)
7. [Paso 6: Pruebas y Validación](#paso-6-pruebas-y-validación)
8. [Paso 7: Monitoreo y Mantenimiento](#paso-7-monitoreo-y-mantenimiento)

---

## Requisitos Previos

### Backend
- Node.js 14+
- Express.js
- MongoDB
- Mongoose
- Archivos creados:
  - `backend/models/ModerationLog.js`
  - `backend/services/advancedModerationService.js`
  - `backend/routes/moderation.routes.js`
  - `backend/config/badWordsDict.js`

### Angular
- Angular 17+
- Angular Material
- RxJS
- Archivos creados:
  - `bedic-admin-panel/src/app/features/moderation/moderation-feed-advanced/`
  - Componentes TypeScript, HTML, SCSS

### Dependencias de NPM (Backend)
```json
{
  "express": "^4.18.0",
  "mongoose": "^7.0.0",
  "dotenv": "^16.0.0",
  "helmet": "^7.0.0",
  "cors": "^2.8.5"
}
```

---

## Paso 1: Backend - Integración de Rutas

### 1.1 Verificar que las rutas están registradas en `server.js`

**Archivo:** `backend/server.js`

Las rutas de moderación ya están registradas:

```javascript
// Línea 102
const moderationRoutes = require('./routes/moderation.routes');

// Línea 133
app.use('/api/admin/moderation', moderationRoutes);
```

**Endpoints disponibles:**
- `GET /api/admin/moderation/logs` - Obtener logs de moderación
- `GET /api/admin/moderation/dashboard` - Estadísticas del dashboard
- `GET /api/admin/moderation/stats` - Estadísticas generales
- `GET /api/admin/moderation/user/:userId/violations` - Violaciones de usuario
- `POST /api/admin/moderation/review/:logId` - Revisar acción de moderación
- `POST /api/admin/moderation/appeal/:logId` - Apelar acción de moderación
- `PUT /api/admin/moderation/appeal/:logId/resolve` - Resolver apelación

### 1.2 Verificar que el modelo ModerationLog está registrado

**Archivo:** `backend/models/ModerationLog.js`

El modelo debe estar disponible para importar:

```javascript
const ModerationLog = require('../models/ModerationLog');
```

---

## Paso 2: Backend - Integración en Middleware

### 2.1 Actualizar middleware de moderación

**Archivo:** `backend/middleware/moderation.middleware.js`

El middleware ya está actualizado para usar `moderateContentAdvanced`:

```javascript
const { moderateContentAdvanced } = require('../services/advancedModerationService');

// En moderateBeforeSave()
const result = await moderateContentAdvanced(
  contentText,
  user.id,
  language,
  contentType,
  contentId
);
```

### 2.2 Rutas que usan el middleware de moderación

Las siguientes rutas ya tienen integrada la moderación automática:

**Ratings (Calificaciones):**
```javascript
// backend/routes/rating.routes.js
router.post('/', protect, rateLimit('rating', { perMinute: 3 }), moderateBeforeSave, addRating);
router.post('/:id/comments', protect, rateLimit('comment', { perMinute: 5 }), moderateBeforeSave, addCommentToRating);
```

**Reports (Reportes):**
```javascript
// backend/routes/report.routes.js
router.post('/', protect, rateLimit('report', { perMinute: 10 }), moderateBeforeSave, filterLanguage(['description']), createReport);
router.post('/:id/comments', protect, rateLimit('comment', { perMinute: 5 }), moderateBeforeSave, addCommentToReport);
```

### 2.3 Integrar moderación en otras rutas (si es necesario)

Para agregar moderación a otras rutas de contenido:

```javascript
const { moderateBeforeSave, rateLimit } = require('../middleware/moderation.middleware');

// Ejemplo: Crear comentario en lugar
router.post('/places/:placeId/comments', 
  protect, 
  rateLimit('comment', { perMinute: 5 }), 
  moderateBeforeSave,  // ← Agregar esta línea
  createPlaceComment
);
```

---

## Paso 3: Angular - Registrar Componentes

### 3.1 Crear módulo de moderación (si no existe)

**Archivo:** `bedic-admin-panel/src/app/features/moderation/moderation.module.ts`

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ModerationFeedAdvancedComponent } from './moderation-feed-advanced/moderation-feed-advanced.component';

@NgModule({
  declarations: [ModerationFeedAdvancedComponent],
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule
  ]
})
export class ModerationModule { }
```

### 3.2 Registrar en routing

**Archivo:** `bedic-admin-panel/src/app/app.routes.ts` (o el archivo de routing principal)

```typescript
import { ModerationFeedAdvancedComponent } from './features/moderation/moderation-feed-advanced/moderation-feed-advanced.component';

export const routes: Routes = [
  // ... otras rutas
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      // ... otras rutas del admin
      {
        path: 'moderation-dashboard',
        component: ModerationFeedAdvancedComponent,
        data: { title: 'Moderation Dashboard' }
      }
    ]
  }
];
```

---

## Paso 4: Angular - Actualizar Navegación

### 4.1 Agregar enlace en el menú de navegación

**Archivo:** `bedic-admin-panel/src/app/core/layout/sidebar/sidebar.component.ts`

```typescript
// En el array de items del menú
{
  label: this.languageService.translate('nav.moderation'),
  icon: 'security',
  route: '/admin/moderation-dashboard',
  badge: 'NEW'
}
```

### 4.2 Actualizar LanguageService (ya completado)

Las traducciones ya están agregadas en `language.service.ts`:

```typescript
'moderation.dashboard_title': { es: 'Panel de Moderación Automática', en: 'Automated Moderation Dashboard' },
'moderation.statistics': { es: 'Estadísticas', en: 'Statistics' },
// ... más traducciones
```

---

## Paso 5: Configuración de Producción

### 5.1 Variables de entorno (.env)

```bash
# Backend
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/bedic
PORT=5000
FRONTEND_URL=https://app.bedic.com
ADMIN_URL=https://admin.bedic.com

# Perspective API (opcional, para análisis de toxicidad)
PERSPECTIVE_API_KEY=your_api_key_here

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5.2 Configuración de seguridad

**Archivo:** `backend/middleware/security.js`

Asegurar que está configurado para producción:

```javascript
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});
```

### 5.3 Configuración de CORS

**Archivo:** `backend/server.js`

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.ADMIN_URL] 
    : '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

---

## Paso 6: Pruebas y Validación

### 6.1 Ejecutar pruebas automatizadas

```bash
cd backend
npm test -- tests/moderation.test.js
```

**Pruebas incluidas:**
- ✅ Detección de malas palabras (3 niveles)
- ✅ Detección de spam
- ✅ Cálculo de trust score
- ✅ Determinación de nivel de moderación
- ✅ Cálculo de sanciones progresivas

### 6.2 Pruebas manuales de API

**Test 1: Obtener logs de moderación**
```bash
curl -X GET http://localhost:5000/api/admin/moderation/logs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Test 2: Obtener dashboard**
```bash
curl -X GET "http://localhost:5000/api/admin/moderation/dashboard?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test 3: Obtener violaciones de usuario**
```bash
curl -X GET "http://localhost:5000/api/admin/moderation/user/USER_ID/violations?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6.3 Pruebas en Angular

1. Navegar a `/admin/moderation-dashboard`
2. Verificar que se cargan las estadísticas
3. Probar filtros avanzados
4. Probar exportación de datos
5. Verificar que la información del sistema se muestra correctamente

### 6.4 Prueba end-to-end

1. **Crear contenido ofensivo desde la app móvil**
   - El middleware debe rechazarlo automáticamente
   - Se debe crear un log en ModerationLog

2. **Verificar en el dashboard**
   - El log debe aparecer en la tabla
   - Las estadísticas deben actualizarse

3. **Revisar acciones**
   - Admin puede ver detalles de la acción
   - Admin puede apelar o revisar la acción

---

## Paso 7: Monitoreo y Mantenimiento

### 7.1 Monitoreo de logs

**Archivo:** `backend/config/logger.js`

Logs estructurados para monitoreo:

```javascript
logger.info('Moderation action logged', {
  userId: user.id,
  action: 'COMMENT_HIDDEN',
  severity: 'MODERATE',
  reason: 'BAD_WORDS'
});
```

### 7.2 Alertas recomendadas

Configurar alertas para:
- Usuarios con 3+ violaciones en 24 horas
- Picos de contenido rechazado (>100 en 1 hora)
- Fallos en el servicio de moderación

### 7.3 Mantenimiento de base de datos

**Limpiar logs antiguos (30+ días):**

```javascript
// backend/scripts/cleanup-moderation-logs.js
const ModerationLog = require('../models/ModerationLog');

async function cleanupOldLogs() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await ModerationLog.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
  console.log('Old moderation logs cleaned up');
}

// Ejecutar diariamente con cron
```

### 7.4 Actualización del diccionario de malas palabras

**Archivo:** `backend/config/badWordsDict.js`

Actualizar regularmente con nuevas palabras ofensivas:

```javascript
// Agregar nuevas palabras
const badWordsDict = {
  es: {
    SEVERO: ['palabra1', 'palabra2', ...],
    MODERADO: ['palabra3', 'palabra4', ...],
    LEVE: ['palabra5', 'palabra6', ...]
  },
  en: {
    SEVERO: ['word1', 'word2', ...],
    MODERADO: ['word3', 'word4', ...],
    LEVE: ['word5', 'word6', ...]
  }
};
```

---

## 📊 Flujo Completo de Moderación

```
┌─────────────────────────────────────────────────────────────┐
│ Usuario publica contenido (comentario, reseña, reporte)    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Middleware: moderateBeforeSave()                           │
│ - Verifica estado del usuario (baneado, silenciado)        │
│ - Calcula trust score                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ advancedModerationService.moderateContentAdvanced()        │
│ - Detecta malas palabras (3 niveles)                       │
│ - Detecta spam (patrones múltiples)                        │
│ - Analiza toxicidad con IA                                 │
│ - Obtiene historial de violaciones                         │
│ - Calcula sanción progresiva                               │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ✅ APROBADO            ❌ RECHAZADO
         │                       │
         ├─ Crear log           ├─ Crear log
         ├─ Guardar contenido   ├─ Aplicar sanción
         └─ Responder OK        ├─ Actualizar usuario
                                └─ Responder error
                                
         ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Admin ve en Dashboard                                      │
│ - Estadísticas en tiempo real                              │
│ - Logs de moderación con filtros                           │
│ - Información del sistema                                  │
│ - Puede revisar, apelar, exportar                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Problema: Los logs de moderación no se crean

**Solución:**
1. Verificar que ModerationLog está importado en `advancedModerationService.js`
2. Verificar que MongoDB está conectado
3. Revisar logs del servidor para errores

### Problema: El dashboard no carga datos

**Solución:**
1. Verificar que AdminService tiene los métodos `getModerationLogs`, `getModerationDashboard`
2. Verificar que las rutas de API están registradas en `server.js`
3. Verificar token de autenticación en headers

### Problema: Las sanciones no se aplican

**Solución:**
1. Verificar que `moderateContentAdvanced` retorna `sanction` correctamente
2. Verificar que el middleware actualiza el usuario
3. Revisar logs de base de datos

---

## 📚 Documentación Adicional

- **MODERATION_SYSTEM_INTEGRATION.md** - Detalles técnicos del sistema
- **backend/services/advancedModerationService.js** - Código del servicio
- **backend/routes/moderation.routes.js** - Endpoints de API
- **backend/tests/moderation.test.js** - Suite de pruebas

---

## ✅ Checklist de Implementación

- [ ] Rutas de moderación registradas en `server.js`
- [ ] Middleware actualizado con `moderateContentAdvanced`
- [ ] ModerationLog modelo disponible
- [ ] ModerationFeedAdvancedComponent registrado en routing
- [ ] Enlace en navegación del admin panel
- [ ] Variables de entorno configuradas
- [ ] Pruebas automatizadas pasadas
- [ ] Pruebas manuales completadas
- [ ] Dashboard carga datos correctamente
- [ ] Filtros funcionan correctamente
- [ ] Exportación de datos funciona
- [ ] Sanciones se aplican correctamente
- [ ] Logs se crean en base de datos
- [ ] Monitoreo configurado
- [ ] Documentación actualizada

---

## 📞 Soporte

Para problemas o preguntas sobre la integración:
1. Revisar logs del servidor
2. Consultar troubleshooting section
3. Revisar código fuente de los servicios
4. Ejecutar pruebas automatizadas

---

**Versión:** 1.0  
**Última actualización:** 2024  
**Estado:** ✅ Listo para Producción
