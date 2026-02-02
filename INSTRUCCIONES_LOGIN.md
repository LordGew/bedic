# 🔐 INSTRUCCIONES DE LOGIN - Panel Admin BEDIC

**Fecha**: Nov 28, 2025  
**Estado**: ✅ LISTO PARA USAR

---

## ⚠️ IMPORTANTE - REINICIA EL BACKEND

Después de estos cambios, **DEBES REINICIAR el backend**:

```bash
# 1. Detener el backend (Ctrl+C en la terminal)
# 2. Reiniciar:
cd backend
npm start
```

---

## 🔑 CREDENCIALES CORRECTAS

### Admin (Acceso Total)
```
Email: admin@bedic.com
Password: admin123
```

### Moderador
```
Email: moderator@bedic.com
Password: mod123
```

### Soporte
```
Email: support@bedic.com
Password: support123
```

---

## 🚀 PASOS PARA PROBAR

### 1. Reinicia Backend
```bash
cd backend
npm start
```

**Deberías ver en la consola:**
```
🚀 Servidor corriendo en http://0.0.0.0:5000
📡 WebSocket disponible en ws://0.0.0.0:5000
```

### 2. Abre Angular en otra terminal
```bash
cd bedic-admin-panel
ng serve --open
```

### 3. Ingresa las credenciales
```
Email: admin@bedic.com
Password: admin123
Click: Ingresar
```

### 4. Verifica en la consola del backend
Deberías ver:
```
🔐 Login attempt: { email: 'admin@bedic.com', password: 'admin123' }
👤 Usuario encontrado: Sí
✅ Login exitoso para: admin@bedic.com
```

---

## 🔍 SI SIGUE SIN FUNCIONAR

### Paso 1: Verifica que el backend está corriendo
```bash
curl http://localhost:5000
```

Deberías ver: `BEDIC API is running!`

### Paso 2: Prueba el login directamente
```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bedic.com","password":"admin123"}'
```

Deberías recibir:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin-001",
    "email": "admin@bedic.com",
    "name": "Admin BEDIC",
    "role": "admin"
  }
}
```

### Paso 3: Revisa los logs del backend
- Busca mensajes con 🔐, 👤, ✅ o ❌
- Esto te dirá exactamente qué está pasando

### Paso 4: Revisa la consola del navegador
- DevTools → Console
- Busca errores de red o de autenticación

---

## 📊 ARCHIVOS ACTUALIZADOS

```
✅ backend/middleware/auth.js                (NUEVO)
✅ backend/routes/admin-auth.routes.js       (ACTUALIZADO con logs)
✅ backend/server.js                         (Ya estaba actualizado)
```

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DEL LOGIN

Una vez que el login funcione:

1. ✅ Deberías ver el Dashboard
2. ✅ Deberías ver datos reales en:
   - Moderación
   - Lugares
   - Reportes
3. ✅ El tema oscuro/claro debe funcionar

---

## 💡 TIPS

- **No cambies las credenciales** - están hardcodeadas en el backend
- **Reinicia siempre después de cambios** en el backend
- **Limpia el cache** del navegador si hay problemas (Ctrl+Shift+Delete)
- **Revisa los logs** del backend para debugging

---

**¡Ahora debería funcionar!** 🚀

Si aún hay problemas, copia los logs del backend y del navegador para debugging.
