// backend/seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Place = require('./models/Place');
const { mockPlaces } = require('./data-importer/mockData');
const osmService = require('./data-importer/services/osmService'); // OSM Service

dotenv.config();

const importType = process.argv[2]; // "", --real, --real-co

// Mapa de categorías que se enviará a Overpass
const CATEGORIES_MAP = {
  amenity: ['restaurant', 'bar', 'cinema'],
  leisure: ['park', 'fitness_centre', 'stadium'],
  tourism: ['museum'],
  shop: ['mall'],
};

/**
 * Pequeña pausa entre llamadas a Overpass para evitar rate-limit
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Descarga lugares reales para COLOMBIA por ciudades, usando Overpass
 */
async function fetchColombiaPlaces() {
  console.log('Iniciando importación REAL para COLOMBIA completa…');

  // Ciudades principales como centros de búsqueda
  const CO_CITIES = [
    { name: 'Bogotá', lat: 4.7110, lon: -74.0721, radius: 28000 },
    { name: 'Medellín', lat: 6.2442, lon: -75.5812, radius: 23000 },
    { name: 'Cali', lat: 3.4516, lon: -76.5320, radius: 23000 },
    { name: 'Barranquilla', lat: 10.9685, lon: -74.7813, radius: 22000 },
    { name: 'Cartagena', lat: 10.3910, lon: -75.4794, radius: 22000 },
    { name: 'Bucaramanga', lat: 7.1193, lon: -73.1227, radius: 20000 },
    { name: 'Pereira', lat: 4.8133, lon: -75.6961, radius: 20000 },
    { name: 'Manizales', lat: 5.0703, lon: -75.5138, radius: 18000 },
    { name: 'Armenia', lat: 4.5350, lon: -75.6750, radius: 18000 },
    { name: 'Cúcuta', lat: 7.8939, lon: -72.5078, radius: 20000 },
    { name: 'Santa Marta', lat: 11.2408, lon: -74.1990, radius: 20000 },
    { name: 'Ibagué', lat: 4.4389, lon: -75.2322, radius: 18000 },
    { name: 'Villavicencio', lat: 4.1514, lon: -73.6369, radius: 20000 },
    { name: 'Neiva', lat: 2.9386, lon: -75.2673, radius: 18000 },
    { name: 'Montería', lat: 8.7479, lon: -75.8814, radius: 18000 },
    { name: 'Sincelejo', lat: 9.3047, lon: -75.3978, radius: 16000 },
    { name: 'Valledupar', lat: 10.4631, lon: -73.2532, radius: 18000 },
    { name: 'Pasto', lat: 1.2136, lon: -77.2811, radius: 18000 },
  ];

  const allPlaces = [];

  for (const city of CO_CITIES) {
    console.log(
      `> Descargando lugares para ${city.name} (lat=${city.lat}, lon=${city.lon}, r=${city.radius})`
    );

    const cityPlaces = await osmService.fetchPlaces(
      city.lat,
      city.lon,
      city.radius,
      CATEGORIES_MAP
    );

    console.log(`  -> ${cityPlaces.length} lugares normalizados para ${city.name}`);

    // Añadir al acumulado
    allPlaces.push(...cityPlaces);

    // Breve pausa para evitar rate-limit agresivo
    await delay(3000);
  }

  console.log(`Total de lugares recopilados para Colombia: ${allPlaces.length}`);
  return allPlaces;
}

/**
 * Modo real simple: un solo centro (por compatibilidad con tu versión vieja)
 */
async function fetchSingleArea() {
  console.log('Iniciando importación de DATOS REALES (OSM/Overpass)…');
  const lat = 4.7110; // Bogotá
  const lon = -74.0721;
  const radius = 10000;

  return osmService.fetchPlaces(lat, lon, radius, CATEGORIES_MAP);
}

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB conectado para el Seeder.');

    // Limpiar datos antiguos
    await Place.deleteMany();
    console.log('Colección Places limpiada.');

    let placesToImport = [];

    if (importType === '--real-co') {
      // Opción 2: Colombia completa, por ciudades
      placesToImport = await fetchColombiaPlaces();
    } else if (importType === '--real') {
      // Opción 1: área única (Bogotá)
      placesToImport = await fetchSingleArea();
    } else {
      // Mock por defecto
      console.log('Iniciando importación de DATOS MOCKS…');
      placesToImport = mockPlaces;
    }

    if (!placesToImport || placesToImport.length === 0) {
      console.log('No se encontraron lugares (reales o mocks) para importar.');
      process.exit(0);
      return;
    }

    // Inserción en MongoDB
    await Place.insertMany(placesToImport);
    console.log(`IMPORTACIÓN COMPLETA: ${placesToImport.length} lugares creados.`);
    process.exit(0);
  } catch (error) {
    console.error('Error durante la importación (Seeder):', error);
    process.exit(1);
  }
};

importData();
