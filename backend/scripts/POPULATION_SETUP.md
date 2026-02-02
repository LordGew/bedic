# 🗺️ Sistema de Población de Lugares - BEDIC

## Descripción
Script automático que puebla la base de datos con lugares de Colombia cada 24 horas.

### Características
- ✅ Obtiene lugares de **Google Places API**
- ✅ Cubre **10 ciudades principales** de Colombia
- ✅ Soporta **20 categorías** de lugares
- ✅ **Descarga imágenes** automáticamente
- ✅ **Aplica marca de agua** (BEDIC) a todas las imágenes
- ✅ **Scheduler automático** cada 24 horas
- ✅ **Evita duplicados** en la BD
- ✅ **Logging detallado** de operaciones

---

## 📋 Requisitos

### 1. Dependencias NPM
```bash
npm install axios sharp node-cron dotenv
```

### 2. Variables de Entorno (.env)
```env
# Google Places API
GOOGLE_PLACES_API_KEY=YOUR_API_KEY_HERE

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/bedic

# Rutas
IMAGES_DIR=./uploads/places
```

### 3. Obtener Google Places API Key
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita "Places API"
4. Crea una clave de API
5. Agrega la clave a `.env`

---

## 🚀 Uso

### Ejecución Manual (Una sola vez)
```bash
node scripts/populatePlacesDaily.js --manual
```

### Ejecución con Scheduler (Cada 24 horas)
```bash
node scripts/populatePlacesDaily.js --scheduler
```

### Integración en PM2
```bash
# Crear archivo ecosystem.config.js
pm2 start scripts/populatePlacesDaily.js --name "places-population" -- --scheduler

# Ver logs
pm2 logs places-population

# Detener
pm2 stop places-population
```

---

## 📊 Ciudades Cubiertas

| Ciudad | Coordenadas | Radio |
|--------|-------------|-------|
| Bogotá | 4.71°N, 74.00°W | 15 km |
| Medellín | 6.24°N, 75.58°W | 15 km |
| Cali | 3.43°N, 76.50°W | 12 km |
| Barranquilla | 10.96°N, 74.79°W | 12 km |
| Cartagena | 10.39°N, 75.48°W | 10 km |
| Bucaramanga | 7.12°N, 73.11°W | 10 km |
| Santa Marta | 11.24°N, 74.22°W | 8 km |
| Cúcuta | 7.88°N, 72.50°W | 10 km |
| Pereira | 4.81°N, 75.69°W | 8 km |
| Manizales | 5.06°N, 75.51°W | 8 km |

---

## 🏷️ Categorías de Lugares

```
restaurant, cafe, bar, hotel, park, museum, shopping_mall,
supermarket, pharmacy, hospital, gym, cinema, library, bank,
atm, gas_station, parking, taxi_stand, bus_station, train_station
```

---

## 📸 Procesamiento de Imágenes

### Marca de Agua
- Texto: "BEDIC"
- Posición: Esquina inferior derecha
- Opacidad: 60%
- Formato: JPEG (calidad 85%)

### Almacenamiento
```
/backend/uploads/places/
├── {placeId}_{timestamp}.jpg
├── {placeId}_{timestamp}.jpg
└── ...
```

---

## 📈 Estadísticas Esperadas

### Por Ejecución
- **Ciudades**: 10
- **Categorías**: 20
- **Lugares por categoría**: ~20-50
- **Total estimado**: 4,000 - 10,000 lugares
- **Tiempo**: 2-4 horas (con delays para no sobrecargar API)

### Después de 1 Semana
- **Lugares únicos**: 20,000+
- **Imágenes descargadas**: 15,000+
- **Cobertura**: Todo Colombia

---

## 🔍 Monitoreo

### Logs
```bash
# Ver logs en tiempo real
tail -f logs/population.log

# Ver últimas 100 líneas
tail -100 logs/population.log
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

// Lugares por ciudad (aproximado por coordenadas)
db.places.find({
  "coordinates.coordinates": {
    $near: {
      $geometry: { type: "Point", coordinates: [-74.0055, 4.7110] },
      $maxDistance: 15000
    }
  }
}).count()
```

---

## ⚠️ Consideraciones

### Límites de API
- **Google Places**: 1 solicitud por segundo (recomendado)
- **Cuota diaria**: Depende del plan
- **Delay**: 500ms entre lugares, 1000ms entre categorías

### Optimizaciones
- ✅ Evita duplicados verificando antes de guardar
- ✅ Descarga solo 1 imagen por lugar
- ✅ Comprime imágenes a 800px de ancho
- ✅ Aplica marca de agua en tiempo real

### Mantenimiento
- Ejecutar cada 24 horas para actualizaciones
- Limpiar imágenes antiguas cada 30 días
- Monitorear uso de API

---

## 🐛 Troubleshooting

### Error: "GOOGLE_PLACES_API_KEY is undefined"
```bash
# Verificar .env
cat .env | grep GOOGLE_PLACES_API_KEY

# Agregar si falta
echo "GOOGLE_PLACES_API_KEY=your_key" >> .env
```

### Error: "Cannot find module 'sharp'"
```bash
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
- Verificar que Google Places API tiene habilitada "Places API"
- Verificar cuota diaria de API
- Revisar logs para errores específicos

---

## 📝 Próximos Pasos

1. ✅ Instalar dependencias
2. ✅ Configurar variables de entorno
3. ✅ Obtener Google Places API Key
4. ✅ Ejecutar script manual primero
5. ✅ Configurar scheduler en PM2
6. ✅ Monitorear logs
7. ✅ Verificar datos en BD

---

## 📞 Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.

**Última actualización**: Diciembre 2025
