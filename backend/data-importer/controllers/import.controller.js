const Place = require('../../models/Place');
const { mockPlaces } = require('../mockData');
const osmService = require('../services/osmService'); 

// @desc    Importar y poblar datos (Simulación o API real)
// @route   POST /api/import
// @access  Private/Admin
exports.importData = async (req, res) => {
    // Parámetros para la importación REAL de OSM (si se usa)
    const { lat = 19.43, lon = -99.13, radius = 5000, osm_categories = ['restaurant', 'park', 'cinema'] } = req.body;
    
    // Determinar si usar MOCKS (si NODE_ENV no es 'production' O si se especifica mock=true)
    const isMockRequest = req.query.mock === 'true'; 
    const isProdEnvironment = process.env.NODE_ENV === 'production';
    const executeMocks = isMockRequest || !isProdEnvironment;

    try {
        let placesToImport = [];

        if (executeMocks) {
            // --- LÓGICA DE IMPORTACIÓN SIMULADA (MOCK) ---
            placesToImport = mockPlaces;
            console.log("Modo MOCK: Usando datos internos.");
        
        } else if (isProdEnvironment) {
            // --- LÓGICA DE IMPORTACIÓN REAL (OSM) ---
            console.log(`Modo REAL: Consultando Overpass API en [${lat}, ${lon}]...`);
            
            placesToImport = await osmService.fetchPlaces(
                lat, lon, radius, osm_categories
            );

            if (placesToImport.length === 0) {
                 return res.status(200).json({ success: true, message: 'Consulta de Overpass no devolvió resultados.' });
            }
        
        } else {
             // Fallback si no se especifican mocks y no es producción
             return res.status(501).json({ success: false, message: 'Import endpoint no implementado (Modo Dev sin Mock).' });
        }
        
        // --- PROCESO DE INSERCIÓN/ACTUALIZACIÓN GENERAL ---
        const importResults = await Promise.all(
            placesToImport.map(async (placeData) => {
                const existingPlace = await Place.findOne({ name: placeData.name, category: placeData.category });

                if (!existingPlace) {
                    await Place.create(placeData);
                    return { status: 'created', name: placeData.name, source: placeData.source };
                } else {
                    return { status: 'skipped', name: placeData.name };
                }
            })
        );

        const createdCount = importResults.filter(r => r.status === 'created').length;
        const skippedCount = importResults.filter(r => r.status === 'skipped').length;

        return res.status(200).json({
            success: true,
            message: `Importación completa. ${createdCount} creados, ${skippedCount} omitidos.`,
            data: importResults,
        });

    } catch (error) {
        console.error('Error durante la importación:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor durante la importación.' });
    }
};