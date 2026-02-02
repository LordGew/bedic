# 🧪 Suite de Pruebas - BEDIC Backend

Esta carpeta contiene un conjunto completo de pruebas para evaluar la seguridad, rendimiento y calidad del código del backend de BEDIC.

## 📋 Contenido

### 1. **Prueba de Estrés** (`stress-test.js`)
Simula carga alta con múltiples usuarios concurrentes para identificar:
- Cuellos de botella
- Fugas de memoria
- Problemas de rendimiento
- Límites de capacidad
- Tiempos de respuesta bajo carga

**Métricas evaluadas:**
- Total de requests
- Tasa de éxito/fallo
- Tiempos de respuesta (promedio, min, max, percentiles)
- Throughput (requests/segundo)
- Timeouts

### 2. **Pruebas de Seguridad** (`security-test.js`)
Busca vulnerabilidades comunes de seguridad:
- **Inyección NoSQL**: Intenta inyectar código malicioso en consultas
- **XSS (Cross-Site Scripting)**: Prueba sanitización de entrada
- **Autenticación/Autorización**: Verifica protección de endpoints
- **Rate Limiting**: Prueba límites de peticiones
- **Validación de Entrada**: Verifica validación de datos
- **Exposición de Información**: Busca leaks de información sensible
- **Headers de Seguridad**: Verifica headers HTTP de seguridad
- **CORS**: Verifica configuración de CORS

### 3. **Análisis de Código** (`code-analysis.js`)
Analiza el código fuente en busca de:
- **Secretos Hardcodeados**: Contraseñas, API keys, tokens
- **Malas Prácticas**: console.log, eval(), process.exit()
- **Problemas de Seguridad**: innerHTML, exec(), $where
- **Problemas de Rendimiento**: Loops ineficientes, operaciones bloqueantes
- **Code Smells**: Funciones largas, catch vacíos, TODOs
- **Dependencias Vulnerables**: Ejecuta npm audit
- **Variables de Entorno**: Verifica configuración

### 4. **Ejecutor Maestro** (`run-all-tests.js`)
Ejecuta todas las pruebas en secuencia y genera un reporte consolidado.

## 🚀 Cómo Usar

### Requisitos Previos

1. **Instalar dependencias** (si no están instaladas):
```bash
npm install
```

2. **Configurar variables de entorno**:
Asegúrate de tener un archivo `.env` con:
```env
MONGO_URI=mongodb://localhost:27017/bedic
JWT_SECRET=tu_secreto_jwt
PORT=5000
API_URL=http://localhost:5000/api
```

3. **Servidor en ejecución**:
El servidor debe estar corriendo para las pruebas de estrés y seguridad:
```bash
npm start
```

### Ejecutar Todas las Pruebas

```bash
cd backend/tests
node run-all-tests.js
```

### Ejecutar Pruebas Individuales

#### Prueba de Estrés
```bash
node stress-test.js
```

**Configuración** (editar en el archivo):
```javascript
const TEST_CONFIG = {
  CONCURRENT_USERS: 100,        // Usuarios simultáneos
  TEST_DURATION: 60,            // Duración en segundos
  REQUESTS_PER_SECOND: 2,       // Requests por segundo por usuario
  REQUEST_TIMEOUT: 5000         // Timeout en ms
};
```

#### Pruebas de Seguridad
```bash
node security-test.js
```

Esta prueba no requiere configuración adicional.

#### Análisis de Código
```bash
node code-analysis.js
```

Esta prueba analiza todos los archivos `.js` y `.ts` en el proyecto (excepto `node_modules`).

## 📊 Interpretación de Resultados

### Prueba de Estrés

**Excelente** ✅
- Tasa de éxito ≥ 99%
- Tiempo de respuesta promedio < 200ms
- Sin timeouts

**Bueno** ✅
- Tasa de éxito ≥ 95%
- Tiempo de respuesta promedio < 500ms
- Pocos timeouts

**Aceptable** ⚠️
- Tasa de éxito ≥ 90%
- Tiempo de respuesta promedio < 1000ms
- Algunos timeouts

**Crítico** ❌
- Tasa de éxito < 80%
- Muchos timeouts
- Errores frecuentes

### Pruebas de Seguridad

**Crítico** 🚨
- Vulnerabilidades críticas encontradas
- Inyección SQL/NoSQL exitosa
- Acceso no autorizado permitido
- Tokens inválidos aceptados

**Advertencias** ⚠️
- Falta rate limiting
- Headers de seguridad faltantes
- Validación de entrada débil
- Exposición de información

**Seguro** ✅
- Todas las pruebas pasadas
- Protección contra inyecciones
- Autenticación robusta
- Headers de seguridad presentes

### Análisis de Código

**Crítico** 🚨
- Secretos hardcodeados encontrados
- Credenciales en código
- API keys expuestas

**Problemas** ⚠️
- Múltiples malas prácticas
- Problemas de seguridad
- Code smells

