# 🤖 Sistema de Auto-Descubrimiento de Lugares - Guía Completa

## 📋 Descripción General

Sistema completo de gestión automática de lugares que:
- ✅ Pobla la base de datos con lugares reales
- ✅ Descubre automáticamente nuevos lugares cada 24 horas
- ✅ Registra toda la actividad en la base de datos
- ✅ Proporciona un panel de administración en Angular para monitoreo

## 🏗️ Arquitectura del Sistema

### Backend (Node.js/Express)
```
backend/
├── scripts/
│   ├── seedPlaces.js           # Población inicial (116 lugares)
│   ├── autoDiscoverPlaces.js   # Auto-descubrimiento con OSM
│   ├── scheduler.js            # Programador (cada 24h a las 3 AM)
│   └── README.md               # Documentación de scripts
├── models/
│   └── ScriptActivity.js       # Modelo de actividad
├── controllers/
│   └── scriptActivity.controller.js  # Controlador de API
└── routes/
    └── scriptActivity.routes.js      # Rutas de API
```

### Frontend (Angular)
```
bedic-admin-panel/src/app/features/
└── script-activity/
    ├── script-activity.component.ts    # Lógica del componente
    ├── script-activity.component.html  # Template
    └── script-activity.component.scss  # Estilos
```

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias

```bash
cd backend
npm install node-cron
```

### 2. Poblar Base de Datos Inicial

```bash
npm run seed
```

**Resultado esperado:**
```
✅ 116 lugares insertados exitosamente

📊 Resumen por categoría:
   Restaurante: 24 lugares
   Bar: 16 lugares
   Cafetería: 12 lugares
   Parque: 14 lugares
   Hotel: 15 lugares
   Museo: 12 lugares
   Centro Comercial: 11 lugares
   Punto de Interés: 4 lugares
   Hospital: 4 lugares
   Cine: 4 lugares
```

### 3. Probar Auto-Descubrimiento (Opcional)

```bash
npm run discover
```

Este comando ejecuta manualmente el script de auto-descubrimiento para probar que funciona correctamente.

### 4. Iniciar Scheduler (Producción)

#### Opción A: Ejecutar directamente
```bash
npm run scheduler
```

#### Opción B: Con PM2 (Recomendado para producción)
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar scheduler
pm2 start scripts/scheduler.js --name "bedic-scheduler"

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

**Comandos útiles de PM2:**
```bash
pm2 list                    # Ver procesos
pm2 logs bedic-scheduler    # Ver logs
pm2 restart bedic-scheduler # Reiniciar
pm2 stop bedic-scheduler    # Detener
pm2 delete bedic-scheduler  # Eliminar
```

## 📡 API Endpoints

Todos los endpoints requieren autenticación de **administrador**.

### GET `/api/script-activity/activities`
Obtiene el historial de ejecuciones.

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Resultados por página (default: 50)
- `scriptName` (opcional): Filtrar por nombre de script

**Ejemplo de respuesta:**
```json
{
  "activities": [
    {
      "_id": "...",
      "scriptName": "autoDiscoverPlaces",
      "status": "success",
      "message": "Descubrimiento completado: 45 lugares nuevos agregados",
      "stats": {
        "totalFound": 150,
        "totalAdded": 45,
        "totalSkipped": 105,
        "duration": "120.5s",
        "citiesProcessed": [...]
      },
      "timestamp": "2024-12-02T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

### GET `/api/script-activity/stats`
Obtiene estadísticas generales.

**Ejemplo de respuesta:**
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

**Ejemplo de respuesta:**
```json
{
  "message": "Script de auto-descubrimiento iniciado en segundo plano",
  "timestamp": "2024-12-02T10:00:00.000Z"
}
```

### DELETE `/api/script-activity/clean`
Elimina actividades antiguas (más de 90 días).

**Ejemplo de respuesta:**
```json
{
  "message": "Actividades antiguas eliminadas",
  "deletedCount": 45
}
```

## 🎨 Panel de Administración Angular

### Acceso
Navega a: **Dashboard → Sistema → Actividad de Scripts**

O directamente: `http://localhost:4200/dashboard/script-activity`

### Características del Panel

#### 📊 Estadísticas en Tiempo Real
- Total de ejecuciones
- Ejecuciones exitosas
- Errores
- Tasa de éxito
- Lugares agregados en los últimos 30 días
- Tiempo hasta la próxima ejecución

#### 📋 Última Ejecución
- Estado (éxito/error)
- Mensaje descriptivo
- Estadísticas detalladas
- Lista de ciudades procesadas con resultados

#### 📜 Historial Completo
- Lista paginada de todas las ejecuciones
- Filtros por estado
- Detalles de cada ejecución
- Auto-actualización cada 30 segundos

#### 🎮 Acciones Disponibles
- **Ejecutar Manualmente**: Inicia el script inmediatamente
- **Actualizar**: Recarga los datos
- **Limpiar Antiguas**: Elimina registros de más de 90 días

