/**
 * Script para poblar la base de datos con lugares de Colombia
 * Se ejecuta cada 24 horas automáticamente
 * Obtiene lugares de Google Places API y OpenStreetMap
 * Descarga imágenes y aplica marca de agua
 */

const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const sharp = require('sharp');
const Place = require('../models/Place');
require('dotenv').config();

// Configuración
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;
const IMAGES_DIR = path.join(__dirname, '../uploads/places');

// Categorías de lugares en Colombia
const PLACE_CATEGORIES = [
    'restaurant',
    'cafe',
    'bar',
    'hotel',
    'park',
    'museum',
    'shopping_mall',
    'supermarket',
    'pharmacy',
    'hospital',
    'gym',
    'cinema',
    'library',
    'bank',
    'atm',
    'gas_station',
    'parking',
    'taxi_stand',
    'bus_station',
    'train_station'
];

// Ciudades principales de Colombia con coordenadas
const COLOMBIAN_CITIES = [
    { name: 'Bogotá', lat: 4.7110, lng: -74.0055, radius: 15000 },
    { name: 'Medellín', lat: 6.2442, lng: -75.5812, radius: 15000 },
    { name: 'Cali', lat: 3.4372, lng: -76.5069, radius: 12000 },
    { name: 'Barranquilla', lat: 10.9639, lng: -74.7964, radius: 12000 },
    { name: 'Cartagena', lat: 10.3932, lng: -75.4830, radius: 10000 },
    { name: 'Bucaramanga', lat: 7.1254, lng: -73.1198, radius: 10000 },
    { name: 'Santa Marta', lat: 11.2404, lng: -74.2247, radius: 8000 },
    { name: 'Cúcuta', lat: 7.8854, lng: -72.5078, radius: 10000 },
    { name: 'Pereira', lat: 4.8133, lng: -75.6961, radius: 8000 },
    { name: 'Manizales', lat: 5.0692, lng: -75.5159, radius: 8000 }
];

// Conectar a MongoDB
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB conectado');
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    }
}

// Crear directorio de imágenes si no existe
function ensureImagesDir() {
    if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
        console.log(`✅ Directorio de imágenes creado: ${IMAGES_DIR}`);
    }
}

// Obtener lugares de Google Places API
async function getPlacesFromGoogle(city, category) {
    try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
        const params = {
            location: `${city.lat},${city.lng}`,
            radius: city.radius,
            type: category,
            key: GOOGLE_PLACES_API_KEY
        };

        const response = await axios.get(url, { params });
        
        if (response.data.status === 'OK') {
            return response.data.results.map(place => ({
                name: place.name,
                category: category,
                coordinates: {
                    type: 'Point',
                    coordinates: [place.geometry.location.lng, place.geometry.location.lat]
                },
                address: place.vicinity,
                rating: place.rating || 0,
                source: 'Google Places',
                photos: place.photos || [],
                placeId: place.place_id
            }));
        }
        return [];
    } catch (error) {
        console.error(`❌ Error obteniendo lugares de Google para ${city.name}:`, error.message);
        return [];
    }
}

// Descargar imagen y aplicar marca de agua
async function downloadAndWatermarkImage(photoReference, placeId) {
    try {
        if (!photoReference) return null;

        // Descargar imagen de Google Places
        const imageUrl = `https://maps.googleapis.com/maps/api/place/photo`;
        const params = {
            maxwidth: 800,
            photoreference: photoReference,
            key: GOOGLE_PLACES_API_KEY
        };

        const response = await axios.get(imageUrl, {
            params,
            responseType: 'arraybuffer'
        });

        const imageBuffer = Buffer.from(response.data, 'binary');
        const filename = `${placeId}_${Date.now()}.jpg`;
        const filepath = path.join(IMAGES_DIR, filename);

        // Aplicar marca de agua
        const watermarkedBuffer = await applyWatermark(imageBuffer);
        
        // Guardar imagen
        fs.writeFileSync(filepath, watermarkedBuffer);
        
        console.log(`✅ Imagen descargada y marcada: ${filename}`);
        return `/uploads/places/${filename}`;
    } catch (error) {
        console.error(`❌ Error descargando imagen:`, error.message);
        return null;
    }
}

// Aplicar marca de agua a la imagen
async function applyWatermark(imageBuffer) {
    try {
        // Crear marca de agua con texto "BEDIC"
        const watermarkSvg = `
            <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <style>
                        .watermark-text { font-size: 48px; font-weight: bold; fill: rgba(255,255,255,0.5); }
                    </style>
                </defs>
                <text x="10" y="60" class="watermark-text">BEDIC</text>
            </svg>
        `;

        const watermarkedImage = await sharp(imageBuffer)
            .composite([
                {
                    input: Buffer.from(watermarkSvg),
                    gravity: 'southeast',
                    opacity: 0.6
                }
            ])
            .jpeg({ quality: 85 })
            .toBuffer();

        return watermarkedImage;
    } catch (error) {
        console.error('❌ Error aplicando marca de agua:', error.message);
        return imageBuffer; // Retornar imagen sin marca de agua si falla
    }
}

