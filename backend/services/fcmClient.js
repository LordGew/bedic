 'use strict';

// const axios = require('axios'); // No necesario - no usamos FCM (Firebase Cloud Messaging)

const FCM_API_URL = 'https://fcm.googleapis.com/fcm/send';

class FCMClient {
    constructor() {
        this.serverKey = process.env.FCM_SERVER_KEY;
        if (!this.serverKey) {
            console.warn('[FCMClient] FCM_SERVER_KEY no está definido en las variables de entorno.');
        }
    }

    /**
     * Envía una notificación a un único dispositivo.
     * @param {string} deviceToken
     * @param {string} title
     * @param {string} body
     * @param {object} [data]
     */
    async sendToDevice(deviceToken, title, body, data = {}) {
        if (!this.serverKey) {
            return {
                success: false,
                message: 'FCM_SERVER_KEY no configurado en el backend',
            };
        }

        if (!deviceToken) {
            return { success: false, message: 'deviceToken requerido' };
        }

        const payload = {
            to: deviceToken,
            notification: {
                title,
                body,
            },
            data: data || {},
        };

        return this._send(payload);
    }

    /**
     * Envía una notificación a múltiples dispositivos utilizando registration_ids.
     * @param {string[]} deviceTokens
     * @param {string} title
     * @param {string} body
     * @param {object} [data]
     */
    async sendToMany(deviceTokens, title, body, data = {}) {
        if (!this.serverKey) {
            return {
                success: false,
                message: 'FCM_SERVER_KEY no configurado en el backend',
            };
        }

        const tokens = Array.from(new Set((deviceTokens || []).filter(Boolean)));
        if (!tokens.length) {
            return { success: false, message: 'No se proporcionaron tokens de dispositivo' };
        }

        const payload = {
            registration_ids: tokens,
            notification: {
                title,
                body,
            },
            data: data || {},
        };

        return this._send(payload);
    }

    async _send(payload) {
        try {
            const response = await axios.post(FCM_API_URL, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `key=${this.serverKey}`,
                },
                timeout: 5000,
            });

            const ok = response.status >= 200 && response.status < 300;
            return {
                success: ok,
                status: response.status,
                data: response.data,
            };
        } catch (error) {
            console.error('[FCMClient] Error al enviar notificación FCM:', error.response?.data || error.message);
            return {
                success: false,
                status: error.response?.status || 500,
                message: 'Error al enviar notificación FCM',
                error: error.response?.data || error.message,
            };
        }
    }
}

module.exports = new FCMClient();

