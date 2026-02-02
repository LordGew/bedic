const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
// const { importData } = require('./data-importer/controllers/import.controller'); // No necesario - datos manuales
// const { enrichPlacesWithImages } = require('./services/imageEnricher'); // No necesario - imágenes manuales

// Importar middlewares de seguridad y logging
const logger = require('./config/logger');
const { 
  helmetConfig, 
  sanitizeInput, 
  preventNoSQLInjection, 
  requestLogger,
  generalLimiter 
} = require('./middleware/security');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Cargar variables de entorno del archivo .env
dotenv.config();

const app = express();

// ============ MIDDLEWARES DE SEGURIDAD ============

// Helmet para headers de seguridad
app.use(helmetConfig);

// Deshabilitar X-Powered-By
app.disable('x-powered-by');

// CORS configurado
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.ADMIN_URL] 
    : '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser para JSON con límite de tamaño
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests
app.use(requestLogger);

// Sanitización de entrada
app.use(sanitizeInput);

// Prevención de NoSQL injection
app.use(preventNoSQLInjection);

// Rate limiting general (aplicado a todas las rutas)
app.use('/api/', generalLimiter);

// Conexión a MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB conectado exitosamente a Atlas.');
        scheduleImageEnrichmentJob();
    } catch (err) {
        console.error('Error al conectar a MongoDB:', err.message);
        process.exit(1);
    }
};

connectDB();

// Sistema de notificaciones automáticas
const notificationScheduler = require('./services/notificationScheduler');

function scheduleImageEnrichmentJob() {
    // Imágenes manuales - no necesario
    console.log('📸 Enriquecimiento automático de imágenes deshabilitado - se usan imágenes manuales');
    
    // Iniciar scheduler de notificaciones automáticas
    notificationScheduler.start();
}

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const adminAuthRoutes = require('./routes/admin-auth.routes');
const placeRoutes = require('./routes/place.routes');
const placesManagementRoutes = require('./routes/places.routes'); // Nueva API de gestión
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');
const adminExtendedRoutes = require('./routes/admin-extended.routes');
const appealRoutes = require('./routes/appeal.routes'); 
const notificationRoutes = require('./routes/notification.routes');
const eventRoutes = require('./routes/event.routes');
const announcementRoutes = require('./routes/announcement.routes');
const publicRoutes = require('./routes/public.routes');
const referralRoutes = require('./routes/referral.routes');
const titleRoutes = require('./routes/title.routes');
const badgeRoutes = require('./routes/badge.routes');
const scriptActivityRoutes = require('./routes/scriptActivity.routes');
const categoryRoutes = require('./routes/category.routes');
const moderationRoutes = require('./routes/moderation.routes');
const verificationRoutes = require('./routes/verification.routes');

// Definición de Endpoints REST principales
app.use('/api/auth', authRoutes); 
app.use('/api/admin/auth', adminAuthRoutes); // Rutas de autenticación para panel admin
app.use('/api/places', placeRoutes); 
app.use('/api/management/places', placesManagementRoutes); // API de gestión de lugares
app.use('/api/reports', reportRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminExtendedRoutes); // Nuevas rutas extendidas para el panel Angular
app.use('/api/appeals', appealRoutes); 
app.use('/api/public', publicRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/api/ratings', require('./routes/rating.routes'));
app.use('/api/events', eventRoutes);
app.use('/api/recommendations', require('./routes/recommendation.routes'));
app.use('/api/announcements', announcementRoutes);

// Rutas de Gamificación (Referidos, Títulos, Insignias)
app.use('/api/referrals', referralRoutes);
app.use('/api/titles', titleRoutes);
app.use('/api/badges', badgeRoutes);

// Rutas de actividad de scripts
app.use('/api/script-activity', scriptActivityRoutes);

// Rutas de categorías
app.use('/api/categories', categoryRoutes);

// Rutas de moderación automática avanzada
app.use('/api/admin/moderation', moderationRoutes);

// Rutas de verificación de usuarios
app.use('/api/admin/verification', verificationRoutes);
app.use('/api/verification', verificationRoutes);

// Servir archivos estáticos (fotos con marca de agua)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- SOLUCIÓN DE ARRANQUE: Usar un handler directo para /api/import (DESHABILITADO - datos manuales) ---
// app.post('/api/import', importData);

// Endpoint de prueba
app.get('/', (req, res) => {
    res.send('BEDIC API is running!');
});

// ============ MANEJO DE ERRORES ============

// Manejar rutas no encontradas
app.use(notFound);

// Manejador global de errores (debe ser el último middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Crear servidor HTTP
const http = require('http');
const server = http.createServer(app);

// Inicializar WebSocket para notificaciones en tiempo real
const WebSocketService = require('./services/websocket.service');
const wsService = new WebSocketService(server);
global.wsService = wsService;

server.listen(PORT, HOST, () => {
    logger.info(`🚀 Servidor corriendo en http://${HOST}:${PORT}`);
    logger.info(`🔒 Seguridad: Helmet, Rate Limiting y Validación activados`);
    logger.info(`📝 Logging estructurado activado`);
    logger.info(`✅ Sistema 100% autónomo - sin dependencias externas`);
});