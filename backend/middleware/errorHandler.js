const logger = require('../config/logger');

// Clase de error personalizado
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Manejo de errores de MongoDB
const handleMongoError = (err) => {
  // Error de duplicado (código 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    return new AppError(
      `El ${field} '${value}' ya está en uso. Por favor usa otro.`,
      400
    );
  }

  // Error de validación
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return new AppError(`Datos inválidos: ${errors.join(', ')}`, 400);
  }

  // Error de cast (ID inválido)
  if (err.name === 'CastError') {
    return new AppError(`ID inválido: ${err.value}`, 400);
  }

  return err;
};

// Manejo de errores de JWT
const handleJWTError = () => {
  return new AppError('Token inválido. Por favor inicia sesión de nuevo.', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Tu sesión ha expirado. Por favor inicia sesión de nuevo.', 401);
};

// Enviar error en desarrollo
const sendErrorDev = (err, res) => {
  logger.error('Error en desarrollo:', {
    status: err.statusCode,
    message: err.message,
    stack: err.stack,
    error: err
  });

  res.status(err.statusCode).json({
    status: 'error',
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Enviar error en producción
const sendErrorProd = (err, res) => {
  // Error operacional confiable: enviar mensaje al cliente
  if (err.isOperational) {
    logger.error('Error operacional:', {
      status: err.statusCode,
      message: err.message
    });

    res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  } 
  // Error de programación o desconocido: no filtrar detalles
  else {
    logger.error('ERROR CRÍTICO:', {
      error: err,
      stack: err.stack
    });

    res.status(500).json({
      status: 'error',
      message: 'Algo salió mal. Por favor intenta de nuevo más tarde.'
    });
  }
};

// Middleware principal de manejo de errores
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Manejar errores específicos
    if (err.code === 11000) error = handleMongoError(err);
    if (err.name === 'ValidationError') error = handleMongoError(err);
    if (err.name === 'CastError') error = handleMongoError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// Middleware para rutas no encontradas
const notFound = (req, res, next) => {
  const error = new AppError(
    `No se encontró la ruta: ${req.originalUrl}`,
    404
  );
  next(error);
};

// Wrapper para funciones async (catch automático)
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Manejo de rechazos no capturados
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Apagando...');
  logger.error(err.name, err.message);
  logger.error(err.stack);
  
  // En producción, dar tiempo para terminar requests pendientes
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Apagando...');
  logger.error(err.name, err.message);
  logger.error(err.stack);
  
  // Apagar inmediatamente
  process.exit(1);
});

module.exports = {
  AppError,
  errorHandler,
  notFound,
  catchAsync
};
