const mongoose = require('mongoose');
const Place = require('../models/Place');
const axios = require('axios');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bedic')
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => {
  console.error('❌ Error conectando a MongoDB:', err);
  process.exit(1);
});

// Datos de lugares por ciudad y categoría
const places = [
  // ==================== BOGOTÁ ====================
  // Restaurantes
  { name: 'Andrés Carne de Res', category: 'Restaurante', description: 'Restaurante icónico con ambiente festivo', coordinates: [-74.0479, 4.7110], address: 'Calle 3 #11A-56, Chía', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Leo Cocina y Cava', category: 'Restaurante', description: 'Alta cocina colombiana', coordinates: [-74.0547, 4.6659], address: 'Calle 27B #6-75, Bogotá', rating: 4.7, verified: true, source: 'Community', adminCreated: true },
  { name: 'Harry Sasson', category: 'Restaurante', description: 'Restaurante de alta cocina', coordinates: [-74.0548, 4.6701], address: 'Calle 119B #6A-20, Bogotá', rating: 4.8, verified: true, source: 'Community', adminCreated: true },
  { name: 'Criterion', category: 'Restaurante', description: 'Cocina francesa contemporánea', coordinates: [-74.0547, 4.6659], address: 'Calle 69A #5-75, Bogotá', rating: 4.6, verified: true, source: 'Community', adminCreated: true },
  { name: 'La Puerta Falsa', category: 'Restaurante', description: 'Restaurante tradicional desde 1816', coordinates: [-74.0730, 4.5981], address: 'Calle 11 #6-50, Bogotá', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'Misia', category: 'Restaurante', description: 'Cocina de autor colombiana', coordinates: [-74.0547, 4.6659], address: 'Carrera 10 #96-15, Bogotá', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Wok', category: 'Restaurante', description: 'Comida asiática fusión', coordinates: [-74.0547, 4.6659], address: 'Calle 119A #6-19, Bogotá', rating: 4.3, verified: true, source: 'Community', adminCreated: true },
  { name: 'Crepes & Waffles', category: 'Restaurante', description: 'Cadena colombiana de comida casual', coordinates: [-74.0547, 4.6659], address: 'Carrera 13 #82-71, Bogotá', rating: 4.2, verified: true, source: 'Community', adminCreated: true },

  // Bares
  { name: 'Armando Records', category: 'Bar', description: 'Bar con música en vivo', coordinates: [-74.0547, 4.6659], address: 'Calle 85 #14-46, Bogotá', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'Theatron', category: 'Bar', description: 'Discoteca LGBTQ+ más grande de Latinoamérica', coordinates: [-74.0547, 4.6659], address: 'Calle 58 #10-32, Bogotá', rating: 4.3, verified: true, source: 'Community', adminCreated: true },
  { name: 'Bogotá Beer Company', category: 'Bar', description: 'Cervecería artesanal', coordinates: [-74.0547, 4.6659], address: 'Carrera 13 #82-24, Bogotá', rating: 4.2, verified: true, source: 'Community', adminCreated: true },
  { name: 'Gringo Mike\'s', category: 'Bar', description: 'Bar deportivo americano', coordinates: [-74.0547, 4.6659], address: 'Carrera 13 #82-32, Bogotá', rating: 4.1, verified: true, source: 'Community', adminCreated: true },
  { name: 'El Mozo', category: 'Bar', description: 'Bar tradicional bogotano', coordinates: [-74.0730, 4.5981], address: 'Carrera 5 #17-76, Bogotá', rating: 4.0, verified: true, source: 'Community', adminCreated: true },

  // Cafeterías
  { name: 'Juan Valdez Café', category: 'Cafetería', description: 'Cadena colombiana de café', coordinates: [-74.0547, 4.6659], address: 'Carrera 7 #71-21, Bogotá', rating: 4.3, verified: true, source: 'Community', adminCreated: true },
  { name: 'Azahar Coffee', category: 'Cafetería', description: 'Café de especialidad', coordinates: [-74.0547, 4.6659], address: 'Calle 93B #13-84, Bogotá', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Amor Perfecto', category: 'Cafetería', description: 'Café de especialidad y tostador', coordinates: [-74.0547, 4.6659], address: 'Calle 64 #9-52, Bogotá', rating: 4.6, verified: true, source: 'Community', adminCreated: true },
  { name: 'Café San Alberto', category: 'Cafetería', description: 'Café premium colombiano', coordinates: [-74.0547, 4.6659], address: 'Carrera 4A #57-52, Bogotá', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'Starbucks', category: 'Cafetería', description: 'Cadena internacional de café', coordinates: [-74.0547, 4.6659], address: 'Carrera 11 #82-71, Bogotá', rating: 4.0, verified: true, source: 'Community', adminCreated: true },

  // Parques
  { name: 'Parque Simón Bolívar', category: 'Parque', description: 'Parque urbano más grande de Bogotá', coordinates: [-74.0908, 4.6570], address: 'Calle 63 #68-95, Bogotá', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Parque de la 93', category: 'Parque', description: 'Parque con zona gastronómica', coordinates: [-74.0404, 4.6764], address: 'Carrera 13 #93A-45, Bogotá', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'Parque El Virrey', category: 'Parque', description: 'Parque lineal con ciclovía', coordinates: [-74.0547, 4.6659], address: 'Carrera 15 #88-00, Bogotá', rating: 4.3, verified: true, source: 'Community', adminCreated: true },
  { name: 'Parque Nacional', category: 'Parque', description: 'Parque histórico de Bogotá', coordinates: [-74.0547, 4.6350], address: 'Carrera 7 #39-43, Bogotá', rating: 4.2, verified: true, source: 'Community', adminCreated: true },
  { name: 'Jardín Botánico', category: 'Parque', description: 'Jardín botánico José Celestino Mutis', coordinates: [-74.1103, 4.6676], address: 'Calle 63 #68-95, Bogotá', rating: 4.6, verified: true, source: 'Community', adminCreated: true },

  // Hoteles
  { name: 'Hotel Tequendama', category: 'Hotel', description: 'Hotel histórico de Bogotá', coordinates: [-74.0730, 4.5981], address: 'Carrera 10 #26-21, Bogotá', rating: 4.2, verified: true, source: 'Community', adminCreated: true },
  { name: 'JW Marriott Bogotá', category: 'Hotel', description: 'Hotel de lujo', coordinates: [-74.0547, 4.6659], address: 'Calle 73 #8-60, Bogotá', rating: 4.6, verified: true, source: 'Community', adminCreated: true },
  { name: 'Four Seasons Casa Medina', category: 'Hotel', description: 'Hotel boutique de lujo', coordinates: [-74.0547, 4.6659], address: 'Carrera 7 #69A-22, Bogotá', rating: 4.7, verified: true, source: 'Community', adminCreated: true },
  { name: 'Hotel de la Ópera', category: 'Hotel', description: 'Hotel colonial en La Candelaria', coordinates: [-74.0730, 4.5981], address: 'Calle 10 #5-72, Bogotá', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'Sofitel Bogotá Victoria Regia', category: 'Hotel', description: 'Hotel de lujo francés', coordinates: [-74.0547, 4.6659], address: 'Calle 113 #7-65, Bogotá', rating: 4.5, verified: true, source: 'Community', adminCreated: true },

  // Museos
  { name: 'Museo del Oro', category: 'Museo', description: 'Museo con la mayor colección de orfebrería prehispánica', coordinates: [-74.0730, 4.6017], address: 'Carrera 6 #15-88, Bogotá', rating: 4.8, verified: true, source: 'Community', adminCreated: true },
  { name: 'Museo Botero', category: 'Museo', description: 'Museo de arte con obras de Fernando Botero', coordinates: [-74.0730, 4.5981], address: 'Calle 11 #4-41, Bogotá', rating: 4.7, verified: true, source: 'Community', adminCreated: true },
  { name: 'Museo Nacional', category: 'Museo', description: 'Museo de historia y arte de Colombia', coordinates: [-74.0730, 4.6117], address: 'Carrera 7 #28-66, Bogotá', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Maloka', category: 'Museo', description: 'Museo interactivo de ciencia y tecnología', coordinates: [-74.1103, 4.6676], address: 'Carrera 68D #24A-51, Bogotá', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'Museo de Arte Moderno', category: 'Museo', description: 'MAMBO - Arte moderno y contemporáneo', coordinates: [-74.0730, 4.5981], address: 'Calle 24 #6-00, Bogotá', rating: 4.3, verified: true, source: 'Community', adminCreated: true },

  // Cines
  { name: 'Cinemark Andino', category: 'Cine', description: 'Complejo de cines en Centro Andino', coordinates: [-74.0547, 4.6659], address: 'Carrera 11 #82-71, Bogotá', rating: 4.3, verified: true, source: 'Community', adminCreated: true },
  { name: 'Cinépolis Titán Plaza', category: 'Cine', description: 'Complejo de cines moderno', coordinates: [-74.1103, 4.6676], address: 'Autopista Medellín #100-00, Bogotá', rating: 4.2, verified: true, source: 'Community', adminCreated: true },
  { name: 'Procinal Gran Estación', category: 'Cine', description: 'Cines en centro comercial', coordinates: [-74.0908, 4.6570], address: 'Calle 26 #62-47, Bogotá', rating: 4.1, verified: true, source: 'Community', adminCreated: true },
  { name: 'Cine Colombia Multiplaza', category: 'Cine', description: 'Complejo de cines', coordinates: [-74.0547, 4.6659], address: 'Carrera 19B #84-14, Bogotá', rating: 4.0, verified: true, source: 'Community', adminCreated: true },

  // Hospitales
  { name: 'Fundación Santa Fe de Bogotá', category: 'Hospital', description: 'Hospital universitario de alta complejidad', coordinates: [-74.0547, 4.6350], address: 'Calle 119 #7-75, Bogotá', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Clínica Shaio', category: 'Hospital', description: 'Clínica cardiovascular', coordinates: [-74.0547, 4.6659], address: 'Diagonal 115A #70C-75, Bogotá', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'Hospital San Ignacio', category: 'Hospital', description: 'Hospital universitario', coordinates: [-74.0547, 4.6350], address: 'Carrera 7 #40-62, Bogotá', rating: 4.3, verified: true, source: 'Community', adminCreated: true },
  { name: 'Clínica del Country', category: 'Hospital', description: 'Clínica de alta complejidad', coordinates: [-74.0547, 4.6659], address: 'Carrera 16 #82-57, Bogotá', rating: 4.4, verified: true, source: 'Community', adminCreated: true },

  // Centros Comerciales
  { name: 'Centro Comercial Andino', category: 'Centro Comercial', description: 'Centro comercial de lujo', coordinates: [-74.0547, 4.6659], address: 'Carrera 11 #82-71, Bogotá', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'Centro Comercial Santafé', category: 'Centro Comercial', description: 'Uno de los centros comerciales más grandes', coordinates: [-74.0547, 4.6659], address: 'Calle 185 #45-03, Bogotá', rating: 4.3, verified: true, source: 'Community', adminCreated: true },
  { name: 'Unicentro', category: 'Centro Comercial', description: 'Centro comercial tradicional', coordinates: [-74.0547, 4.6659], address: 'Avenida 15 #124-30, Bogotá', rating: 4.2, verified: true, source: 'Community', adminCreated: true },
  { name: 'Gran Estación', category: 'Centro Comercial', description: 'Centro comercial y de entretenimiento', coordinates: [-74.0908, 4.6570], address: 'Calle 26 #62-47, Bogotá', rating: 4.1, verified: true, source: 'Community', adminCreated: true },

  // ==================== MEDELLÍN ====================
  // Restaurantes
  { name: 'Carmen', category: 'Restaurante', description: 'Alta cocina en Medellín', coordinates: [-75.5636, 6.2476], address: 'Carrera 36 #10A-27, Medellín', rating: 4.7, verified: true, source: 'Community', adminCreated: true },
  { name: 'El Cielo', category: 'Restaurante', description: 'Experiencia gastronómica sensorial', coordinates: [-75.5636, 6.2476], address: 'Calle 9 Sur #42-63, Medellín', rating: 4.8, verified: true, source: 'Community', adminCreated: true },
  { name: 'Mondongos', category: 'Restaurante', description: 'Comida típica antioqueña', coordinates: [-75.5636, 6.2476], address: 'Carrera 43A #34-10, Medellín', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'Hatoviejo', category: 'Restaurante', description: 'Restaurante de comida paisa', coordinates: [-75.5636, 6.2476], address: 'Carrera 42 #75-83, Medellín', rating: 4.3, verified: true, source: 'Community', adminCreated: true },
  { name: 'Oci.Mde', category: 'Restaurante', description: 'Cocina de autor', coordinates: [-75.5636, 6.2476], address: 'Carrera 37 #8A-37, Medellín', rating: 4.6, verified: true, source: 'Community', adminCreated: true },

  // Bares
  { name: 'Eslabon Prendido', category: 'Bar', description: 'Bar de salsa y música latina', coordinates: [-75.5636, 6.2476], address: 'Carrera 43A #6-15, Medellín', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'Cervecería Libre', category: 'Bar', description: 'Cervecería artesanal', coordinates: [-75.5636, 6.2476], address: 'Carrera 35 #7-98, Medellín', rating: 4.3, verified: true, source: 'Community', adminCreated: true },
  { name: 'Vintrash', category: 'Bar', description: 'Bar de vinos y cocteles', coordinates: [-75.5636, 6.2476], address: 'Carrera 36 #10A-32, Medellín', rating: 4.2, verified: true, source: 'Community', adminCreated: true },
  { name: 'Dulce Jesús Mío', category: 'Bar', description: 'Bar con música en vivo', coordinates: [-75.5636, 6.2476], address: 'Carrera 40 #10-28, Medellín', rating: 4.1, verified: true, source: 'Community', adminCreated: true },

  // Cafeterías
  { name: 'Pergamino Café', category: 'Cafetería', description: 'Café de especialidad', coordinates: [-75.5636, 6.2476], address: 'Carrera 37 #8A-4, Medellín', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Velvet Medellín', category: 'Cafetería', description: 'Café y repostería', coordinates: [-75.5636, 6.2476], address: 'Carrera 35 #7-69, Medellín', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'Café Zorba', category: 'Cafetería', description: 'Café cultural', coordinates: [-75.5636, 6.2476], address: 'Carrera 43A #27-01, Medellín', rating: 4.3, verified: true, source: 'Community', adminCreated: true },

  // Parques
  { name: 'Parque Arví', category: 'Parque', description: 'Parque natural y ecoturístico', coordinates: [-75.5000, 6.2800], address: 'Santa Elena, Medellín', rating: 4.7, verified: true, source: 'Community', adminCreated: true },
  { name: 'Parque Explora', category: 'Parque', description: 'Parque de ciencia y tecnología', coordinates: [-75.5636, 6.2676], address: 'Carrera 52 #73-75, Medellín', rating: 4.6, verified: true, source: 'Community', adminCreated: true },
  { name: 'Parque Lleras', category: 'Parque', description: 'Parque con zona rosa', coordinates: [-75.5636, 6.2476], address: 'Carrera 37 #8-24, Medellín', rating: 4.2, verified: true, source: 'Community', adminCreated: true },
  { name: 'Jardín Botánico', category: 'Parque', description: 'Jardín botánico de Medellín', coordinates: [-75.5636, 6.2676], address: 'Calle 73 #51D-14, Medellín', rating: 4.5, verified: true, source: 'Community', adminCreated: true },

  // Hoteles
  { name: 'Hotel Dann Carlton Medellín', category: 'Hotel', description: 'Hotel de negocios', coordinates: [-75.5636, 6.2476], address: 'Carrera 43A #7-50, Medellín', rating: 4.3, verified: true, source: 'Community', adminCreated: true },
  { name: 'Diez Hotel', category: 'Hotel', description: 'Hotel boutique', coordinates: [-75.5636, 6.2476], address: 'Carrera 43A #7-50, Medellín', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Hotel Poblado Plaza', category: 'Hotel', description: 'Hotel en El Poblado', coordinates: [-75.5636, 6.2476], address: 'Carrera 43A #1-50, Medellín', rating: 4.2, verified: true, source: 'Community', adminCreated: true },

  // Museos
  { name: 'Museo de Antioquia', category: 'Museo', description: 'Museo de arte con obras de Botero', coordinates: [-75.5636, 6.2518], address: 'Carrera 52 #52-43, Medellín', rating: 4.6, verified: true, source: 'Community', adminCreated: true },
  { name: 'Museo Casa de la Memoria', category: 'Museo', description: 'Museo sobre el conflicto armado', coordinates: [-75.5636, 6.2476], address: 'Calle 51 #36-66, Medellín', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Museo El Castillo', category: 'Museo', description: 'Castillo y jardines', coordinates: [-75.5636, 6.2476], address: 'Calle 9 Sur #32-269, Medellín', rating: 4.4, verified: true, source: 'Community', adminCreated: true },

  // Centros Comerciales
  { name: 'Centro Comercial El Tesoro', category: 'Centro Comercial', description: 'Centro comercial de lujo', coordinates: [-75.5636, 6.2476], address: 'Carrera 25A #1A Sur-45, Medellín', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Centro Comercial Santa Fe', category: 'Centro Comercial', description: 'Centro comercial grande', coordinates: [-75.5636, 6.2476], address: 'Calle 30A Sur #82A-26, Medellín', rating: 4.3, verified: true, source: 'Community', adminCreated: true },
  { name: 'Oviedo', category: 'Centro Comercial', description: 'Centro comercial en El Poblado', coordinates: [-75.5636, 6.2476], address: 'Carrera 43A #6 Sur-15, Medellín', rating: 4.2, verified: true, source: 'Community', adminCreated: true },

  // ==================== CALI ====================
  // Restaurantes
  { name: 'Platillos Voladores', category: 'Restaurante', description: 'Restaurante de autor', coordinates: [-76.5225, 3.4516], address: 'Avenida 9N #9N-135, Cali', rating: 4.6, verified: true, source: 'Community', adminCreated: true },
  { name: 'Ringlete', category: 'Restaurante', description: 'Comida del Pacífico', coordinates: [-76.5225, 3.4516], address: 'Calle 5 #38-71, Cali', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'El Zaguán de San Antonio', category: 'Restaurante', description: 'Comida tradicional vallecaucana', coordinates: [-76.5225, 3.4516], address: 'Carrera 10 #1-14, Cali', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'Carbón de Palo', category: 'Restaurante', description: 'Parrilla y carnes', coordinates: [-76.5225, 3.4516], address: 'Avenida 6D #36N-18, Cali', rating: 4.3, verified: true, source: 'Community', adminCreated: true },

  // Bares
  { name: 'Tin Tin Deo', category: 'Bar', description: 'Bar de salsa caleña', coordinates: [-76.5225, 3.4516], address: 'Calle 5 #38-71, Cali', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Zaperoco', category: 'Bar', description: 'Bar de salsa', coordinates: [-76.5225, 3.4516], address: 'Carrera 4 #3-68, Cali', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'La Topa Tolondra', category: 'Bar', description: 'Bar con música en vivo', coordinates: [-76.5225, 3.4516], address: 'Calle 8 #3-14, Cali', rating: 4.3, verified: true, source: 'Community', adminCreated: true },

  // Cafeterías
  { name: 'Macondo Café', category: 'Cafetería', description: 'Café cultural', coordinates: [-76.5225, 3.4516], address: 'Carrera 9 #2-19, Cali', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'Café Macanas', category: 'Cafetería', description: 'Café de especialidad', coordinates: [-76.5225, 3.4516], address: 'Avenida 9N #9N-135, Cali', rating: 4.3, verified: true, source: 'Community', adminCreated: true },

  // Parques
  { name: 'Parque del Perro', category: 'Parque', description: 'Parque con zona gastronómica', coordinates: [-76.5225, 3.4516], address: 'Carrera 35 con Calle 3 Oeste, Cali', rating: 4.3, verified: true, source: 'Community', adminCreated: true },
  { name: 'Parque de las Banderas', category: 'Parque', description: 'Parque urbano', coordinates: [-76.5225, 3.4516], address: 'Avenida Colombia, Cali', rating: 4.2, verified: true, source: 'Community', adminCreated: true },
  { name: 'Cristo Rey', category: 'Punto de Interés', description: 'Monumento con vista panorámica', coordinates: [-76.5225, 3.4516], address: 'Los Cristales, Cali', rating: 4.6, verified: true, source: 'Community', adminCreated: true },

  // Hoteles
  { name: 'Hotel Intercontinental Cali', category: 'Hotel', description: 'Hotel de lujo', coordinates: [-76.5225, 3.4516], address: 'Avenida Colombia #2-72, Cali', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Hotel Dann Carlton Cali', category: 'Hotel', description: 'Hotel de negocios', coordinates: [-76.5225, 3.4516], address: 'Avenida Colombia #1-40, Cali', rating: 4.3, verified: true, source: 'Community', adminCreated: true },

  // Museos
  { name: 'Museo La Tertulia', category: 'Museo', description: 'Museo de arte moderno', coordinates: [-76.5225, 3.4516], address: 'Avenida Colombia #5-105 Oeste, Cali', rating: 4.4, verified: true, source: 'Community', adminCreated: true },
  { name: 'Museo Arqueológico La Merced', category: 'Museo', description: 'Museo de arqueología', coordinates: [-76.5225, 3.4516], address: 'Carrera 4 #6-59, Cali', rating: 4.3, verified: true, source: 'Community', adminCreated: true },

  // Centros Comerciales
  { name: 'Centro Comercial Chipichape', category: 'Centro Comercial', description: 'Centro comercial grande', coordinates: [-76.5225, 3.4516], address: 'Calle 38 Norte #6N-35, Cali', rating: 4.3, verified: true, source: 'Community', adminCreated: true },
  { name: 'Unicentro Cali', category: 'Centro Comercial', description: 'Centro comercial', coordinates: [-76.5225, 3.4516], address: 'Calle 5 #36-100, Cali', rating: 4.2, verified: true, source: 'Community', adminCreated: true },

  // ==================== CARTAGENA ====================
  // Restaurantes
  { name: 'Carmen Cartagena', category: 'Restaurante', description: 'Alta cocina caribeña', coordinates: [-75.5514, 10.3910], address: 'Calle del Santísimo #8-19, Cartagena', rating: 4.8, verified: true, source: 'Community', adminCreated: true },
  { name: 'La Vitrola', category: 'Restaurante', description: 'Restaurante clásico', coordinates: [-75.5514, 10.3910], address: 'Calle Baloco #2-01, Cartagena', rating: 4.6, verified: true, source: 'Community', adminCreated: true },
  { name: 'Restaurante 1621', category: 'Restaurante', description: 'Cocina de autor', coordinates: [-75.5514, 10.3910], address: 'Calle San Juan de Dios #3-87, Cartagena', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'La Cevichería', category: 'Restaurante', description: 'Ceviche y mariscos', coordinates: [-75.5514, 10.3910], address: 'Calle Stuart #7-14, Cartagena', rating: 4.4, verified: true, source: 'Community', adminCreated: true },

  // Bares
  { name: 'Café Havana', category: 'Bar', description: 'Bar con música cubana', coordinates: [-75.5514, 10.3910], address: 'Calle de la Media Luna, Cartagena', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Alquímico', category: 'Bar', description: 'Bar de cocteles de autor', coordinates: [-75.5514, 10.3910], address: 'Calle del Colegio #34-24, Cartagena', rating: 4.6, verified: true, source: 'Community', adminCreated: true },
  { name: 'El Arsenal', category: 'Bar', description: 'Bar lounge', coordinates: [-75.5514, 10.3910], address: 'Calle de la Factoria #36-77, Cartagena', rating: 4.3, verified: true, source: 'Community', adminCreated: true },

  // Cafeterías
  { name: 'Café del Mar', category: 'Cafetería', description: 'Café con vista al mar', coordinates: [-75.5514, 10.3910], address: 'Baluarte de Santo Domingo, Cartagena', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Abaco Libros y Café', category: 'Cafetería', description: 'Librería café', coordinates: [-75.5514, 10.3910], address: 'Calle de la Iglesia #3-86, Cartagena', rating: 4.4, verified: true, source: 'Community', adminCreated: true },

  // Hoteles
  { name: 'Hotel Charleston Santa Teresa', category: 'Hotel', description: 'Hotel de lujo colonial', coordinates: [-75.5514, 10.3910], address: 'Calle Don Sancho #36-14, Cartagena', rating: 4.8, verified: true, source: 'Community', adminCreated: true },
  { name: 'Hotel Sofitel Legend Santa Clara', category: 'Hotel', description: 'Hotel histórico de lujo', coordinates: [-75.5514, 10.3910], address: 'Calle del Torno #39-29, Cartagena', rating: 4.7, verified: true, source: 'Community', adminCreated: true },
  { name: 'Casa San Agustín', category: 'Hotel', description: 'Hotel boutique', coordinates: [-75.5514, 10.3910], address: 'Calle de la Universidad #36-44, Cartagena', rating: 4.6, verified: true, source: 'Community', adminCreated: true },

  // Puntos de Interés
  { name: 'Castillo San Felipe de Barajas', category: 'Punto de Interés', description: 'Fortaleza colonial', coordinates: [-75.5514, 10.4236], address: 'Cerro de San Lázaro, Cartagena', rating: 4.7, verified: true, source: 'Community', adminCreated: true },
  { name: 'Torre del Reloj', category: 'Punto de Interés', description: 'Entrada principal a la ciudad amurallada', coordinates: [-75.5514, 10.3910], address: 'Plaza de los Coches, Cartagena', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Islas del Rosario', category: 'Punto de Interés', description: 'Archipiélago paradisíaco', coordinates: [-75.7500, 10.1667], address: 'Islas del Rosario, Cartagena', rating: 4.8, verified: true, source: 'Community', adminCreated: true },

  // Museos
  { name: 'Museo del Oro Zenú', category: 'Museo', description: 'Museo de orfebrería', coordinates: [-75.5514, 10.3910], address: 'Plaza de Bolívar, Cartagena', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Museo Naval del Caribe', category: 'Museo', description: 'Museo de historia naval', coordinates: [-75.5514, 10.3910], address: 'Calle San Juan de Dios #3-62, Cartagena', rating: 4.3, verified: true, source: 'Community', adminCreated: true },

  // ==================== BARRANQUILLA ====================
  // Restaurantes
  { name: 'Varadero', category: 'Restaurante', description: 'Mariscos y comida costeña', coordinates: [-74.7813, 10.9685], address: 'Carrera 52 #76-173, Barranquilla', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Árabe Internacional', category: 'Restaurante', description: 'Comida árabe', coordinates: [-74.7813, 10.9685], address: 'Calle 93 #43-122, Barranquilla', rating: 4.4, verified: true, source: 'Community', adminCreated: true },

  // Bares
  { name: 'La Troja', category: 'Bar', description: 'Bar de música vallenata', coordinates: [-74.7813, 10.9685], address: 'Carrera 43 #34-85, Barranquilla', rating: 4.3, verified: true, source: 'Community', adminCreated: true },

  // Parques
  { name: 'Parque Cultural del Caribe', category: 'Parque', description: 'Parque cultural y museo', coordinates: [-74.7813, 10.9685], address: 'Calle 36 #46-66, Barranquilla', rating: 4.4, verified: true, source: 'Community', adminCreated: true },

  // Hoteles
  { name: 'Hotel El Prado', category: 'Hotel', description: 'Hotel histórico', coordinates: [-74.7813, 10.9685], address: 'Carrera 54 #70-10, Barranquilla', rating: 4.3, verified: true, source: 'Community', adminCreated: true },

  // Centros Comerciales
  { name: 'Buenavista', category: 'Centro Comercial', description: 'Centro comercial grande', coordinates: [-74.7813, 10.9685], address: 'Calle 98 #106-268, Barranquilla', rating: 4.3, verified: true, source: 'Community', adminCreated: true },

  // ==================== BUCARAMANGA ====================
  // Restaurantes
  { name: 'Mercagán', category: 'Restaurante', description: 'Comida santandereana', coordinates: [-73.1198, 7.1193], address: 'Carrera 33 #42-06, Bucaramanga', rating: 4.4, verified: true, source: 'Community', adminCreated: true },

  // Parques
  { name: 'Parque del Agua', category: 'Parque', description: 'Parque acuático', coordinates: [-73.1198, 7.1193], address: 'Kilómetro 7 vía al mar, Bucaramanga', rating: 4.5, verified: true, source: 'Community', adminCreated: true },
  { name: 'Parque Santander', category: 'Parque', description: 'Parque principal', coordinates: [-73.1198, 7.1193], address: 'Carrera 19 con Calle 35, Bucaramanga', rating: 4.2, verified: true, source: 'Community', adminCreated: true },

  // Hoteles
  { name: 'Hotel Dann Carlton Bucaramanga', category: 'Hotel', description: 'Hotel de negocios', coordinates: [-73.1198, 7.1193], address: 'Calle 47 #28-83, Bucaramanga', rating: 4.3, verified: true, source: 'Community', adminCreated: true },

  // Centros Comerciales
  { name: 'Cacique', category: 'Centro Comercial', description: 'Centro comercial', coordinates: [-73.1198, 7.1193], address: 'Carrera 36 #52-15, Bucaramanga', rating: 4.2, verified: true, source: 'Community', adminCreated: true },
];

// Función para insertar lugares
async function seedPlaces() {
  try {
    console.log('🗑️  Limpiando lugares existentes...');
    await Place.deleteMany({ adminCreated: true });
    
    console.log('📍 Insertando nuevos lugares...');
    
    // Convertir coordenadas al formato GeoJSON correcto
    const placesToInsert = places.map(place => ({
      ...place,
      coordinates: {
        type: 'Point',
        coordinates: place.coordinates // [longitud, latitud]
      }
    }));
    
    const result = await Place.insertMany(placesToInsert);
    
    console.log(`✅ ${result.length} lugares insertados exitosamente`);
    
    // Mostrar resumen por categoría
    const categories = {};
    result.forEach(place => {
      categories[place.category] = (categories[place.category] || 0) + 1;
    });
    
    console.log('\n📊 Resumen por categoría:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} lugares`);
    });
    
    console.log('\n🎉 ¡Población de datos completada!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar el script
seedPlaces();
