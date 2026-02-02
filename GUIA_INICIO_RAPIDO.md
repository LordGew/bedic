# 🚀 Guía de Inicio Rápido - BDIC

## 📋 Resumen

Esta guía te ayudará a empezar a usar el sistema de gestión de lugares de BDIC en **menos de 10 minutos**.

---

## ✅ Pre-requisitos

Antes de comenzar, asegúrate de tener:

- [x] Node.js instalado (v18+)
- [x] MongoDB corriendo
- [x] Backend iniciado (`npm start`)
- [x] Angular iniciado (`npm start`)
- [x] Usuario admin creado

---

## 🎯 Paso 1: Limpiar Base de Datos (Opcional)

Si quieres empezar desde cero sin lugares de APIs de terceros:

```bash
cd backend

# Ver estadísticas sin eliminar (seguro)
npm run clean-database

# Ejecutar limpieza real
CONFIRM_DELETE=true npm run clean-database
```

**Resultado esperado**:
```
✅ Eliminados: X lugares de Google Places
✅ Eliminados: X lugares de OpenStreetMap
✅ Mantenidos: X lugares creados por admin
```

---

## 🎯 Paso 2: Iniciar Servicios

### Backend:
```bash
cd backend
npm start
```

**Verificar**:
- ✅ Servidor corriendo en http://localhost:5000
- ✅ MongoDB conectado
- ✅ API disponible en http://localhost:5000/api

### Angular:
```bash
cd bedic-admin-panel
npm start
```

**Verificar**:
- ✅ Panel corriendo en http://localhost:4200
- ✅ Compilación exitosa
- ✅ Sin errores en consola

---

## 🎯 Paso 3: Acceder al Panel

1. **Abrir navegador**: http://localhost:4200
2. **Iniciar sesión** con usuario admin
3. **Ir al menú lateral** → "📍 Gestión de Lugares"

**Ruta directa**: http://localhost:4200/dashboard/places-management

---

## 🎯 Paso 4: Crear Tu Primer Lugar

### Ejemplo: Restaurante La Troja (Barranquilla)

1. **Click en "Agregar Nuevo Lugar"**

2. **Llenar Información Básica**:
   ```
   Nombre: Restaurante La Troja
   Categoría: Restaurante
   Descripción: Restaurante de comida costeña tradicional
   ```

3. **Llenar Ubicación**:
   ```
   Departamento: Atlántico
   Ciudad: Barranquilla
   Sector: Norte
   Dirección: Calle 84 #52-45
   ```

4. **Llenar Coordenadas**:
   ```
   Latitud: 10.9685
   Longitud: -74.7813
   ```

   **💡 Tip**: Para obtener coordenadas:
   - Ir a Google Maps
   - Click derecho en el lugar
   - Seleccionar "Copiar coordenadas"
   - Pegar en los campos (formato: `10.9685, -74.7813`)

5. **Seleccionar Imágenes**:
   - Click en "Seleccionar Imágenes"
   - Elegir 1-3 fotos del lugar
   - Ver preview inmediato
   - Máximo 10MB por imagen

6. **Guardar**:
   - Click en "Crear Lugar"
   - Esperar compresión automática
   - ✅ Lugar creado exitosamente

**Tiempo total**: ~1-2 minutos

---

## 🎯 Paso 5: Verificar en la Tabla

Después de crear el lugar, deberías ver:

- ✅ Nombre y dirección
- ✅ Categoría (chip verde)
- ✅ Ubicación (Barranquilla, Atlántico, Norte)
- ✅ Estado (✅ Verificado)
- ✅ Imágenes (contador)
- ✅ Acciones (editar/eliminar)

---

## 🎯 Paso 6: Verificar en Flutter (Opcional)

1. **Abrir Flutter app**
2. **Ir al mapa**
3. **Buscar "Barranquilla"**
4. **Ver el lugar** que acabas de crear
5. **Click en el marcador** para ver detalles

---

## 📊 Estadísticas en Tiempo Real

En la parte superior verás 4 tarjetas:

1. **📊 Total de Lugares**: Contador total
2. **✅ Verificados**: Lugares con verificación
3. **⏳ Pendientes**: Sin verificar
4. **🏙️ Barranquilla**: Contador específico de la ciudad

---

## 🔍 Filtros Disponibles

Puedes filtrar lugares por:

- **Búsqueda**: Nombre o dirección
- **Departamento**: Atlántico, Bogotá D.C., etc.
- **Ciudad**: Barranquilla, Bogotá, etc.
- **Categoría**: Restaurante, Cafetería, etc.
- **Estado**: Verificado / Sin verificar

**Ejemplo de uso**:
```
Departamento: Atlántico
Ciudad: Barranquilla
Categoría: Restaurante
→ Click en "Aplicar"
```

---

## ✏️ Editar un Lugar

1. **Click en el ícono de editar** (lápiz)
2. **Modificar los campos** necesarios
3. **Agregar/Eliminar imágenes**
4. **Click en "Actualizar Lugar"**

---

## 🗑️ Eliminar un Lugar

1. **Click en el ícono de eliminar** (papelera roja)
2. **Confirmar eliminación**
3. **Lugar eliminado** (incluye imágenes)

⚠️ **Advertencia**: Esta acción no se puede deshacer.

---

## 🖼️ Gestión de Imágenes

### Agregar Imágenes:
1. En modo edición o creación
2. Click en "Seleccionar Imágenes"
3. Elegir archivos (múltiples)
4. Ver preview
5. Guardar

