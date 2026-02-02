# 🎖️ Sistema de Referidos, Títulos e Insignias - BEDIC

## 📌 Descripción General

Sistema completo de gamificación que permite a los usuarios:
- ✅ **Referir amigos** y ganar recompensas
- ✅ **Desbloquear títulos** dinámicos para mostrar en perfil
- ✅ **Ganar insignias** por hitos y logros
- ✅ **Compartir logros** en perfiles públicos
- ✅ **Competir** en leaderboards

---

## 🏗️ Arquitectura

### Modelos
- **Referral.js** - Gestiona códigos de referido y tracking
- **Title.js** - Define títulos desbloqueables
- **Badge.js** - Define insignias/medallas
- **User.js** - Actualizado con campos de títulos, insignias y referidos

### Controladores
- **referral.controller.js** - Lógica de referidos
- **title.controller.js** - Lógica de títulos
- **badge.controller.js** - Lógica de insignias

### Rutas
- `/api/referrals/*` - Endpoints de referidos
- `/api/titles/*` - Endpoints de títulos
- `/api/badges/*` - Endpoints de insignias

---

## 🚀 Instalación

### 1. Crear Modelos
Los modelos ya están creados en:
- `backend/models/Referral.js`
- `backend/models/Title.js`
- `backend/models/Badge.js`

### 2. Crear Controladores
Los controladores ya están creados en:
- `backend/controllers/referral.controller.js`
- `backend/controllers/title.controller.js`
- `backend/controllers/badge.controller.js`

### 3. Crear Rutas
Las rutas ya están creadas en:
- `backend/routes/referral.routes.js`
- `backend/routes/title.routes.js`
- `backend/routes/badge.routes.js`

### 4. Registrar Rutas en server.js
```javascript
// En backend/server.js
const referralRoutes = require('./routes/referral.routes');
const titleRoutes = require('./routes/title.routes');
const badgeRoutes = require('./routes/badge.routes');

app.use('/api/referrals', referralRoutes);
app.use('/api/titles', titleRoutes);
app.use('/api/badges', badgeRoutes);
```

### 5. Poblar Títulos e Insignias
```bash
node backend/scripts/seedTitlesAndBadges.js
```

---

## 📋 Títulos Disponibles

### Por Nivel (5)
- 👶 **Novato** - 0 XP
- 🧭 **Explorador** - 100 XP
- 🤝 **Colaborador Activo** - 500 XP
- 📰 **Reportero Experto** - 2,000 XP
- 👑 **Maestro de la Comunidad** - 5,000 XP

### Por Contribución (3)
- 📸 **Fotógrafo Urbano** - 50+ fotos
- ⭐ **Crítico de Lugares** - 100+ calificaciones
- 🛡️ **Guardián de la Comunidad** - 25+ reportes útiles

### Por Exploración (2)
- 🌆 **Explorador Urbano** - 10+ categorías
- ✈️ **Viajero Incansable** - 100+ lugares

### Por Referidos (2)
- 🎖️ **Embajador BEDIC** - 5 referidos
- ⭐ **Reclutador Estrella** - 10 referidos

### Especiales (2)
- 🏆 **Miembro Fundador** - Limitado
- ✅ **Verificado** - Cuenta verificada

---

## 🏅 Insignias Disponibles

### Hitos de Reportes (3)
- 🚩 **Primer Reporte** - 1 reporte
- 🚩 **Reportero Activo** - 10 reportes
- 🚩 **Reportero Dedicado** - 50 reportes

### Hitos de Fotos (3)
- 📸 **Primera Foto** - 1 foto
- 📸 **Fotógrafo Aficionado** - 10 fotos
- 📸 **Fotógrafo Profesional** - 50 fotos

### Hitos de Calificaciones (3)
- ⭐ **Primera Calificación** - 1 calificación
- ⭐ **Crítico Activo** - 25 calificaciones
- ⭐ **Crítico Experto** - 100 calificaciones

