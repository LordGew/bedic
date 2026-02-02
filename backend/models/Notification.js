const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['recommendation', 'new_place', 'announcement', 'system', 'report_update', 'comment_reply', 'event_rsvp'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date
    },
    actionUrl: {
        type: String,
        trim: true
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    }
}, {
    timestamps: true
});

// Índices compuestos para consultas eficientes
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

// Método para marcar como leída
NotificationSchema.methods.markAsRead = async function() {
    this.read = true;
    this.readAt = new Date();
    return await this.save();
};

// Método estático para obtener notificaciones no leídas de un usuario
NotificationSchema.statics.getUnreadByUser = function(userId) {
    return this.find({ userId, read: false })
        .sort({ createdAt: -1 })
        .limit(50);
};

// Método estático para contar notificaciones no leídas
NotificationSchema.statics.countUnreadByUser = function(userId) {
    return this.countDocuments({ userId, read: false });
};

module.exports = mongoose.model('Notification', NotificationSchema);
