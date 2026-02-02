const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// ============ LOGIN - USAR SISTEMA EXISTENTE ============
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email });

    // Validar campos
    if (!email || !password) {
      console.log('❌ Campos faltantes');
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Buscar usuario en BD con contraseña
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ Usuario no existe:', email);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      console.log('❌ Contraseña incorrecta para:', email);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar que sea admin o moderator
    if (!['admin', 'moderator'].includes(user.role)) {
      console.log('❌ Usuario no tiene permisos de admin:', email);
      return res.status(403).json({ error: 'Acceso denegado - No eres administrador' });
    }

    // Generar JWT
    const token = require('jsonwebtoken').sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('✅ Login exitoso para:', email, 'Rol:', user.role);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('❌ Error en login:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ GET CURRENT USER ============
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('id email name role');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ LOGOUT ============
router.post('/logout', verifyToken, (req, res) => {
  try {
    // En una aplicación real, invalidar el token en la BD
    res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ REFRESH TOKEN ============
router.post('/refresh', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('id email name role');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Generar nuevo JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
