# 🗺️ Sistema Automático de Población de Lugares - BEDIC

## 📌 Resumen Ejecutivo

Sistema completo para poblar la base de datos de BEDIC con **20,000+ lugares de Colombia** en 1 semana, con:
- ✅ Obtención automática de Google Places API
- ✅ Descarga y procesamiento de imágenes con marca de agua
- ✅ Ejecución automática cada 24 horas
- ✅ Limpieza y optimización de datos cada 7 días
- ✅ Monitoreo y reportes detallados

---

## 🚀 Instalación Rápida

### 1. Instalar Dependencias
```bash
cd backend
npm install axios sharp node-cron dotenv
```

### 2. Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env y agregar:
GOOGLE_PLACES_API_KEY=YOUR_API_KEY_HERE
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/bedic
```

### 3. Obtener Google Places API Key
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita "Places API"
4. Crea una clave de API
5. Copia la clave a `.env`

### 4. Instalar PM2 (Opcional pero Recomendado)
```bash
npm install -g pm2
```

---

## 📊 Estructura de Archivos

```
backend/
├── scripts/
│   ├── populatePlacesDaily.js      # Script principal de población
│   ├── dataCleanup.js              # Script de limpieza de datos
│   └── POPULATION_SETUP.md         # Documentación detallada
├── ecosystem.config.js             # Configuración PM2
├── PLACES_POPULATION_README.md     # Este archivo
└── uploads/
    └── places/                     # Imágenes descargadas
```

---

## 🎯 Uso

### Opción 1: Ejecución Manual (Una sola vez)
```bash
node scripts/populatePlacesDaily.js --manual
```

**Tiempo estimado**: 2-4 horas
**Lugares generados**: 4,000 - 10,000

### Opción 2: Con Scheduler (Recomendado)
```bash
node scripts/populatePlacesDaily.js --scheduler
```

Se ejecutará automáticamente a las 2:00 AM todos los días.

### Opción 3: Con PM2 (Producción)
```bash
# Iniciar todos los procesos
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs places-population

# Detener
pm2 stop places-population

# Reiniciar
pm2 restart places-population

# Eliminar
pm2 delete places-population
```

---

## 📈 Resultados Esperados

### Después de 1 Ejecución
- **Lugares**: 4,000 - 10,000
- **Imágenes**: 3,000 - 8,000
- **Tiempo**: 2-4 horas

### Después de 1 Semana (7 ejecuciones)
- **Lugares únicos**: 20,000+
- **Imágenes**: 15,000+
- **Cobertura**: Todo Colombia

### Después de 1 Mes
- **Lugares**: 50,000+
- **Imágenes**: 40,000+
- **Actualizaciones**: Datos frescos de Google Places

---

## 🏙️ Cobertura Geográfica

El script cubre estas 10 ciudades principales:

| Ciudad | Población | Radio |
|--------|-----------|-------|
| Bogotá | 8.2M | 15 km |
| Medellín | 2.5M | 15 km |
| Cali | 2.3M | 12 km |
| Barranquilla | 1.3M | 12 km |
| Cartagena | 0.9M | 10 km |
| Bucaramanga | 0.6M | 10 km |
| Santa Marta | 0.5M | 8 km |
| Cúcuta | 0.6M | 10 km |
| Pereira | 0.5M | 8 km |
| Manizales | 0.4M | 8 km |

---

## 🏷️ Categorías de Lugares

El script obtiene lugares en estas 20 categorías:

```
restaurant, cafe, bar, hotel, park, museum, shopping_mall,
supermarket, pharmacy, hospital, gym, cinema, library, bank,
atm, gas_station, parking, taxi_stand, bus_station, train_station
```

---

## 📸 Procesamiento de Imágenes

### Marca de Agua
- **Texto**: "BEDIC"
- **Posición**: Esquina inferior derecha
- **Opacidad**: 60%
- **Formato**: JPEG (calidad 85%)

### Almacenamiento
```
/backend/uploads/places/
├── {placeId}_{timestamp}.jpg
├── {placeId}_{timestamp}.jpg
└── ...
```

---

## 🔍 Monitoreo

### Ver Logs
```bash
# Logs en tiempo real
tail -f logs/population-out.log

# Últimas 100 líneas
tail -100 logs/population-out.log

# Errores
tail -f logs/population-error.log
```

### Estadísticas en BD
```javascript
// Contar lugares totales
db.places.countDocuments()

// Lugares por categoría
db.places.aggregate([
  { $group: { _id: "$category", count: { $sum: 1 } } }
])

// Lugares con imágenes
db.places.countDocuments({ officialImages: { $ne: [] } })

