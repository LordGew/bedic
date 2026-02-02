// controllers/places.controller.js
const Place = require('../models/Place');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// OBTENER TODOS LOS LUGARES (con filtros)
exports.getAllPlaces = async (req, res) => {
    try {
        const { 
            city, 
            department, 
            category, 
            verified, 
            page = 1, 
            limit = 50,
            search 
        } = req.query;

        const query = {};
        
        if (city) query.city = city;
        if (department) query.department = department;
        if (category) query.category = category;
        if (verified !== undefined) query.verified = verified === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        
        const places = await Place.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Place.countDocuments(query);

        res.status(200).json({
            success: true,
            data: places,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error getting places:', error);
        res.status(500).json({ success: false, message: 'Error al obtener lugares' });
    }
};

// OBTENER LUGAR POR ID
exports.getPlaceById = async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);
        
        if (!place) {
            return res.status(404).json({ success: false, message: 'Lugar no encontrado' });
        }

        res.status(200).json({ success: true, data: place });
    } catch (error) {
        console.error('Error getting place:', error);
        res.status(500).json({ success: false, message: 'Error al obtener lugar' });
    }
};

// CREAR NUEVO LUGAR
exports.createPlace = async (req, res) => {
    try {
        const {
            name,
            category,
            description,
            latitude,
            longitude,
            address,
            city,
            department,
            sector
        } = req.body;

        // Validar campos requeridos
        if (!name || !category || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, categoría, latitud y longitud son requeridos'
            });
        }

        // Crear lugar
        const place = new Place({
            name: name.trim(),
            category,
            description: description?.trim(),
            coordinates: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            address: address?.trim(),
            city: city?.trim(),
            department: department?.trim(),
            sector: sector?.trim(),
            source: 'Community',
            adminCreated: true,
            verified: false, // Los lugares deben verificarse manualmente
            officialImages: []
        });

        await place.save();

        res.status(201).json({
            success: true,
            message: 'Lugar creado exitosamente',
            data: place
        });
    } catch (error) {
        console.error('Error creating place:', error);
        res.status(500).json({ success: false, message: 'Error al crear lugar' });
    }
};

// ACTUALIZAR LUGAR
exports.updatePlace = async (req, res) => {
    try {
        const {
            name,
            category,
            description,
            latitude,
            longitude,
            address,
            city,
            department,
            sector,
            verified
        } = req.body;

        const place = await Place.findById(req.params.id);
        
        if (!place) {
            return res.status(404).json({ success: false, message: 'Lugar no encontrado' });
        }

        // Actualizar campos
        if (name) place.name = name.trim();
        if (category) place.category = category;
        if (description !== undefined) place.description = description?.trim();
        if (address !== undefined) place.address = address?.trim();
        if (city !== undefined) place.city = city?.trim();
        if (department !== undefined) place.department = department?.trim();
        if (sector !== undefined) place.sector = sector?.trim();
        if (verified !== undefined) place.verified = verified;

        // Actualizar coordenadas si se proporcionan
        if (latitude && longitude) {
            place.coordinates = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            };
        }

        await place.save();

        res.status(200).json({
            success: true,
            message: 'Lugar actualizado exitosamente',
            data: place
        });
    } catch (error) {
        console.error('Error updating place:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar lugar' });
    }
};

// ELIMINAR LUGAR
exports.deletePlace = async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);
        
        if (!place) {
            return res.status(404).json({ success: false, message: 'Lugar no encontrado' });
        }

        // Eliminar imágenes asociadas
        if (place.officialImages && place.officialImages.length > 0) {
            for (const imagePath of place.officialImages) {
                try {
                    const fullPath = path.join(__dirname, '..', imagePath);
                    await fs.unlink(fullPath);
                } catch (err) {
                    console.error('Error deleting image:', err);
                }
            }
        }

        await Place.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Lugar eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error deleting place:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar lugar' });
    }
};

// SUBIR IMAGEN PARA LUGAR
exports.uploadPlaceImage = async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);
        
        if (!place) {
            return res.status(404).json({ success: false, message: 'Lugar no encontrado' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se proporcionó imagen' });
        }

        // Crear directorio si no existe
        const uploadDir = path.join(__dirname, '..', 'uploads', 'places');
        await fs.mkdir(uploadDir, { recursive: true });

        // Comprimir y optimizar imagen con sharp
        // Usar WebP para mejor compatibilidad con Flutter/Web
        const imageBuffer = req.file.buffer;
        const fileSize = imageBuffer.length;
        
        console.log(`📸 Procesando imagen: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
        
        const webpFilename = `${place._id}_${Date.now()}.webp`;
        const webpPath = path.join(uploadDir, webpFilename);
        
        await sharp(imageBuffer)
            .resize(1200, 1200, { 
                fit: 'inside',
                withoutEnlargement: true 
            })
            .webp({ 
                quality: 85,
                effort: 6 
            })
            .toFile(webpPath);
        
        const relativePath = `/uploads/places/${webpFilename}`;
        console.log(`✅ Imagen guardada en WebP: ${webpFilename}`);

        // Guardar ruta en la base de datos
        place.officialImages.push(relativePath);
        await place.save();

        res.status(200).json({
            success: true,
            message: 'Imagen subida exitosamente',
            data: {
                path: relativePath,
                place: place
            }
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ success: false, message: 'Error al subir imagen' });
    }
};

// ELIMINAR IMAGEN DE LUGAR
exports.deletePlaceImage = async (req, res) => {
    try {
        const { id, imagePath } = req.params;
        
        const place = await Place.findById(id);
        
        if (!place) {
            return res.status(404).json({ success: false, message: 'Lugar no encontrado' });
        }

        // Eliminar de array
        place.officialImages = place.officialImages.filter(img => img !== imagePath);
        await place.save();

        // Eliminar archivo físico
        try {
            const fullPath = path.join(__dirname, '..', imagePath);
            await fs.unlink(fullPath);
        } catch (err) {
            console.error('Error deleting file:', err);
        }

        res.status(200).json({
            success: true,
            message: 'Imagen eliminada exitosamente',
            data: place
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar imagen' });
    }
};

// OBTENER ESTADÍSTICAS DE LUGARES
exports.getPlacesStats = async (req, res) => {
    try {
        const total = await Place.countDocuments();
        const verified = await Place.countDocuments({ verified: true });
        const byCity = await Place.aggregate([
            { $match: { city: { $exists: true, $ne: null, $ne: '' } } },
            { $group: { _id: '$city', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const byCategory = await Place.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                total,
                verified,
                unverified: total - verified,
                byCity: byCity.map(c => ({ city: c._id, count: c.count })),
                byCategory: byCategory.map(c => ({ category: c._id, count: c.count }))
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
};

// OBTENER CIUDADES DISPONIBLES
exports.getCities = async (req, res) => {
    try {
        const cities = await Place.distinct('city', { 
            city: { $exists: true, $ne: null, $ne: '' } 
        });
        
        res.status(200).json({
            success: true,
            data: cities.sort()
        });
    } catch (error) {
        console.error('Error getting cities:', error);
        res.status(500).json({ success: false, message: 'Error al obtener ciudades' });
    }
};

// OBTENER CATEGORÍAS DISPONIBLES
exports.getCategories = async (req, res) => {
    try {
        const categories = await Place.distinct('category');
        
        res.status(200).json({
            success: true,
            data: categories.sort()
        });
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ success: false, message: 'Error al obtener categorías' });
    }
};
