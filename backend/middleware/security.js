const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const logger = require('../config/logger');

// Rate limiter general para toda la API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  message: {
    error: 'Demasiadas peticiones desde esta IP',
    message: 'Por favor intenta de nuevo más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiadas peticiones',
      message: 'Has excedido el límite de peticiones. Por favor intenta más tarde.'
    });
  }
});

// Rate limiter estricto para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // solo 5 intentos de login
  skipSuccessfulRequests: true, // No contar requests exitosos
  message: {
    error: 'Demasiados intentos de inicio de sesión',
    message: 'Por favor intenta de nuevo en 15 minutos'
  },
  handler: (req, res) => {
    logger.warn(`Múltiples intentos de login fallidos desde IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiados intentos',
      message: 'Has excedido el límite de intentos de inicio de sesión. Por favor intenta en 15 minutos.'
    });
  }
});

// Rate limiter para registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // solo 3 registros por hora por IP
  message: {
    error: 'Demasiados registros',
    message: 'Solo puedes crear 3 cuentas por hora'
  },
  handler: (req, res) => {
    logger.warn(`Múltiples intentos de registro desde IP: ${req.ip}`);
    res.status(429).json({
      error: 'Límite de registros excedido',
      message: 'Solo puedes crear 3 cuentas por hora desde esta IP.'
    });
  }
});

// Rate limiter para creación de contenido
const contentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 posts/comentarios por minuto
  message: {
    error: 'Demasiado contenido',
    message: 'Por favor espera un momento antes de publicar más contenido'
  },
  handler: (req, res) => {
    logger.warn(`Spam de contenido detectado desde IP: ${req.ip}`);
    res.status(429).json({
      error: 'Publicando demasiado rápido',
      message: 'Por favor espera un momento antes de publicar más contenido.'
    });
  }
});

// Configuración de Helmet para headers de seguridad
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Permitir recursos externos
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: {
    action: 'deny'
  },
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
});

// Middleware para sanitizar entrada
const sanitizeInput = (req, res, next) => {
  // Sanitizar strings en body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remover caracteres peligrosos
        req.body[key] = req.body[key]
          .replace(/[<>]/g, '') // Remover < y >
          .trim();
      }
    });
  }

  // Sanitizar query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/[<>]/g, '')
          .trim();
      }
    });
  }

  next();
};

// Middleware para prevenir NoSQL injection
const preventNoSQLInjection = (req, res, next) => {
  const checkForInjection = (obj) => {
    if (typeof obj === 'object' && obj !== null) {
      for (let key in obj) {
        // Detectar operadores de MongoDB
        if (key.startsWith('$')) {
          logger.warn(`Posible intento de NoSQL injection detectado: ${key}`);
          return true;
        }
        // Recursivo para objetos anidados
        if (typeof obj[key] === 'object' && checkForInjection(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkForInjection(req.body) || checkForInjection(req.query) || checkForInjection(req.params)) {
    logger.error(`NoSQL injection bloqueado desde IP: ${req.ip}`);
    return res.status(400).json({
      error: 'Solicitud inválida',
      message: 'Los datos enviados contienen caracteres no permitidos'
    });
  }

  next();
};

// Middleware de logging de requests
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    } else {
      logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    }
  });

  next();
};

module.exports = {
  generalLimiter,
  authLimiter,
  registerLimiter,
  contentLimiter,
  helmetConfig,
  sanitizeInput,
  preventNoSQLInjection,
  requestLogger
};
