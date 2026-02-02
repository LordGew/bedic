const mongoose = require('mongoose');

const DeviceTokenSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deviceToken: { type: String, required: true, unique: true }, // Token FCM para notificaciones [cite: 79]
    platform: { type: String, enum: ['android', 'ios'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('DeviceToken', DeviceTokenSchema);