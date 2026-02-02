const jwt = require('jsonwebtoken');

// Verificar JWT token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    console.log('🔐 Verificando token...');
    console.log('📍 URL:', req.originalUrl);
    console.log('🔑 Token presente:', token ? '✅ Sí' : '❌ No');
    
    if (!token) {
      console.log('❌ Token no proporcionado');
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    console.log('🔑 Secret usado:', secret.substring(0, 10) + '...');
    
    const decoded = jwt.verify(token, secret);
    console.log('✅ Token válido para:', decoded.email);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Error verificando token:', err.message);
    res.status(401).json({ error: 'Token inválido o expirado: ' + err.message });
  }
};

// Verificar rol
const verifyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    next();
  };
};

// Alias para checkRole (usado en admin-extended.routes.js)
const checkRole = verifyRole;

module.exports = {
  verifyToken,
  verifyRole,
  checkRole
};