**Limpio** ✅
- Sin secretos hardcodeados
- Pocas malas prácticas
- Código bien estructurado

## 🔧 Solución de Problemas Comunes

### Error: "ECONNREFUSED"
**Causa**: El servidor no está corriendo.
**Solución**: Inicia el servidor con `npm start` antes de ejecutar las pruebas.

### Error: "Cannot find module"
**Causa**: Dependencias no instaladas.
**Solución**: Ejecuta `npm install` en la carpeta `backend`.

### Muchos errores 429 (Too Many Requests)
**Causa**: Rate limiting muy estricto.
**Solución**: Reduce `CONCURRENT_USERS` o `REQUESTS_PER_SECOND` en `stress-test.js`.

### Timeouts frecuentes
**Causa**: Servidor lento o sobrecargado.
**Solución**: 
- Aumenta `REQUEST_TIMEOUT` en `stress-test.js`
- Optimiza consultas a la base de datos
- Considera agregar índices en MongoDB

### Secretos hardcodeados detectados
**Causa**: Credenciales en el código.
**Solución**:
1. Mover todos los secretos a `.env`
2. Agregar `.env` a `.gitignore`
3. Rotar todos los secretos expuestos
4. Usar `process.env.VARIABLE_NAME` en el código

## 📈 Mejores Prácticas

### Antes de Producción

1. **Ejecutar todas las pruebas**:
```bash
node run-all-tests.js
```

2. **Corregir todos los problemas críticos** 🚨

3. **Revisar y corregir advertencias** ⚠️

4. **Verificar que todas las pruebas pasen** ✅

### Desarrollo Continuo

- Ejecuta las pruebas después de cambios importantes
- Integra las pruebas en tu pipeline CI/CD
- Monitorea el rendimiento en producción
- Actualiza las pruebas según nuevas funcionalidades

### Optimización de Rendimiento

Si las pruebas de estrés fallan:

1. **Optimizar consultas a MongoDB**:
   - Agregar índices apropiados
   - Usar proyecciones para limitar campos
   - Implementar paginación

2. **Implementar caché**:
   - Redis para datos frecuentes
   - Caché en memoria para datos estáticos

3. **Escalar horizontalmente**:
   - Múltiples instancias del servidor
   - Load balancer
   - Cluster de MongoDB

### Seguridad

Si las pruebas de seguridad fallan:

1. **Validación de entrada**:
   - Usar bibliotecas como `joi` o `express-validator`
   - Sanitizar todos los inputs del usuario
   - Validar tipos de datos

2. **Autenticación robusta**:
   - JWT con expiración corta
   - Refresh tokens
   - Rate limiting en endpoints de auth

3. **Headers de seguridad**:
   - Usar `helmet` middleware
   - Configurar CORS apropiadamente
   - HTTPS en producción

## 🎯 Objetivos de Calidad

### Mínimos para Producción

- ✅ 0 vulnerabilidades críticas
- ✅ 0 secretos hardcodeados
- ✅ Tasa de éxito ≥ 95% en pruebas de estrés
- ✅ Tiempo de respuesta promedio < 500ms
- ✅ Rate limiting implementado
- ✅ Validación de entrada en todos los endpoints

### Ideales

- ✅ 0 vulnerabilidades de cualquier tipo
- ✅ Tasa de éxito ≥ 99%
- ✅ Tiempo de respuesta promedio < 200ms
- ✅ Headers de seguridad completos
- ✅ Código sin code smells
- ✅ 100% de cobertura de pruebas

## 📞 Soporte

Si encuentras problemas o tienes preguntas:

1. Revisa los logs detallados de cada prueba
2. Verifica la configuración del servidor
3. Asegúrate de que MongoDB esté corriendo
4. Revisa las variables de entorno

## 🔄 Actualización de Pruebas

Para agregar nuevas pruebas:

1. **Pruebas de estrés**: Agrega nuevos escenarios en `testEndpoint()`
2. **Pruebas de seguridad**: Agrega nuevos payloads o pruebas
3. **Análisis de código**: Agrega nuevos patrones en `PATTERNS`

## 📝 Notas Importantes

- Las pruebas de estrés crean usuarios temporales en la base de datos
- Las pruebas de seguridad intentan explotar vulnerabilidades (es normal)
- El análisis de código no modifica ningún archivo
- Todas las pruebas son no destructivas (excepto crear usuarios de prueba)

## 🏆 Checklist de Calidad

Antes de desplegar a producción:

- [ ] Todas las pruebas pasan
- [ ] Sin vulnerabilidades críticas
- [ ] Sin secretos hardcodeados
- [ ] Rate limiting implementado
- [ ] Headers de seguridad configurados
- [ ] Validación de entrada en todos los endpoints
- [ ] Logs estructurados implementados
- [ ] Monitoreo configurado
- [ ] Backups de base de datos configurados
- [ ] Plan de recuperación ante desastres

---

**¡Buena suerte con tus pruebas! 🚀**
