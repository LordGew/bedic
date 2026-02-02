# Integración Backend - Panel Angular BEDIC

## ✅ COMPLETADO

### Archivos Creados/Actualizados

#### Backend
- ✅ `backend/routes/admin-extended.routes.js` - Nuevas rutas para el panel Angular
- ✅ `backend/server.js` - Actualizado para montar las nuevas rutas

#### Angular
- ✅ `bedic-admin-panel/src/app/core/services/admin.service.ts` - Actualizado con todos los métodos

---

## 📋 ENDPOINTS DISPONIBLES

### STATS
```
GET /api/admin/stats/overview
- Retorna estadísticas generales del sistema
- Requiere: JWT token, rol: admin/moderator/support_agent
```

### MODERATION
```
GET /api/admin/moderation/feed
- Retorna lista de reportes
- Query params: type, status, severity, page, limit
- Requiere: JWT token, rol: admin/moderator

GET /api/admin/reports/:id
- Retorna detalle de un reporte
- Requiere: JWT token, rol: admin/moderator

PUT /api/admin/reports/:id/moderate
- Modera un reporte
- Body: { status, action, note }
- Requiere: JWT token, rol: admin/moderator
```

### PLACES
```
GET /api/admin/places
- Retorna lista de lugares
- Query params: category, verified, page, limit
- Requiere: JWT token, rol: admin/support_agent

GET /api/admin/places/:id
- Retorna detalle de un lugar
- Requiere: JWT token, rol: admin/support_agent

POST /api/admin/places
- Crea un nuevo lugar
- Body: { name, description, category, location }
- Requiere: JWT token, rol: admin/support_agent

PUT /api/admin/places/:id
- Actualiza un lugar
- Body: { name, description, category, location }
- Requiere: JWT token, rol: admin/support_agent

POST /api/admin/places/:id/images
- Sube una imagen a un lugar
- Body: FormData con archivo 'image'
- Requiere: JWT token, rol: admin/support_agent

DELETE /api/admin/places/:placeId/images/:imageId
- Elimina una imagen de un lugar
- Requiere: JWT token, rol: admin/support_agent

PUT /api/admin/places/:placeId/images/:imageId/main
- Establece una imagen como principal
- Requiere: JWT token, rol: admin/support_agent

PUT /api/admin/places/:id/verify
- Verifica un lugar
- Requiere: JWT token, rol: admin

DELETE /api/admin/places/:id
- Elimina un lugar
- Requiere: JWT token, rol: admin
```

### REPORTS
```
GET /api/admin/reports/stats
- Retorna estadísticas de reportes
- Query params: type, status, severity, startDate, endDate
- Requiere: JWT token, rol: admin/moderator

GET /api/admin/reports/export
- Exporta reportes
- Query params: format (csv|excel|pdf), type, status, severity, startDate, endDate
- Requiere: JWT token, rol: admin/moderator
- Retorna: Blob (archivo descargable)
```

### USERS
```
GET /api/admin/users
- Retorna lista de usuarios
- Query params: search, role, page, limit
- Requiere: JWT token, rol: admin/support_agent

GET /api/admin/users/:id
- Retorna detalle de un usuario
- Requiere: JWT token, rol: admin/support_agent

PUT /api/admin/users/:id/mute
- Silencia un usuario
- Body: { hours }
- Requiere: JWT token, rol: admin/moderator

DELETE /api/admin/users/:id
- Elimina un usuario
- Requiere: JWT token, rol: admin
```

---

## 🔧 CÓMO USAR

### 1. Iniciar Backend
```bash
cd backend
npm install
npm start
```

El servidor estará en: `http://localhost:5000`

### 2. Iniciar Angular
```bash
cd bedic-admin-panel
npm install
ng serve --open
```

La aplicación estará en: `http://localhost:4200`

### 3. Autenticarse
```
Email: admin@bedic.com
Password: admin123
```

---

## 📊 ESTRUCTURA DE DATOS

### Report
```javascript
{
  id: string,
  type: 'comment' | 'rating' | 'place',
  userId: string,
  userName: string,
  userAvatar?: string,
  reportedUserId: string,
  reportedUserName: string,
  reason: string,
  content: string,
  createdAt: Date,
  status: 'pending' | 'verified' | 'rejected',
  severity: 'leve' | 'moderado' | 'severo',
  actionTaken?: string
}
```

