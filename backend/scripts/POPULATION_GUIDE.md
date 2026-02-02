# 🗺️ Guía Completa de Población de Lugares - BEDIC

## 📊 Resumen Ejecutivo

Sistema de población automática de lugares para Colombia con **cobertura completa** de todas las ciudades principales.

### 🎯 Objetivos:
- ✅ Poblar con **30,000-50,000 lugares reales**
- ✅ Cubrir **TODA el área urbana** de cada ciudad (no solo el centro)
- ✅ Enriquecer con datos completos (ratings, teléfonos, horarios, fotos)
- ✅ **100% GRATIS** usando tiers gratuitos

---

## 🏗️ Arquitectura del Sistema

### **Fase 1: Población Base con OpenStreetMap** (GRATIS)
- **Fuente**: OpenStreetMap Overpass API
- **Cobertura**: 59 zonas en 20+ ciudades
- **Radio por zona**: 15-20 km (cubre toda el área urbana)
- **Categorías**: 15 tipos de lugares
- **Estimado**: 30,000-50,000 lugares
- **Costo**: $0

### **Fase 2: Enriquecimiento con Google Places** (GRATIS)
- **Fuente**: Google Places API
- **Límite gratuito**: 28,000 peticiones/mes (~900/día)
- **Datos agregados**: Ratings, teléfonos, horarios, fotos, sitio web
- **Estrategia**: Priorizar lugares más importantes
- **Costo**: $0 (dentro del tier gratuito)

### **Fase 3: Mantenimiento Automático** (GRATIS)
- **Frecuencia**: Diaria (3:00 AM)
- **OSM**: Buscar nuevos lugares
- **Google**: Enriquecer 900 lugares/día
- **Costo**: $0

---

## 🌍 Cobertura Geográfica

### **Ciudades Principales (59 zonas totales)**

#### 🏙️ **Bogotá** (16 zonas - Cobertura completa)
- Usaquén, Chapinero, Santa Fe, San Cristóbal
- Usme, Tunjuelito, Bosa, Kennedy
- Fontibón, Engativá, Suba, Barrios Unidos
- Teusaquillo, Los Mártires, Antonio Nariño, Puente Aranda

#### 🏙️ **Medellín** (10 zonas - Cobertura completa)
- El Poblado, Laureles, La Candelaria, Buenos Aires
- Castilla, Aranjuez, Manrique, Belén
- Robledo, Bello

#### 🏙️ **Cali** (8 zonas - Cobertura completa)
- Norte, Centro, Sur, Oeste, Este
- Aguablanca, Jamundí, Yumbo

#### 🏙️ **Barranquilla** (4 zonas)
- Norte, Centro, Sur, Soledad

#### 🏙️ **Cartagena** (4 zonas)
- Centro Histórico, Bocagrande, Norte, Sureste

#### 🏙️ **Bucaramanga** (4 zonas)
- Centro, Norte, Floridablanca, Girón

#### 🏙️ **Pereira** (3 zonas)
- Centro, Norte, Dosquebradas

#### 🏙️ **Otras Ciudades** (10 ciudades)
Santa Marta, Cúcuta, Manizales, Ibagué, Pasto, Villavicencio, Armenia, Neiva, Popayán, Valledupar, Montería, Sincelejo, Tunja, Palmira, Riohacha

---

## 📋 Categorías de Lugares (15 tipos)

1. **Restaurante** - Comida, gastronomía
2. **Bar** - Bares, discotecas
3. **Cafetería** - Cafés, panaderías
4. **Parque** - Espacios verdes, recreación
5. **Hotel** - Alojamiento
6. **Museo** - Cultura, galerías
7. **Cine** - Entretenimiento
8. **Hospital** - Salud
9. **Farmacia** - Medicamentos
10. **Banco** - Servicios financieros
11. **Supermercado** - Compras
12. **Centro Comercial** - Shopping
13. **Gimnasio** - Fitness
14. **Biblioteca** - Educación
15. **Tienda** - Comercio general

---

## 🚀 Comandos Disponibles

```bash
# 1. Población inicial (116 lugares base)
npm run seed

# 2. Auto-descubrimiento con OSM (30,000-50,000 lugares)
npm run discover

# 3. Enriquecimiento con Google Places (900/día)
npm run enrich

# 4. Monitorear progreso en tiempo real
npm run monitor

# 5. Crear índice geoespacial (necesario para búsquedas)
npm run create-geo-index

# 6. Scheduler automático (ejecución diaria)
npm run scheduler
```

---

## 📝 Guía Paso a Paso

### **Paso 1: Población Base (Ya ejecutado)**
```bash
npm run seed
```
✅ **Completado**: 116 lugares iniciales

### **Paso 2: Auto-Descubrimiento OSM (En progreso)**
```bash
npm run discover
```
📊 **Progreso actual**: ~20,000 lugares
⏱️ **Tiempo estimado**: 2-3 horas más
🎯 **Meta**: 30,000-50,000 lugares

### **Paso 3: Configurar Google Places API**

#### 3.1. Obtener API Key (5 minutos)
1. Ve a: https://console.cloud.google.com/
2. Crea un proyecto nuevo: "BEDIC Places"
3. Habilita "Places API"
4. Ve a "Credenciales" → "Crear credenciales" → "Clave de API"
5. Copia la API Key

#### 3.2. Configurar en el proyecto
```bash
# Editar archivo .env
echo "GOOGLE_PLACES_API_KEY=tu_api_key_aqui" >> .env
```

### **Paso 4: Enriquecimiento con Google Places**
```bash
npm run enrich
```
📊 **Resultado**: 900 lugares enriquecidos/día
💰 **Costo**: $0 (tier gratuito)
⏱️ **Tiempo**: ~2 horas/día

