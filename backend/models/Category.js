const mongoose = require('mongoose');

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const CategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 200
  },
  icon: { 
    type: String, 
    trim: true,
    default: 'category'
  },
  color: { 
    type: String, 
    trim: true,
    default: '#1976d2'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  placeCount: { 
    type: Number, 
    default: 0 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { 
  timestamps: true 
});

// Índices para mejor rendimiento
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ createdBy: 1 });

CategorySchema.pre('validate', function(next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = slugify(this.name);
  }
  next();
});

// Middleware para actualizar el conteo de lugares
CategorySchema.pre('save', async function(next) {
  if (this.isModified('isActive') && !this.isActive) {
    // Si se desactiva la categoría, actualizar todos los lugares
    const Place = mongoose.model('Place');
    await Place.updateMany(
      { category: { $in: [this.slug, this.name] } },
      { category: 'uncategorized' }
    );
  }
  next();
});

// Método estático para actualizar conteo de lugares
CategorySchema.statics.updatePlaceCounts = async function() {
  const Place = mongoose.model('Place');
  const categories = await this.find({ isActive: true });
  
  for (const category of categories) {
    const count = await Place.countDocuments({ category: { $in: [category.slug, category.name] } });
    category.placeCount = count;
    await category.save();
  }
};

module.exports = mongoose.model('Category', CategorySchema);