### Place
```javascript
{
  id: string,
  name: string,
  description: string,
  category: string,
  location: {
    latitude: number,
    longitude: number,
    address: string
  },
  images: Array<{
    id: string,
    url: string,
    isMain: boolean,
    uploadedAt: Date
  }>,
  verified: boolean,
  rating: number,
  reviewCount: number,
  createdAt: Date,
  updatedAt: Date
}
```

### User
```javascript
{
  id: string,
  username: string,
  email: string,
  role: string,
  status: 'active' | 'inactive' | 'banned',
  createdAt: Date,
  reportCount: number,
  isMuted: boolean,
  isBanned: boolean,
  sanctions: Array
}
```

---

## 🔐 AUTENTICACIÓN

### JWT Token
```
Header: Authorization: Bearer <token>
```

### Roles
- `admin` - Acceso total
- `moderator` - Moderación de reportes
- `support_agent` - Soporte a usuarios

### Permisos por Rol

| Acción | Admin | Moderator | Support Agent |
|--------|-------|-----------|---------------|
| Ver reportes | ✅ | ✅ | ❌ |
| Moderar reportes | ✅ | ✅ | ❌ |
| Silenciar usuarios | ✅ | ✅ | ❌ |
| Banear usuarios | ✅ | ❌ | ❌ |
| Gestionar lugares | ✅ | ❌ | ✅ |
| Verificar lugares | ✅ | ❌ | ❌ |
| Ver usuarios | ✅ | ❌ | ✅ |
| Eliminar usuarios | ✅ | ❌ | ❌ |
| Ver estadísticas | ✅ | ✅ | ❌ |
| Exportar reportes | ✅ | ✅ | ❌ |

---

## 🧪 TESTING

### Probar endpoints con curl

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bedic.com","password":"admin123"}'
```

#### Obtener feed de moderación
```bash
curl -X GET http://localhost:5000/api/admin/moderation/feed \
  -H "Authorization: Bearer <token>"
```

#### Obtener lugares
```bash
curl -X GET http://localhost:5000/api/admin/places \
  -H "Authorization: Bearer <token>"
```

#### Obtener estadísticas de reportes
```bash
curl -X GET http://localhost:5000/api/admin/reports/stats \
  -H "Authorization: Bearer <token>"
```

---

## 🐛 TROUBLESHOOTING

### Error: Cannot find module
**Solución**: Asegúrate de que `admin-extended.routes.js` está en `backend/routes/`

### Error: 401 Unauthorized
**Solución**: Verifica que el token JWT es válido y no ha expirado

### Error: 403 Forbidden
**Solución**: Verifica que el usuario tiene el rol requerido para la acción

### Error: CORS
**Solución**: Verifica que CORS está habilitado en `server.js`

---

## 📈 PRÓXIMOS PASOS

### Implementar en Backend
1. Reemplazar datos simulados con consultas reales a MongoDB
2. Implementar paginación real
3. Implementar búsqueda y filtros avanzados
4. Implementar exportación real de datos
5. Implementar subida de imágenes real

### Implementar en Angular
1. Conectar componentes con endpoints reales
2. Agregar manejo de errores
3. Agregar notificaciones
4. Agregar confirmaciones de acciones
5. Agregar loading states

### WebSocket
1. Implementar eventos en tiempo real
2. Notificaciones automáticas
3. Sincronización bidireccional

---

## 📞 SOPORTE

Para preguntas o problemas:
1. Revisar logs del backend: `npm start`
2. Revisar logs del Angular: DevTools Console
3. Verificar conexión: `http://localhost:5000`

---

## 📝 NOTAS IMPORTANTES

1. **Datos simulados**: Los endpoints retornan datos simulados. Reemplazar con datos reales de BD.
2. **Autenticación**: Todos los endpoints requieren JWT token válido.
3. **CORS**: Habilitado para `http://localhost:4200`
4. **Roles**: Implementar validación de roles en cada endpoint.
5. **Errores**: Implementar manejo de errores consistente.

---

**Última actualización**: Nov 27, 2025  
**Versión**: 1.0  
**Estado**: Endpoints creados, listos para integración real
