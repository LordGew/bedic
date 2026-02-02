# 🚀 INSTRUCCIONES DE EJECUCIÓN - BEDIC

## ✅ Estado Actual

### **Backend** 
- ✅ **Corriendo** en `http://localhost:5000`
- ✅ Conectado a MongoDB Atlas
- ✅ Script de población ejecutándose en segundo plano

### **Base de Datos**
- 🔄 **Importando lugares** desde OpenStreetMap
- 📍 Ciudades: Bogotá (3 zonas), Medellín (2 zonas), Cali, Cartagena, Barranquilla
- 🖼️ Imágenes placeholder asignadas automáticamente

---

## 🎯 Para Ejecutar el Frontend

### **Opción 1: Desde PowerShell**
```powershell
cd C:\Users\Jairo\Downloads\bedic_project\flutter_app
flutter run -d edge
```

### **Opción 2: Desde CMD**
```cmd
cd C:\Users\Jairo\Downloads\bedic_project\flutter_app
flutter run -d edge
```

### **Opción 3: Desde VS Code**
1. Abre la carpeta `flutter_app` en VS Code
2. Presiona `F5` o usa el menú `Run > Start Debugging`
3. Selecciona `edge` como dispositivo

---

## 📊 Verificar Importación de Lugares

### **Opción 1: Desde la API**
```bash
curl http://localhost:5000/api/places/search?lat=4.6097&lon=-74.0817&radius=5000
```

### **Opción 2: Desde el Frontend**
1. Ejecuta el frontend
2. Inicia sesión con tu cuenta
3. Ve al mapa
4. Deberías ver múltiples marcadores de lugares importados

---

## 🔧 Funcionalidades Implementadas

### **1. Importación Automática de Lugares**

#### **Archivos Creados:**
- ✅ `backend/services/osmImporter.js` - Importador desde OpenStreetMap
- ✅ `backend/services/imageEnricher.js` - Enriquecedor de imágenes
- ✅ `backend/scripts/populateDatabase.js` - Script de población

#### **Endpoints Nuevos:**
- `POST /api/admin/import-osm` - Importar lugares desde OSM
- `POST /api/admin/enrich-images` - Enriquecer con imágenes

#### **Uso desde Postman/cURL:**
```bash
# Importar lugares de una ubicación específica
curl -X POST http://localhost:5000/api/admin/import-osm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -d '{
    "lat": 4.6097,
    "lon": -74.0817,
    "radius": 5
  }'

# Enriquecer lugares con imágenes
curl -X POST http://localhost:5000/api/admin/enrich-images \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -d '{
    "limit": 30
  }'
```

---

### **2. Pin Personalizable en el Mapa**

#### **Cómo Usar:**
1. Abre el mapa en la app
2. Presiona el botón de **pin rojo** (📌) en la esquina inferior izquierda
3. Se colocará un pin en el centro actual del mapa
4. Automáticamente buscará lugares en esa área
5. Arrastra el mapa para mover el pin
6. Presiona el pin nuevamente para buscar en la nueva ubicación
7. Toca el pin para eliminarlo

#### **Archivos Modificados:**
- ✅ `flutter_app/lib/screens/map_screen.dart`
  - Función `_searchInCustomArea()` (líneas 605-643)
  - Marcador visual del pin (líneas 1030-1061)
  - Botón flotante con tooltip (líneas 1184-1208)

---

### **3. Traducciones Completas al Inglés**

#### **Archivos Modificados:**
- ✅ `flutter_app/assets/i18n/en.json` - 17 nuevas claves
- ✅ `flutter_app/assets/i18n/es.json` - 17 nuevas claves
- ✅ `flutter_app/lib/screens/place_detail_screen.dart` - Todos los textos traducidos
- ✅ `flutter_app/lib/screens/map_screen.dart` - Popups y tooltips traducidos

#### **Nuevas Traducciones:**
- Tabs de detalles de lugares (Información, Reportes, Eventos, Calificaciones)
- Botones y tooltips
- Mensajes de búsqueda por área
- Badges oficiales

