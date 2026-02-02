const CommunityPolicy = require('../models/CommunityPolicy');

/**
 * @desc    Crear o actualizar política comunitaria
 * @route   POST /api/admin/policies
 * @access  Private/Admin
 */
exports.createOrUpdatePolicy = async (req, res) => {
  try {
    const { type, title, content, language, version } = req.body;

    if (!type || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'type, title y content son obligatorios'
      });
    }

    // Buscar política existente
    let policy = await CommunityPolicy.findOne({ type, language });

    if (policy) {
      // Actualizar versión existente
      policy.title = title;
      policy.content = content;
      policy.version = (policy.version || 1) + 1;
      policy.updatedBy = req.user.id;
      policy.effectiveDate = new Date();
    } else {
      // Crear nueva
      policy = await CommunityPolicy.create({
        type,
        title,
        content,
        language: language || 'es',
        version: version || 1,
        updatedBy: req.user.id
      });
    }

    await policy.save();

    res.status(200).json({
      success: true,
      message: policy._id ? 'Política actualizada' : 'Política creada',
      data: policy
    });
  } catch (err) {
    console.error('Error en createOrUpdatePolicy:', err);
    res.status(500).json({
      success: false,
      message: 'Error al guardar la política'
    });
  }
};

/**
 * @desc    Obtener todas las políticas (admin)
 * @route   GET /api/admin/policies
 * @access  Private/Admin
 */
exports.getAllPolicies = async (req, res) => {
  try {
    const policies = await CommunityPolicy.find()
      .populate('updatedBy', 'username email')
      .sort('-updatedAt');

    res.status(200).json({
      success: true,
      count: policies.length,
      data: policies
    });
  } catch (err) {
    console.error('Error en getAllPolicies:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las políticas'
    });
  }
};

/**
 * @desc    Obtener política por ID
 * @route   GET /api/admin/policies/:id
 * @access  Private/Admin
 */
exports.getPolicyById = async (req, res) => {
  try {
    const policy = await CommunityPolicy.findById(req.params.id)
      .populate('updatedBy', 'username email');

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Política no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: policy
    });
  } catch (err) {
    console.error('Error en getPolicyById:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la política'
    });
  }
};

/**
 * @desc    Eliminar política
 * @route   DELETE /api/admin/policies/:id
 * @access  Private/Admin
 */
exports.deletePolicy = async (req, res) => {
  try {
    const policy = await CommunityPolicy.findByIdAndDelete(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Política no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Política eliminada',
      data: {}
    });
  } catch (err) {
    console.error('Error en deletePolicy:', err);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la política'
    });
  }
};

/**
 * @desc    Cambiar estado activo/inactivo de una política
 * @route   PUT /api/admin/policies/:id/toggle
 * @access  Private/Admin
 */
exports.togglePolicyStatus = async (req, res) => {
  try {
    const policy = await CommunityPolicy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Política no encontrada'
      });
    }

    policy.active = !policy.active;
    await policy.save();

    res.status(200).json({
      success: true,
      message: `Política ${policy.active ? 'activada' : 'desactivada'}`,
      data: policy
    });
  } catch (err) {
    console.error('Error en togglePolicyStatus:', err);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado de la política'
    });
  }
};