// Guardar lugar en BD
async function savePlaceToDatabase(placeData) {
    try {
        // Verificar si el lugar ya existe
        const existingPlace = await Place.findOne({
            name: placeData.name,
            category: placeData.category,
            'coordinates.coordinates': placeData.coordinates.coordinates
        });

        if (existingPlace) {
            console.log(`⏭️  Lugar ya existe: ${placeData.name}`);
            return null;
        }

        // Descargar y marcar imagen si existe
        if (placeData.photos && placeData.photos.length > 0) {
            const photoRef = placeData.photos[0].photo_reference;
            const imageUrl = await downloadAndWatermarkImage(photoRef, placeData.placeId);
            if (imageUrl) {
                placeData.officialImages = [imageUrl];
            }
        }

        // Crear nuevo lugar
        const newPlace = new Place({
            name: placeData.name,
            category: placeData.category,
            coordinates: placeData.coordinates,
            address: placeData.address,
            rating: placeData.rating,
            source: placeData.source,
            officialImages: placeData.officialImages || [],
            verified: false,
            adminCreated: false
        });

        await newPlace.save();
        console.log(`✅ Lugar guardado: ${placeData.name}`);
        return newPlace;
    } catch (error) {
        console.error(`❌ Error guardando lugar:`, error.message);
        return null;
    }
}

// Función principal de población
async function populatePlaces() {
    console.log('\n🚀 Iniciando población de lugares...');
    console.log(`⏰ ${new Date().toLocaleString()}\n`);

    let totalPlaces = 0;
    let savedPlaces = 0;

    try {
        for (const city of COLOMBIAN_CITIES) {
            console.log(`\n📍 Procesando ciudad: ${city.name}`);

            for (const category of PLACE_CATEGORIES) {
                try {
                    // Obtener lugares de Google Places
                    const places = await getPlacesFromGoogle(city, category);
                    
                    if (places.length > 0) {
                        console.log(`  📌 Categoría ${category}: ${places.length} lugares encontrados`);
                        
                        // Guardar cada lugar
                        for (const place of places) {
                            const saved = await savePlaceToDatabase(place);
                            if (saved) {
                                savedPlaces++;
                            }
                            totalPlaces++;
                            
                            // Delay para no sobrecargar API
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }
                } catch (error) {
                    console.error(`  ❌ Error procesando categoría ${category}:`, error.message);
                }

                // Delay entre categorías
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`\n✅ Población completada`);
        console.log(`📊 Total procesados: ${totalPlaces}`);
        console.log(`💾 Lugares guardados: ${savedPlaces}`);

        // Obtener estadísticas finales
        const totalInDB = await Place.countDocuments();
        console.log(`📈 Total de lugares en BD: ${totalInDB}\n`);

    } catch (error) {
        console.error('❌ Error en población de lugares:', error);
    }
}

// Scheduler para ejecutar cada 24 horas
function schedulePopulation() {
    // Ejecutar a las 2:00 AM todos los días
    cron.schedule('0 2 * * *', async () => {
        console.log('\n⏰ Ejecutando población programada de lugares...');
        await populatePlaces();
    });

    console.log('✅ Scheduler configurado: Se ejecutará a las 2:00 AM diariamente');
}

// Ejecutar población manual
async function runManualPopulation() {
    await connectDB();
    ensureImagesDir();
    await populatePlaces();
    process.exit(0);
}

// Iniciar con scheduler
async function startWithScheduler() {
    await connectDB();
    ensureImagesDir();
    schedulePopulation();
    
    // Ejecutar una vez al iniciar
    await populatePlaces();
    
    console.log('\n✅ Sistema de población de lugares activo');
    console.log('📌 Presiona Ctrl+C para detener\n');
}

// Exportar funciones
module.exports = {
    populatePlaces,
    schedulePopulation,
    startWithScheduler,
    runManualPopulation
};

// Si se ejecuta directamente
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--manual')) {
        runManualPopulation();
    } else if (args.includes('--scheduler')) {
        startWithScheduler();
    } else {
        console.log('Uso:');
        console.log('  node populatePlacesDaily.js --manual    (Ejecutar una vez)');
        console.log('  node populatePlacesDaily.js --scheduler (Ejecutar con scheduler)');
        process.exit(0);
    }
}