### **Paso 5: Configurar Mantenimiento Automático**
```bash
# Con PM2 (recomendado)
pm2 start scripts/scheduler.js --name "bedic-scheduler"
pm2 save
pm2 startup

# O directamente
npm run scheduler
```

---

## 📊 Monitoreo y Estadísticas

### Ver progreso en tiempo real:
```bash
npm run monitor
```

### Salida esperada:
```
📊 MONITOREO DE PROGRESO - POBLACIÓN DE LUGARES

🔢 TOTALES GENERALES:
   Total de lugares: 35,420
   Creados por admin: 116
   Descubiertos de OSM: 35,304
   Enriquecidos con Google: 2,700

📋 POR CATEGORÍA:
   Restaurante: 8,500 lugares (Rating: 4.2)
   Supermercado: 3,200 lugares
   Parque: 2,800 lugares
   ...

🏙️ POR CIUDAD:
   Bogotá: 15,000 lugares
   Medellín: 8,000 lugares
   Cali: 5,000 lugares
   ...

📈 CALIDAD DE DATOS:
   Con rating: 7.6%
   Con teléfono: 5.2%
   Con sitio web: 3.8%
   Con fotos: 4.1%
```

---

## 🎯 Estrategia de Enriquecimiento

### **Priorización Inteligente**

El script de enriquecimiento prioriza lugares por:
1. **Verificados** (verified: true)
2. **Mayor concurrencia** (más visitados)
3. **Mayor rating** (mejor calificados)

### **Límites Diarios**

| Servicio | Límite Gratuito | Uso Diario | Costo |
|----------|-----------------|------------|-------|
| OSM Overpass | Ilimitado* | ~2,000 peticiones | $0 |
| Google Places | 28,000/mes | 900/día | $0 |

*Con delay de 2 segundos entre peticiones

### **Proyección de Enriquecimiento**

- **Día 1**: 900 lugares enriquecidos
- **Semana 1**: 6,300 lugares enriquecidos
- **Mes 1**: ~25,000 lugares enriquecidos
- **Costo total**: $0

---

## 🔧 Solución de Problemas

### Error: "unable to find index for $geoNear query"
```bash
npm run create-geo-index
```

### Error 429: "Too Many Requests" (OSM)
- El script ya tiene delay de 2 segundos
- Si persiste, aumentar delay en `autoDiscoverPlaces.js`

### Error: "GOOGLE_PLACES_API_KEY not configured"
```bash
# Agregar al archivo .env
GOOGLE_PLACES_API_KEY=tu_api_key_aqui
```

### Script se detiene inesperadamente
```bash
# Usar PM2 para mantenerlo corriendo
pm2 start scripts/discover.js --name "bedic-discover"
pm2 logs bedic-discover
```

---

## 📈 Resultados Esperados

### **Al Finalizar Fase 1 (OSM)**
- 📍 30,000-50,000 lugares
- 🏙️ 20+ ciudades cubiertas
- 📋 15 categorías
- ⏱️ Tiempo: 3-4 horas
- 💰 Costo: $0

### **Al Finalizar Fase 2 (Google - 1 mes)**
- ⭐ ~25,000 lugares enriquecidos
- 📞 Teléfonos, horarios, sitios web
- 📸 Fotos oficiales
- ⭐ Ratings reales de usuarios
- 💰 Costo: $0

### **Con Mantenimiento Automático**
- 🔄 Actualización diaria
- 📈 Crecimiento constante
- 🆕 Nuevos lugares automáticamente
- 💰 Costo: $0/mes

---

## 💡 Mejores Prácticas

### **Para Usuarios de la App**
- Radio de búsqueda: 1-20 km ✅
- Pueden mover el pin a cualquier parte ✅
- Toda el área de la ciudad está cubierta ✅

### **Para Administradores**
- Ejecutar `npm run monitor` diariamente
- Revisar logs del scheduler
- Verificar calidad de datos enriquecidos

### **Para Desarrollo**
- No modificar radios de búsqueda (20km es óptimo)
- No reducir delay entre peticiones OSM
- Mantener límite de 900 peticiones/día Google

---

## 📞 Soporte y Recursos

### **APIs Utilizadas**
- OpenStreetMap Overpass: https://overpass-api.de/
- Google Places API: https://developers.google.com/maps/documentation/places/web-service

### **Documentación**
- OSM Tags: https://wiki.openstreetmap.org/wiki/Map_Features
- Google Places Fields: https://developers.google.com/maps/documentation/places/web-service/place-data-fields

### **Monitoreo**
- Panel Angular: `/dashboard/script-activity`
- Logs: `pm2 logs bedic-scheduler`
- Base de datos: Colección `ScriptActivity`

---

## 🎉 Estado Actual

✅ **Fase 1 en progreso**: ~20,000 lugares y subiendo
⏳ **Fase 2 pendiente**: Configurar Google Places API
⏳ **Fase 3 pendiente**: Activar scheduler

**Próximo paso**: Esperar a que termine el script OSM (~2 horas) y luego configurar Google Places API para enriquecimiento.

---

## 📊 Proyección Final

Con este sistema tendrás:
- 📍 **40,000+ lugares reales** en Colombia
- ⭐ **25,000+ con datos completos** (ratings, fotos, teléfonos)
- 🏙️ **Cobertura total** de ciudades principales
- 🔄 **Actualización automática** diaria
- 💰 **Costo: $0** (100% gratis)

**¡Tu base de datos será una de las más completas de lugares en Colombia!** 🇨🇴
