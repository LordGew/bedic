const ScriptActivity = require('../models/ScriptActivity');

// Obtener todas las actividades del script (con paginación)
exports.getActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const scriptName = req.query.scriptName;

    const query = scriptName ? { scriptName } : {};

    const activities = await ScriptActivity.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ScriptActivity.countDocuments(query);

    res.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo actividades:', error);
    res.status(500).json({ error: 'Error obteniendo actividades del script' });
  }
};

// Obtener estadísticas generales
exports.getStats = async (req, res) => {
  try {
    const totalRuns = await ScriptActivity.countDocuments({ scriptName: 'autoDiscoverPlaces' });
    const successRuns = await ScriptActivity.countDocuments({ 
      scriptName: 'autoDiscoverPlaces',
      status: 'success' 
    });
    const errorRuns = await ScriptActivity.countDocuments({ 
      scriptName: 'autoDiscoverPlaces',
      status: 'error' 
    });

    // Última ejecución
    const lastRun = await ScriptActivity.findOne({ scriptName: 'autoDiscoverPlaces' })
      .sort({ timestamp: -1 });

    // Próxima ejecución (3:00 AM del día siguiente)
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(3, 0, 0, 0);
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    // Estadísticas de lugares agregados (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivities = await ScriptActivity.find({
      scriptName: 'autoDiscoverPlaces',
      status: 'success',
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: -1 });

    let totalPlacesAdded = 0;
    let totalPlacesFound = 0;

    recentActivities.forEach(activity => {
      if (activity.stats) {
        totalPlacesAdded += activity.stats.totalAdded || 0;
        totalPlacesFound += activity.stats.totalFound || 0;
      }
    });

    res.json({
      totalRuns,
      successRuns,
      errorRuns,
      successRate: totalRuns > 0 ? ((successRuns / totalRuns) * 100).toFixed(2) : 0,
      lastRun: lastRun ? {
        timestamp: lastRun.timestamp,
        status: lastRun.status,
        message: lastRun.message,
        stats: lastRun.stats
      } : null,
      nextRun,
      last30Days: {
        totalPlacesAdded,
        totalPlacesFound,
        runs: recentActivities.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
};

// Ejecutar manualmente el script (solo admin)
exports.runManually = async (req, res) => {
  try {
    // Importar dinámicamente para evitar problemas de dependencias circulares
    const { discoverNewPlaces } = require('../scripts/autoDiscoverPlaces');
    
    // Ejecutar en segundo plano
    discoverNewPlaces()
      .then(() => console.log('✅ Ejecución manual completada'))
      .catch(err => console.error('❌ Error en ejecución manual:', err));

    res.json({ 
      message: 'Script de auto-descubrimiento iniciado en segundo plano',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error ejecutando script manualmente:', error);
    res.status(500).json({ error: 'Error ejecutando script' });
  }
};

// Limpiar actividades antiguas (mantener solo últimos 90 días)
exports.cleanOldActivities = async (req, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await ScriptActivity.deleteMany({
      timestamp: { $lt: ninetyDaysAgo }
    });

    res.json({
      message: 'Actividades antiguas eliminadas',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error limpiando actividades:', error);
    res.status(500).json({ error: 'Error limpiando actividades' });
  }
};
