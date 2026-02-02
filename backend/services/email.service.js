const nodemailer = require('nodemailer');

/**
 * Servicio de Email usando Nodemailer + Gmail
 * 
 * CONFIGURACIÓN REQUERIDA:
 * 1. Crear cuenta Gmail (si no tienes)
 * 2. Habilitar "Acceso de aplicaciones menos seguras" O usar contraseña de aplicación
 * 3. Agregar a .env:
 *    EMAIL_USER=tu_email@gmail.com
 *    EMAIL_PASSWORD=tu_contraseña_o_contraseña_app
 *    EMAIL_FROM=BEDIC Admin <tu_email@gmail.com>
 */

let transporter = null;

/**
 * Inicializa el transporter de Nodemailer
 */
const initializeEmailService = () => {
  if (transporter) {
    return transporter;
  }

  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    console.warn('⚠️ EMAIL_USER o EMAIL_PASSWORD no configurados en .env');
    console.warn('📧 El servicio de email está deshabilitado');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  });

  console.log('✅ Servicio de email inicializado correctamente');
  return transporter;
};

/**
 * Envía email de verificación de email
 */
const sendEmailVerificationToken = async (user, token) => {
  try {
    const transport = initializeEmailService();

    if (!transport) {
      console.log(`📧 [SIMULADO] Email de verificación enviado a ${user.email}`);
      console.log(`🔗 Token: ${token}`);
      return true;
    }

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}&userId=${user._id}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: '🔐 Verifica tu email - BEDIC',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">BEDIC</h1>
            <p style="margin: 5px 0 0 0;">Verificación de Email</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">¡Hola ${user.name}!</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Gracias por registrarte en BEDIC. Para completar tu registro, necesitamos verificar tu dirección de email.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Verificar Email
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              O copia y pega este código en la aplicación:
            </p>
            
            <div style="background-color: #fff; border: 2px dashed #667eea; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <code style="font-size: 18px; font-weight: bold; color: #667eea; letter-spacing: 2px;">
                ${token}
              </code>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              Este enlace expira en 24 horas.<br>
              Si no solicitaste este email, puedes ignorarlo.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              © 2026 BEDIC. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
      text: `
Hola ${user.name},

Gracias por registrarte en BEDIC. Para completar tu registro, necesitamos verificar tu dirección de email.

Código de verificación: ${token}

O haz clic en este enlace: ${verificationLink}

Este enlace expira en 24 horas.

Si no solicitaste este email, puedes ignorarlo.

© 2026 BEDIC
      `
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Email de verificación enviado a ${user.email}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email de verificación:', error.message);
    return false;
  }
};

/**
 * Envía email de bienvenida después de verificación exitosa
 */
const sendWelcomeEmail = async (user) => {
  try {
    const transport = initializeEmailService();

    if (!transport) {
      console.log(`📧 [SIMULADO] Email de bienvenida enviado a ${user.email}`);
      return true;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: '¡Bienvenido a BEDIC! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">¡Bienvenido a BEDIC!</h1>
            <p style="margin: 5px 0 0 0;">Tu cuenta está lista</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">Hola ${user.name},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              ¡Tu email ha sido verificado exitosamente! Tu cuenta en BEDIC está completamente activa.
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Ahora puedes:
            </p>
            
            <ul style="color: #666; line-height: 1.8;">
              <li>📍 Reportar problemas en lugares</li>
              <li>⭐ Calificar y reseñar lugares</li>
              <li>💬 Participar en la comunidad</li>
              <li>🏆 Ganar insignias y títulos</li>
            </ul>
            
            <p style="color: #666; line-height: 1.6; margin-top: 20px;">
              ¿Preguntas? Visita nuestro centro de ayuda o contacta con soporte.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              © 2026 BEDIC. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
      text: `
Hola ${user.name},

¡Tu email ha sido verificado exitosamente! Tu cuenta en BEDIC está completamente activa.

Ahora puedes:
- Reportar problemas en lugares
- Calificar y reseñar lugares
- Participar en la comunidad
- Ganar insignias y títulos

¿Preguntas? Visita nuestro centro de ayuda o contacta con soporte.

© 2026 BEDIC
      `
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Email de bienvenida enviado a ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error.message);
    return false;
  }
};

/**
 * Envía email de notificación a admin
 */
const sendAdminNotification = async (subject, message, adminEmail) => {
  try {
    const transport = initializeEmailService();

    if (!transport) {
      console.log(`📧 [SIMULADO] Notificación de admin: ${subject}`);
      return true;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: adminEmail,
      subject: `[BEDIC Admin] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #333; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">BEDIC Admin</h1>
            <p style="margin: 5px 0 0 0;">Notificación del Sistema</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">${subject}</h2>
            <p style="color: #666; line-height: 1.6;">${message}</p>
          </div>
        </div>
      `,
      text: `${subject}\n\n${message}`
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Notificación de admin enviada a ${adminEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando notificación de admin:', error.message);
    return false;
  }
};

/**
 * Verifica la conexión con Gmail
 */
const verifyConnection = async () => {
  try {
    const transport = initializeEmailService();

    if (!transport) {
      console.warn('⚠️ Servicio de email no configurado');
      return false;
    }

    await transport.verify();
    console.log('✅ Conexión con Gmail verificada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error verificando conexión con Gmail:', error.message);
    return false;
  }
};

module.exports = {
  initializeEmailService,
  sendEmailVerificationToken,
  sendWelcomeEmail,
  sendAdminNotification,
  verifyConnection
};
