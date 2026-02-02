const Category = require('../models/Category');
const Place = require('../models/Place');

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Obtener todas las categorías
exports.getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const skip = (page - 1) * limit;

    // Construir filtro
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const categories = await Category.find(filter)
      .populate('createdBy', 'username email')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calcular conteo real de lugares por categoría (compat: slug y name)
    // Usamos countDocuments por categoría para evitar inconsistencias por diferentes colecciones/ORM state.
    const categoriesWithCounts = await Promise.all(
      categories.map(async (c) => {
        const obj = c.toObject();
        const slug = obj.slug;
        const name = obj.name;

        const placeCount = await Place.countDocuments({ category: { $in: [slug, name] } });
        return { ...obj, placeCount };
      })
    );

    const total = await Category.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: categoriesWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
    });
  }
};

// Obtener una categoría por ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'username email');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría'
    });
  }
};

// Crear una nueva categoría
exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;

    // Validaciones básicas
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es requerido y debe tener al menos 2 caracteres'
      });
    }

    const trimmedName = name.trim();
    const slug = slugify(trimmedName);

    // Verificar si ya existe una categoría con ese nombre o slug
    const existingCategory = await Category.findOne({
      isActive: true,
      $or: [{ name: trimmedName }, { slug }]
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría activa con ese nombre'
      });
    }

    const category = new Category({
      name: trimmedName,
      slug,
      description: description?.trim(),
      icon: icon || 'category',
      color: color || '#1976d2',
      createdBy: req.user.id
    });

    await category.save();

    // Actualizar conteo de lugares
    const placeCount = await Place.countDocuments({ category: { $in: [category.slug, category.name] } });
    category.placeCount = placeCount;
    await category.save();

    const populatedCategory = await Category.findById(category._id)
      .populate('createdBy', 'username email');

    res.status(201).json({
      success: true,
      data: populatedCategory,
      message: 'Categoría creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear categoría'
    });
  }
};

// Actualizar una categoría
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, icon, color, isActive } = req.body;
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Si se cambia el nombre, verificar que no exista otra categoría con ese nombre o slug
    let newSlug = category.slug;
    if (name && name.trim() !== category.name) {
      const trimmedName = name.trim();
      newSlug = slugify(trimmedName);

      const existingCategory = await Category.findOne({
        isActive: true,
        _id: { $ne: categoryId },
        $or: [{ name: trimmedName }, { slug: newSlug }]
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una categoría activa con ese nombre'
        });
      }
    }

    // Si se cambia el nombre, actualizar todos los lugares que usan esta categoría
    const oldName = category.name;
    const oldSlug = category.slug;
    const newName = name?.trim() || category.name;

    // Actualizar campos
    if (name) {
      category.name = newName;
      category.slug = newSlug;
    }
    if (description !== undefined) category.description = description.trim();
    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    // Si se cambió el nombre/slug, actualizar los lugares a usar el slug (valor estable)
    if (oldName !== newName || oldSlug !== category.slug) {
      await Place.updateMany(
        { category: { $in: [oldSlug, oldName] } },
        { category: category.slug }
      );
    }

    // Actualizar conteo de lugares
    const placeCount = await Place.countDocuments({ category: { $in: [category.slug, category.name] } });
    category.placeCount = placeCount;
    await category.save();

    const updatedCategory = await Category.findById(categoryId)
      .populate('createdBy', 'username email');

    res.status(200).json({
      success: true,
      data: updatedCategory,
      message: 'Categoría actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría'
    });
  }
};

// Eliminar (desactivar) una categoría
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar si hay lugares usando esta categoría
    const placeCount = await Place.countDocuments({ category: { $in: [category.slug, category.name] } });
    
    if (placeCount > 0) {
      // Si hay lugares, desactivar la categoría y mover los lugares a "uncategorized"
      category.isActive = false;
      await category.save();

      await Place.updateMany(
        { category: { $in: [category.slug, category.name] } },
        { category: 'uncategorized' }
      );

      return res.status(200).json({
        success: true,
        message: `Categoría desactivada y ${placeCount} lugares movidos a "uncategorized"`
      });
    } else {
      // Si no hay lugares, eliminar completamente
      await Category.findByIdAndDelete(categoryId);

      return res.status(200).json({
        success: true,
        message: 'Categoría eliminada exitosamente'
      });
    }
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría'
    });
  }
};

// Obtener estadísticas de categorías
exports.getCategoryStats = async (req, res) => {
  try {
    const stats = await Category.aggregate([
      {
        $group: {
          _id: '$isActive',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalPlaces = await Place.countDocuments({ category: { $exists: true, $ne: null } });

    const total = await Category.countDocuments();
    const active = await Category.countDocuments({ isActive: true });
    const inactive = await Category.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        inactive,
        stats,
        totalPlaces
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};