// Lugares verificados
db.places.countDocuments({ verified: true })
```

---

## 🧹 Limpieza de Datos

### Ejecución Manual
```bash
node scripts/dataCleanup.js --manual
```

### Con Scheduler
```bash
node scripts/dataCleanup.js --scheduler
```

Se ejecutará automáticamente cada domingo a las 3:00 AM.

### Qué Limpia
- ✅ Elimina imágenes más antiguas de 30 días
- ✅ Elimina lugares duplicados
- ✅ Optimiza índices de BD
- ✅ Genera reportes de estadísticas

---

## ⚙️ Configuración Avanzada

### Cambiar Horario de Ejecución

**En `populatePlacesDaily.js` (línea ~250):**
```javascript
// Cambiar de 2:00 AM a 3:00 AM
cron.schedule('0 3 * * *', async () => {
    // ...
});
```

### Cambiar Ciudades

**En `populatePlacesDaily.js` (línea ~50):**
```javascript
const COLOMBIAN_CITIES = [
    { name: 'Bogotá', lat: 4.7110, lng: -74.0055, radius: 15000 },
    // Agregar más ciudades aquí
];
```

### Cambiar Categorías

**En `populatePlacesDaily.js` (línea ~30):**
```javascript
const PLACE_CATEGORIES = [
    'restaurant', 'cafe', 'bar', // Agregar más categorías
];
```

---

## ⚠️ Consideraciones Importantes

### Límites de API
- **Google Places**: 1 solicitud por segundo (recomendado)
- **Cuota diaria**: Depende del plan de Google Cloud
- **Costo**: ~$0.01 - $0.05 por lugar (varía)

### Optimizaciones
- ✅ Delay de 500ms entre lugares
- ✅ Delay de 1000ms entre categorías
- ✅ Evita duplicados antes de guardar
- ✅ Comprime imágenes a 800px
- ✅ Aplica marca de agua en tiempo real

### Mantenimiento
- Ejecutar cada 24 horas para actualizaciones
- Limpiar imágenes cada 30 días
- Monitorear uso de API
- Revisar logs semanalmente

---

## 🐛 Troubleshooting

### Error: "GOOGLE_PLACES_API_KEY is undefined"
```bash
# Verificar .env existe
ls -la .env

# Verificar contenido
cat .env | grep GOOGLE_PLACES_API_KEY

# Si falta, agregar
echo "GOOGLE_PLACES_API_KEY=your_key" >> .env
```

### Error: "Cannot find module 'sharp'"
```bash
# Reinstalar sharp
npm install sharp --build-from-source
```

### Error: "MongoDB connection failed"
```bash
# Verificar MONGODB_URI
echo $MONGODB_URI

# Probar conexión
mongosh "mongodb+srv://user:password@cluster.mongodb.net/bedic"
```

### Imágenes no se descargan
- Verificar que Google Places API está habilitada
- Verificar cuota diaria de API
- Revisar logs para errores específicos
- Aumentar delay entre solicitudes

---

## 📊 Ejemplo de Salida

```
==================================================
🚀 Iniciando población de lugares...
⏰ 2025-12-02 14:30:45

📍 Procesando ciudad: Bogotá
  📌 Categoría restaurant: 45 lugares encontrados
  ✅ Lugar guardado: Restaurante La Candelaria
  ✅ Imagen descargada y marcada: 123456_1701520245.jpg
  ✅ Lugar guardado: Restaurante El Corral
  ...

📍 Procesando ciudad: Medellín
  📌 Categoría cafe: 32 lugares encontrados
  ...

✅ Población completada
📊 Total procesados: 1,250
💾 Lugares guardados: 1,180
📈 Total de lugares en BD: 5,420

==================================================
```

---

## 🎯 Próximos Pasos

1. ✅ Instalar dependencias
2. ✅ Configurar variables de entorno
3. ✅ Obtener Google Places API Key
4. ✅ Ejecutar script manual primero
5. ✅ Configurar scheduler en PM2
6. ✅ Monitorear logs
7. ✅ Verificar datos en BD
8. ✅ Configurar limpieza automática

---

## 📞 Soporte

Para reportar problemas o sugerencias:
- Revisar logs en `logs/` directorio
- Consultar `scripts/POPULATION_SETUP.md` para más detalles
- Contactar al equipo de desarrollo

---

## 📝 Changelog

### v1.0 (Diciembre 2025)
- ✅ Script inicial de población
- ✅ Descarga de imágenes con marca de agua
- ✅ Scheduler automático
- ✅ Script de limpieza de datos
- ✅ Configuración PM2
- ✅ Documentación completa

---

**Última actualización**: Diciembre 2025
**Estado**: Listo para producción ✅
