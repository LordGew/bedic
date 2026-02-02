# ✅ Checklist de Pruebas del Sistema de Verificación

## Fase 1: Verificación de Dependencias

### Backend
```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Instalar dependencias
cd backend
npm install

# Verificar Nodemailer
npm list nodemailer
```

### Frontend
```bash
# Verificar Angular CLI
ng version

# Instalar dependencias
cd bedic-admin-panel
npm install

# Verificar compilación
ng build
```

---

## Fase 2: Pruebas Unitarias

### Ejecutar pruebas de verificación
```bash
cd backend
node tests/verification-system.test.js
```

**Esperado:**
- ✓ Validación de nombre real funciona
- ✓ Generación de tokens funciona
- ✓ Servicio de email inicializa
- ✓ Conexión con Gmail se verifica
- ✓ Usuario se crea con verificación
- ✓ Email se verifica correctamente
- ✓ Contador de acciones funciona
- ✓ Auto-verificación funciona
- ✓ Verificación manual funciona
- ✓ Rechazo de verificación funciona

---

## Fase 3: Pruebas de Compilación

### Backend
```bash
cd backend
npm start
```

**Esperado:**
- ✓ Servidor inicia sin errores
- ✓ MongoDB conecta
- ✓ Rutas de verificación se registran
- ✓ Servicio de email se inicializa

### Frontend
```bash
cd bedic-admin-panel
npm start
```

**Esperado:**
- ✓ Angular compila sin errores
- ✓ Aplicación se abre en http://localhost:4200
- ✓ No hay errores en consola

---

## Fase 4: Pruebas de Integración

### Registro con Validación de Nombre

**Test 1: Nombre válido**
```
POST /api/auth/register
{
  "name": "Juan Pérez",
  "username": "juanperez123",
  "email": "juan@example.com",
  "password": "SecurePassword123!"
}
```

**Esperado:**
- ✓ Status 201
- ✓ Usuario creado
- ✓ Email de verificación enviado
- ✓ verification.verificationLevel = "partially_verified"

**Test 2: Nombre inválido**
```
POST /api/auth/register
{
  "name": "Juan",
  "username": "juan123",
  "email": "juan@example.com",
  "password": "SecurePassword123!"
}
```

**Esperado:**
- ✓ Status 400
- ✓ Mensaje: "Nombre inválido: El nombre debe contener al menos nombre y apellido"

---

### Verificación de Email

**Test 1: Verificar con token válido**
```
POST /api/verification/verify-email
Headers: Authorization: Bearer {token}
{
  "token": "{emailVerificationToken}"
}
```

**Esperado:**
- ✓ Status 200
- ✓ verification.emailVerified = true
- ✓ Mensaje: "Email verificado correctamente"

**Test 2: Verificar con token inválido**
```
POST /api/verification/verify-email
Headers: Authorization: Bearer {token}
{
  "token": "invalid_token"
}
```

**Esperado:**
- ✓ Status 400
- ✓ Mensaje: "Token inválido"

---

### Auto-Verificación por Reputación

**Test: Incrementar contador de acciones**
```
GET /api/verification/my-status
Headers: Authorization: Bearer {token}
```

**Esperado (después de 5 acciones):**
- ✓ verification.verificationLevel = "verified"
- ✓ verification.actionsCompleted = 5
- ✓ verification.autoVerifiedAt = fecha actual

---

### Panel de Admin

**Test 1: Obtener lista de usuarios**
```
GET /api/admin/verification/users
Headers: Authorization: Bearer {adminToken}
```

**Esperado:**
- ✓ Status 200
- ✓ Array de usuarios con estado de verificación
- ✓ Cada usuario tiene campos: name, username, email, verification

**Test 2: Obtener estadísticas**
```
GET /api/admin/verification/stats/overview
Headers: Authorization: Bearer {adminToken}
```

**Esperado:**
- ✓ Status 200
- ✓ totalUsers: número
- ✓ verifiedUsers: número
- ✓ partiallyVerifiedUsers: número
- ✓ unverifiedUsers: número
- ✓ verificationRate: porcentaje

**Test 3: Verificar usuario manualmente**
```
POST /api/admin/verification/users/{userId}/verify
Headers: Authorization: Bearer {adminToken}
{
  "reason": "Verificado manualmente por admin"
}
```

**Esperado:**
- ✓ Status 200
- ✓ verification.verificationLevel = "verified"
- ✓ Historial actualizado

**Test 4: Rechazar verificación**
```
POST /api/admin/verification/users/{userId}/reject
Headers: Authorization: Bearer {adminToken}
{
  "reason": "Nombre sospechoso"
}
```

**Esperado:**
- ✓ Status 200
- ✓ verification.verificationLevel = "unverified"
- ✓ Historial actualizado

---

## Fase 5: Pruebas de Email

### Configuración Gmail
- [ ] EMAIL_USER configurado en .env
- [ ] EMAIL_PASSWORD configurado en .env (contraseña de app)
- [ ] Verificación en 2 pasos habilitada
- [ ] Contraseña de aplicación generada

### Envío de Email
```
Registrar nuevo usuario con nombre válido
```

**Esperado:**
- [ ] Email llega a la bandeja de entrada
- [ ] Email NO va a spam
- [ ] Template HTML se ve correctamente
- [ ] Link de verificación funciona
- [ ] Código OTP se muestra

---

## Fase 6: Pruebas del Componente Angular

### Componente de Verificación
```
Navegar a: http://localhost:62172/verification
```

**Esperado:**
- [ ] Componente se carga sin errores
- [ ] 6 tarjetas KPI se muestran
- [ ] Tabla de usuarios se renderiza
- [ ] Filtros funcionan
- [ ] Botones de acción funcionan

### Filtros
- [ ] Filtrar por nivel de verificación
- [ ] Filtrar por estado de email
- [ ] Filtrar por validación de nombre
- [ ] Botón "Actualizar" funciona

### Acciones
- [ ] Botón "Ver detalles" abre modal
- [ ] Botón "Verificar" verifica usuario
- [ ] Botón "Rechazar" rechaza usuario
- [ ] Mensajes de éxito/error aparecen

---

## Fase 7: Pruebas de Seguridad

### Validación
- [ ] Nombres con caracteres especiales rechazados
- [ ] Nombres con números rechazados
- [ ] Emails inválidos rechazados
- [ ] Tokens expirados rechazados

### Autenticación
- [ ] Sin token: acceso denegado
- [ ] Token inválido: acceso denegado
- [ ] Usuario no-admin: no puede acceder a /admin/verification

### Datos Sensibles
- [ ] .env no está en Git
- [ ] Contraseña de Gmail no se expone en logs
- [ ] Tokens se hashean correctamente

---

## Fase 8: Pruebas de Performance

### Backend
- [ ] Validación de nombre < 10ms
- [ ] Generación de token < 5ms
- [ ] Verificación de email < 100ms
- [ ] Obtener lista de usuarios < 500ms

### Frontend
- [ ] Componente se carga < 1s
- [ ] Tabla se renderiza < 500ms
- [ ] Filtros responden < 200ms

---

## Resultados

### Resumen
- **Fecha:** [COMPLETAR]
- **Pruebas Totales:** [COMPLETAR]
- **Pasadas:** [COMPLETAR]
- **Fallidas:** [COMPLETAR]
- **Porcentaje:** [COMPLETAR]%

### Problemas Encontrados
[COMPLETAR]

### Recomendaciones
[COMPLETAR]

### Listo para Producción
[ ] Sí [ ] No

---

## Notas
[COMPLETAR]
