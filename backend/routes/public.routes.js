const express = require('express');
const router = express.Router();
const CommunityPolicy = require('../models/CommunityPolicy');

/**
 * @desc    Obtener política por tipo e idioma
 * @route   GET /api/public/policies/:type/:language
 * @access  Public
 */
router.get('/policies/:type/:language', async (req, res) => {
  try {
    const { type, language } = req.params;

    // Validar que type sea válido
    const validTypes = ['TERMS', 'PRIVACY', 'MODERATION_POLICY', 'APPEALS_PROCESS', 'CODE_OF_CONDUCT'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de política inválido. Debe ser uno de: ${validTypes.join(', ')}`
      });
    }

    const policy = await CommunityPolicy.findOne({
      type,
      language,
      active: true
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Política no encontrada para tipo: ${type}, idioma: ${language}`
      });
    }

    res.status(200).json({
      success: true,
      data: policy
    });
  } catch (err) {
    console.error('Error en GET /policies:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la política'
    });
  }
});

/**
 * @desc    Obtener todas las políticas por idioma
 * @route   GET /api/public/policies/all/:language
 * @access  Public
 */
router.get('/policies/all/:language', async (req, res) => {
  try {
    const { language } = req.params;

    const policies = await CommunityPolicy.find({
      language,
      active: true
    }).select('type title version effectiveDate');

    res.status(200).json({
      success: true,
      data: policies
    });
  } catch (err) {
    console.error('Error en GET /policies/all:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las políticas'
    });
  }
});

/**
 * @desc    Obtener diccionario de palabras prohibidas
 * @route   GET /api/public/moderation/bad-words-dict
 * @access  Public
 */
router.get('/moderation/bad-words-dict', (req, res) => {
  try {
    const badWordsDict = require('../config/badWordsDict');

    res.status(200).json({
      success: true,
      data: badWordsDict
    });
  } catch (err) {
    console.error('Error en GET /bad-words-dict:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el diccionario'
    });
  }
});

module.exports = router;
