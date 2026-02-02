# BEDIC Admin Panel - Estructura del Proyecto

## 📁 Estructura Completa

```
bedic-admin-panel/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts           ✅ Servicio de autenticación
│   │   │   │   ├── auth.guard.ts             ✅ Guard de autenticación
│   │   │   │   └── role.guard.ts             ✅ Guard de roles
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts       ✅ Interceptor JWT
│   │   │   └── services/
│   │   │       └── admin.service.ts          ✅ Servicio admin
│   │   │
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   └── login/
│   │   │   │       └── login.component.ts    ✅ Componente login
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── dashboard.component.ts    ✅ Dashboard con estadísticas
│   │   │   │
│   │   │   ├── moderation/
│   │   │   │   ├── moderation.routes.ts      ✅ Rutas de moderación
│   │   │   │   ├── moderation-feed/
│   │   │   │   │   └── (componente por crear)
│   │   │   │   └── moderation-detail/
│   │   │   │       └── (componente por crear)
│   │   │   │
│   │   │   ├── appeals/
│   │   │   │   ├── appeals.routes.ts         ✅ Rutas de apelaciones
│   │   │   │   └── (componentes por crear)
│   │   │   │
│   │   │   └── users/
│   │   │       ├── users.routes.ts           ✅ Rutas de usuarios
│   │   │       └── (componentes por crear)
│   │   │
│   │   ├── layout/
│   │   │   ├── layout.component.ts           ✅ Layout principal
│   │   │   ├── navbar/
│   │   │   │   └── navbar.component.ts       ✅ Navbar
│   │   │   └── sidebar/
│   │   │       └── sidebar.component.ts      ✅ Sidebar
│   │   │
│   │   ├── app.component.ts                  ✅ Componente raíz
│   │   └── app.routes.ts                     ✅ Rutas principales
│   │
│   ├── index.html                            ✅ HTML principal
│   ├── main.ts                               ✅ Bootstrap
│   └── styles.scss                           ✅ Estilos globales
│
├── angular.json                              ✅ Configuración Angular
├── tsconfig.json                             ✅ Configuración TypeScript
├── package.json                              ✅ Dependencias
├── .gitignore                                ✅ Git ignore
├── README.md                                 ✅ Documentación
├── SETUP.md                                  ✅ Guía de instalación
└── PROJECT_STRUCTURE.md                      ✅ Este archivo
```

## 📊 Estado de Implementación

### ✅ Completado (Base)
- [x] Autenticación con JWT
- [x] Guards de autenticación y roles
- [x] Interceptor JWT
- [x] Dashboard con estadísticas
- [x] Layout (sidebar + navbar)
- [x] Login component
- [x] AdminService
- [x] Rutas configuradas

### ⏳ Por Implementar (Componentes)
- [ ] ModerationFeedComponent - Tabla de reportes/ratings
- [ ] ModerationDetailComponent - Detalle de reporte
- [ ] AppealsComponent - Listar apelaciones
- [ ] AppealsDetailComponent - Resolver apelación
- [ ] UsersComponent - Tabla de usuarios
- [ ] UserDetailComponent - Detalle de usuario

### ⏳ Por Implementar (Landing Page)
- [ ] LandingComponent - Página principal
- [ ] TeamComponent - Información del equipo
- [ ] FeaturesComponent - Características
- [ ] DownloadsComponent - Descargas
- [ ] ContactComponent - Formulario de contacto

## 🚀 Cómo Usar

### 1. Instalar dependencias
```bash
cd bedic-admin-panel
npm install
```

### 2. Ejecutar en desarrollo
```bash
npm start
```

La app estará en `http://localhost:4200`

### 3. Build para producción
```bash
npm run build
```

Los archivos compilados estarán en `dist/bedic-admin-panel`

## 🔑 Características Principales

### Autenticación
- Login con email/contraseña
- JWT con expiración
- Roles: admin, moderator, support_agent
- Una sola cuenta con múltiples roles

### Dashboard
- Estadísticas generales
- Usuarios, lugares, reportes, valoraciones
- Grid layout con Material Design

### Moderación (Por implementar)
- Feed de reportes y ratings
- Detalle de reporte
- Acciones: marcar como moderado, verificado, etc.

### Apelaciones (Por implementar)
- Listar apelaciones pendientes
- Resolver apelación
- Agregar respuesta del admin

### Usuarios (Por implementar)
- Listar usuarios
- Silenciar usuarios
- Banear usuarios
- Ver detalles

## 📦 Dependencias Principales

- **@angular/core**: ^17.0.0
- **@angular/material**: ^17.0.0
- **@angular/router**: ^17.0.0
- **rxjs**: ^7.8.0
- **typescript**: ~5.2.0

## 🔗 API Endpoints Utilizados

```
POST   /api/auth/login              - Login
GET    /api/auth/me                 - Obtener usuario actual
GET    /api/admin/stats/overview    - Estadísticas
GET    /api/admin/moderation/feed   - Feed de moderación
PUT    /api/admin/reports/:id       - Moderar reporte
GET    /api/admin/moderation/appeals - Apelaciones
PUT    /api/admin/moderation/appeals/:id - Resolver apelación
GET    /api/admin/users             - Listar usuarios
PUT    /api/admin/users/:id/mute    - Silenciar usuario
DELETE /api/admin/users/:id         - Eliminar usuario
```

## 🎨 Temas y Estilos

- Material Design Theme (Indigo-Pink)
- Colores: Azul (#667eea), Púrpura (#764ba2)
- Responsive design
- Dark mode compatible

## 📝 Notas Importantes

1. El backend debe estar ejecutándose en `http://localhost:5000`
2. El JWT se almacena en `localStorage`
3. Los guards validan autenticación y roles
4. El interceptor agrega JWT a todas las requests
5. Las rutas están lazy-loaded para mejor performance

## 🔐 Seguridad

- JWT con Bearer token
- Guards de autenticación
- Guards de autorización por rol
- Interceptor para agregar token
- Logout limpia localStorage

## 📞 Soporte

Ver `SETUP.md` para más información sobre instalación y troubleshooting.
