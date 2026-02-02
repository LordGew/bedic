const Joi = require('joi');
const logger = require('../config/logger');

// Esquemas de validación comunes
const schemas = {
  // Registro de usuario
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.pattern.base': 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      }),
    acceptedTerms: Joi.boolean().valid(true).required(),
    acceptedPrivacy: Joi.boolean().valid(true).required(),
    referralCode: Joi.string().optional().allow('', null),
    darkMode: Joi.boolean().optional()
  }),

  // Login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Actualizar perfil
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    bio: Joi.string().max(500).optional().allow('', null),
    avatar: Joi.string().uri().optional().allow('', null),
    preferences: Joi.object({
      darkMode: Joi.boolean().optional(),
      language: Joi.string().valid('es', 'en').optional(),
      notifications: Joi.boolean().optional()
    }).optional()
  }),

  // Rating/Comentario
  rating: Joi.object({
    placeId: Joi.string().hex().length(24).required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(1000).optional().allow('', null),
    images: Joi.array().items(Joi.string().uri()).max(5).optional()
  }),

  // Reporte
  report: Joi.object({
    contentType: Joi.string().valid('comment', 'rating', 'place', 'user').required(),
    contentId: Joi.string().hex().length(24).required(),
    reason: Joi.string().max(200).required(),
    description: Joi.string().max(1000).optional().allow('', null)
  }),

  // ID de MongoDB
  mongoId: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),

  // Búsqueda de lugares
  searchPlaces: Joi.object({
    query: Joi.string().max(100).optional(),
    lat: Joi.number().min(-90).max(90).optional(),
    lng: Joi.number().min(-180).max(180).optional(),
    radius: Joi.number().min(100).max(50000).optional(),
    category: Joi.string().max(50).optional(),
    limit: Joi.number().min(1).max(100).optional(),
    page: Joi.number().min(1).optional()
  }),

  // Anuncio
  announcement: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    content: Joi.string().min(10).max(2000).required(),
    type: Joi.string().valid('info', 'warning', 'event', 'promotion').required(),
    targetAudience: Joi.string().valid('all', 'verified', 'premium').optional(),
    expiresAt: Joi.date().greater('now').optional(),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
      radius: Joi.number().min(100).max(50000).required()
    }).optional()
  })
};

// Middleware de validación
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      logger.error(`Schema de validación no encontrado: ${schemaName}`);
      return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    // Determinar qué validar (body, params, query)
    let dataToValidate = req.body;
    
    if (schemaName === 'mongoId') {
      dataToValidate = { id: req.params.id || req.params.userId || req.params.placeId };
    } else if (schemaName === 'searchPlaces') {
      dataToValidate = req.query;
    }

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Retornar todos los errores
      stripUnknown: true // Remover campos no definidos en el schema
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn(`Validación fallida en ${schemaName}:`, errors);

      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors
      });
    }

    // Reemplazar datos con los validados y sanitizados
    if (schemaName === 'searchPlaces') {
      req.query = value;
    } else if (schemaName !== 'mongoId') {
      req.body = value;
    }

    next();
  };
};

// Validación personalizada para IDs de MongoDB
const validateMongoId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      logger.warn(`ID de MongoDB inválido: ${id}`);
      return res.status(400).json({ 
        error: 'ID inválido',
        message: 'El ID proporcionado no es válido'
      });
    }
    
    next();
  };
};

module.exports = {
  validate,
  validateMongoId,
  schemas
};
