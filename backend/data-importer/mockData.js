// Datos de ejemplo simulados para poblar la base de datos de MongoDB.

exports.mockPlaces = [
    {
        name: "Parque Central",
        category: "Parques",
        coordinates: { type: "Point", coordinates: [-99.172, 19.417] }, // Coordenadas cerca de CDMX
        address: "Av. Chapultepec, Ciudad de México",
        rating: 4.5,
        concurrence: 80,
        verified: true,
        source: "Community",
    },
    {
        name: "Cinepolis Insurgentes",
        category: "Cines",
        coordinates: { type: "Point", coordinates: [-99.165, 19.423] },
        address: "Insurgentes Sur 300",
        rating: 4.8,
        concurrence: 95,
        verified: true,
        source: "Google Places",
    },
    {
        name: "Restaurante La Esquina",
        category: "Restaurantes",
        coordinates: { type: "Point", coordinates: [-99.141, 19.431] },
        address: "Calle de la Noche Triste 70",
        rating: 4.6,
        concurrence: 70,
        verified: true,
        source: "Google Places",
    },
    {
        name: "Museo de Arte Moderno",
        category: "Museos",
        coordinates: { type: "Point", coordinates: [-99.186, 19.425] },
        address: "Paseo de la Reforma 50",
        rating: 4.9,
        concurrence: 90,
        verified: true,
        source: "OpenStreetMap",
    },
    {
        name: "Gimnasio FitZone",
        category: "Gimnasios",
        coordinates: { type: "Point", coordinates: [-99.160, 19.412] },
        address: "Av. Universidad 100",
        rating: 4.1,
        concurrence: 50,
        verified: false,
        source: "Community",
    },
];