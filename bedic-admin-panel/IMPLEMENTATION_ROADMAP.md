# BEDIC Admin Panel - Roadmap de Implementación Completa

## ✅ COMPLETADO

### Tema Oscuro/Claro
- ✅ `ThemeService` creado
- ✅ CSS variables para ambos temas
- ✅ Botón toggle en navbar
- ✅ Persistencia en localStorage
- ✅ Detección automática de preferencia del sistema

---

## 📋 PENDIENTE DE IMPLEMENTAR

### FASE 1: Componentes de Moderación Completos

#### 1.1 ModerationFeedComponent
- [ ] Tabla con Material DataTable
- [ ] Columnas: Tipo, Usuario, Fecha, Estado, Acciones
- [ ] Filtros: Por tipo, estado, fecha, usuario
- [ ] Búsqueda en tiempo real
- [ ] Paginación
- [ ] Ordenamiento
- [ ] Acciones: Ver detalle, Moderar, Rechazar

#### 1.2 ModerationDetailComponent
- [ ] Vista detallada de reporte/rating
- [ ] Información del usuario reportado
- [ ] Contenido reportado (texto, imagen, video)
- [ ] Razón del reporte
- [ ] Acciones disponibles:
  - [ ] Marcar como verificado
  - [ ] Marcar como moderado
  - [ ] Rechazar reporte
  - [ ] Silenciar usuario (1-30 días)
  - [ ] Banear usuario permanentemente
  - [ ] Agregar nota privada
- [ ] Historial de acciones en este reporte

#### 1.3 AppealsComponent
- [ ] Tabla de apelaciones pendientes
- [ ] Filtros: Por estado, usuario, fecha
- [ ] Acciones: Ver detalle, Resolver
- [ ] Estados: Pendiente, Aprobada, Rechazada

#### 1.4 AppealsDetailComponent
- [ ] Información de la apelación
- [ ] Razón de la apelación
- [ ] Contenido original reportado
- [ ] Decisión anterior
- [ ] Acciones:
  - [ ] Aprobar apelación (revertir acción)
  - [ ] Rechazar apelación
  - [ ] Agregar respuesta
- [ ] Notificación automática al usuario

---

### FASE 2: Gestión de Reportes y Exportación

#### 2.1 ReportsComponent
- [ ] Dashboard de reportes
- [ ] Gráficos:
  - [ ] Reportes por tipo (pastel)
  - [ ] Reportes por fecha (línea)
  - [ ] Reportes por usuario más reportado (barras)
  - [ ] Tasa de resolución
- [ ] Tabla de reportes recientes
- [ ] Filtros avanzados

#### 2.2 Exportación de Datos
- [ ] Exportar a CSV
- [ ] Exportar a Excel
- [ ] Exportar a PDF
- [ ] Rango de fechas personalizado
- [ ] Seleccionar columnas a exportar
- [ ] Incluir gráficos en PDF

#### 2.3 Estadísticas
- [ ] Total de reportes
- [ ] Reportes resueltos
- [ ] Reportes pendientes
- [ ] Usuarios más activos
- [ ] Moderadores más activos
- [ ] Tiempo promedio de resolución

---

### FASE 3: Gestión de Imágenes de Lugares

#### 3.1 PlacesComponent
- [ ] Tabla de lugares
- [ ] Búsqueda por nombre
- [ ] Filtros: Por categoría, estado de verificación
- [ ] Acciones: Ver detalle, Editar, Eliminar

#### 3.2 PlaceDetailComponent
- [ ] Información del lugar
- [ ] Galería de imágenes
- [ ] Subir nuevas imágenes
- [ ] Eliminar imágenes
- [ ] Establecer imagen principal
- [ ] Editar información del lugar
- [ ] Verificar lugar

#### 3.3 ImageUploadComponent
- [ ] Drag & drop para subir imágenes
- [ ] Validación de tamaño (max 5MB)
- [ ] Validación de formato (jpg, png, webp)
- [ ] Compresión automática
- [ ] Previsualización
- [ ] Progreso de carga
- [ ] Eliminar antes de subir

---

### FASE 4: Sincronización Bidireccional

#### 4.1 WebSocket Integration
- [ ] Conectar a servidor WebSocket
- [ ] Eventos en tiempo real:
  - [ ] Nuevo reporte
  - [ ] Reporte moderado
  - [ ] Usuario silenciado
  - [ ] Usuario baneado
  - [ ] Apelación creada
  - [ ] Apelación resuelta

#### 4.2 Notificaciones
- [ ] Toast notifications
- [ ] Sonido de notificación
- [ ] Notificaciones del navegador
- [ ] Centro de notificaciones

#### 4.3 Sincronización con Flutter App
- [ ] Cambios en moderación reflejados en app
- [ ] Cambios en usuarios reflejados en app
- [ ] Cambios en lugares reflejados en app
- [ ] Cambios en imágenes reflejados en app

---

### FASE 5: Dashboard Avanzado

#### 5.1 DashboardComponent Mejorado
- [ ] KPIs principales
- [ ] Gráficos de actividad
- [ ] Actividad reciente
- [ ] Alertas importantes
- [ ] Tareas pendientes

