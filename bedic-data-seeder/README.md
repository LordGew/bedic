# 🗺️ BEDIC Data Seeder

Sistema **escalable e independiente** para poblar automáticamente la base de datos de BEDIC con lugares reales de Colombia.

## 🎯 Características

- ✅ **Independiente** - No depende del backend principal
- ✅ **Escalable** - Puede poblar 30,000-50,000 lugares
- ✅ **Automático** - Descubrimiento con OpenStreetMap
- ✅ **Enriquecimiento** - Datos completos con Google Places
- ✅ **Programable** - Ejecución automática diaria
- ✅ **Gratuito** - Usa tiers gratuitos de APIs

---

## 📦 Instalación

```bash
cd bedic-data-seeder
npm install
```

---

## ⚙️ Configuración

1. **Copia el archivo de ejemplo:**
```bash
cp .env.example .env
```

2. **Edita `.env` con tus credenciales:**
```env
MONGO_URI=mongodb+srv://...
GOOGLE_PLACES_API_KEY=tu_api_key_aqui
```

---

## 🚀 Uso Rápido

### 1️⃣ Población Inicial (116 lugares)
```bash
npm run seed
```

### 2️⃣ Auto-Descubrimiento OSM (30,000-50,000 lugares)
```bash
npm run discover
```

### 3️⃣ Enriquecimiento con Google (900/día)
```bash
npm run enrich
```

### 4️⃣ Monitoreo en Tiempo Real
```bash
npm run monitor
```

### 5️⃣ Programador Automático (3:00 AM diario)
```bash
npm run scheduler
```

---

## 📊 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run seed` | Población inicial con 116 lugares |
| `npm run discover` | Auto-descubrimiento con OSM |
| `npm run enrich` | Enriquecimiento con Google Places |
| `npm run monitor` | Estadísticas en tiempo real |
| `npm run scheduler` | Programador automático |
| `npm run create-geo-index` | Crear índice geoespacial |
| `npm run clean-duplicates` | Limpiar duplicados |
| `npm run delete-all` | Eliminar todos los lugares |
| `npm run validate-images` | Validar imágenes |
| `npm run convert-images` | Convertir imágenes a WebP |
| `npm run count` | Contar lugares |

---

## 🏙️ Cobertura

### **59 zonas en 20+ ciudades:**

- **Bogotá** (16 zonas)
- **Medellín** (10 zonas)
- **Cali** (8 zonas)
- **Barranquilla** (4 zonas)
- **Cartagena** (4 zonas)
- **Bucaramanga** (4 zonas)
- **Pereira** (3 zonas)
- Y 13 ciudades más...

### **15 categorías:**
Restaurant, Cafe, Bar, Park, Hotel, Shop, Cinema, Museum, Library, Gym, Hospital, Pharmacy, Bank, Supermarket, Shopping Mall

---

## 📋 Flujo de Trabajo Recomendado

### **Fase 1: Población Masiva (1 día)**
```bash
# 1. Crear índice geoespacial
npm run create-geo-index

# 2. Población inicial
npm run seed

# 3. Auto-descubrimiento (30,000-50,000 lugares)
npm run discover

# 4. Monitorear progreso
npm run monitor
```

### **Fase 2: Enriquecimiento (1 mes)**
```bash
# Enriquecer 900 lugares/día (gratis)
npm run enrich

# O automatizar con scheduler
npm run scheduler
```

---

## 🔧 Mantenimiento

### **Limpiar Duplicados**
```bash
npm run clean-duplicates
```

### **Validar Imágenes**
```bash
npm run validate-images
```

### **Convertir Imágenes a WebP**
```bash
npm run convert-images
```

---

## 📊 Resultados Esperados

### **Después de Fase 1 (OSM):**
- 📍 30,000-50,000 lugares reales
- 🏙️ 20+ ciudades cubiertas
- 📋 15 categorías
- 💰 Costo: $0

### **Después de Fase 2 (Google - 1 mes):**
- ⭐ ~25,000 lugares enriquecidos
- 📞 Teléfonos, horarios, sitios web
- 📸 Fotos oficiales
- ⭐ Ratings reales
- 💰 Costo: $0

---

## 🌐 APIs Utilizadas

### **OpenStreetMap Overpass API**
- ✅ **Gratis** - Sin límites
- ✅ **Delay de 2s** entre peticiones
- ✅ **Datos abiertos** de calidad

### **Google Places API**
- ✅ **28,000 peticiones/mes gratis**
- ✅ **900 lugares/día** sin costo
- ✅ **Datos completos** y actualizados

---

## 📖 Documentación Completa

- `scripts/README.md` - Documentación de scripts
- `scripts/POPULATION_GUIDE.md` - Guía detallada de población
- `scripts/POPULATION_SETUP.md` - Setup paso a paso

---

## 🚨 Importante

1. **Ejecuta `create-geo-index` antes** del primer descubrimiento
2. **No ejecutes `delete-all`** en producción
3. **Respeta los límites** de las APIs
4. **Mantén backups** de la base de datos

---

## 💡 Tips

- Ejecuta `discover` en horarios de baja carga
- Usa `scheduler` para automatizar el enriquecimiento
- Monitorea con `npm run monitor` regularmente
- Valida imágenes mensualmente

---

## 📞 Soporte

Para más información, consulta la documentación en `scripts/`.

---

## 📝 Licencia

MIT License - BEDIC Team
