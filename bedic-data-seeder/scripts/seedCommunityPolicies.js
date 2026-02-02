/**
 * Script para poblar la BD con políticas de la comunidad
 */

const mongoose = require('mongoose');
const CommunityPolicy = require('../models/CommunityPolicy');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Conectar a MongoDB
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB conectado');
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    }
}

// Políticas predefinidas
const POLICIES = [
    // TÉRMINOS DE SERVICIO
    {
        type: 'TERMS',
        language: 'es',
        title: 'Términos de Servicio',
        content: `
# TÉRMINOS DE SERVICIO DE BEDIC

## 1. Aceptación de Términos
Al acceder y utilizar BEDIC, aceptas estos términos de servicio en su totalidad. Si no estás de acuerdo con alguna parte, no debes usar la plataforma.

## 2. Descripción del Servicio
BEDIC es una plataforma comunitaria que permite a los usuarios:
- Explorar y descubrir lugares
- Compartir experiencias y reseñas
- Reportar problemas y contribuir a la comunidad
- Conectarse con otros usuarios

## 3. Responsabilidades del Usuario
- Proporcionar información precisa y actualizada
- No compartir contenido ilegal, ofensivo o discriminatorio
- Respetar los derechos de otros usuarios
- No intentar acceder a sistemas de forma no autorizada

## 4. Limitación de Responsabilidad
BEDIC no es responsable por:
- Contenido generado por usuarios
- Daños indirectos o incidentales
- Pérdida de datos o interrupciones del servicio

## 5. Modificación de Términos
Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente.

## 6. Terminación
Podemos terminar tu cuenta si violas estos términos o la ley.
        `,
        active: true
    },
    {
        type: 'TERMS',
        language: 'en',
        title: 'Terms of Service',
        content: `
# BEDIC TERMS OF SERVICE

## 1. Acceptance of Terms
By accessing and using BEDIC, you accept these terms of service in their entirety. If you do not agree with any part, you should not use the platform.

## 2. Service Description
BEDIC is a community platform that allows users to:
- Explore and discover places
- Share experiences and reviews
- Report issues and contribute to the community
- Connect with other users

## 3. User Responsibilities
- Provide accurate and updated information
- Not share illegal, offensive or discriminatory content
- Respect the rights of other users
- Not attempt to access systems without authorization

## 4. Limitation of Liability
BEDIC is not responsible for:
- User-generated content
- Indirect or incidental damages
- Data loss or service interruptions

## 5. Modification of Terms
We reserve the right to modify these terms at any time. Changes will take effect immediately.

## 6. Termination
We may terminate your account if you violate these terms or the law.
        `,
        active: true
    },

    // POLÍTICA DE PRIVACIDAD
    {
        type: 'PRIVACY',
        language: 'es',
        title: 'Política de Privacidad',
        content: `
# POLÍTICA DE PRIVACIDAD DE BEDIC

## 1. Información que Recopilamos
- Información de perfil (nombre, email, foto)
- Datos de ubicación
- Contenido que compartes
- Datos de uso y navegación

## 2. Cómo Usamos tu Información
- Mejorar la experiencia del usuario
- Personalizar contenido y recomendaciones
- Comunicarnos contigo
- Cumplir con obligaciones legales

## 3. Protección de Datos
- Usamos encriptación SSL/TLS
- Almacenamos datos en servidores seguros
- Limitamos el acceso a personal autorizado
- Cumplimos con GDPR y leyes locales

## 4. Compartir Información
No vendemos tu información personal. Solo compartimos con:
- Proveedores de servicios necesarios
- Autoridades cuando es requerido por ley
- Otros usuarios según tus configuraciones de privacidad

## 5. Tus Derechos
Tienes derecho a:
- Acceder a tus datos
- Corregir información inexacta
- Solicitar eliminación de datos
- Optar por no recibir comunicaciones

## 6. Contacto
Para preguntas sobre privacidad: privacy@bedic.com
        `,
        active: true
    },
    {
        type: 'PRIVACY',
        language: 'en',
        title: 'Privacy Policy',
        content: `
# BEDIC PRIVACY POLICY

## 1. Information We Collect
- Profile information (name, email, photo)
- Location data
- Content you share
- Usage and navigation data

## 2. How We Use Your Information
- Improve user experience
- Personalize content and recommendations
- Communicate with you
- Comply with legal obligations

## 3. Data Protection
- We use SSL/TLS encryption
- Store data on secure servers
- Limit access to authorized personnel
- Comply with GDPR and local laws

## 4. Sharing Information
We do not sell your personal information. We only share with:
- Necessary service providers
- Authorities when required by law
- Other users according to your privacy settings

## 5. Your Rights
You have the right to:
- Access your data
- Correct inaccurate information
- Request data deletion
- Opt out of communications

## 6. Contact
For privacy questions: privacy@bedic.com
        `,
        active: true
    },

    // POLÍTICA DE MODERACIÓN
    {
        type: 'MODERATION_POLICY',
        language: 'es',
        title: 'Política de Moderación',
        content: `
# POLÍTICA DE MODERACIÓN DE BEDIC

## 1. Principios de Moderación
Mantenemos una comunidad segura y respetuosa mediante:
- Revisión de contenido reportado
- Aplicación consistente de reglas
- Transparencia en decisiones
- Oportunidad de apelación

## 2. Contenido Prohibido
- Lenguaje ofensivo o discriminatorio
- Contenido sexual o violento
- Spam o publicidad no autorizada
- Información personal de otros usuarios
- Contenido ilegal

## 3. Acciones de Moderación
- Advertencia: Primera infracción menor
- Silenciamiento: Restricción temporal (24h - 7 días)
- Suspensión: Restricción extendida (7 - 30 días)
- Baneo: Eliminación permanente de la cuenta

## 4. Proceso de Apelación
Si crees que una acción fue injusta:
1. Envía una apelación desde tu perfil
2. Incluye detalles sobre por qué crees que fue un error
3. Un moderador revisará tu caso
4. Recibirás una respuesta en 48 horas

## 5. Niveles de Severidad
- Leve: Lenguaje inapropiado menor
- Moderado: Contenido ofensivo o spam
- Severo: Acoso, amenazas, contenido ilegal

## 6. Derechos del Usuario
- Ser informado de violaciones
- Conocer la razón de la acción
- Apelar decisiones
- Solicitar revisión por moderador diferente
        `,
        active: true
    },
    {
        type: 'MODERATION_POLICY',
        language: 'en',
        title: 'Moderation Policy',
        content: `
# BEDIC MODERATION POLICY

## 1. Moderation Principles
We maintain a safe and respectful community through:
- Review of reported content
- Consistent application of rules
- Transparency in decisions
- Appeal opportunity

## 2. Prohibited Content
- Offensive or discriminatory language
- Sexual or violent content
- Spam or unauthorized advertising
- Personal information of other users
- Illegal content

## 3. Moderation Actions
- Warning: First minor infraction
- Mute: Temporary restriction (24h - 7 days)
- Suspension: Extended restriction (7 - 30 days)
- Ban: Permanent account removal

## 4. Appeal Process
If you believe an action was unfair:
1. Submit an appeal from your profile
2. Include details about why you think it was a mistake
3. A moderator will review your case
4. You will receive a response within 48 hours

## 5. Severity Levels
- Minor: Minor inappropriate language
- Moderate: Offensive content or spam
- Severe: Harassment, threats, illegal content

## 6. User Rights
- Be informed of violations
- Know the reason for the action
- Appeal decisions
- Request review by different moderator
        `,
        active: true
    },

    // PROCESO DE APELACIONES
    {
        type: 'APPEALS_PROCESS',
        language: 'es',
        title: 'Proceso de Apelaciones',
        content: `
# PROCESO DE APELACIONES DE BEDIC

## 1. ¿Cuándo Puedo Apelar?
Puedes apelar si:
- Recibiste una acción de moderación que crees fue injusta
- Tienes evidencia de que la decisión fue incorrecta
- Crees que se violaron tus derechos

## 2. Cómo Apelar
1. Ve a tu perfil → Configuración → Apelaciones
2. Haz clic en "Nueva Apelación"
3. Selecciona la acción que deseas apelar
4. Explica por qué crees que fue injusta
5. Adjunta evidencia si es necesario
6. Envía la apelación

## 3. Revisión de Apelación
- Un moderador diferente revisará tu caso
- Se considerará toda la evidencia
- Se evaluará la consistencia con políticas
- Recibirás una respuesta en 48-72 horas

## 4. Posibles Resultados
- Apelación Aprobada: Se revierte la acción
- Apelación Parcialmente Aprobada: Se reduce la sanción
- Apelación Rechazada: Se mantiene la acción
- Escalada: Se envía a administrador senior

## 5. Derechos Durante Apelación
- Derecho a ser escuchado
- Derecho a evidencia clara
- Derecho a revisión justa
- Derecho a confidencialidad

## 6. Después de la Apelación
- Si es aprobada, se restaurarán tus permisos
- Si es rechazada, puedes solicitar revisión adicional
- Cada caso se documenta para referencia futura
        `,
        active: true
    },
    {
        type: 'APPEALS_PROCESS',
        language: 'en',
        title: 'Appeals Process',
        content: `
# BEDIC APPEALS PROCESS

## 1. When Can I Appeal?
You can appeal if:
- You received a moderation action you believe was unfair
- You have evidence the decision was incorrect
- You believe your rights were violated

## 2. How to Appeal
1. Go to your profile → Settings → Appeals
2. Click "New Appeal"
3. Select the action you want to appeal
4. Explain why you think it was unfair
5. Attach evidence if necessary
6. Submit the appeal

## 3. Appeal Review
- A different moderator will review your case
- All evidence will be considered
- Consistency with policies will be evaluated
- You will receive a response within 48-72 hours

## 4. Possible Outcomes
- Appeal Approved: Action is reversed
- Appeal Partially Approved: Sanction is reduced
- Appeal Rejected: Action is maintained
- Escalation: Sent to senior administrator

## 5. Rights During Appeal
- Right to be heard
- Right to clear evidence
- Right to fair review
- Right to confidentiality

## 6. After Appeal
- If approved, your permissions will be restored
- If rejected, you can request additional review
- Each case is documented for future reference
        `,
        active: true
    },

    // CÓDIGO DE CONDUCTA
    {
        type: 'CODE_OF_CONDUCT',
        language: 'es',
        title: 'Código de Conducta',
        content: `
# CÓDIGO DE CONDUCTA DE BEDIC

## 1. Respeto y Dignidad
- Trata a todos con respeto independientemente de su origen
- No hagas acoso, intimidación o amenazas
- Respeta las opiniones diferentes
- Evita lenguaje ofensivo o discriminatorio

## 2. Integridad
- Sé honesto en tus contribuciones
- No compartas información falsa
- Cita fuentes cuando sea apropiado
- Admite errores cuando los cometas

## 3. Seguridad
- No compartas información personal de otros
- No intentes acceder a cuentas no autorizadas
- Reporta contenido peligroso o ilegal
- Protege tu propia información

## 4. Comunidad
- Contribuye positivamente
- Ayuda a otros usuarios
- Participa en discusiones constructivas
- Reporta problemas a los moderadores

## 5. Responsabilidad
- Eres responsable de tu contenido
- Comprende las consecuencias de tus acciones
- Aprende de retroalimentación
- Mejora continuamente

## 6. Consecuencias
Las violaciones pueden resultar en:
- Advertencias
- Silenciamiento temporal
- Suspensión de cuenta
- Baneo permanente
- Acciones legales si es necesario

## 7. Ejemplos de Buen Comportamiento
- Compartir reseñas honestas y útiles
- Ayudar a nuevos usuarios
- Reportar contenido problemático
- Participar en debates respetuosos
- Reconocer contribuciones de otros
        `,
        active: true
    },
    {
        type: 'CODE_OF_CONDUCT',
        language: 'en',
        title: 'Code of Conduct',
        content: `
# BEDIC CODE OF CONDUCT

## 1. Respect and Dignity
- Treat everyone with respect regardless of background
- Do not harass, intimidate or threaten
- Respect different opinions
- Avoid offensive or discriminatory language

## 2. Integrity
- Be honest in your contributions
- Do not share false information
- Cite sources when appropriate
- Admit mistakes when you make them

## 3. Safety
- Do not share personal information of others
- Do not attempt to access unauthorized accounts
- Report dangerous or illegal content
- Protect your own information

## 4. Community
- Contribute positively
- Help other users
- Participate in constructive discussions
- Report problems to moderators

## 5. Accountability
- You are responsible for your content
- Understand the consequences of your actions
- Learn from feedback
- Continuously improve

## 6. Consequences
Violations may result in:
- Warnings
- Temporary muting
- Account suspension
- Permanent ban
- Legal action if necessary

## 7. Examples of Good Behavior
- Share honest and useful reviews
- Help new users
- Report problematic content
- Participate in respectful debates
- Acknowledge contributions of others
        `,
        active: true
    }
];

// Función para poblar
async function seedData() {
    try {
        console.log('\n🌱 Poblando políticas de la comunidad...\n');

        let createdCount = 0;

        // Insertar o actualizar políticas
        for (const policy of POLICIES) {
            await CommunityPolicy.updateOne(
                { type: policy.type, language: policy.language },
                { $set: policy },
                { upsert: true }
            );
            createdCount++;
        }

        console.log(`✅ ${createdCount} políticas creadas/actualizadas`);

        console.log('\n✅ Población completada exitosamente\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error poblando datos:', error);
        process.exit(1);
    }
}

// Ejecutar
connectDB().then(() => seedData());
