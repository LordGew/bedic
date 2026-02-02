const winston = require('winston');
const path = require('path');

// Definir niveles de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Definir colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Formato para logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Definir qué nivel usar según el entorno
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Definir transportes
const transports = [
  // Consola
  new winston.transports.Console(),
  
  // Archivo de errores
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
  }),
  
  // Archivo de todos los logs
  new winston.transports.File({ 
    filename: path.join(__dirname, '../logs/all.log') 
  }),
];

// Crear logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

module.exports = logger;
