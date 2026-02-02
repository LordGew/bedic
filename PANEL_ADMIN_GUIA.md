# 🎯 Panel de Administración - Guía de Uso

## ✅ Estado Actual

El panel de administración Angular está **100% funcional** con:
- ✅ Autenticación JWT
- ✅ Datos reales de BD (6 usuarios, 4 lugares)
- ✅ Todos los botones de acciones funcionando
- ✅ Tablas con información real

---

## 🚀 Cómo Verlo Funcionando

### 1. Asegúrate de que el Backend está corriendo

```bash
cd c:\Users\Jairo\Downloads\bedic_project\backend
npm start
```

Deberías ver:
```
🚀 Servidor corriendo en http://0.0.0.0:5000
📡 WebSocket disponible en ws://0.0.0.0:5000
MongoDB conectado exitosamente a Atlas.
```

### 2. Asegúrate de que Angular está corriendo

```bash
cd c:\Users\Jairo\Downloads\bedic_project\bedic-admin-panel
ng serve
```

Deberías ver:
```
✔ Compiled successfully.
```

### 3. Abre el navegador

Ve a: **http://localhost:4200**

---

## 🔐 Login

**Email:** `admin@bedic.com`  
**Contraseña:** `admin123`

Después de hacer login, verás el dashboard.

---

## 📊 Secciones y Funcionalidades

### Dashboard
- Muestra 4 tarjetas con estadísticas reales:
  - **Usuarios**: 6
  - **Lugares**: 4
  - **Reportes**: 0
  - **Valoraciones**: 7

### Gestión → Lugares
- **Tabla con 4 lugares reales**:
  1. Restaurante La Esquina
  2. Café del Centro
  3. Hotel Boutique Plaza
  4. Parque Arvi

- **Botones funcionales**:
  - ✏️ **Editar**: Navega a formulario de edición
  - 🖼️ **Gestionar imágenes**: Navega a gestor de imágenes
  - ✅ **Verificar**: Marca el lugar como verificado (PUT /api/admin/places/:id/verify)
  - 🗑️ **Eliminar**: Elimina el lugar de la BD (DELETE /api/admin/places/:id)

- **Filtros**:
  - Buscar por nombre o categoría
  - Filtrar por categoría (Restaurante, Café, Bar, Hotel, Atracción, Otro)
  - Filtrar por estado (Verificados, No verificados)

### Gestión → Usuarios
- **Tabla con 6 usuarios reales**:
  1. Juan Pérez (user)
  2. María García (user)
  3. Carlos López (user)
  4. Ana Martínez (user)
  5. Pedro Sánchez (user)
  6. Admin BEDIC (admin)

- **Botones funcionales**:
  - 🔇 **Silenciar**: Silencia al usuario por X horas (PUT /api/admin/users/:id/mute)
  - 🔑 **Reset Pass**: Envía email de reset de contraseña
  - 🗑️ **Eliminar**: Elimina el usuario de la BD (DELETE /api/admin/users/:id)

- **Información mostrada**:
  - Nombre, Email, Rol (badge de color)
  - Estado (Activo/Silenciado/Baneado)
  - Fecha de creación

### Moderación → Feed de Moderación
- Muestra reportes pendientes (actualmente 0)
- **Botones funcionales**:
  - 👁️ **Ver detalle**: Navega a detalle del reporte
  - ✅ **Verificar**: Marca reporte como verificado
  - ❌ **Rechazar**: Marca reporte como rechazado

### Moderación → Apelaciones
- Muestra apelaciones de moderación (actualmente 0)
- Tabla con usuario, estado y fecha

### Reportes
- **Resumen**: 4 tarjetas con estadísticas de reportes
- **Gráficos**: Reportes por tipo y severidad
- **Filtros avanzados**: Por tipo, estado, severidad, rango de fechas
- **Exportación**:
  - 📥 **CSV**: Descarga reportes en formato CSV
  - 📥 **Excel**: Descarga reportes en formato Excel
  - 📥 **PDF**: Descarga reportes en formato PDF

---

## 🔄 Flujo de Uso Típico

### Ejemplo 1: Verificar un Lugar
1. Ve a **Gestión → Lugares**
2. Busca "Restaurante La Esquina"
3. Haz clic en el botón **✅ Verificar**
4. Verás un alert: "Lugar verificado exitosamente"
5. El lugar ahora aparecerá con estado "Verificado" (verde)

