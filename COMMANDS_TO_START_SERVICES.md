# 🚀 Comandos para Encender Todos los Servicios

## 📋 Resumen Rápido

Necesitas abrir **3 terminales diferentes** y ejecutar estos comandos:

---

## Terminal 1: Backend (Express - Puerto 5000)

```bash
cd c:\Users\Jairo\Downloads\bedic_project\backend
npm start
```

**Esperado:**
```
🚀 Servidor corriendo en http://0.0.0.0:5000
🔒 Seguridad: Helmet, Rate Limiting y Validación activados
📝 Logging estructurado activado
✅ Sistema 100% autónomo - sin dependencias externas
```

**URLs disponibles:**
- `http://localhost:5000` - API base
- `http://localhost:5000/api/admin/moderation/logs` - Logs de moderación
- `http://localhost:5000/api/admin/moderation/dashboard` - Dashboard de moderación

---

## Terminal 2: Angular Admin Panel (Puerto 4200)

```bash
cd c:\Users\Jairo\Downloads\bedic_project\bedic-admin-panel
npm start
```

**Esperado:**
```
✔ Compiled successfully.
✔ Built successfully.

Application bundle generated successfully. [X.XXX seconds]

Watch mode enabled. Watching for file changes...
```

**URLs disponibles:**
- `http://localhost:4200` - Admin panel
- `http://localhost:4200/admin/moderation-dashboard` - Dashboard de moderación

---

## Terminal 3: Aplicación Móvil (Flutter)

```bash
cd c:\Users\Jairo\Downloads\bedic_project\flutter_app
flutter pub get
flutter run
```

**Esperado:**
```
Running "flutter pub get" in flutter_app...
Resolving dependencies...
Got dependencies!

Launching lib/main.dart on [device]...
```

---

## 🔍 Verificación de Implementaciones Pendientes

Antes de encender los servicios, vamos a validar que todo está implementado:

### Backend - Validar Moderación
```bash
cd c:\Users\Jairo\Downloads\bedic_project\backend
node scripts/validate-moderation.js
```

### Backend - Setup de Moderación
```bash
cd c:\Users\Jairo\Downloads\bedic_project\backend
node scripts/setup-moderation.js
```

### Backend - Pruebas Automatizadas
```bash
cd c:\Users\Jairo\Downloads\bedic_project\backend
npm test -- tests/moderation.test.js
```

---

## 📊 Orden Recomendado

### Paso 1: Validar Implementaciones (Opcional pero recomendado)
```bash
cd backend
node scripts/validate-moderation.js
```

### Paso 2: Abrir Terminal 1 - Backend
```bash
cd backend
npm start
```
**Esperar a ver:** `🚀 Servidor corriendo en http://0.0.0.0:5000`

### Paso 3: Abrir Terminal 2 - Angular
```bash
cd bedic-admin-panel
npm start
```
**Esperar a ver:** `✔ Compiled successfully.`

### Paso 4: Abrir Terminal 3 - Flutter (Opcional)
```bash
cd flutter_app
flutter pub get
flutter run
```

---

## ✅ Checklist de Servicios

Una vez encendidos, verifica:

- [ ] Backend respondiendo en `http://localhost:5000`
- [ ] Angular cargando en `http://localhost:4200`
- [ ] Dashboard de moderación en `http://localhost:4200/admin/moderation-dashboard`
- [ ] Flutter app corriendo en dispositivo/emulador
- [ ] Logs de moderación visibles en dashboard
- [ ] Filtros funcionando en dashboard
- [ ] Exportación de datos disponible

---

## 🧪 Pruebas Rápidas

### Test 1: API Backend
```bash
curl http://localhost:5000
```
**Esperado:** `BEDIC API is running!`

### Test 2: Logs de Moderación
```bash
curl http://localhost:5000/api/admin/moderation/logs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Dashboard de Moderación
```bash
curl http://localhost:5000/api/admin/moderation/dashboard?days=30 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Troubleshooting

### Backend no inicia
```bash
# Verificar que MongoDB está conectado
# Revisar .env en backend/

# Limpiar node_modules y reinstalar
cd backend
rm -r node_modules
npm install
npm start
```

### Angular no compila
```bash
# Limpiar cache de Angular
cd bedic-admin-panel
rm -r node_modules
npm install
npm start
```

### Flutter no corre
```bash
# Verificar que Flutter está instalado
flutter --version

# Obtener dependencias
cd flutter_app
flutter pub get

# Ejecutar
flutter run
```

---

## 📝 Notas Importantes

1. **Orden de inicio:** Backend → Angular → Flutter
2. **Puertos:** Backend (5000), Angular (4200), Flutter (depende del dispositivo)
3. **Variables de entorno:** Asegurar que `backend/.env` está configurado
4. **MongoDB:** Debe estar conectado para que el backend funcione
5. **Tokens:** Para acceder a endpoints de admin, necesitas JWT válido

---

## 🎯 Próximos Pasos

1. Abre 3 terminales
2. Ejecuta los comandos en orden
3. Verifica que todos los servicios están corriendo
4. Accede a `http://localhost:4200/admin/moderation-dashboard`
5. Prueba los filtros y exportación de datos
6. Revisa los logs en la consola de cada servicio

---

## 📚 Documentación Relacionada

- **MODERATION_QUICKSTART.md** - Guía rápida del sistema
- **PRODUCTION_INTEGRATION_GUIDE.md** - Integración completa
- **INTEGRATION_COMPLETE.md** - Resumen de implementación
