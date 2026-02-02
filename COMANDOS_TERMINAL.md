# 🚀 Comandos para Encender Backend y Angular

## Terminal 1: Backend (Express - Puerto 5000)

```bash
cd c:\Users\Jairo\Downloads\bedic_project\backend
npm start
```

**Resultado esperado:**
```
🚀 Servidor corriendo en http://0.0.0.0:5000
🔒 Seguridad: Helmet, Rate Limiting y Validación activados
📝 Logging estructurado activado
✅ Sistema 100% autónomo
MongoDB conectado exitosamente a Atlas.
```

---

## Terminal 2: Angular Admin Panel (Puerto 4200)

```bash
cd c:\Users\Jairo\Downloads\bedic_project\bedic-admin-panel
npm start
```

**Resultado esperado:**
```
✔ Compiled successfully.
✔ Built successfully.

Application bundle generated successfully.

Watch mode enabled. Watching for file changes...

** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **
```

---

## Acceso a los Servicios

| Servicio | URL |
|---|---|
| Backend API | `http://localhost:5000` |
| Admin Panel | `http://localhost:4200` |
| Dashboard Moderación | `http://localhost:4200/admin/moderation-dashboard` |

---

## Pasos Rápidos

1. **Abre PowerShell/CMD Terminal 1**
   ```
   cd c:\Users\Jairo\Downloads\bedic_project\backend
   npm start
   ```

2. **Abre PowerShell/CMD Terminal 2**
   ```
   cd c:\Users\Jairo\Downloads\bedic_project\bedic-admin-panel
   npm start
   ```

3. **Accede a:**
   - Backend: `http://localhost:5000`
   - Admin: `http://localhost:4200`
   - Dashboard: `http://localhost:4200/admin/moderation-dashboard`

---

## Detener Servicios

**En cualquier terminal:**
```
Ctrl + C
```

---

## Limpiar y Reinstalar (si hay problemas)

### Backend:
```bash
cd c:\Users\Jairo\Downloads\bedic_project\backend
rm -r node_modules
npm install
npm start
```

### Angular:
```bash
cd c:\Users\Jairo\Downloads\bedic_project\bedic-admin-panel
rm -r node_modules
npm install
npm start
```

---

**¡Listo! Ambos servicios estarán corriendo y listos para pruebas.**
