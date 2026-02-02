# Implementación de Moderación - Guía Completa

## ✅ COMPLETADO

### Componentes Creados

#### 1. ModerationFeedComponent
- **Ubicación**: `src/app/features/moderation/moderation-feed/moderation-feed.component.ts`
- **Funcionalidades**:
  - ✅ Tabla Material con paginación
  - ✅ Búsqueda en tiempo real
  - ✅ Filtros: Tipo, Estado, Severidad
  - ✅ Ordenamiento por columnas
  - ✅ Acciones: Ver detalle, Verificar, Rechazar
  - ✅ Chips de estado con colores
  - ✅ Responsive design
  - ✅ Tema oscuro/claro

#### 2. ModerationDetailComponent
- **Ubicación**: `src/app/features/moderation/moderation-detail/moderation-detail.component.ts`
- **Funcionalidades**:
  - ✅ Información completa del reporte
  - ✅ Datos del reportador
  - ✅ Datos del usuario reportado
  - ✅ Vista previa del contenido
  - ✅ Acciones:
    - ✅ Verificar reporte
    - ✅ Rechazar reporte
    - ✅ Silenciar usuario
    - ✅ Banear usuario
  - ✅ Notas privadas
  - ✅ Navegación a perfiles de usuarios
  - ✅ Tema oscuro/claro

### Rutas Actualizadas
- ✅ `moderation.routes.ts` - Importa componentes reales

---

## 🚀 PRÓXIMOS PASOS

### PASO 1: Integrar con Backend Real

Actualizar `AdminService` para conectar con endpoints reales:

```typescript
// src/app/core/services/admin.service.ts

getModerationFeed(filters?: any): Observable<any[]> {
  const options = filters ? { params: filters } : {};
  return this.http.get<any[]>(`${this.apiUrl}/moderation/feed`, options);
}

getReportDetail(reportId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/reports/${reportId}`);
}

moderateReport(reportId: string, body: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/reports/${reportId}/moderate`, body);
}
```

### PASO 2: Crear Endpoints Backend

En `backend/routes/admin.routes.js`:

```javascript
// GET /api/admin/moderation/feed
router.get('/moderation/feed', async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('userId', 'username avatar')
      .populate('reportedUserId', 'username')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/reports/:id/moderate
router.put('/reports/:id/moderate', async (req, res) => {
  try {
    const { status, action } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, actionTaken: action },
      { new: true }
    );
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### PASO 3: Crear Modelo de Report en Backend

En `backend/models/Report.js`:

```javascript
const reportSchema = new Schema({
  type: { type: String, enum: ['comment', 'rating', 'place'] },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  reportedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  reason: String,
  content: String,
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  severity: { type: String, enum: ['leve', 'moderado', 'severo'] },
  actionTaken: String,
  createdAt: { type: Date, default: Date.now }
});
```

### PASO 4: Actualizar ModerationDetailComponent

Reemplazar la carga simulada con llamada real:

```typescript
loadReportDetail(): void {
  this.loading = true;
  this.adminService.getReportDetail(this.reportId).subscribe({
    next: (report: any) => {
      this.report = {
        ...report,
        createdAt: new Date(report.createdAt)
      };
      this.loading = false;
    },
    error: (err: any) => {
      console.error('Error loading report:', err);
      this.loading = false;
    }
  });
}
```

---

## 📊 ESTRUCTURA DE DATOS

### Report Interface
```typescript
interface Report {
  id: string;
  type: 'comment' | 'rating' | 'place';
  userId: string;
  userName: string;
  userAvatar?: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  content: string;
  createdAt: Date;
  status: 'pending' | 'verified' | 'rejected';
  severity: 'leve' | 'moderado' | 'severo';
  actionTaken?: string;
}
```

---

## 🎨 CARACTERÍSTICAS DE UI

### Colores por Tipo
- **Comentario**: Azul (#1976d2)
- **Valoración**: Púrpura (#7b1fa2)
- **Lugar**: Verde (#388e3c)

### Colores por Severidad
- **Leve**: Naranja (#f57c00)
- **Moderado**: Naranja oscuro (#e65100)
- **Severo**: Rojo (#c62828)

### Colores por Estado
- **Pendiente**: Amarillo (#f57f17)
- **Verificado**: Verde (#2e7d32)
- **Rechazado**: Rojo (#c62828)

---

## 🔄 FLUJO DE MODERACIÓN

```
1. Admin accede a /dashboard/moderation
   ↓
2. Ve tabla de reportes pendientes
   ↓
3. Hace clic en "Ver detalle"
   ↓
4. Ve información completa del reporte
   ↓
5. Elige acción:
   - Verificar → Status = 'verified'
   - Rechazar → Status = 'rejected'
   - Silenciar → Mute user 24h
   - Banear → Ban user permanently
   ↓
6. Acción se envía al backend
   ↓
7. Backend actualiza MongoDB
   ↓
8. Frontend recibe confirmación
   ↓
9. Usuario reportado recibe notificación
```

---

## 📱 RESPONSIVE

- **Desktop** (1920px+): Grid de 2 columnas
- **Tablet** (768px-1024px): Grid de 1 columna
- **Mobile** (320px-767px): Stack vertical

---

## 🧪 TESTING

### Casos de prueba

1. **Cargar feed de moderación**
   - [ ] Tabla carga correctamente
   - [ ] Paginación funciona
   - [ ] Ordenamiento funciona

2. **Filtrar reportes**
   - [ ] Filtro por tipo funciona
   - [ ] Filtro por estado funciona
   - [ ] Filtro por severidad funciona
   - [ ] Búsqueda funciona

3. **Ver detalle**
   - [ ] Información se carga correctamente
   - [ ] Botones de acción funcionan
   - [ ] Navegación a perfiles funciona

4. **Moderar reporte**
   - [ ] Verificar reporte funciona
   - [ ] Rechazar reporte funciona
   - [ ] Backend recibe cambios

5. **Sancionar usuario**
   - [ ] Silenciar usuario funciona
   - [ ] Banear usuario funciona
   - [ ] Notificación se envía

---

## 🐛 DEBUGGING

### Problemas comunes

**Problema**: Tabla no carga datos
- **Solución**: Verificar que `AdminService.getModerationFeed()` devuelve datos
- **Debug**: Abrir DevTools → Network → Ver respuesta de `/api/admin/moderation/feed`

**Problema**: Filtros no funcionan
- **Solución**: Verificar que `dataSource.filter` se actualiza correctamente
- **Debug**: Agregar `console.log(this.dataSource.data)` en métodos de filtro

**Problema**: Acciones no funcionan
- **Solución**: Verificar que `AdminService` tiene métodos correctos
- **Debug**: Ver respuesta en Network tab

---

## 📈 MEJORAS FUTURAS

- [ ] Agregar paginación en backend
- [ ] Agregar búsqueda avanzada
- [ ] Agregar exportación de reportes
- [ ] Agregar gráficos de estadísticas
- [ ] Agregar notificaciones en tiempo real
- [ ] Agregar historial de acciones
- [ ] Agregar bulk actions
- [ ] Agregar filtros guardados

---

## 📞 SOPORTE

Para preguntas o problemas:
1. Revisar este documento
2. Revisar `IMPLEMENTATION_ROADMAP.md`
3. Revisar logs en DevTools

---

**Última actualización**: Nov 27, 2025
**Versión**: 1.0
**Estado**: Componentes creados, pendiente integración con backend
