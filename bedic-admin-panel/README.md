# BEDIC Admin Panel

Panel administrativo web para moderadores y agentes de soporte de la plataforma BEDIC.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200`

## Build

```bash
npm run build
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   └── role.guard.ts
│   │   └── interceptors/
│   │       └── auth.interceptor.ts
│   ├── features/
│   │   ├── auth/
│   │   │   └── login/
│   │   ├── dashboard/
│   │   ├── moderation/
│   │   ├── appeals/
│   │   └── users/
│   ├── layout/
│   │   ├── sidebar/
│   │   ├── navbar/
│   │   └── layout.component.ts
│   ├── app.component.ts
│   └── app.routes.ts
├── index.html
├── main.ts
└── styles.scss
```

## Características

- **Panel de Moderación**: Revisar y moderar reportes, ratings y comentarios
- **Gestión de Apelaciones**: Resolver apelaciones de usuarios
- **Gestión de Usuarios**: Silenciar, banear y gestionar usuarios
- **Dashboard**: Métricas y estadísticas generales
- **Autenticación**: Login con JWT y roles

## Roles

- **admin**: Acceso total
- **moderator**: Acceso a moderación y apelaciones
- **support_agent**: Acceso a gestión de usuarios

## Ambiente

Configurar las variables de entorno en `src/environments/`:

- `environment.ts`: Desarrollo
- `environment.prod.ts`: Producción

## API Base

Por defecto: `http://localhost:5000/api`

Cambiar en `src/app/core/auth/auth.service.ts`
