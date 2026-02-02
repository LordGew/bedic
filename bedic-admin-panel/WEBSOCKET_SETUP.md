# WebSocket Setup - Panel Angular BEDIC

## 📦 INSTALACIÓN

### 1. Instalar dependencias en Angular

```bash
cd bedic-admin-panel
npm install socket.io-client
npm install --save-dev @types/socket.io-client
```

### 2. Instalar dependencias en Backend

```bash
cd backend
npm install socket.io
```

---

## 🔧 CONFIGURACIÓN

### Backend (server.js)
```javascript
const http = require('http');
const WebSocketService = require('./services/websocket.service');

const server = http.createServer(app);
const wsService = new WebSocketService(server);
global.wsService = wsService;

server.listen(PORT, HOST);
```

### Angular (app.component.ts)
```typescript
import { WebSocketService } from './core/services/websocket.service';
import { AuthService } from './core/services/auth.service';

export class AppComponent implements OnInit {
  constructor(
    private wsService: WebSocketService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.wsService.connect(user.id, user.role, user.token);
    }
  }
}
```

---

## 📡 EVENTOS DISPONIBLES

### Reportes
```
report:new          - Nuevo reporte creado
report:updated      - Reporte actualizado
report:moderated    - Reporte moderado
```

### Lugares
```
place:new           - Nuevo lugar creado
place:updated       - Lugar actualizado
place:verified      - Lugar verificado
place:deleted       - Lugar eliminado
```

### Usuarios
```
user:muted          - Usuario silenciado
user:banned         - Usuario baneado
user:sanctioned     - Sanción aplicada
```

---

## 🎯 USO EN COMPONENTES

### Escuchar eventos

```typescript
import { WebSocketService } from '../core/services/websocket.service';

export class ModerationFeedComponent implements OnInit {
  constructor(private wsService: WebSocketService) {}

  ngOnInit() {
    // Escuchar nuevos reportes
    this.wsService.getReportCreated$().subscribe(report => {
      if (report) {
        console.log('Nuevo reporte:', report);
        // Actualizar tabla
      }
    });

    // Escuchar reportes moderados
    this.wsService.getReportModerated$().subscribe(data => {
      if (data) {
        console.log('Reporte moderado:', data);
        // Actualizar tabla
      }
    });
  }
}
```

### Emitir eventos

```typescript
// Cuando se modera un reporte
this.wsService.emitReportModerated({
  reportId: report.id,
  status: 'verified',
  action: 'mute',
  moderatorId: currentUser.id,
  reportedUserId: report.reportedUserId
});
```

---

## 🔔 NOTIFICACIONES

### Escuchar notificaciones

```typescript
this.wsService.getNotifications$().subscribe(notifications => {
  console.log('Notificaciones:', notifications);
});
```

### Marcar como leída

```typescript
this.wsService.markNotificationAsRead(notificationId);
```

### Estado de conexión

```typescript
this.wsService.getConnectionStatus$().subscribe(connected => {
  console.log('Conectado:', connected);
});
```

---

## 🧪 TESTING

### Verificar conexión

```bash
# En DevTools Console
const ws = new WebSocket('ws://localhost:5000');
ws.onopen = () => console.log('✅ Conectado');
ws.onerror = (err) => console.log('❌ Error:', err);
```

### Emitir evento de prueba

```bash
# En DevTools Console
socket.emit('report:created', {
  id: '1',
  type: 'comment',
  reason: 'Test',
  severity: 'moderado'
});
```

---

## 📊 ARQUITECTURA

```
┌─────────────────────────────────────────┐
│         Angular App                     │
│  ┌───────────────────────────────────┐  │
│  │   WebSocketService                │  │
│  │  - connect()                      │  │
│  │  - disconnect()                   │  │
│  │  - emit events                    │  │
│  │  - listen events                  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↕ WebSocket
┌─────────────────────────────────────────┐
│         Node.js Backend                 │
│  ┌───────────────────────────────────┐  │
│  │   WebSocketService                │  │
│  │  - Socket.io server               │  │
│  │  - Event handlers                 │  │
│  │  - Room management                │  │
│  │  - Broadcast events               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↕ REST API
┌─────────────────────────────────────────┐
│         MongoDB                         │
│  - Reports                              │
│  - Places                               │
│  - Users                                │
│  - Notifications                        │
└─────────────────────────────────────────┘
```

---

## 🔐 SEGURIDAD

### Autenticación
```typescript
// Socket.io valida JWT token
this.socket = io(this.wsUrl, {
  auth: {
    token,      // JWT token
    userId,     // User ID
    role        // User role
  }
});
```

### Autorización
```javascript
// Backend valida rol
this.io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Validar token y rol
  next();
});
```

### Salas privadas
```javascript
// Cada usuario en su sala
socket.join(`user:${userId}`);

// Cada rol en su sala
socket.join(`role:${role}`);
```

---

## 📈 MONITOREO

### Usuarios conectados
```typescript
const users = this.wsService.getConnectionStats();
console.log('Conectados:', users);
```

### Eventos por segundo
```javascript
// Backend
const eventCount = {};
socket.on('*', (event) => {
  eventCount[event] = (eventCount[event] || 0) + 1;
});
```

---

## 🐛 TROUBLESHOOTING

### WebSocket no conecta
1. Verificar que backend está corriendo: `http://localhost:5000`
2. Verificar CORS en backend
3. Revisar logs del navegador (DevTools Console)

### Eventos no se reciben
1. Verificar que usuario está autenticado
2. Verificar que rol es correcto
3. Revisar logs del backend

### Desconexiones frecuentes
1. Aumentar `reconnectionAttempts`
2. Revisar logs del servidor
3. Verificar conexión de red

---

## 📝 PRÓXIMOS PASOS

1. ✅ WebSocket Service creado
2. ✅ Backend WebSocket implementado
3. ⏳ Conectar componentes con eventos
4. ⏳ Crear componente de notificaciones
5. ⏳ Testing de eventos en tiempo real

---

**Última actualización**: Nov 27, 2025  
**Versión**: 1.0  
**Estado**: Listo para usar
