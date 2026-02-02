const cron = require('node-cron');
const { discoverNewPlaces } = require('./autoDiscoverPlaces');
const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bedic')
.then(() => console.log('✅ Scheduler conectado a MongoDB'))
.catch(err => {
  console.error('❌ Error conectando a MongoDB:', err);
  process.exit(1);
});

console.log('🕐 Scheduler iniciado');
console.log('📅 El script de auto-descubrimiento se ejecutará cada 24 horas a las 3:00 AM');

// Ejecutar cada día a las 3:00 AM
// Formato: segundo minuto hora día mes día-semana
cron.schedule('0 0 3 * * *', async () => {
  console.log('\n⏰ Ejecutando tarea programada de auto-descubrimiento...');
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-CO')}\n`);
  
  try {
    await discoverNewPlaces();
    console.log('✅ Tarea completada exitosamente\n');
  } catch (error) {
    console.error('❌ Error en tarea programada:', error);
  }
}, {
  scheduled: true,
  timezone: "America/Bogota"
});

// También permitir ejecución manual cada hora para pruebas (comentar en producción)
// cron.schedule('0 * * * *', async () => {
//   console.log('\n⏰ Ejecutando tarea de prueba cada hora...');
//   await discoverNewPlaces();
// });

console.log('✅ Scheduler configurado correctamente');
console.log('💡 Presiona Ctrl+C para detener el scheduler\n');

// Mantener el proceso vivo
process.on('SIGINT', () => {
  console.log('\n👋 Deteniendo scheduler...');
  mongoose.connection.close();
  process.exit(0);
});
