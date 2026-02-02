# BEDIC Admin Panel - Guía de Instalación

## Requisitos Previos

- Node.js 18+ instalado
- npm 9+ instalado
- Backend BEDIC ejecutándose en `http://localhost:5000`

## Instalación Rápida

### 1. Instalar dependencias

```bash
cd bedic-admin-panel
npm install
```

### 2. Iniciar servidor de desarrollo

```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200`

### 3. Login

- Email: `admin@bedic.com` (o tu email de admin)
- Contraseña: Tu contraseña

## Estructura del Proyecto

El proyecto está organizado en:

- **core/**: Servicios de autenticación, guards, interceptores
- **features/**: Módulos de funcionalidades (auth, dashboard, moderation, appeals, users)
- **layout/**: Componentes de layout (sidebar, navbar)
- **shared/**: Componentes y pipes compartidos

## Características Implementadas

### Panel de Moderación
- Listar reportes y ratings pendientes
- Marcar como moderado/verificado
- Ver detalles de reportes
- Comentarios de reportes

### Gestión de Apelaciones
- Listar apelaciones pendientes
- Resolver apelaciones (aprobar/rechazar)
- Agregar respuesta del admin

### Gestión de Usuarios
- Listar usuarios
- Silenciar usuarios
- Banear usuarios
- Ver detalles del usuario

### Dashboard
- Métricas generales
- Estadísticas de moderación
- Gráficos de actividad

## Configuración de Backend

Asegúrate de que el backend tenga:

1. **Roles en User model**:
   ```javascript
   role: {
     type: [String],
     enum: ['user', 'admin', 'moderator', 'support_agent'],
     default: ['user']
   }
   ```

2. **Endpoint `/api/auth/me`** que devuelva:
   ```json
   {
     "id": "...",
     "username": "...",
     "email": "...",
     "role": ["admin", "moderator"],
     "twoFactorEnabled": false
   }
   ```

3. **Endpoints de moderación**:
   - `GET /api/admin/moderation/feed`
   - `PUT /api/admin/reports/:id/moderate`
   - `GET /api/admin/moderation/appeals`
   - `PUT /api/admin/moderation/appeals/:id`

## Build para Producción

```bash
npm run build
```

Los archivos compilados estarán en `dist/bedic-admin-panel`

## Troubleshooting

### Error: Cannot find module '@angular/...'

Ejecuta `npm install` nuevamente

### Error: Connection refused (localhost:5000)

Asegúrate de que el backend está ejecutándose en el puerto 5000

### Error: 401 Unauthorized

Verifica que el token JWT es válido y que el usuario tiene los roles necesarios

## Próximos Pasos

1. Implementar landing page con info del equipo
2. Agregar sección de descargas
3. Agregar formulario de contacto
4. Implementar 2FA para admins
5. Agregar auditoría de acciones
