const axios = require('axios');
const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

/**
 * Normaliza un elemento de OpenStreetMap (node/way) al esquema Place.js.
 */
function normalizeToPlace(osmElement) {
    const tags = osmElement.tags;
    if (!tags || !tags.name) return null;

    // Mapeo de categorías (simplificado)
    let category = 'Otros';
    if (tags.amenity === 'restaurant') category = 'Restaurantes';
    else if (tags.leisure === 'park') category = 'Parques';
    else if (tags.amenity === 'cinema') category = 'Cines';
    else if (tags.tourism === 'museum') category = 'Museos';
    else if (tags.leisure === 'fitness_centre' || tags.sport === 'gym') category = 'Gimnasios';
    else if (tags.shop === 'mall') category = 'Centros Comerciales';
    else if (tags.amenity === 'bar') category = 'Bares';

    // Determinar coordenadas
    let lat, lon;
    if (osmElement.lat && osmElement.lon) { // Es un 'node'
        lat = osmElement.lat;
        lon = osmElement.lon;
    } else if (osmElement.center && osmElement.center.lat) { // Es un 'way' o 'relation'
        lat = osmElement.center.lat;
        lon = osmElement.center.lon;
    } else {
        return null; // Geometría no válida
    }
    
    // Construir dirección (si está disponible)
    const address = [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']]
        .filter(Boolean) // Filtrar nulos o undefined
        .join(', ');

    return {
        name: tags.name,
        category: category,
        coordinates: { type: "Point", coordinates: [parseFloat(lon), parseFloat(lat)] },
        address: address || 'Dirección no disponible en OSM',
        rating: 0, // OSM no proporciona ratings
        concurrence: 0, 
        verified: true, // Asumimos que los datos de OSM son verificados
        source: 'OpenStreetMap',
    };
}

/**
 * Consulta la API de Overpass para obtener lugares (nodos, vías y relaciones)
 * basados en un conjunto de filtros (tags) y un radio.
 */
exports.fetchPlaces = async (lat, lon, radius, categoriesMap) => {
    // categoriesMap = { 'amenity': ['restaurant', 'bar'], 'leisure': ['park'] }
    
    // Construir los filtros para la consulta QL
    const filters = Object.entries(categoriesMap)
        .map(([key, values]) => {
            // Genera: (nwr[key=value1](around:radius,lat,lon); nwr[key=value2](around:radius,lat,lon);)
            return values.map(value => `nwr[${key}=${value}](around:${radius},${lat},${lon});`).join('\n');
        })
        .join('\n');

    const overpassQuery = `
        [out:json][timeout:25];
        (
            ${filters}
        );
        out center;
    `;

    try {
        console.log('Enviando consulta a Overpass API...');
        const response = await axios.post(OVERPASS_ENDPOINT, overpassQuery, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && Array.isArray(response.data.elements)) {
            const places = response.data.elements
                .map(normalizeToPlace)
                .filter(p => p !== null); // Filtrar los que no se pudieron normalizar
            
            console.log(`Overpass API devolvió ${places.length} lugares.`);
            return places;
        }
        return [];
    } catch (error) {
        console.error('Error al consultar Overpass API:', error.response ? error.response.data : error.message);
        return [];
    }
};