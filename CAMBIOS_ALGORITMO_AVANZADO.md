# 🚀 ALGORITMO BEDIC 2.0 - IMPLEMENTACIÓN COMPLETA

## ✅ **CAMBIOS IMPLEMENTADOS**

---

## 📊 **PARTE 1: BACKEND - ALGORITMO AVANZADO**

### **1. Nuevo Modelo: UserEngagement**
**Archivo:** `backend/models/UserEngagement.js`

**Propósito:** Rastrear todas las interacciones del usuario con los lugares

**Eventos Capturados:**
```javascript
{
  VIEW: 1,              // Vio el lugar en el mapa
  POPUP_OPEN: 2,        // Abrió el popup
  DETAIL_VIEW: 5,       // Vio detalles completos
  PHOTO_VIEW: 3,        // Vio fotos
  SHARE: 8,             // Compartió
  RATING: 10,           // Calificó
  REVIEW: 15,           // Dejó reseña
  SAVE: 12,             // Guardó en favoritos
  NAVIGATE: 20,         // Navegó hacia el lugar
  SKIP: -2,             // Cerró rápido (< 3 segundos)
  HIDE: -5              // Ocultó el lugar
}
```

**Campos:**
- `totalPoints`: Puntos acumulados de engagement
- `events`: Contador de cada tipo de evento
- `totalTimeSpent`: Tiempo total de interacción (segundos)
- `lastInteraction`: Última vez que interactuó

---

### **2. Servicio Avanzado de Recomendaciones**
**Archivo:** `backend/services/advancedRecommendationService.js`

#### **Función Principal: `calculatePlaceScore()`**

Calcula un score de 0 a 1 para cada lugar basado en 6 factores:

```javascript
score = 
  (Afinidad de Categoría × 0.40) +      // 40%
  (Engagement Histórico × 0.25) +       // 25%
  (Rating del Lugar × 0.15) +           // 15%
  (Distancia Óptima × 0.10) +           // 10%
  (Novedad × 0.05) +                    // 5%
  (Contexto Temporal × 0.05)            // 5%
```

**Detalles de cada factor:**

1. **Afinidad de Categoría (40%)**
   - Más peso a categorías visitadas recientemente
   - Las 12 categorías más recientes se consideran
   - Decay por posición: categoría #1 = 100%, #12 = 8%

2. **Engagement Histórico (25%)**
   - Basado en puntos acumulados de interacciones previas
   - Máximo 100 puntos = 100% del factor
   - Incluye tiempo de interacción como bonus

3. **Rating del Lugar (15%)**
   - Rating de 5 estrellas = 100%
   - Rating de 0 estrellas = 0%

4. **Distancia Óptima (10%)**
   - Compara distancia del lugar vs distancia promedio del usuario
   - Menor diferencia = mayor score
   - Penaliza lugares muy lejos o muy cerca de lo usual

5. **Novedad (5%)**
   - Bonus para lugares no visitados o con poco engagement
   - Fomenta la exploración

6. **Contexto Temporal (5%)**
   - Bonus si el horario actual coincide con el período más activo del usuario
   - Períodos: morning, afternoon, evening, night

#### **Función: `getAdvancedRecommendations()`**

**Estrategia 80/20 (Exploración vs Explotación):**

```javascript
// 80% Explotación: Lo que le gusta al usuario
const exploitCount = Math.floor(count * 0.8);
// Busca lugares con alto score
// Ordena por score descendente

// 20% Exploración: Cosas nuevas
const exploreCount = count - exploitCount;
// Busca categorías no exploradas
// Selección aleatoria
```

**Diversidad Forzada:**
- Máximo 3 lugares de la misma categoría seguidos
- Cada 5 lugares, intenta diversificar con otra categoría

**Decay Temporal:**
- Las preferencias decaen exponencialmente en 30 días
- Fórmula: `decay = exp(-daysSince / 30)`
- Mantiene el algoritmo actualizado con gustos recientes

