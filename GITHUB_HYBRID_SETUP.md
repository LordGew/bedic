# 🏗️ Configuración de Repositorio Híbrido (Monorepo + Submódulos)

## Estructura Final

```
bedic/ (Monorepo Principal)
├── .gitmodules
├── .github/
│   ├── workflows/
│   │   ├── backend-tests.yml
│   │   ├── frontend-tests.yml
│   │   └── deploy.yml
│   └── ISSUE_TEMPLATE/
├── backend/ (Submódulo: bedic-backend)
├── bedic-admin-panel/ (Submódulo: bedic-admin-panel)
├── flutter_app/ (Submódulo: bedic-flutter-app)
├── bedic-data-seeder/ (Submódulo: bedic-data-seeder)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SETUP.md
│   ├── DEPLOYMENT.md
│   ├── CONTRIBUTING.md
│   └── TESTING.md
├── .gitignore
├── README.md
├── CHANGELOG.md
├── LICENSE
└── package.json (root)
```

---

## 📋 Paso 1: Crear Repositorios en GitHub

### Repositorio Principal (Monorepo)
- **Nombre:** `bedic`
- **Descripción:** "BEDIC - Geolocalized Collaborative Platform"
- **Privado/Público:** [Tu preferencia]
- **NO** inicializar con README

### Submódulos (Repositorios Independientes)
1. **bedic-backend**
   - Descripción: "BEDIC Backend - Node.js/Express/MongoDB"
   
2. **bedic-admin-panel**
   - Descripción: "BEDIC Admin Panel - Angular Dashboard"
   
3. **bedic-flutter-app**
   - Descripción: "BEDIC Mobile App - Flutter"
   
4. **bedic-data-seeder**
   - Descripción: "BEDIC Data Seeder - Initial Data Setup"

---

## 🔧 Paso 2: Configurar Submódulos Localmente

### 2.1 Inicializar Git en el Monorepo
```bash
cd c:\Users\Jairo\Downloads\bedic_project
git init
git add .
git commit -m "Initial commit: BEDIC platform structure"
```

### 2.2 Agregar Submódulos
```bash
# Agregar backend como submódulo
git submodule add https://github.com/tu-usuario/bedic-backend.git backend

# Agregar admin-panel como submódulo
git submodule add https://github.com/tu-usuario/bedic-admin-panel.git bedic-admin-panel

# Agregar flutter-app como submódulo
git submodule add https://github.com/tu-usuario/bedic-flutter-app.git flutter_app

# Agregar data-seeder como submódulo
git submodule add https://github.com/tu-usuario/bedic-data-seeder.git bedic-data-seeder
```

### 2.3 Crear .gitmodules
```
[submodule "backend"]
	path = backend
	url = https://github.com/tu-usuario/bedic-backend.git

[submodule "bedic-admin-panel"]
	path = bedic-admin-panel
	url = https://github.com/tu-usuario/bedic-admin-panel.git

[submodule "flutter_app"]
	path = flutter_app
	url = https://github.com/tu-usuario/bedic-flutter-app.git

[submodule "bedic-data-seeder"]
	path = bedic-data-seeder
	url = https://github.com/tu-usuario/bedic-data-seeder.git
```

---

## 📤 Paso 3: Hacer Push a GitHub

### 3.1 Conectar Repositorio Principal
```bash
git remote add origin https://github.com/tu-usuario/bedic.git
git branch -M main
git push -u origin main
```

### 3.2 Hacer Push de Submódulos
```bash
# Cada submódulo se hace push automáticamente
# Pero puedes hacerlo manualmente si es necesario

cd backend
git remote add origin https://github.com/tu-usuario/bedic-backend.git
git push -u origin main

cd ../bedic-admin-panel
git remote add origin https://github.com/tu-usuario/bedic-admin-panel.git
git push -u origin main

# ... y así para los otros
```

---

## 🔐 Paso 4: Configurar Protecciones

### En Repositorio Principal (bedic)
1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Require pull request reviews: 1
4. Require status checks to pass: ✓
5. Require branches to be up to date: ✓
6. Dismiss stale pull request approvals: ✓

### En Cada Submódulo
Repetir lo anterior para cada repositorio

---

## 🔑 Paso 5: Configurar Secrets (CI/CD)

### En Repositorio Principal
- Settings → Secrets and variables → Actions

**Secrets a agregar:**
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=tu_jwt_secret
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_app
DOCKER_USERNAME=tu_usuario_docker
DOCKER_PASSWORD=tu_token_docker
```

### En Cada Submódulo
Agregar los mismos secrets

---

## 📝 Paso 6: Crear Archivos Principales

### README.md (Raíz)
```markdown
# BEDIC - Geolocalized Collaborative Platform

Plataforma colaborativa para reportar y gestionar problemas en lugares públicos.

## 📁 Estructura del Proyecto

- **backend/** - API Node.js/Express
- **bedic-admin-panel/** - Dashboard Angular
- **flutter_app/** - Aplicación móvil Flutter
- **bedic-data-seeder/** - Script de datos iniciales
- **docs/** - Documentación

## 🚀 Quick Start

Ver [SETUP.md](docs/SETUP.md)

## 📚 Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Contributing](docs/CONTRIBUTING.md)

## 📄 Licencia

[Tu licencia]
```

### CHANGELOG.md
```markdown
# Changelog

## [1.0.0] - 2026-02-01

### Added
- Sistema de verificación de usuarios (Nivel 1, 2, 4)
- Validación de nombre real
- Verificación de email con Nodemailer + Gmail
- Auto-verificación por reputación temprana
- Componente de gestión de verificación en admin panel
- Pruebas completas del sistema

### Fixed
- Errores de tipado en Angular templates
- Traducción de textos en español

### Changed
- Actualizado modelo User.js con campos de verificación
- Mejorado sistema de autenticación
```

---

## 🔄 Flujo de Trabajo con Submódulos

### Clonar Repositorio con Submódulos
```bash
git clone --recurse-submodules https://github.com/tu-usuario/bedic.git
```

### Actualizar Submódulos
```bash
git submodule update --remote --merge
```

### Hacer Cambios en Submódulo
```bash
cd backend
git checkout -b feature/nueva-feature
# ... hacer cambios ...
git commit -m "feat: nueva feature"
git push origin feature/nueva-feature

# Volver al monorepo
cd ..
git add backend
git commit -m "chore: actualizar backend submódulo"
git push origin main
```

---

## ✅ Checklist Final

- [ ] 5 Repositorios creados en GitHub
- [ ] Submódulos configurados localmente
- [ ] .gitmodules creado
- [ ] Push inicial completado
- [ ] Protecciones de rama configuradas
- [ ] Secrets configurados
- [ ] README.md actualizado
- [ ] CHANGELOG.md creado
- [ ] Documentación en docs/
- [ ] CI/CD workflows configurados

---

## 🎯 Ventajas de Esta Estructura

✅ **Monorepo:** Documentación centralizada, fácil onboarding
✅ **Submódulos:** Repositorios independientes, permisos granulares
✅ **Flexible:** Equipos pueden trabajar independientemente
✅ **Escalable:** Fácil agregar nuevos proyectos
✅ **Profesional:** Estructura lista para producción

---

## 📞 Soporte

Si necesitas ayuda con submódulos:
```bash
# Ver estado de submódulos
git submodule status

# Inicializar submódulos después de clonar
git submodule init
git submodule update

# Actualizar todos los submódulos
git submodule foreach git pull origin main
```