### Eliminar Imágenes:
1. En modo edición
2. Ver "Imágenes Actuales"
3. Click en ❌ sobre la imagen
4. Confirmar eliminación

### Compresión Automática:
- ✅ Redimensiona a 1200x1200px
- ✅ Convierte a WebP
- ✅ Calidad 85%
- ✅ Reduce ~90% del tamaño

---

## 📝 Lista de 100 Lugares para Barranquilla

### Categorías Sugeridas:

#### Restaurantes (30 lugares):
```
1. Restaurante La Troja
2. Árabe Internacional
3. Varadero
4. Restaurante Buenavista
5. ... (25 más)
```

#### Cafeterías (15 lugares):
```
1. Juan Valdez Café
2. Starbucks
3. Café Quindío
4. ... (12 más)
```

#### Centros Comerciales (10 lugares):
```
1. Centro Comercial Buenavista
2. Portal del Prado
3. Washington
4. ... (7 más)
```

#### Bancos (10 lugares):
```
1. Bancolombia
2. Banco de Bogotá
3. Davivienda
4. ... (7 más)
```

#### Hospitales/Clínicas (10 lugares):
```
1. Clínica La Asunción
2. Hospital Universidad del Norte
3. Clínica Bautista
4. ... (7 más)
```

#### Parques (10 lugares):
```
1. Parque Cultural del Caribe
2. Parque Washington
3. Parque Sagrado Corazón
4. ... (7 más)
```

#### Hoteles (10 lugares):
```
1. Hotel El Prado
2. GHL Hotel Barranquilla
3. Hilton Garden Inn
4. ... (7 más)
```

#### Otros (5 lugares):
```
1. Aeropuerto Ernesto Cortissoz
2. Terminal de Transportes
3. Estadio Metropolitano
4. ... (2 más)
```

---

## 💡 Tips para Carga Eficiente

### 1. Preparar Datos en Excel:
```
Nombre | Categoría | Dirección | Latitud | Longitud
La Troja | restaurant | Calle 84 #52-45 | 10.9685 | -74.7813
```

### 2. Buscar Coordenadas en Lote:
- Abrir Google Maps
- Buscar lugar
- Click derecho → Copiar coordenadas
- Pegar en Excel

### 3. Descargar Imágenes:
- Google Images → Tamaño grande
- 1-3 fotos por lugar
- Evitar logos/marcas de agua
- Guardar con nombre descriptivo

### 4. Cargar en Sesiones:
- **Sesión 1**: 10 restaurantes
- **Sesión 2**: 10 cafeterías
- **Sesión 3**: 10 comercios
- etc.

### 5. Verificar Cada Lugar:
- Abrir Flutter app
- Buscar en el mapa
- Verificar que aparezca correctamente
- Verificar imágenes

---

## 🐛 Solución de Problemas

### Error: "No se pudo crear lugar"
**Solución**:
- Verificar que el backend esté corriendo
- Verificar conexión a MongoDB
- Revisar logs del backend

### Error: "No se pudo subir imagen"
**Solución**:
- Verificar tamaño de imagen (< 10MB)
- Verificar formato (JPG, PNG, WebP)
- Verificar permisos de carpeta `/uploads`

### No aparece en el mapa de Flutter
**Solución**:
- Verificar coordenadas correctas
- Verificar que la ciudad sea "Barranquilla"
- Hacer hot reload en Flutter
- Verificar filtros en el mapa

### Imágenes no se ven
**Solución**:
- Verificar ruta: http://localhost:5000/uploads/places/...
- Verificar que Sharp esté instalado
- Revisar logs del backend

---

## 📈 Progreso Recomendado

### Semana 1: Barranquilla Básico
- ✅ 30 restaurantes
- ✅ 15 cafeterías
- ✅ 10 centros comerciales
- **Total**: 55 lugares

### Semana 2: Barranquilla Completo
- ✅ 10 bancos
- ✅ 10 hospitales
- ✅ 10 parques
- ✅ 10 hoteles
- ✅ 5 otros
- **Total**: 100 lugares

### Semana 3: Validación
- ✅ Verificar todos los lugares
- ✅ Agregar imágenes faltantes
- ✅ Corregir coordenadas
- ✅ Completar descripciones

### Semana 4: Expansión
- ✅ Comenzar con otra ciudad
- ✅ Replicar proceso

---

## 🎉 ¡Listo!

Ahora tienes todo configurado para empezar a poblar BDIC con lugares propios.

**Próximos pasos**:
1. Crear lista de 100 lugares objetivo
2. Comenzar con restaurantes
3. Cargar 10 lugares por día
4. Verificar en Flutter
5. Expandir a otras categorías

---

## 📞 Comandos Útiles

```bash
# Backend
npm start                    # Iniciar servidor
npm run clean-database       # Ver estadísticas
npm run geocode-locations    # Geocodificar lugares

# Angular
npm start                    # Iniciar panel
npm run build               # Compilar para producción

# Flutter
flutter run                  # Iniciar app
flutter clean               # Limpiar cache
```

---

## 📚 Documentación Adicional

- **API**: `PLAN_GESTION_LUGARES.md`
- **Compresión**: `ALGORITMO_COMPRESION_IMAGENES.md`
- **Rebranding**: `REBRANDING_BDIC.md`

---

**¡Éxito con BDIC! 🚀**

*Fecha: Diciembre 4, 2025*
