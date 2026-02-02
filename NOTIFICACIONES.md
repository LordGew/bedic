# 🔔 Sistema de Notificaciones BEDIC - 100% Autónomo

## 🎯 Objetivo

Proporcionar notificaciones en tiempo real y recomendaciones personalizadas **sin depender de servicios externos** como Firebase Cloud Messaging, OneSignal, etc.

---

## 📊 Arquitectura del Sistema

### **Componentes:**

```
┌──────────────────────────────────────────────────────────────┐
│  1. NOTIFICATION SCHEDULER (Backend)                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • Se ejecuta cada hora automáticamente                      │
│  • Analiza comportamiento de usuarios                        │
│  • Crea notificaciones personalizadas                        │
│  • Almacena en MongoDB                                       │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  2. API REST (Backend)                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Endpoints:                                                   │
│  • GET  /api/notifications/unread    - Notificaciones nuevas │
│  • GET  /api/notifications           - Todas las notif.      │
│  • PUT  /api/notifications/:id/read  - Marcar como leída     │
│  • GET  /api/announcements/latest    - Últimos anuncios      │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  3. FLUTTER APP (Polling Inteligente)                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • Consulta cada 30-60 segundos                              │
│  • Muestra badge con contador                                │
│  • Notificaciones locales (Flutter Local Notifications)      │
│  • Sin dependencias externas                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Notificaciones

### **1. Generación Automática (Backend):**

```javascript
// Cada hora, el scheduler:
1. Busca usuarios activos (últimos 7 días)
2. Analiza su comportamiento:
   - Categorías favoritas
   - Historial de búsquedas
   - Lugares guardados
3. Encuentra lugares relevantes
4. Crea notificación personalizada
5. Guarda en MongoDB
```

### **2. Consulta desde Flutter:**

```dart
// Cada 30-60 segundos:
Timer.periodic(Duration(seconds: 30), (_) async {
  final response = await http.get('/api/notifications/unread');
  if (response.data.length > 0) {
    // Mostrar badge
    // Mostrar notificación local
  }
});
```

### **3. Anuncios en Tiempo Real:**

```dart
// Ya implementado en Flutter (map_screen.dart):
Timer.periodic(Duration(seconds: 30), (_) {
  _loadAnnouncements(); // Actualiza anuncios automáticamente
});
```

---

## 📋 Tipos de Notificaciones

### **1. Recomendaciones Personalizadas:**

```json
{
  "type": "recommendation",
  "title": "🎯 Nuevo lugar que te puede interesar",
  "message": "Descubre Café del Parque - cafe. ¡Tiene 4.8 ⭐!",
  "data": {
    "placeId": "507f1f77bcf86cd799439011",
    "placeName": "Café del Parque",
    "placeCategory": "cafe",
    "placeRating": 4.8
  }
}
```

**Lógica:**
- Usuario busca "cafés" frecuentemente
- Sistema encuentra cafés nuevos o bien valorados
- Envía recomendación: "Porque buscaste cafés, quizás te interese..."

### **2. Nuevos Lugares:**

```json
{
  "type": "new_place",
  "title": "🆕 Nuevo lugar agregado",
  "message": "¡Descubre Restaurante La Costa en Barranquilla!",
  "data": {
    "placeId": "507f1f77bcf86cd799439012",
    "placeName": "Restaurante La Costa",
    "placeCategory": "restaurant"
  }
}
```

**Lógica:**
- Admin crea nuevo lugar en Angular
- Sistema notifica a usuarios interesados en esa categoría
- "Nuevo restaurante en tu ciudad"

### **3. Anuncios del Sistema:**

```json
{
  "type": "announcement",
  "title": "📢 Nuevo evento en BEDIC",
  "message": "Festival gastronómico este fin de semana",
  "isPinned": true
}
```

**Lógica:**
- Admin crea anuncio en Angular
- Flutter consulta cada 30s
- Se muestra automáticamente sin recargar

---

## 🛠️ Implementación

### **Backend (Ya implementado):**

#### **1. Notification Scheduler:**
```javascript
// backend/services/notificationScheduler.js
const notificationScheduler = require('./services/notificationScheduler');
notificationScheduler.start(); // Inicia automáticamente
```

**Funciones:**
- `sendSearchBasedRecommendations()` - Recomendaciones basadas en búsquedas
- `sendNewPlaceNotifications()` - Notifica nuevos lugares
- `cleanOldNotifications()` - Limpia notificaciones antiguas

#### **2. API Endpoints (Ya existen):**
```javascript
// GET /api/notifications/unread
// GET /api/notifications
// PUT /api/notifications/:id/read
// GET /api/announcements/latest
```

### **Flutter (Actualización necesaria):**

#### **1. Agregar Timer para Notificaciones:**

```dart
// lib/screens/map_screen.dart

