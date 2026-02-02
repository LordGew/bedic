# 📊 ALGORITMO DE RECOMENDACIÓN - BEDIC

## 🎯 Objetivo
Proporcionar recomendaciones personalizadas de lugares basadas en el comportamiento histórico del usuario, sus preferencias de categorías, distancias de búsqueda y patrones temporales.

---

## 🏗️ Arquitectura del Sistema

### **Backend** (Node.js + MongoDB)
- **Modelo**: `Recommendation.js`
- **Servicio**: `recommendationService.js`
- **Controlador**: `recommendation.controller.js`

### **Frontend** (Flutter)
- **Servicio**: `recommendation_service.dart`
- **Implementación**: `map_screen.dart` (líneas 105-172)

---

## 🔄 Flujo de Funcionamiento

### **1. Captura de Interacciones**

Cuando el usuario interactúa con un lugar (lo ve, lo selecciona, navega a sus detalles), se registra:

```dart
// Flutter: map_screen.dart línea 910-916
await _placeService.sendInteraction(
  category: place.category,    // Ej: "Restaurante", "Parque"
  distance: distanceMeters,     // Distancia del usuario al lugar
);
```

**Datos capturados:**
- `category`: Categoría del lugar (Restaurante, Bar, Parque, etc.)
- `distance`: Distancia en metros desde la ubicación del usuario
- `time`: Timestamp de la interacción (automático)

---

### **2. Actualización de Preferencias (Backend)**

**Archivo**: `backend/controllers/recommendation.controller.js`

```javascript
exports.updateUserPreferences = async (userId, data) => {
  const { category, distance, time } = data;
  
  // 1. CATEGORÍAS (líneas 72-88)
  // - Si la categoría ya existe, se mueve al frente (más prioridad)
  // - Si es nueva, se añade al inicio
  // - Se mantienen máximo 12 categorías
  prefs.categories.unshift(category);
  
  // 2. PATRONES TEMPORALES (líneas 90-96)
  // - Se clasifica el horario: morning/afternoon/evening/night
  // - Se incrementa la frecuencia del período
  const period = getTimePeriod(time);
  item.frequency += 1;
  
  // 3. DISTANCIA PROMEDIO (líneas 98-103)
  // - Media suavizada: 70% histórico + 30% nueva interacción
  prefs.avgDistance = prev * 0.7 + distance * 0.3;
}
```

**Clasificación de períodos temporales:**
- `morning` (6:00 - 11:59)
- `afternoon` (12:00 - 17:59)
- `evening` (18:00 - 23:59)
- `night` (0:00 - 5:59)

---

### **3. Generación de Recomendaciones**

**Archivo**: `backend/controllers/recommendation.controller.js`

```javascript
exports.getUserRecommendations = async (userId) => {
  const rec = await Recommendation.findOne({ user: userId });
  
  return {
    preferredCategories: prefs.categories.slice(0, 5),  // Top 5 categorías
    avgDistance: prefs.avgDistance || 1000,             // Distancia promedio
    activeTime: getDominantPeriod(prefs.timePatterns)   // Período más activo
  };
}
```

---

### **4. Uso en el Frontend**

**Archivo**: `flutter_app/lib/screens/map_screen.dart`

```dart
Future<void> _loadRecommendations() async {
  // PRIORIDAD 1: Filtros manuales del usuario
  if (_selectedCategories.isNotEmpty) {
    data = await _placeService.searchPlaces(
      categories: _selectedCategories,
      radius: _selectedRadiusKm * 1000,
    );
    return;
  }
  
  // PRIORIDAD 2: Preferencias del backend (historial)
  final reco = await _recommendationService.getRecommendations();
  final preferred = reco['preferredCategories'];
  
  if (preferred.isNotEmpty) {
    data = await _placeService.searchPlaces(
      categories: preferred,
      radius: _selectedRadiusKm * 1000,
    );
    _recommendationCategory = preferred.first; // Para mostrar mensaje
    return;
  }
  
  // PRIORIDAD 3: Lugares cercanos generales (fallback)
  data = await _placeService.searchPlaces(
    radius: _selectedRadiusKm * 1000,
  );
}
```

---

## 📈 Ejemplo Práctico