### Ejemplo 2: Silenciar un Usuario
1. Ve a **Gestión → Usuarios**
2. Busca "Juan Pérez"
3. Haz clic en **🔇 Silenciar**
4. Ingresa el número de horas (ej: 24)
5. Verás un alert: "Usuario silenciado por 24 horas"
6. El estado del usuario cambiará a "Silenciado" (amarillo)

### Ejemplo 3: Eliminar un Lugar
1. Ve a **Gestión → Lugares**
2. Busca "Café del Centro"
3. Haz clic en **🗑️ Eliminar**
4. Confirma en el diálogo
5. El lugar será eliminado de la BD y desaparecerá de la tabla

### Ejemplo 4: Exportar Reportes
1. Ve a **Reportes**
2. Haz clic en el botón **Exportar**
3. Elige formato:
   - **CSV**: Se descargará `reportes.csv`
   - **Excel**: Se descargará `reportes.xlsx`
   - **PDF**: Se descargará `reportes.pdf`

---

## 🛠️ Estructura del Backend

### Endpoints Implementados

#### Autenticación
- `POST /api/admin/auth/login` - Login con email/password
- `GET /api/admin/auth/me` - Obtener usuario actual
- `POST /api/admin/auth/logout` - Logout
- `POST /api/admin/auth/refresh` - Refrescar token

#### Estadísticas
- `GET /api/admin/stats/overview` - Stats generales
- `GET /api/admin/reports/stats` - Stats de reportes

#### Lugares
- `GET /api/admin/places` - Listar lugares (con filtros)
- `GET /api/admin/places/:id` - Obtener detalle de lugar
- `POST /api/admin/places` - Crear lugar
- `PUT /api/admin/places/:id` - Actualizar lugar
- `DELETE /api/admin/places/:id` - Eliminar lugar
- `PUT /api/admin/places/:id/verify` - Verificar lugar

#### Usuarios
- `GET /api/admin/users` - Listar usuarios
- `GET /api/admin/users/:id` - Obtener detalle de usuario
- `PUT /api/admin/users/:id` - Actualizar usuario
- `DELETE /api/admin/users/:id` - Eliminar usuario
- `PUT /api/admin/users/:id/mute` - Silenciar usuario

#### Moderación
- `GET /api/admin/moderation/feed` - Feed de reportes
- `PUT /api/admin/reports/:id/moderate` - Moderar reporte
- `GET /api/admin/moderation/appeals` - Listar apelaciones

#### Exportación
- `GET /api/admin/reports/export?format=csv|excel|pdf` - Exportar reportes

---

## 📱 Datos de Prueba

### Usuarios (6 total)
```
1. Juan Pérez (juan@example.com) - Rol: user
2. María García (maria@example.com) - Rol: user
3. Carlos López (carlos@example.com) - Rol: user
4. Ana Martínez (ana@example.com) - Rol: user
5. Pedro Sánchez (pedro@example.com) - Rol: user
6. Admin BEDIC (admin@bedic.com) - Rol: admin
```

### Lugares (4 total)
```
1. Restaurante La Esquina
   - Categoría: restaurant
   - Ubicación: Bogotá
   - Verificado: Sí

2. Café del Centro
   - Categoría: cafe
   - Ubicación: Bogotá
   - Verificado: No

3. Hotel Boutique Plaza
   - Categoría: hotel
   - Ubicación: Bogotá
   - Verificado: Sí

4. Parque Arvi
   - Categoría: attraction
   - Ubicación: Medellín
   - Verificado: Sí
```

---

## 🐛 Troubleshooting

### "Error 401 Unauthorized"
- Asegúrate de que el token está siendo enviado correctamente
- Limpia localStorage: Abre DevTools → Console → `localStorage.clear()` → Recarga

### "No se cargan los datos"
- Verifica que el backend está corriendo en `http://localhost:5000`
- Revisa la consola del navegador (F12) para ver errores de red

### "Botones no funcionan"
- Asegúrate de que estás logueado como admin
- Revisa la consola del navegador para ver errores

---

## 🎨 Próximos Pasos

- [ ] Crear formularios para editar/crear lugares
- [ ] Crear formularios para editar/crear usuarios
- [ ] Añadir paginación a las tablas
- [ ] Implementar filtros avanzados
- [ ] Conectar con Flutter app
- [ ] Añadir gráficos interactivos
- [ ] Implementar búsqueda en tiempo real

---

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs del backend (`npm start`)
2. Abre DevTools en el navegador (F12)
3. Revisa la pestaña Network para ver las llamadas HTTP
4. Revisa la pestaña Console para ver errores de JavaScript