## 🌍 Ciudades y Categorías

### Ciudades Incluidas (12)
1. Bogotá
2. Medellín
3. Cali
4. Barranquilla
5. Cartagena
6. Bucaramanga
7. Pereira
8. Santa Marta
9. Cúcuta
10. Manizales
11. Ibagué
12. Pasto

### Categorías (15)
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

## ⚙️ Configuración del Scheduler

El scheduler está configurado para ejecutarse:
- **Frecuencia**: Cada 24 horas
- **Hora**: 3:00 AM
- **Zona horaria**: America/Bogota

### Modificar Horario

Edita `backend/scripts/scheduler.js`:

```javascript
// Formato: segundo minuto hora día mes día-semana
cron.schedule('0 0 3 * * *', async () => {
  // ... código
}, {
  scheduled: true,
  timezone: "America/Bogota"
});
```

**Ejemplos de horarios:**
- `'0 0 3 * * *'` - Cada día a las 3:00 AM
- `'0 0 */6 * * *'` - Cada 6 horas
- `'0 0 0 * * 0'` - Cada domingo a medianoche
- `'0 30 2 * * *'` - Cada día a las 2:30 AM

## 🔍 Fuente de Datos

El sistema utiliza **OpenStreetMap Overpass API** (gratuita) para descubrir nuevos lugares.

### Ventajas
- ✅ Completamente gratuita
- ✅ Datos actualizados por la comunidad
- ✅ Cobertura global
- ✅ Sin límites de API key

### Limitaciones
- ⚠️ Delay de 1 segundo entre peticiones (para no saturar)
- ⚠️ Calidad de datos depende de la comunidad
- ⚠️ Algunos lugares pueden no tener nombre

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real

**Con PM2:**
```bash
pm2 logs bedic-scheduler
```

**Ejecución directa:**
Los logs se muestran en la consola.

### Logs Típicos

**Inicio:**
```
🕐 Scheduler iniciado
📅 El script de auto-descubrimiento se ejecutará cada 24 horas a las 3:00 AM
✅ Scheduler configurado correctamente
```

**Durante ejecución:**
```
⏰ Ejecutando tarea programada de auto-descubrimiento...
📅 Fecha: 2/12/2024, 3:00:00 a. m.
🔍 Iniciando búsqueda automática de lugares...
📍 Procesando Bogotá...
   Restaurante: 45 encontrados
   ✅ Bogotá: 12 nuevos, 33 existentes
```

**Finalización:**
```
📊 Resumen de ejecución:
   Total encontrados: 1250
   Nuevos agregados: 145
   Ya existentes: 1105
   Duración: 180.5s
✅ Tarea completada exitosamente
```

## 🐛 Solución de Problemas

### El scheduler no inicia
```bash
# Verificar que node-cron está instalado
npm list node-cron

# Reinstalar si es necesario
npm install node-cron
```

### Error de conexión a MongoDB
```bash
# Verificar variable de entorno
echo $MONGO_URI

# Verificar conexión
mongosh $MONGO_URI
```

### No se agregan lugares nuevos
- Verifica que el script se está ejecutando (revisa logs)
- Confirma que hay conexión a internet
- Revisa si los lugares ya existen en la BD

### Panel Angular no muestra datos
- Verifica que el backend está corriendo
- Confirma que estás autenticado como admin
- Revisa la consola del navegador para errores
- Verifica que la URL de la API es correcta en `environment.ts`

## 📈 Mejoras Futuras

### Posibles Extensiones
1. **Múltiples fuentes de datos**
   - Google Places API
   - Foursquare API
   - TripAdvisor

2. **Validación automática**
   - Verificar que los lugares existen
   - Validar coordenadas
   - Enriquecer con más información

3. **Notificaciones**
   - Email cuando se agregan muchos lugares
   - Alertas de errores
   - Reportes semanales

4. **Machine Learning**
   - Predecir popularidad de lugares
   - Detectar lugares duplicados
   - Sugerir categorías

5. **Optimizaciones**
   - Cache de resultados
   - Búsqueda incremental
   - Priorización por zonas

## 📞 Soporte

Para problemas o preguntas:
1. Revisa los logs del scheduler
2. Verifica el panel de actividad en Angular
3. Consulta la documentación de OpenStreetMap Overpass API
4. Revisa la colección `ScriptActivity` en MongoDB

## 🎉 ¡Listo!

El sistema está completamente configurado y funcionando. El scheduler se ejecutará automáticamente cada 24 horas y podrás monitorear toda la actividad desde el panel de administración.

**Comandos de inicio rápido:**
```bash
# Backend
cd backend
npm run seed        # Poblar BD inicial
npm run scheduler   # Iniciar scheduler

# O con PM2
pm2 start scripts/scheduler.js --name "bedic-scheduler"
pm2 save

# Frontend
cd bedic-admin-panel
ng serve
# Navega a: http://localhost:4200/dashboard/script-activity
```