### **Escenario:**
Usuario visita 3 restaurantes y 2 parques en diferentes momentos.

### **Interacciones registradas:**
```
1. Restaurante "La Puerta Falsa" - 500m - 14:30 (afternoon)
2. Parque "Simón Bolívar" - 2000m - 10:00 (morning)
3. Restaurante "Andrés Carne de Res" - 1500m - 20:00 (evening)
4. Parque "93" - 800m - 11:00 (morning)
5. Restaurante "Leo Cocina" - 1200m - 19:30 (evening)
```

### **Preferencias resultantes:**

**Categorías** (ordenadas por recencia):
```
1. Restaurante (última interacción)
2. Parque
```

**Patrones temporales:**
```
- morning: 2 veces
- afternoon: 1 vez
- evening: 2 veces
```
**Período dominante**: `morning` o `evening` (empate, se toma el primero encontrado)

**Distancia promedio:**
```
Cálculo suavizado:
- Inicial: 500m
- +2000m: 500*0.7 + 2000*0.3 = 950m
- +1500m: 950*0.7 + 1500*0.3 = 1115m
- +800m: 1115*0.7 + 800*0.3 = 1020.5m
- +1200m: 1020.5*0.7 + 1200*0.3 = 1074.35m

Resultado: ~1074 metros
```

### **Recomendaciones generadas:**
```json
{
  "preferredCategories": ["Restaurante", "Parque"],
  "avgDistance": 1074,
  "activeTime": "morning"
}
```

### **Resultado en la UI:**
El usuario verá en el mapa:
> "Porque sueles buscar **Restaurante**, quizá te interesen estos lugares"

Y se mostrarán restaurantes en un radio de ~1km de su ubicación actual.

---

## 🎨 Ventajas del Algoritmo

✅ **Personalización progresiva**: Mejora con cada interacción  
✅ **Suavizado exponencial**: Evita cambios bruscos por interacciones aisladas  
✅ **Prioridad por recencia**: Las categorías recientes tienen más peso  
✅ **Fallback inteligente**: Siempre muestra algo, incluso sin historial  
✅ **Respeta filtros manuales**: El usuario siempre tiene control  

---
¨😊¨¨
## 🔧 Posibles Mejoras

### **1. Ponderación por rating**
Dar más peso a lugares con mejor calificación:
```javascript
const weight = place.rating / 5.0;
prefs.categoryWeight[category] += weight;
```

### **2. Decay temporal**
Reducir el peso de interacciones antiguas:
```javascript
const daysSince = (now - interaction.time) / (1000 * 60 * 60 * 24);
const decay = Math.exp(-daysSince / 30); // Decae en 30 días
```

### **3. Collaborative filtering**
Recomendar basado en usuarios similares:
```javascript
const similarUsers = findSimilarUsers(userId);
const theirPreferences = aggregatePreferences(similarUsers);
```

### **4. Contexto geográfico**
Ajustar recomendaciones según la zona:
```javascript
if (userInTouristArea) {
  boostCategories(['Museos', 'Monumentos', 'Restaurantes']);
}
```

### **5. Eventos y temporadas**
Priorizar lugares con eventos activos:
```javascript
if (place.hasUpcomingEvents) {
  score *= 1.5;
}
```

---

## 📊 Métricas de Éxito

Para evaluar la efectividad del algoritmo:

1. **Click-through rate (CTR)**: % de recomendaciones en las que el usuario hace clic
2. **Tiempo de interacción**: Cuánto tiempo pasa el usuario en lugares recomendados
3. **Conversión**: % de recomendaciones que resultan en visitas reales
4. **Diversidad**: Variedad de categorías recomendadas (evitar monotonía)

---

## 🔐 Privacidad

- Los datos se almacenan de forma agregada (no se guardan lugares específicos visitados)
- El usuario puede borrar su historial desde el perfil
- Las preferencias se sincronizan entre dispositivos con el mismo usuario

---

## 📝 Notas de Implementación

- **Sincronización**: Las preferencias se guardan localmente (SharedPreferences) y se sincronizan con el backend
- **Offline-first**: Si no hay conexión, se usan las preferencias locales
- **Límite de historial**: Se mantienen máximo 30 interacciones locales para evitar uso excesivo de memoria
