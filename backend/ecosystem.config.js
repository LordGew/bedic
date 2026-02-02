/**
 * PM2 Ecosystem Configuration
 * Gestiona todos los procesos de la aplicación BEDIC
 */

module.exports = {
  apps: [
    // ==========================================
    // API Backend Principal
    // ==========================================
    {
      name: 'bedic-api',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },

    // ==========================================
    // Población de Lugares (Cada 24 horas)
    // ==========================================
    {
      name: 'places-population',
      script: './scripts/populatePlacesDaily.js',
      instances: 1,
      exec_mode: 'fork',
      args: '--scheduler',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/population-error.log',
      out_file: './logs/population-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      cron_restart: '0 1 * * *' // Reiniciar a las 1:00 AM diariamente
    },

    // ==========================================
    // Limpieza de Datos (Cada 7 días)
    // ==========================================
    {
      name: 'data-cleanup',
      script: './scripts/dataCleanup.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/cleanup-error.log',
      out_file: './logs/cleanup-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      cron_restart: '0 3 * * 0' // Ejecutar domingos a las 3:00 AM
    }
  ],

  // ==========================================
  // Configuración Global
  // ==========================================
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/bedic.git',
      path: '/var/www/bedic',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