Timer? _notificationTimer;

@override
void initState() {
  super.initState();
  
  // Timer para notificaciones (cada 30s)
  _notificationTimer = Timer.periodic(
    const Duration(seconds: 30),
    (_) => _checkNotifications(),
  );
}

@override
void dispose() {
  _notificationTimer?.cancel();
  super.dispose();
}

Future<void> _checkNotifications() async {
  try {
    final response = await http.get(
      Uri.parse('$baseUrl/api/notifications/unread'),
      headers: {'Authorization': 'Bearer $token'},
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final notifications = data['data'] as List;
      
      if (notifications.isNotEmpty) {
        setState(() {
          _unreadCount = notifications.length;
        });
        
        // Mostrar notificación local
        _showLocalNotification(notifications.first);
      }
    }
  } catch (e) {
    // Silenciar error
  }
}
```

#### **2. Agregar Badge de Notificaciones:**

```dart
// En el AppBar o FloatingActionButton
Badge(
  label: Text('$_unreadCount'),
  isLabelVisible: _unreadCount > 0,
  child: IconButton(
    icon: Icon(Icons.notifications),
    onPressed: () {
      // Navegar a pantalla de notificaciones
      Navigator.push(context, MaterialPageRoute(
        builder: (_) => NotificationsScreen(),
      ));
    },
  ),
)
```

---

## 📱 Notificaciones Locales (Flutter)

### **Dependencia:**
```yaml
dependencies:
  flutter_local_notifications: ^17.0.0
```

### **Configuración:**
```dart
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

Future<void> initNotifications() async {
  const AndroidInitializationSettings initializationSettingsAndroid =
      AndroidInitializationSettings('@mipmap/ic_launcher');
  
  const InitializationSettings initializationSettings =
      InitializationSettings(android: initializationSettingsAndroid);
  
  await flutterLocalNotificationsPlugin.initialize(initializationSettings);
}

Future<void> showNotification(String title, String body) async {
  const AndroidNotificationDetails androidDetails =
      AndroidNotificationDetails(
    'bedic_channel',
    'BEDIC Notifications',
    importance: Importance.high,
    priority: Priority.high,
  );
  
  const NotificationDetails details =
      NotificationDetails(android: androidDetails);
  
  await flutterLocalNotificationsPlugin.show(
    0,
    title,
    body,
    details,
  );
}
```

---

## 🎨 Interfaz de Usuario

### **1. Badge en Mapa:**
```dart
Stack(
  children: [
    IconButton(
      icon: Icon(Icons.notifications),
      onPressed: _showNotifications,
    ),
    if (_unreadCount > 0)
      Positioned(
        right: 0,
        top: 0,
        child: Container(
          padding: EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.red,
            shape: BoxShape.circle,
          ),
          child: Text(
            '$_unreadCount',
            style: TextStyle(color: Colors.white, fontSize: 10),
          ),
        ),
      ),
  ],
)
```

### **2. Lista de Notificaciones:**
```dart
ListView.builder(
  itemCount: notifications.length,
  itemBuilder: (context, index) {
    final notif = notifications[index];
    return ListTile(
      leading: Icon(_getIconForType(notif.type)),
      title: Text(notif.title),
      subtitle: Text(notif.message),
      trailing: !notif.read ? Icon(Icons.circle, size: 12, color: Colors.blue) : null,
      onTap: () => _handleNotificationTap(notif),
    );
  },
)
```

---

## ⚙️ Configuración de Usuario

### **Preferencias de Notificaciones:**

```dart
// Pantalla de configuración
SwitchListTile(
  title: Text('Recibir recomendaciones'),
  subtitle: Text('Te sugeriremos lugares basados en tus búsquedas'),
  value: _notificationsEnabled,
  onChanged: (value) async {
    await _updateNotificationSettings(value);
  },
)
```

### **API para actualizar preferencias:**
```javascript
// PUT /api/users/me/preferences
{
  "notificationsEnabled": true,
  "favoriteCategories": ["restaurant", "cafe"]
}
```

---

## 📊 Algoritmo de Recomendaciones

### **Lógica del Scheduler:**

```javascript
1. Obtener usuarios activos (últimos 7 días)
2. Para cada usuario:
   a. Obtener categorías favoritas
   b. Obtener historial de búsquedas
   c. Buscar lugares que coincidan:
      - Misma categoría
      - Rating >= 4.0
      - Verificados
      - No en favoritos del usuario
   d. Seleccionar lugar aleatorio de top 5
   e. Crear notificación personalizada
