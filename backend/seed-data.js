const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Importar modelos
const User = require('./models/User');
const Place = require('./models/Place');
const Report = require('./models/Report');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar datos existentes
    await User.deleteMany({});
    await Place.deleteMany({});
    await Report.deleteMany({});
    console.log('🗑️  Datos anteriores eliminados');

    // Crear usuarios de prueba
    const users = await User.insertMany([
      {
        name: 'Juan Pérez',
        username: 'juan_perez',
        email: 'juan@example.com',
        password: 'hashed_password_1',
        status: 'active',
        isMuted: false
      },
      {
        name: 'María García',
        username: 'maria_garcia',
        email: 'maria@example.com',
        password: 'hashed_password_2',
        status: 'active',
        isMuted: false
      },
      {
        name: 'Carlos López',
        username: 'carlos_lopez',
        email: 'carlos@example.com',
        password: 'hashed_password_3',
        status: 'banned',
        isMuted: false
      },
      {
        name: 'Ana Martínez',
        username: 'ana_martinez',
        email: 'ana@example.com',
        password: 'hashed_password_4',
        status: 'active',
        isMuted: true
      },
      {
        name: 'Pedro Sánchez',
        username: 'pedro_sanchez',
        email: 'pedro@example.com',
        password: 'hashed_password_5',
        status: 'active',
        isMuted: false
      }
    ]);
    console.log(`✅ ${users.length} usuarios creados`);

    // Crear lugares de prueba (simplificado)
    let places = [];
    try {
      places = await Place.insertMany([
        {
          name: 'Restaurante La Esquina',
          description: 'Comida típica latinoamericana',
          verified: true,
          rating: 4.5,
          reviewCount: 120
        },
        {
          name: 'Café del Centro',
          description: 'Café artesanal con wifi',
          verified: true,
          rating: 4.2,
          reviewCount: 85
        },
        {
          name: 'Bar Nocturno',
          description: 'Bar con música en vivo',
          verified: false,
          rating: 3.8,
          reviewCount: 45
        },
        {
          name: 'Hotel Plaza Mayor',
          description: 'Hotel 4 estrellas en el centro',
          verified: true,
          rating: 4.7,
          reviewCount: 200
        },
        {
          name: 'Monumento Nacional',
          description: 'Atracción turística histórica',
          verified: true,
          rating: 4.6,
          reviewCount: 350
        }
      ]);
      console.log(`✅ ${places.length} lugares creados`);
    } catch (err) {
      console.log(`⚠️  No se pudieron crear lugares (modelo diferente): ${err.message.substring(0, 50)}`);
    }

    // Crear reportes de prueba (simplificado)
    let reports = [];
    try {
      reports = await Report.insertMany([
        {
          type: 'comment',
          userId: users[0]._id,
          reportedUserId: users[1]._id,
          reason: 'offensive',
          description: 'Comentario ofensivo en la plataforma',
          contentType: 'comment',
          contentId: 'content_1',
          status: 'pending',
          severity: 'moderado',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          type: 'rating',
          userId: users[1]._id,
          reportedUserId: users[2]._id,
          reason: 'spam',
          description: 'Valoración spam repetida',
          contentType: 'rating',
          contentId: 'content_2',
          status: 'verified',
          severity: 'leve',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
        },
        {
          type: 'place',
          userId: users[2]._id,
          reportedUserId: users[3]._id,
          reason: 'false_info',
          description: 'Lugar con información incorrecta',
          contentType: 'place',
          contentId: 'content_3',
          status: 'verified',
          severity: 'moderado',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
        },
        {
          type: 'comment',
          userId: users[3]._id,
          reportedUserId: users[4]._id,
          reason: 'harassment',
          description: 'Comentarios acosadores',
          contentType: 'comment',
          contentId: 'content_4',
          status: 'rejected',
          severity: 'severo',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          type: 'rating',
          userId: users[4]._id,
          reportedUserId: users[0]._id,
          reason: 'inappropriate',
          description: 'Valoración con contenido inapropiado',
          contentType: 'rating',
          contentId: 'content_5',
          status: 'pending',
          severity: 'leve',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        {
          type: 'comment',
          userId: users[0]._id,
          reportedUserId: users[1]._id,
          reason: 'offensive',
          description: 'Otro comentario ofensivo',
          contentType: 'comment',
          contentId: 'content_6',
          status: 'pending',
          severity: 'moderado',
          createdAt: new Date()
        }
      ]);
      console.log(`✅ ${reports.length} reportes creados`);
    } catch (err) {
      console.log(`⚠️  No se pudieron crear reportes: ${err.message.substring(0, 80)}`);
    }

    console.log('\n✅ Base de datos poblada exitosamente');
    console.log(`
📊 Resumen:
- Usuarios: ${users.length}
- Lugares: ${places.length}
- Reportes: ${reports.length}
    `);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedDatabase();