---

### **3. Controlador de Recomendaciones Avanzadas**
**Archivo:** `backend/controllers/advancedRecommendation.controller.js`

**Endpoints Nuevos:**

#### **POST `/api/recommendations/track`**
Registra un evento de engagement

**Request:**
```json
{
  "placeId": "507f1f77bcf86cd799439011",
  "eventType": "DETAIL_VIEW",
  "duration": 45
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "points": 50
  }
}
```

#### **GET `/api/recommendations/advanced`**
Obtiene recomendaciones personalizadas avanzadas

**Query Params:**
- `lat`: Latitud (requerido)
- `lon`: Longitud (requerido)
- `radius`: Radio en metros (default: 5000)
- `count`: Cantidad de resultados (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Restaurante La Puerta Falsa",
      "category": "Restaurante",
      "rating": 4.5,
      "_score": 0.85,
      "_isExploration": false
    }
  ],
  "meta": {
    "count": 20,
    "location": { "lat": 4.6097, "lon": -74.0817 },
    "radius": 5000
  }
}
```

#### **GET `/api/recommendations/engagement-stats`**
Obtiene estadísticas de engagement del usuario

**Response:**
```json
{
  "success": true,
  "data": {
    "byCategory": {
      "Restaurante": 150,
      "Cafetería": 80,
      "Bar": 45
    }
  }
}
```

---

### **4. Rutas Actualizadas**
**Archivo:** `backend/routes/recommendation.routes.js`

```javascript
// Nuevas rutas añadidas:
router.post('/track', protect, trackUserEngagement);
router.get('/advanced', protect, getPersonalizedRecommendations);
router.get('/engagement-stats', protect, getEngagementStats);
```

---

## 📱 **PARTE 2: FRONTEND - UX MEJORADA**

### **1. Servicio de Recomendaciones Actualizado**
**Archivo:** `flutter_app/lib/services/recommendation_service.dart`

**Nuevos Métodos:**

#### **`trackEngagement()`**
```dart
await recommendationService.trackEngagement(
  placeId,
  'DETAIL_VIEW',
  duration: 45,
);
```

#### **`getAdvancedRecommendations()`**
```dart
final recommendations = await recommendationService.getAdvancedRecommendations(
  lat: 4.6097,
  lon: -74.0817,
  radius: 5000,
  count: 20,
);
```

#### **`getEngagementStats()`**
```dart
final stats = await recommendationService.getEngagementStats();
// { "byCategory": { "Restaurante": 150, ... } }
```

---

### **2. Mapa Mejorado (Sin Clusters)**
**Archivo:** `flutter_app/lib/screens/map_screen.dart`

#### **Cambios Visuales:**

**ANTES:**
- ❌ Clusters que agrupan lugares
- ❌ Click en cluster → zoom → ver lugares
- ❌ No se ve el radio de búsqueda
- ❌ Confuso con múltiples niveles de zoom

**AHORA:**
- ✅ Marcadores individuales directos
- ✅ Click en marcador → popup inmediato
- ✅ Círculo visible mostrando el radio de búsqueda
- ✅ UX más clara y directa

**Código del Círculo de Radio:**
```dart
CircleLayer(
  circles: [
    CircleMarker(
      point: LatLng(_userPos!.latitude, _userPos!.longitude),
      radius: _selectedRadiusKm * 1000, // metros
      useRadiusInMeter: true,
      color: neon.withOpacity(0.1),
      borderColor: neon.withOpacity(0.4),
      borderStrokeWidth: 2,
    ),
  ],
),
```

**Código de Marcadores Individuales:**
```dart
MarkerLayer(
  markers: _results.map((p) => Marker(
    width: 40,
    height: 40,
    point: LatLng(p.latitude, p.longitude),
    child: GestureDetector(
      onTap: () {
        // Track engagement
        _recommendationService.trackEngagement(p.id, 'POPUP_OPEN');
        _placeViewStartTime = DateTime.now();
        
        setState(() {
          _selectedPlace = p;
        });
      },
      child: _neonPulse(neon: neon),
    ),
  )).toList(),
),
```

---

### **3. Recomendaciones Automáticas al Entrar**

**Comportamiento:**
1. Usuario abre la app
2. Da permiso de ubicación
3. **AUTOMÁTICAMENTE** se cargan y muestran recomendaciones personalizadas
4. No necesita tocar filtros ni buscar nada

**Código:**
```dart
// En _loadInitialData()
if (!_autoLoadedRecommendations) {
  _autoLoadedRecommendations = true;
  _loadRecommendations();
}
```

**Función `_loadRecommendations()` actualizada:**
```dart
Future<void> _loadRecommendations() async {
  // NUEVO: Usar algoritmo avanzado
  final advancedRecs = await _recommendationService.getAdvancedRecommendations(
    lat: center.latitude,
    lon: center.longitude,
    radius: _selectedRadiusKm * 1000,
    count: 20,
  );
  
  if (advancedRecs.isNotEmpty) {
    final places = advancedRecs.map((json) => Place.fromJson(json)).toList();
    setState(() {
      _recommended = places.take(6).toList();
      _recommendationCategory = places.first.category;
    });
    return;
  }
  
  // Fallback a lógica anterior si no hay recomendaciones avanzadas
}
```

---

### **4. Tracking de Engagement Completo**

**Eventos Rastreados Automáticamente:**

1. **VIEW** - Cuando el usuario ve un lugar en la lista de recomendaciones
```dart
_recommendationService.trackEngagement(place.id, 'VIEW');
```

2. **POPUP_OPEN** - Cuando hace click en un marcador del mapa
```dart
_recommendationService.trackEngagement(p.id, 'POPUP_OPEN');
_placeViewStartTime = DateTime.now();
```

3. **DETAIL_VIEW** - Cuando abre los detalles completos
```dart
final duration = DateTime.now().difference(_placeViewStartTime!).inSeconds;
_recommendationService.trackEngagement(
  place.id,
  'DETAIL_VIEW',
  duration: duration,
);
```

**Flujo Completo:**
```
Usuario ve lugar en lista → VIEW (1 punto)
    ↓
