const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { moderateContent } = require('../services/contentModerationService');
const User = require('../models/User');
const Place = require('../models/Place');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Configuración de multer para subir imágenes de eventos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/events');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: function (req, file, cb) {
        const allowedExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        const fileExt = path.extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype.toLowerCase();

        if (allowedExtensions.includes(fileExt) || allowedMimeTypes.includes(mimeType)) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
        }
    }
});

exports.createEvent = async (req, res) => {
    try {
        const { place, title, description, date } = req.body;

        console.log('Datos recibidos:', { place, title, description, date });
        console.log('Usuario:', req.user.id);
        console.log('Archivo:', req.file ? req.file.filename : 'No hay archivo');

        // Validación básica
        if (!title || !description || !date || !place) {
            return res.status(400).json({ 
                success: false, 
                message: "Faltan campos requeridos" 
            });
        }

        // Validar que place sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(place)) {
            return res.status(400).json({ 
                success: false, 
                message: "ID de lugar inválido" 
            });
        }

        // Verificar que el lugar existe
        const placeExists = await Place.findById(place);
        if (!placeExists) {
            return res.status(404).json({ 
                success: false, 
                message: "El lugar especificado no existe" 
            });
        }

        // Verificar usuario
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        // Verificar si el usuario está baneado o silenciado
        const now = new Date();
        if (user.isBanned) {
            return res.status(403).json({ success: false, message: 'Tu cuenta ha sido baneada' });
        }
        if (user.muted_until && user.muted_until > now) {
            return res.status(403).json({ success: false, message: 'Tu cuenta está silenciada temporalmente' });
        }

        // Validar fecha
        let eventDate;
        try {
            eventDate = new Date(date);
            if (isNaN(eventDate.getTime())) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Fecha inválida" 
                });
            }
        } catch (dateErr) {
            return res.status(400).json({ 
                success: false, 
                message: "Formato de fecha inválido" 
            });
        }

        // Si se subió una imagen, agregar la URL
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/events/${req.file.filename}`;
        }

        console.log('Creando evento con imagen:', imageUrl);

        const event = await Event.create({
            place,
            title,
            description,
            date: eventDate,
            user: req.user.id,
            image: imageUrl
        });

        console.log('Evento creado:', event._id);

        res.status(201).json({ success: true, data: event });
    } catch (e) {
        console.error('Error en createEvent:', e);
        console.error('Stack trace:', e.stack);
        res.status(500).json({ 
            success: false, 
            message: "Algo salió mal. Por favor intenta de nuevo más tarde.",
            error: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};

// Middleware para subir imagen de evento con manejo de errores
exports.uploadEventImage = upload.single('image');

exports.getEventsByPlace = async (req, res) => {
    try {
        const events = await Event.find({ place: req.params.placeId })
            .populate('user', 'username');

        res.status(200).json({ success: true, data: events });
    } catch (e) {
        res.status(500).json({ success: false, message: "Error al obtener eventos" });
    }
};

exports.respondToEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { status } = req.body;

        const allowed = ['interested', 'not_interested', 'maybe', 'going'];
        if (!status || !allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido para respuesta de evento'
            });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Evento no encontrado' });
        }

        const userId = req.user.id;
        if (!event.participants) {
            event.participants = [];
        }

        const idx = event.participants.findIndex(p => p.user.toString() === userId.toString());
        if (idx >= 0) {
            event.participants[idx].status = status;
            event.participants[idx].updatedAt = new Date();
        } else {
            event.participants.push({ user: userId, status, updatedAt: new Date() });
        }

        await event.save();

        const stats = { interested: 0, notInterested: 0, maybe: 0, going: 0 };
        event.participants.forEach((p) => {
            if (p.status === 'interested') stats.interested += 1;
            if (p.status === 'not_interested') stats.notInterested += 1;
            if (p.status === 'maybe') stats.maybe += 1;
            if (p.status === 'going') stats.going += 1;
        });

        try {
            await Notification.create({
                userId: event.user,
                type: 'event_rsvp',
                title: 'Nueva respuesta en tu evento',
                message: `Tu evento "${event.title}" ha recibido una nueva respuesta (${status}).`,
                data: {
                    eventId: event._id,
                    placeId: event.place,
                    status
                },
                priority: 'normal'
            });
        } catch (notifyErr) {
            console.error('respondToEvent Notification error:', notifyErr);
        }

        res.status(200).json({ success: true, data: event, stats });
    } catch (e) {
        console.error('respondToEvent ERROR:', e);
        res.status(500).json({ success: false, message: 'Error al registrar respuesta al evento' });
    }
};
