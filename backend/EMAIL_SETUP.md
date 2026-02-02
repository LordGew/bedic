# 📧 Configuración de Nodemailer + Gmail

## Paso 1: Preparar tu cuenta Gmail

### Opción A: Usar Contraseña de Aplicación (Recomendado)

1. **Ir a Google Account Security:**
   - Accede a: https://myaccount.google.com/security
   - Inicia sesión si es necesario

2. **Habilitar Verificación en 2 Pasos:**
   - En el panel izquierdo, busca "Verificación en 2 pasos"
   - Sigue las instrucciones para habilitarla
   - Confirma tu número de teléfono

3. **Generar Contraseña de Aplicación:**
   - Vuelve a: https://myaccount.google.com/apppasswords
   - Selecciona "Mail" y "Windows Computer" (o tu dispositivo)
   - Google generará una contraseña de 16 caracteres
   - **Copia esta contraseña** (la necesitarás en el paso 2)

### Opción B: Habilitar Acceso de Aplicaciones Menos Seguras

1. **Ir a Google Account:**
   - Accede a: https://myaccount.google.com/security
   - Busca "Acceso de aplicaciones menos seguras"
   - Actívalo

2. **Usar tu contraseña normal de Gmail**

---

## Paso 2: Configurar Variables de Entorno

1. **Abre el archivo `.env` en la carpeta `backend/`**

2. **Reemplaza estos valores:**

```env
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion
EMAIL_FROM=BEDIC Admin <tu_email@gmail.com>
```

**Ejemplo:**
```env
EMAIL_USER=bedic.admin@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM=BEDIC Admin <bedic.admin@gmail.com>
```

3. **Guarda el archivo**

---

## Paso 3: Instalar Nodemailer

```bash
cd backend
npm install nodemailer
```

---

## Paso 4: Verificar la Configuración

El sistema verificará automáticamente la conexión al iniciar el servidor. Deberías ver:

```
✅ Servicio de email inicializado correctamente
✅ Conexión con Gmail verificada correctamente
```

Si ves errores, verifica:
- ✅ EMAIL_USER es correcto
- ✅ EMAIL_PASSWORD es la contraseña de aplicación (no tu contraseña normal)
- ✅ Verificación en 2 pasos está habilitada
- ✅ Nodemailer está instalado

---

## Paso 5: Probar el Envío de Emails

1. **Registra un nuevo usuario en la aplicación**
2. **Deberías recibir un email de verificación en tu bandeja de entrada**
3. **Si no lo recibes:**
   - Revisa la carpeta de Spam
   - Verifica los logs del servidor para errores
   - Asegúrate de que EMAIL_USER y EMAIL_PASSWORD son correctos

---

## Límites de Gmail

- **Límite de envío:** ~500 emails/día
- **Suficiente para:** Desarrollo, testing y aplicaciones pequeñas
- **Para producción:** Considera usar SendGrid, Mailgun o Resend

---

## Troubleshooting

### Error: "Invalid login credentials"
- Verifica que EMAIL_PASSWORD es la contraseña de aplicación (no tu contraseña normal)
- Regenera la contraseña de aplicación en Google

### Error: "2-step verification required"
- Habilita verificación en 2 pasos en tu cuenta Google

### Emails no llegan
- Revisa la carpeta de Spam
- Verifica los logs del servidor
- Asegúrate de que el EMAIL_USER es correcto

### Quiero cambiar el email de envío
- Edita `EMAIL_USER` y `EMAIL_FROM` en `.env`
- Reinicia el servidor

---

## Seguridad

⚠️ **IMPORTANTE:**
- **NUNCA** hagas commit del archivo `.env` a Git
- **NUNCA** compartas tu contraseña de aplicación
- **NUNCA** uses tu contraseña normal de Gmail en `.env`
- El `.env` debe estar en `.gitignore` (ya está configurado)

---

## Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica que Nodemailer esté instalado: `npm list nodemailer`
3. Asegúrate de que `.env` tiene los valores correctos
4. Reinicia el servidor después de cambiar `.env`