Click en marcador → POPUP_OPEN (2 puntos)
    ↓
Ve popup 30 segundos → +5 puntos (tiempo)
    ↓
Click "Ver más" → DETAIL_VIEW (5 puntos)
    ↓
Total: 13 puntos de engagement
```

---

## 🎯 **COMPARACIÓN: ANTES VS AHORA**

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Recomendaciones** | Manual (filtros) | Automáticas al entrar |
| **Personalización** | Básica (3 factores) | Avanzada (6 factores) |
| **Tracking** | Solo visitas | 10+ tipos de eventos |
| **Exploración** | No existe | 20% automático |
| **Diversidad** | No controlada | Máx 3 por categoría |
| **Decay temporal** | No | Sí (30 días) |
| **Mapa** | Clusters confusos | Marcadores directos |
| **Radio visible** | No | Sí (círculo) |
| **UX** | 2-3 clicks por lugar | 1 click directo |
| **Aprendizaje** | Lento | Rápido (múltiples eventos) |

---

## 📊 **EJEMPLO DE USO REAL**

### **Escenario: Usuario Nuevo**

**Día 1 - Primera Sesión:**
1. Abre la app → Permiso de ubicación
2. **AUTOMÁTICAMENTE** ve 6 recomendaciones generales
3. Click en "Restaurante La Puerta Falsa" → +2 puntos (POPUP_OPEN)
4. Ve popup 15 segundos → +2.5 puntos (tiempo)
5. Click "Ver más" → +5 puntos (DETAIL_VIEW)
6. **Total: 9.5 puntos en Restaurante**

**Día 2 - Segunda Sesión:**
1. Abre la app
2. **AUTOMÁTICAMENTE** ve recomendaciones:
   - 80% Restaurantes (porque tiene engagement)
   - 20% Categorías nuevas (exploración)
3. Ve "Cafetería Juan Valdez" → +1 punto (VIEW)
4. Click → +2 puntos (POPUP_OPEN)
5. **Total: 3 puntos en Cafetería**

**Día 3 - Tercera Sesión:**
1. Abre la app
2. **AUTOMÁTICAMENTE** ve recomendaciones:
   - 4 Restaurantes (mayor engagement)
   - 1 Cafetería (engagement medio)
   - 1 Parque (exploración)

**Resultado:** El algoritmo aprende rápido y personaliza en tiempo real.

---

## 🔧 **CONFIGURACIÓN Y USO**

### **Backend:**
```bash
# Ya está corriendo en http://localhost:5000
# Los nuevos endpoints están disponibles automáticamente
```

### **Frontend:**
```bash
# Ejecutar con:
flutter run -d edge

