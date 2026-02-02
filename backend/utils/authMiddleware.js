const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtener token del encabezado
            token = req.headers.authorization.split(' ')[1];

            // Verificar token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Adjuntar el usuario del token a la solicitud (excluyendo la contraseña)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'No autorizado, usuario no encontrado.' });
            }

            if (req.user.isDeleted) {
                return res.status(403).json({
                    message: 'Tu cuenta ha sido eliminada.',
                });
            }

            if (req.user.isBanned) {
                return res.status(403).json({
                    message: 'Tu cuenta ha sido baneada por incumplir las normas de la comunidad.',
                });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'No autorizado, token fallido.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no hay token.' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'No autorizado como administrador.' });
    }
};

module.exports = { protect, admin };