---

### **4. Documentación del Algoritmo de Recomendación**

#### **Archivo Creado:**
- ✅ `ALGORITMO_RECOMENDACION.md` - Documentación completa

#### **Contenido:**
- Explicación del funcionamiento
- Arquitectura backend y frontend
- Flujo de captura de interacciones
- Ejemplo práctico con cálculos
- Propuestas de mejoras futuras

---

## 📈 Datos Importados

### **Categorías Disponibles:**
- 🍽️ Restaurante
- ☕ Cafetería
- 🍺 Bar
- 🌳 Parque
- 🏛️ Museo
- 🏨 Hotel
- 🏪 Tienda / Supermercado
- 🏦 Banco
- 💊 Farmacia
- 🎬 Cine
- 🎭 Teatro
- 📚 Biblioteca
- ⚽ Centro Deportivo / Estadio
- 🎨 Galería / Arte
- 🏖️ Atracción Turística

### **Ciudades Cubiertas:**
1. **Bogotá** (3 zonas)
   - Centro (3km radio)
   - Norte - Usaquén (2km radio)
   - Chapinero (2km radio)

2. **Medellín** (2 zonas)
   - Centro (3km radio)
   - Poblado (2km radio)

3. **Cali** - Centro (3km radio)

4. **Cartagena** - Centro Histórico (2km radio)

5. **Barranquilla** - Centro (2km radio)

---

## 🔄 Re-ejecutar Importación

Si quieres importar más lugares o actualizar los existentes:

```bash
cd C:\Users\Jairo\Downloads\bedic_project\backend
node scripts/populateDatabase.js
```

**Nota:** El script detecta duplicados automáticamente usando `externalId`, así que es seguro ejecutarlo múltiples veces.

---

## 🖼️ Configurar Imágenes Reales (Opcional)

Para usar imágenes reales de Unsplash en lugar de placeholders:

1. Crea una cuenta en [Unsplash Developers](https://unsplash.com/developers)
2. Crea una nueva aplicación
3. Copia tu Access Key
4. Añade a `.env`:
   ```
   UNSPLASH_ACCESS_KEY=tu_access_key_aqui
   ```
5. Ejecuta:
   ```bash
   node scripts/populateDatabase.js
   ```

**Límites gratuitos de Unsplash:**
- 50 requests/hora
- 5000 requests/mes

---

## 🐛 Solución de Problemas

### **El frontend no encuentra Flutter**
```powershell
# Verifica que Flutter esté en el PATH
flutter --version

# Si no está, añade Flutter al PATH o usa la ruta completa
C:\path\to\flutter\bin\flutter run -d edge
```

### **No se ven lugares en el mapa**
1. Verifica que el backend esté corriendo en `http://localhost:5000`
2. Verifica que el script de población haya terminado exitosamente
3. Revisa la consola del navegador para errores de API
4. Asegúrate de que el usuario tenga permisos de ubicación

### **Error de CORS**
El backend ya tiene CORS configurado para `http://localhost:*`. Si usas otro puerto, añádelo en `server.js`.

---

## 📝 Próximos Pasos Sugeridos

1. **Ejecutar el frontend** con el comando de arriba
2. **Probar el pin personalizable** en el mapa
3. **Cambiar idioma a inglés** para verificar traducciones
4. **Explorar lugares importados** en diferentes ciudades
5. **Leer la documentación** del algoritmo de recomendación

---

## 💡 Tips

- El script de población puede tardar 5-10 minutos dependiendo de la conexión
- Los lugares se importan con rating inicial de 3.5
- Las imágenes placeholder son de Unsplash (no requieren API key)
- Puedes importar más ciudades editando `scripts/populateDatabase.js`

---

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs del backend en la consola
2. Revisa los logs del frontend en DevTools del navegador
3. Verifica que MongoDB Atlas esté accesible
4. Asegúrate de que todas las dependencias estén instaladas

---

**¡Listo para usar! 🎉**