# O desde VS Code: F5
```

### **Probar el Algoritmo:**

1. **Inicia sesión** en la app
2. **Observa** las recomendaciones automáticas al entrar
3. **Interactúa** con varios lugares:
   - Haz click en marcadores
   - Abre detalles
   - Pasa tiempo viéndolos
4. **Cierra y vuelve a abrir** la app
5. **Verás** recomendaciones personalizadas basadas en tu comportamiento

---

## 💡 **VENTAJAS DEL NUEVO SISTEMA**

### **Para el Usuario:**
- ✅ No necesita buscar ni filtrar manualmente
- ✅ Ve lugares relevantes inmediatamente
- ✅ Descubre nuevos lugares automáticamente (20% exploración)
- ✅ UX más clara sin clusters confusos
- ✅ Ve el radio de búsqueda visualmente

### **Para el Negocio:**
- ✅ Mayor engagement (más interacciones rastreadas)
- ✅ Datos ricos para análisis
- ✅ Personalización que mejora retención
- ✅ Exploración que aumenta descubrimiento
- ✅ Sistema escalable y mantenible

### **Para el Desarrollo:**
- ✅ Código modular y bien documentado
- ✅ Fácil añadir nuevos tipos de eventos
- ✅ Fácil ajustar pesos de factores
- ✅ Métricas claras para optimizar

---

## 🚀 **PRÓXIMAS MEJORAS SUGERIDAS**

1. **Collaborative Filtering**
   - "Usuarios como tú también visitaron..."
   - Requiere: Análisis de similitud entre usuarios

2. **Contexto Geográfico**
   - Detectar zonas turísticas vs residenciales
   - Ajustar recomendaciones según el contexto

3. **Eventos y Temporadas**
   - Priorizar lugares con eventos activos
   - Ajustar por temporada (verano, navidad, etc.)

4. **Machine Learning**
   - Entrenar modelo con datos históricos
   - Predicción más precisa de preferencias

5. **A/B Testing**
   - Probar diferentes pesos de factores
   - Optimizar basado en métricas reales

---

## 📝 **ARCHIVOS MODIFICADOS/CREADOS**

### **Backend (5 archivos):**
1. ✅ `models/UserEngagement.js` (nuevo)
2. ✅ `services/advancedRecommendationService.js` (nuevo)
3. ✅ `controllers/advancedRecommendation.controller.js` (nuevo)
4. ✅ `routes/recommendation.routes.js` (modificado)

### **Frontend (2 archivos):**
1. ✅ `lib/services/recommendation_service.dart` (modificado)
2. ✅ `lib/screens/map_screen.dart` (modificado)

### **Documentación (1 archivo):**
1. ✅ `CAMBIOS_ALGORITMO_AVANZADO.md` (este archivo)

---

**¡El algoritmo estilo TikTok está completamente implementado y funcionando! 🎉**