3. Enviar solo 1 notificación por usuario por día
```

### **Ejemplo de Mensaje:**

```
Usuario busca "cafés" frecuentemente
↓
Sistema encuentra: "Café del Bosque" (4.8⭐)
↓
Notificación: "🎯 Porque buscaste cafés, quizás te interese Café del Bosque"
```

---

## 🔧 Mantenimiento

### **Limpieza Automática:**
```javascript
// Cada hora, elimina notificaciones:
- Más de 30 días de antigüedad
- Ya leídas
```

### **Logs:**
```
📬 [NotificationScheduler] Procesando notificaciones...
📊 Usuarios activos: 45
📬 Notificación creada para usuario 123: Café del Parque
✅ Recomendaciones basadas en búsquedas enviadas
✅ [NotificationScheduler] Proceso completado
```

---

## 💡 Ventajas del Sistema

1. ✅ **100% Autónomo** - Sin Firebase, OneSignal, etc.
2. ✅ **Sin Costos** - No pagamos servicios externos
3. ✅ **Personalizado** - Algoritmo propio de recomendaciones
4. ✅ **Privacidad** - Datos no salen de nuestro servidor
5. ✅ **Escalable** - Funciona con 100 o 10,000 usuarios
6. ✅ **Multiplataforma** - Web y móvil
7. ✅ **Bajo Consumo** - Polling cada 30s es eficiente

---

## 🚀 Próximos Pasos

### **Para Implementar:**

1. ✅ **Backend** - Ya implementado
2. ⏳ **Flutter** - Agregar Timer y Badge
3. ⏳ **Notificaciones Locales** - Instalar paquete
4. ⏳ **Pantalla de Notificaciones** - Crear UI

### **Código a Agregar en Flutter:**

```dart
// 1. Agregar dependencia
flutter_local_notifications: ^17.0.0

// 2. Agregar Timer en map_screen.dart
_notificationTimer = Timer.periodic(Duration(seconds: 30), ...);

// 3. Crear NotificationsScreen
// 4. Agregar Badge en AppBar
```

---

## 📝 Resumen

**Sistema Completo:**
- ✅ Scheduler automático (cada hora)
- ✅ API REST para consultas
- ✅ Polling inteligente (cada 30s)
- ✅ Anuncios en tiempo real (ya funciona)
- ⏳ Notificaciones locales (por implementar en Flutter)

**Sin dependencias externas:**
- ❌ Firebase Cloud Messaging
- ❌ OneSignal
- ❌ Pusher
- ❌ WebSockets externos

**Todo es nuestro:**
- ✅ Algoritmo de recomendaciones
- ✅ Base de datos de notificaciones
- ✅ Sistema de polling
- ✅ Control total
