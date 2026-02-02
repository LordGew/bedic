# ⚡ Quick Start - Sistema de Moderación Automática

## 🎯 Inicio Rápido (5 minutos)

### Paso 1: Validar la instalación
```bash
cd backend
node scripts/validate-moderation.js
```

### Paso 2: Ejecutar setup
```bash
node scripts/setup-moderation.js
```

### Paso 3: Ejecutar pruebas
```bash
npm test -- tests/moderation.test.js
```

### Paso 4: Iniciar servidor
```bash
npm start
```

### Paso 5: Acceder al dashboard
```
http://localhost:4200/admin/moderation-dashboard
```

---

## 📋 Componentes Instalados

### Backend
✅ **Modelo ModerationLog** - Registra todas las acciones automáticas
✅ **Servicio Avanzado** - Detección y sanciones progresivas
✅ **Rutas de API** - 7 endpoints para admin
✅ **Middleware** - Integrado en comentarios y reportes
✅ **Diccionario** - 3 niveles de severidad (ES/EN)

### Angular
✅ **Dashboard Avanzado** - 3 tabs (estadísticas, logs, info)
✅ **Filtros Avanzados** - Período, tipo, severidad, razón
✅ **Exportación** - Descargar datos en CSV
✅ **Traducciones** - Soporte completo ES/EN
✅ **AdminService** - 7 nuevos métodos

---

## 🔄 Flujo de Moderación

```
Usuario publica contenido
    ↓
Middleware: moderateBeforeSave()
    ↓
Servicio: moderateContentAdvanced()
    ├─ Detecta malas palabras
    ├─ Detecta spam
    ├─ Analiza toxicidad
    ├─ Calcula sanción
    └─ Crea log
    ↓
¿Aprobado?
├─ SÍ → Guardar contenido
└─ NO → Aplicar sanción + Responder error
    ↓
Admin ve en dashboard
    ├─ Estadísticas en tiempo real
    ├─ Logs con filtros
    ├─ Información del sistema
    └─ Puede revisar/apelar
```

---

## 📊 Estadísticas del Dashboard

**Tab 1: Estadísticas**
- Total de acciones de moderación
- Usuarios afectados
- Toxicidad promedio
- Spam promedio
- Gráficos de distribución

**Tab 2: Logs de Moderación**
- Tabla filtrable de acciones
- Información detallada de cada log
- Problemas detectados
- Acciones disponibles

**Tab 3: Información del Sistema**
- Cómo funciona la detección
- Sanciones progresivas
- Niveles de severidad
- Cálculo de trust score

---

## 🔍 Filtros Disponibles

- **Período**: 7, 30, 90 días
- **Tipo de Acción**: 6 opciones (hidden, deleted, muted, banned, flagged, spam)
- **Severidad**: Leve, Moderado, Severo
- **Razón**: Malas palabras, spam, toxicidad, etc.
- **Búsqueda**: Usuario o contenido

---

## 🛠️ Endpoints de API

### Obtener logs
```bash
GET /api/admin/moderation/logs?actionType=COMMENT_HIDDEN&severity=MODERATE
```

### Obtener dashboard
```bash
GET /api/admin/moderation/dashboard?days=30
```

### Obtener estadísticas
```bash
GET /api/admin/moderation/stats?days=30
```

### Obtener violaciones de usuario
```bash
GET /api/admin/moderation/user/:userId/violations?days=30
```

### Revisar acción
```bash
POST /api/admin/moderation/review/:logId
Body: { status: "APPROVED", notes: "..." }
```

### Apelar acción
```bash
POST /api/admin/moderation/appeal/:logId
Body: { reason: "..." }
```

### Resolver apelación
```bash
PUT /api/admin/moderation/appeal/:logId/resolve
Body: { status: "APPROVED", notes: "..." }
```

---

## 🚨 Sanciones Progresivas

| Violaciones | Acción | Duración |
|---|---|---|
| 1ª | Flag para revisión | - |
| 2-3 | Comentario oculto | - |
| 4-5 | Silencio temporal | 24 horas |
| 6-7 | Silencio extendido | 3 días |
| 8-9 | Silencio severo | 7 días |
| 10+ | Ban permanente | ∞ |

---

## 📈 Detección Automática

### Malas Palabras (3 niveles)
- **SEVERO**: Palabras muy ofensivas → Contenido eliminado
- **MODERADO**: Palabras ofensivas → Contenido oculto
- **LEVE**: Palabras inapropiadas → Marcado para revisión

### Spam
- Caracteres repetidos (aaaa...)
- URLs sospechosas
- Números de teléfono
- Direcciones de email
- Patrones de spam conocidos

### Toxicidad
- Análisis con IA (Perspective API - opcional)
- Fallback a análisis local si no hay API key
- Score de 0-100

---

## 🔐 Seguridad

✅ Autenticación requerida (JWT)
✅ Rate limiting (3-10 requests/min)
✅ Validación de entrada
✅ Sanitización de datos
✅ Logs auditables
✅ CORS configurado
✅ Helmet para headers de seguridad

---

## 📝 Logs y Monitoreo

Todos los eventos se registran en:
- **ModerationLog** - Base de datos
- **Logger estructurado** - Archivos de log
- **Dashboard** - Interfaz visual

Información capturada:
- Usuario y contenido
- Problemas detectados
- Scores (toxicidad, spam)
- Sanción aplicada
- Timestamp y metadata

---

## 🧪 Pruebas

### Ejecutar todas las pruebas
```bash
npm test -- tests/moderation.test.js
```

### Pruebas incluidas
✅ Detección de malas palabras (3 niveles)
✅ Detección de spam (múltiples patrones)
✅ Cálculo de trust score
✅ Determinación de nivel de moderación
✅ Cálculo de sanciones progresivas

---

## 🐛 Troubleshooting

### Los logs no se crean
```bash
# Verificar conexión a MongoDB
node -e "require('mongoose').connect(process.env.MONGO_URI).then(() => console.log('✅ Conectado')).catch(e => console.log('❌', e.message))"
```

### El dashboard no carga
```bash
# Verificar token en headers
# Verificar que las rutas están registradas en server.js
# Revisar console del navegador para errores
```

### Las sanciones no se aplican
```bash
# Verificar que moderateContentAdvanced retorna sanction
# Revisar logs del servidor
# Verificar que el usuario se actualiza en BD
```

---

## 📚 Documentación Completa

- **PRODUCTION_INTEGRATION_GUIDE.md** - Guía detallada de integración
- **MODERATION_SYSTEM_INTEGRATION.md** - Detalles técnicos del sistema
- **backend/services/advancedModerationService.js** - Código del servicio
- **backend/routes/moderation.routes.js** - Endpoints de API
- **backend/tests/moderation.test.js** - Suite de pruebas

---

## ✅ Checklist Rápido

- [ ] Ejecutar `validate-moderation.js` ✅
- [ ] Ejecutar `setup-moderation.js` ✅
- [ ] Ejecutar pruebas ✅
- [ ] Iniciar servidor ✅
- [ ] Acceder a dashboard ✅
- [ ] Probar filtros ✅
- [ ] Probar exportación ✅
- [ ] Revisar logs en BD ✅

---

## 🎉 ¡Listo!

El sistema de moderación automática está completamente integrado y funcional.

**Estado:** ✅ Listo para Producción
**Versión:** 1.0
**Última actualización:** 2024