#### 5.2 Analytics
- [ ] Tendencias de reportes
- [ ] Análisis de usuarios
- [ ] Análisis de moderadores
- [ ] Reportes personalizados

---

### FASE 6: Gestión de Usuarios

#### 6.1 UsersComponent
- [ ] Tabla de usuarios
- [ ] Búsqueda y filtros
- [ ] Acciones: Ver perfil, Silenciar, Banear, Eliminar

#### 6.2 UserDetailComponent
- [ ] Información del usuario
- [ ] Historial de reportes
- [ ] Historial de moderación
- [ ] Acciones disponibles
- [ ] Notas privadas

#### 6.3 Gestión de Sanciones
- [ ] Silenciar usuario (temporal)
- [ ] Banear usuario (permanente)
- [ ] Ver historial de sanciones
- [ ] Revertir sanciones

---

### FASE 7: Configuración y Administración

#### 7.1 SettingsComponent
- [ ] Configuración de moderación
- [ ] Umbrales de toxicidad
- [ ] Palabras prohibidas
- [ ] Políticas de comunidad
- [ ] Notificaciones

#### 7.2 UsersManagementComponent
- [ ] Crear moderadores
- [ ] Crear agentes de soporte
- [ ] Editar permisos
- [ ] Eliminar usuarios
- [ ] Historial de acciones

#### 7.3 AuditLogComponent
- [ ] Log de todas las acciones
- [ ] Filtros por usuario, acción, fecha
- [ ] Exportar log
- [ ] Búsqueda

---

## 🔄 SINCRONIZACIÓN BIDIRECCIONAL

### Flujo de datos:
```
Flutter App ←→ Backend ←→ Angular Panel
     ↓              ↓              ↓
  Local DB    MongoDB      LocalStorage
```

### Eventos sincronizados:
1. **Moderación**: Cuando se modera un reporte en web, se refleja en app
2. **Usuarios**: Cuando se sanciona un usuario en web, se refleja en app
3. **Lugares**: Cuando se añaden imágenes en web, se ven en app
4. **Reportes**: Nuevos reportes aparecen en tiempo real en web

---

## 📊 ENDPOINTS NECESARIOS

### Moderación
- `GET /api/admin/moderation/feed` - Feed de moderación
- `GET /api/admin/reports/:id` - Detalle de reporte
- `PUT /api/admin/reports/:id/moderate` - Moderar reporte
- `GET /api/admin/moderation/appeals` - Apelaciones
- `PUT /api/admin/moderation/appeals/:id` - Resolver apelación

### Usuarios
- `GET /api/admin/users` - Listar usuarios
- `GET /api/admin/users/:id` - Detalle de usuario
- `PUT /api/admin/users/:id/mute` - Silenciar usuario
- `PUT /api/admin/users/:id/ban` - Banear usuario
- `DELETE /api/admin/users/:id` - Eliminar usuario

### Lugares
- `GET /api/admin/places` - Listar lugares
- `GET /api/admin/places/:id` - Detalle de lugar
- `PUT /api/admin/places/:id` - Editar lugar
- `POST /api/admin/places/:id/images` - Subir imagen
- `DELETE /api/admin/places/:id/images/:imageId` - Eliminar imagen

### Reportes y Exportación
- `GET /api/admin/reports/stats` - Estadísticas
- `GET /api/admin/reports/export?format=csv|excel|pdf` - Exportar

### Auditoría
- `GET /api/admin/audit-log` - Log de auditoría

---

## 🎨 DISEÑO UI/UX

### Colores (Light/Dark)
- **Primario**: #667eea / #667eea
- **Secundario**: #764ba2 / #764ba2
- **Fondo**: #f5f5f5 / #121212
- **Superficie**: #ffffff / #1e1e1e
- **Éxito**: #4caf50 / #66bb6a
- **Advertencia**: #ff9800 / #ffa726
- **Error**: #f44336 / #ef5350

### Componentes
- Material Design 3
- Transiciones suaves
- Responsive design
- Accesibilidad (WCAG 2.1 AA)

---

## 📱 RESPONSIVE

- Desktop: 1920px+
- Tablet: 768px - 1024px
- Mobile: 320px - 767px

---

## 🔐 SEGURIDAD

- JWT con expiración
- Role-based access control
- HTTPS obligatorio
- CORS configurado
- Rate limiting
- Sanitización de inputs
- Validación en backend

---

## 📈 PERFORMANCE

- Lazy loading de módulos
- Virtual scrolling para listas grandes
- Caché de datos
- Compresión de imágenes
- Minificación de assets
- CDN para assets estáticos

---

## 🧪 TESTING

- Unit tests (Jasmine)
- E2E tests (Cypress)
- Coverage > 80%

---

## 📝 DOCUMENTACIÓN

- API documentation
- Component documentation
- User guide
- Admin guide

---

**Última actualización**: Nov 27, 2025
**Estado**: Tema oscuro/claro implementado, pendiente resto de funcionalidades