### Logros de Referidos (3)
- 🎖️ **Primer Referido** - 1 referido
- 🎖️ **Reclutador Novato** - 5 referidos
- 🎖️ **Reclutador Maestro** - 10 referidos

### Logros de Exploración (2)
- 🗺️ **Explorador Principiante** - 10 lugares
- 🗺️ **Explorador Experimentado** - 50 lugares

### Logros de Comunidad (2)
- 🤝 **Miembro Activo** - 500 XP
- 👑 **Líder de Comunidad** - 5,000 XP

### Especiales (1)
- ✅ **Verificado** - Cuenta verificada

---

## 📡 API Endpoints

### Referidos

#### Obtener código de referido
```
GET /api/referrals/code
Authorization: Bearer token
```

#### Aplicar código de referido
```
POST /api/referrals/apply
Authorization: Bearer token
Body: { "code": "ABC123" }
```

#### Obtener mis referidos
```
GET /api/referrals/my-referrals
Authorization: Bearer token
```

#### Leaderboard de referidos
```
GET /api/referrals/leaderboard
```

### Títulos

#### Obtener todos los títulos
```
GET /api/titles
```

#### Obtener mis títulos
```
GET /api/titles/my-titles
Authorization: Bearer token
```

#### Seleccionar título
```
POST /api/titles/select
Authorization: Bearer token
Body: { "titleId": "..." }
```

### Insignias

#### Obtener todas las insignias
```
GET /api/badges
```

#### Obtener mis insignias
```
GET /api/badges/my-badges
Authorization: Bearer token
```

#### Seleccionar insignias
```
POST /api/badges/select
Authorization: Bearer token
Body: { "badgeIds": ["...", "..."] }
```

#### Leaderboard de insignias
```
GET /api/badges/leaderboard
```

---

## 💾 Estructura de Datos

### Referral
```javascript
{
  referrer: ObjectId,
  code: "ABC123",
  referralUrl: "https://bedic.app/ref/ABC123",
  referredUsers: [{
    userId: ObjectId,
    status: "completed|pending|cancelled",
    completedAt: Date
  }],
  stats: {
    totalReferrals: 5,
    completedReferrals: 3,
    pendingReferrals: 2
  }
}
```

### Title
```javascript
{
  name: "Explorador",
  description: "...",
  icon: "🧭",
  category: "level|contributor|explorer|referral|special",
  rarity: "common|uncommon|rare|epic|legendary",
  unlockConditions: {
    minXP: 100,
    minPhotosShared: 0,
    minSuccessfulReferrals: 0
  }
}
```

### Badge
```javascript
{
  name: "Primer Reporte",
  description: "...",
  icon: "🚩",
  type: "milestone|achievement|explorer|contributor|community|referral|special",
  rarity: "common|uncommon|rare|epic|legendary",
  unlockConditions: {
    reportsMilestone: 1
  },
  reward: {
    xp: 50,
    coins: 10
  }
}
```

### User (Actualizado)
```javascript
{
  // ... campos existentes
  badges: [{
    badgeId: ObjectId,
    unlockedAt: Date
  }],
  titles: [{
    titleId: ObjectId,
    unlockedAt: Date
  }],
  profileSettings: {
    selectedTitle: ObjectId,
    selectedBadges: [ObjectId],
    showTitles: true,
    showBadges: true
  },
  referral: {
    code: "ABC123",
    referredBy: ObjectId,
    referralsCount: 5,
    completedReferrals: 3,
    totalRewardsEarned: 1500
  }
}
```

---

## 🎮 Flujo de Gamificación

### 1. Referidos
```
Usuario A → Genera código → Comparte código
                              ↓
Usuario B → Aplica código → Completa acciones
                              ↓
Sistema → Verifica acciones → Da recompensas
                              ↓
Usuario A → Recibe XP + Insignia de referido
Usuario B → Recibe XP + Insignia de referido
```

