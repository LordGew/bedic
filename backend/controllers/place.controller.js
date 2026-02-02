const Place = require('../models/Place');
const User = require('../models/User'); 
const Report = require('../models/Report'); 

// @desc    Obtener lugares (Búsqueda, Filtros y Recomendaciones)
// @route   GET /api/places/search
// @access  Public
exports.searchPlaces = async (req, res) => {
    console.log('searchPlaces called with query:', req.query);
    const { lat, lon, radius = 10000, category, q } = req.query; 

    if (!lat || !lon) {
        return res.status(400).json({ success: false, message: 'Se requieren coordenadas (lat, lon).' });
    }

    try {
        const radiusInMeters = parseInt(radius, 10);
        let query = {};
        let sortQuery = {};

        // 1. FILTRO DE BÚSQUEDA (Palabra Clave)
        if (q) {
            query.$text = { $search: q };
            sortQuery = { score: { $meta: "textScore" } };
        } else {
            sortQuery = { rating: -1 };
        }

        // 2. FILTRO GEOESPACIAL (Cercanía)
        if (!q) {
            query.coordinates = {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lon), parseFloat(lat)]
                    },
                    $maxDistance: radiusInMeters
                }
            };
        }
        
        // 3. FILTRO DE CATEGORÍA (Múltiple)
        if (category) {
            const categories = category.split(','); 
            query.category = { $in: categories };
        }
        
        const places = await Place.find(query).sort(sortQuery).limit(50); 

        res.status(200).json({ 
            success: true, 
            count: places.length,
            data: places
        });

    } catch (error) {
        console.error("Error en búsqueda:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// @desc    Obtener un lugar por ID y sus reportes asociados
// @route   GET /api/places/:id
// @access  Public
exports.getPlace = async (req, res) => {
    console.log('getPlace called with id:', req.params.id);
    try {
        const place = await Place.findById(req.params.id);

        if (!place) {
            return res.status(404).json({ success: false, message: 'Lugar no encontrado.' });
        }

        const reports = await Report.find({ place: req.params.id })
            .populate('user', 'username name') 
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            data: {
                placeDetails: place,
                reports: reports 
            }
        });

    } catch (error) {
        console.error("Error al obtener detalles del lugar:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// @desc    Obtener todas las categorías únicas de lugares
// @route   GET /api/places/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Place.distinct('category');
        
        if (!categories || categories.length === 0) {
            return res.status(200).json({ 
                success: true, 
                data: []
            });
        }

        // Ordenar alfabéticamente
        categories.sort();

        res.status(200).json({ 
            success: true, 
            data: categories
        });

    } catch (error) {
        console.error("Error al obtener categorías:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};