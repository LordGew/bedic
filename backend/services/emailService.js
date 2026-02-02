// const nodemailer = require('nodemailer'); // No necesario - no enviamos emails

// Servicio de email deshabilitado - no se envían emails
const sendEmail = async (options) => {
    console.warn('[emailService] Servicio de email deshabilitado.');
    console.warn('[emailService] Email que se enviaría a:', options.email, 'Asunto:', options.subject);
    return; // No hacer nada
};

module.exports = sendEmail;