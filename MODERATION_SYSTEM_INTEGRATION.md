# Sistema de Moderación Automática Avanzado - Guía de Integración

## 📋 Descripción General

Sistema completo de moderación automática que incluye:
- ✅ Detección de malas palabras (3 niveles de severidad)
- ✅ Detección de spam (caracteres repetidos, mayúsculas, URLs, teléfonos, emails)
- ✅ Análisis de toxicidad con IA
- ✅ Sanciones progresivas (mute, ban)
- ✅ Historial de infracciones
- ✅ Sistema de apelaciones
- ✅ Dashboard de moderación para admins
- ✅ Notificaciones a usuarios

---

## 🗂️ Estructura de Archivos Creados

```
backend/
├── models/
│   └── ModerationLog.js          # Modelo para registrar acciones de moderación
├── services/
│   ├── contentModerationService.js   # Servicio existente (mejorado)
│   └── advancedModerationService.js  # Nuevo servicio avanzado
├── routes/
│   └── moderation.routes.js      # Endpoints de moderación
└── tests/
    └── moderation.test.js        # Suite de pruebas automatizadas
```

---

## 🔧 Integración en Express

### 1. Registrar rutas en `backend/server.js`

```javascript
const moderationRoutes = require('./routes/moderation.routes');

// Después de otras rutas
app.use('/api/moderation', moderationRoutes);
```

### 2. Integrar en endpoints de comentarios

En `backend/routes/comments.routes.js` o similar:

```javascript
const advancedModerationService = require('../services/advancedModerationService');

// Crear comentario
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { text, placeId } = req.body;

    // Moderar contenido
    const moderation = await advancedModerationService.moderateContentAdvanced({
      text,
      userId: req.user.id,
      contentType: 'COMMENT',
      contentId: placeId,
      language: req.user.language || 'es',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Si fue rechazado
    if (!moderation.approved) {
      return res.status(400).json({
        error: moderation.message,
        reason: moderation.reason,
        sanctionApplied: moderation.sanctionApplied
      });
    }

    // Crear comentario
    const comment = new Comment({
      text,
      userId: req.user.id,
      placeId,
      hidden: moderation.action === 'FLAG_FOR_REVIEW',
      moderationLogId: moderation.moderationLogId
    });

    await comment.save();

    res.json({
      success: true,
      comment,
      message: moderation.action === 'FLAG_FOR_REVIEW' 
        ? 'Tu comentario ha sido marcado para revisión' 
        : 'Comentario publicado'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📱 Integración en Flutter

### 1. Actualizar modelo de comentario

```dart
class Comment {
  final String id;
  final String text;
  final String userId;
  final bool hidden;
  final String? moderationReason;
  final DateTime createdAt;

  Comment({
    required this.id,
    required this.text,
    required this.userId,
    this.hidden = false,
    this.moderationReason,
    required this.createdAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['_id'],
      text: json['text'],
      userId: json['userId'],
      hidden: json['hidden'] ?? false,
      moderationReason: json['moderationReason'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
```

### 2. Actualizar servicio de API

```dart
Future<ApiResponse<Comment>> createComment(
  String placeId,
  String text,
) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/comments/create'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'text': text,
        'placeId': placeId,
      }),
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return ApiResponse(
        success: true,
        data: Comment.fromJson(json['comment']),
        message: json['message'],
      );
    } else if (response.statusCode == 400) {
      final json = jsonDecode(response.body);
      return ApiResponse(
        success: false,
        message: json['error'],
        data: null,
      );
    }
    // ...
  } catch (e) {
    return ApiResponse(success: false, message: e.toString());
  }
}
```

### 3. Mostrar notificación al usuario

```dart
void _createComment() async {
  final result = await apiService.createComment(widget.placeId, _textController.text);

  if (result.success) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(result.message ?? 'Comentario publicado'),
        backgroundColor: Colors.green,
      ),
    );
    _textController.clear();
    _loadComments();
  } else {
    // Mostrar error con información de moderación
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(result.message ?? 'Error al publicar comentario'),
        backgroundColor: Colors.red,
        duration: Duration(seconds: 5),
      ),
    );
  }
}
```

---

## 🎛️ Dashboard de Moderación en Angular

### 1. Crear componente ModerationDashboard

```typescript
// src/app/features/moderation/moderation-dashboard/moderation-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-moderation-dashboard',
  templateUrl: './moderation-dashboard.component.html',
  styleUrls: ['./moderation-dashboard.component.scss']
})
export class ModerationDashboardComponent implements OnInit {
  dashboardData: any;
  loading = false;
  selectedPeriod = 30;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.adminService.getModerationDashboard(this.selectedPeriod).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.loading = false;
      }
    });
  }

  onPeriodChange(period: number): void {
    this.selectedPeriod = period;
    this.loadDashboard();
  }
}
```

### 2. Template del Dashboard

```html
<!-- src/app/features/moderation/moderation-dashboard/moderation-dashboard.component.html -->