### 2. Títulos
```
Usuario → Realiza acciones → Acumula XP/Logros
                              ↓
Sistema → Verifica condiciones → Desbloquea título
                              ↓
Usuario → Selecciona título → Aparece en perfil
```

### 3. Insignias
```
Usuario → Realiza hito → Sistema detecta
                              ↓
Sistema → Desbloquea insignia → Da recompensa
                              ↓
Usuario → Selecciona insignias → Aparecen en perfil
```

---

## 🔄 Verificación Automática

El sistema verifica automáticamente títulos e insignias cuando:
- Usuario gana XP
- Usuario completa un referido
- Usuario comparte foto
- Usuario hace calificación
- Usuario hace reporte

Implementar en los controladores correspondientes:
```javascript
const titleController = require('../controllers/title.controller');
const badgeController = require('../controllers/badge.controller');

// Después de cualquier acción
await titleController.checkAndUnlockTitles(userId);
await badgeController.checkAndUnlockBadges(userId);
```

---

## 📊 Recompensas

### Por Referido Completado
- **Referidor**: 500 XP + 100 coins
- **Referido**: 250 XP

### Por Insignia Desbloqueada
- **Common**: 50 XP
- **Uncommon**: 100-200 XP
- **Rare**: 300-500 XP
- **Epic**: 500+ XP
- **Legendary**: 1000+ XP

### Hitos de Referidos
- 5 referidos: Insignia + 300 XP
- 10 referidos: Insignia + 500 XP
- 25 referidos: Insignia + 1000 XP
- 50 referidos: Insignia + 2000 XP

---

## 🎨 Rareza de Títulos

| Rareza | Color | Descripción |
|--------|-------|------------|
| Common | #6C757D | Fácil de obtener |
| Uncommon | #17A2B8 | Requiere esfuerzo |
| Rare | #FFC107 | Difícil de obtener |
| Epic | #9B5CFF | Muy difícil |
| Legendary | #FFD700 | Extremadamente difícil |

---

## 🔐 Seguridad

- ✅ Validación de códigos de referido
- ✅ Prevención de auto-referidos
- ✅ Verificación de acciones completadas
- ✅ Auditoría de recompensas
- ✅ Protección contra duplicados

---

## 📱 Integración Flutter

### Mostrar Títulos en Perfil
```dart
// En public_profile_screen.dart
if (user.profileSettings.selectedTitle != null) {
  Text(selectedTitle.name, style: titleStyle);
  Text(selectedTitle.icon);
}
```

### Mostrar Insignias en Perfil
```dart
// En public_profile_screen.dart
GridView.builder(
  itemCount: selectedBadges.length,
  itemBuilder: (context, index) {
    return BadgeWidget(badge: selectedBadges[index]);
  }
)
```

### Pantalla de Referidos
```dart
// En profile_screen.dart
ReferralSection(
  code: user.referral.code,
  referralUrl: user.referral.referralUrl,
  stats: user.referral.stats
)
```

---

## 🧪 Testing

### Crear Título de Prueba
```bash
curl -X POST http://localhost:5000/api/titles \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Título de Prueba",
    "description": "Descripción",
    "icon": "🎯",
    "category": "special",
    "rarity": "rare"
  }'
```

### Crear Insignia de Prueba
```bash
curl -X POST http://localhost:5000/api/badges \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Insignia de Prueba",
    "description": "Descripción",
    "icon": "🎯",
    "type": "special",
    "rarity": "rare",
    "reward": { "xp": 100, "coins": 25 }
  }'
```

---

## 📝 Próximos Pasos

1. ✅ Registrar rutas en server.js
2. ✅ Ejecutar script de población
3. ✅ Integrar verificación automática en controladores
4. ✅ Actualizar Flutter para mostrar títulos e insignias
5. ✅ Crear pantalla de referidos en Flutter
6. ✅ Implementar leaderboards en Flutter

---

**Última actualización**: Diciembre 2025
**Estado**: Listo para integración ✅
