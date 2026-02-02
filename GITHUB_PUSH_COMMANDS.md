# 🚀 Comandos para Push a GitHub - Usuario: LordGew

## Paso 1: Crear Repositorios en GitHub

Accede a https://github.com/new y crea estos 5 repositorios:

### 1. Repositorio Principal (Monorepo)
- **Nombre:** `bedic`
- **Descripción:** "BEDIC - Geolocalized Collaborative Platform"
- **Privado/Público:** Tu preferencia
- **NO** inicializar con README, .gitignore, o licencia

### 2. Submódulos (Opcional - para estructura completa)
- `bedic-backend`
- `bedic-admin-panel`
- `bedic-flutter-app`
- `bedic-data-seeder`

---

## Paso 2: Ejecutar Comandos de Git

### 2.1 Inicializar Git y hacer Push al Repositorio Principal

```bash
# Navegar a la carpeta del proyecto
cd c:\Users\Jairo\Downloads\bedic_project

# Inicializar Git (si no está ya inicializado)
git init

# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "Initial commit: BEDIC platform with verification system (Level 1, 2, 4)"

# Conectar al repositorio remoto
git remote add origin https://github.com/LordGew/bedic.git

# Cambiar rama a main
git branch -M main

# Hacer push al repositorio
git push -u origin main
```

---

## Paso 3: Configurar Protecciones de Rama

1. Ir a: https://github.com/LordGew/bedic/settings/branches
2. Click en "Add rule"
3. Branch name pattern: `main`
4. Configurar:
   - ✓ Require a pull request before merging
   - ✓ Require status checks to pass before merging
   - ✓ Require branches to be up to date before merging
   - ✓ Dismiss stale pull request approvals when new commits are pushed

---

## Paso 4: Configurar Secrets para CI/CD

1. Ir a: https://github.com/LordGew/bedic/settings/secrets/actions
2. Click en "New repository secret"
3. Agregar estos secrets:

```
Name: MONGO_URI
Value: mongodb+srv://tu_usuario:tu_password@tu_cluster.mongodb.net/bedic

Name: JWT_SECRET
Value: 8825e312a884df0ce71508df2cd7d488501f1786434563f54a86e0daf97f30894e25176ebf60a0e0edcc911ac2c5ee0eb27824b6b2ac24c2fc83ec8bee5485c3

Name: EMAIL_USER
Value: tu_email@gmail.com

Name: EMAIL_PASSWORD
Value: tu_contraseña_de_aplicacion_gmail
```

---

## Paso 5: Crear Estructura Híbrida (Opcional)

Si quieres usar submódulos, ejecuta después de hacer push:

```bash
# Agregar submódulos
git submodule add https://github.com/LordGew/bedic-backend.git backend
git submodule add https://github.com/LordGew/bedic-admin-panel.git bedic-admin-panel
git submodule add https://github.com/LordGew/bedic-flutter-app.git flutter_app
git submodule add https://github.com/LordGew/bedic-data-seeder.git bedic-data-seeder

# Hacer commit de los submódulos
git add .gitmodules
git commit -m "chore: add git submodules"

# Hacer push
git push origin main
```

---

## Verificación Final

Después de hacer push, verifica:

```bash
# Ver estado de Git
git status

# Ver remoto
git remote -v

# Ver ramas
git branch -a

# Ver log
git log --oneline -5
```

---

## URLs de Repositorios

Una vez creados, los repositorios estarán en:

- Principal: https://github.com/LordGew/bedic
- Backend: https://github.com/LordGew/bedic-backend
- Admin Panel: https://github.com/LordGew/bedic-admin-panel
- Flutter App: https://github.com/LordGew/bedic-flutter-app
- Data Seeder: https://github.com/LordGew/bedic-data-seeder

---

## Troubleshooting

### Error: "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/LordGew/bedic.git
```

### Error: "Permission denied (publickey)"
Asegúrate de tener SSH configurado:
```bash
ssh -T git@github.com
```

### Error: "fatal: 'origin' does not appear to be a 'git' repository"
```bash
git init
git remote add origin https://github.com/LordGew/bedic.git
```

---

## Próximos Pasos

1. ✅ Crear repositorios en GitHub
2. ✅ Hacer push del código
3. ✅ Configurar protecciones
4. ✅ Configurar secrets
5. ⏳ Configurar GitHub Actions (CI/CD)
6. ⏳ Invitar colaboradores

---

**Usuario:** LordGew
**Fecha:** 1 de Febrero de 2026
**Estado:** Listo para ejecutar comandos