<div class="dashboard-container">
  <h1>Panel de Moderación Automática</h1>

  <!-- Período de tiempo -->
  <mat-form-field>
    <mat-label>Período</mat-label>
    <mat-select [(value)]="selectedPeriod" (selectionChange)="onPeriodChange($event.value)">
      <mat-option [value]="7">Últimos 7 días</mat-option>
      <mat-option [value]="30">Últimos 30 días</mat-option>
      <mat-option [value]="90">Últimos 90 días</mat-option>
    </mat-select>
  </mat-form-field>

  <!-- Tarjetas de estadísticas -->
  <div class="stats-grid">
    <mat-card class="stat-card">
      <mat-card-title>Acciones Totales</mat-card-title>
      <div class="stat-value">{{ dashboardData?.stats?.totalActions }}</div>
    </mat-card>

    <mat-card class="stat-card">
      <mat-card-title>Usuarios Afectados</mat-card-title>
      <div class="stat-value">{{ dashboardData?.stats?.uniqueUsers?.length }}</div>
    </mat-card>

    <mat-card class="stat-card">
      <mat-card-title>Apelaciones Pendientes</mat-card-title>
      <div class="stat-value">{{ dashboardData?.pendingAppeals }}</div>
    </mat-card>

    <mat-card class="stat-card">
      <mat-card-title>Pendientes de Revisión</mat-card-title>
      <div class="stat-value">{{ dashboardData?.pendingReview }}</div>
    </mat-card>
  </div>

  <!-- Gráficos -->
  <div class="charts-grid">
    <!-- Acciones por tipo -->
    <mat-card>
      <mat-card-title>Acciones por Tipo</mat-card-title>
      <div class="chart-container">
        <div *ngFor="let action of dashboardData?.actionsByType">
          <span>{{ action._id }}</span>
          <span class="count">{{ action.count }}</span>
        </div>
      </div>
    </mat-card>

    <!-- Razones más comunes -->
    <mat-card>
      <mat-card-title>Razones Más Comunes</mat-card-title>
      <div class="chart-container">
        <div *ngFor="let reason of dashboardData?.topReasons">
          <span>{{ reason._id }}</span>
          <span class="count">{{ reason.count }}</span>
        </div>
      </div>
    </mat-card>
  </div>

  <!-- Usuarios más reportados -->
  <mat-card class="full-width">
    <mat-card-title>Usuarios Más Reportados</mat-card-title>
    <table mat-table [dataSource]="dashboardData?.topViolators">
      <ng-container matColumnDef="userName">
        <th mat-header-cell *matHeaderCellDef>Usuario</th>
        <td mat-cell *matCellDef="let element">{{ element.userName }}</td>
      </ng-container>

      <ng-container matColumnDef="violations">
        <th mat-header-cell *matHeaderCellDef>Violaciones</th>
        <td mat-cell *matCellDef="let element">{{ element.violations }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Acciones</th>
        <td mat-cell *matCellDef="let element">
          <button mat-button (click)="viewUserViolations(element._id)">Ver Detalles</button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="['userName', 'violations', 'actions']"></tr>
      <tr mat-row *matRowDef="let row; columns: ['userName', 'violations', 'actions'];"></tr>
    </table>
  </mat-card>
</div>
```

---

## 🧪 Ejecutar Pruebas

```bash
cd backend
node tests/moderation.test.js
```

Salida esperada:
```
🧪 Iniciando pruebas de moderación automática...

📝 PRUEBAS: Detección de Malas Palabras
✅ Test 1: Texto limpio
✅ Test 2: Palabra leve detectada
✅ Test 3: Palabra moderada detectada
✅ Test 4: Palabra severa detectada
✅ Test 5: Contenido de autolesión detectado

...

✅ Pruebas de moderación completadas

🎯 El sistema de moderación automática está listo para producción.
```

---

## 📊 Flujo de Moderación Automática

```
Usuario publica comentario
    ↓
Sistema detecta malas palabras
    ↓
Sistema detecta spam
    ↓
Sistema analiza toxicidad
    ↓
Sistema calcula trust score del usuario
    ↓
Sistema obtiene historial de violaciones
    ↓
Sistema calcula nivel de sanción
    ↓
Decisión:
├─ RECHAZAR + SANCIONAR (si es severo)
├─ MARCAR PARA REVISIÓN (si es moderado)
└─ APROBAR (si es limpio)
    ↓
Registrar en ModerationLog
    ↓
Aplicar sanción si es necesario
    ↓
Notificar al usuario
    ↓
Admin revisa en dashboard
```

---

## 🔐 Niveles de Sanción Progresiva

| Violaciones | Acción | Duración |
|------------|--------|----------|
| 1 (leve) | Flag for review | - |
| 3+ | Silencio 24h | 24 horas |
| 5+ | Silencio 3 días | 3 días |
| 7+ | Silencio 7 días | 7 días |
| 10+ | Silencio permanente | Indefinido |
| 3+ severas | Ban permanente | Indefinido |

---

## 📈 Métricas Capturadas

- Tipo de acción (comentario oculto, usuario silenciado, etc.)
- Razón de la acción (malas palabras, spam, toxicidad)
- Severidad (leve, moderado, severo)
- Scores (toxicidad, spam, confianza)
- Historial del usuario
- IP y User Agent
- Timestamp de la acción
- Estado de apelación

---

## 🎯 Próximos Pasos

1. ✅ Crear modelos y servicios
2. ✅ Crear endpoints backend
3. ✅ Crear pruebas automatizadas
4. ⏳ Integrar en rutas de comentarios
5. ⏳ Actualizar app móvil Flutter
6. ⏳ Crear dashboard Angular
7. ⏳ Implementar notificaciones
8. ⏳ Pruebas end-to-end

---

**Última actualización**: Enero 2026
**Versión**: 1.0
**Estado**: Sistema implementado, pendiente integración
