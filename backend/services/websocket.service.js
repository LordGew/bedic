const socketIO = require('socket.io');

class WebSocketService {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: ['http://localhost:4200', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Middleware para autenticación
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Token no proporcionado'));
      }
      // Validar token JWT aquí
      socket.userId = socket.handshake.auth.userId;
      socket.role = socket.handshake.auth.role;
      next();
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`✅ Usuario conectado: ${socket.userId} (${socket.id})`);

      // Unirse a sala de usuario
      socket.join(`user:${socket.userId}`);

      // Unirse a sala de rol
      socket.join(`role:${socket.role}`);

      // Evento de desconexión
      socket.on('disconnect', () => {
        console.log(`❌ Usuario desconectado: ${socket.userId}`);
      });

      // Eventos de moderación
      socket.on('report:created', (data) => this.handleReportCreated(data));
      socket.on('report:updated', (data) => this.handleReportUpdated(data));
      socket.on('report:moderated', (data) => this.handleReportModerated(data));

      // Eventos de lugares
      socket.on('place:created', (data) => this.handlePlaceCreated(data));
      socket.on('place:updated', (data) => this.handlePlaceUpdated(data));
      socket.on('place:verified', (data) => this.handlePlaceVerified(data));
      socket.on('place:deleted', (data) => this.handlePlaceDeleted(data));

      // Eventos de usuarios
      socket.on('user:muted', (data) => this.handleUserMuted(data));
      socket.on('user:banned', (data) => this.handleUserBanned(data));

      // Eventos de notificaciones
      socket.on('notification:read', (data) => this.handleNotificationRead(data));
    });
  }

  // ============ REPORTES ============
  handleReportCreated(data) {
    // Notificar a moderadores
    this.io.to('role:moderator').emit('report:new', {
      id: data.id,
      type: data.type,
      reason: data.reason,
      severity: data.severity,
      createdAt: new Date(),
      message: `Nuevo reporte: ${data.reason}`
    });

    // Notificar a admins
    this.io.to('role:admin').emit('report:new', data);
  }

  handleReportUpdated(data) {
    // Notificar cambios
    this.io.to('role:moderator').emit('report:updated', data);
    this.io.to('role:admin').emit('report:updated', data);
  }

  handleReportModerated(data) {
    const { reportId, status, action, moderatorId } = data;

    // Notificar a moderadores
    this.io.to('role:moderator').emit('report:moderated', {
      reportId,
      status,
      action,
      moderatorId,
      timestamp: new Date(),
      message: `Reporte moderado: ${action}`
    });

    // Notificar a admins
    this.io.to('role:admin').emit('report:moderated', data);

    // Notificar al usuario reportado si fue baneado/silenciado
    if (action === 'ban' || action === 'mute') {
      this.io.to(`user:${data.reportedUserId}`).emit('user:sanctioned', {
        action,
        reason: data.reason,
        message: action === 'ban' ? 'Has sido baneado' : 'Has sido silenciado'
      });
    }
  }

  // ============ LUGARES ============
  handlePlaceCreated(data) {
    // Notificar a support agents
    this.io.to('role:support_agent').emit('place:new', {
      id: data.id,
      name: data.name,
      category: data.category,
      createdAt: new Date(),
      message: `Nuevo lugar: ${data.name}`
    });

    // Notificar a admins
    this.io.to('role:admin').emit('place:new', data);
  }

  handlePlaceUpdated(data) {
    // Notificar cambios
    this.io.to('role:support_agent').emit('place:updated', data);
    this.io.to('role:admin').emit('place:updated', data);

    // Notificar a usuario propietario
    if (data.ownerId) {
      this.io.to(`user:${data.ownerId}`).emit('place:updated', {
        placeId: data.id,
        message: 'Tu lugar ha sido actualizado'
      });
    }
  }

  handlePlaceVerified(data) {
    const { placeId, ownerId } = data;

    // Notificar a support agents
    this.io.to('role:support_agent').emit('place:verified', {
      placeId,
      message: 'Lugar verificado'
    });

    // Notificar a admins
    this.io.to('role:admin').emit('place:verified', data);

    // Notificar al propietario
    if (ownerId) {
      this.io.to(`user:${ownerId}`).emit('place:verified', {
        placeId,
        message: '¡Tu lugar ha sido verificado!'
      });
    }
  }

  handlePlaceDeleted(data) {
    const { placeId, ownerId } = data;

    // Notificar a support agents
    this.io.to('role:support_agent').emit('place:deleted', {
      placeId,
      message: 'Lugar eliminado'
    });

    // Notificar a admins
    this.io.to('role:admin').emit('place:deleted', data);

    // Notificar al propietario
    if (ownerId) {
      this.io.to(`user:${ownerId}`).emit('place:deleted', {
        placeId,
        message: 'Tu lugar ha sido eliminado'
      });
    }
  }

  // ============ USUARIOS ============
  handleUserMuted(data) {
    const { userId, hours } = data;

    // Notificar a moderadores
    this.io.to('role:moderator').emit('user:muted', {
      userId,
      hours,
      message: `Usuario silenciado por ${hours} horas`
    });

    // Notificar al usuario
    this.io.to(`user:${userId}`).emit('user:muted', {
      hours,
      message: `Has sido silenciado por ${hours} horas`
    });
  }

  handleUserBanned(data) {
    const { userId } = data;

    // Notificar a moderadores
    this.io.to('role:moderator').emit('user:banned', {
      userId,
      message: 'Usuario baneado'
    });

    // Notificar al usuario
    this.io.to(`user:${userId}`).emit('user:banned', {
      message: 'Has sido baneado de la plataforma'
    });
  }

  // ============ NOTIFICACIONES ============
  handleNotificationRead(data) {
    const { notificationId, userId } = data;

    // Actualizar estado de notificación
    this.io.to(`user:${userId}`).emit('notification:read', {
      notificationId,
      timestamp: new Date()
    });
  }

  // Emitir notificación de recomendación
  emitRecommendationNotification(userId, place) {
    this.io.to(`user:${userId}`).emit('recommendation:new', {
      type: 'recommendation',
      title: '🎯 Nuevo lugar que te puede interesar',
      message: `Descubre ${place.name} - ${place.category}. ¡Tiene ${place.rating?.toFixed(1) || '0.0'} ⭐!`,
      data: {
        placeId: place._id,
        placeName: place.name,
        placeCategory: place.category,
        placeRating: place.rating,
        placeImage: place.photos?.[0]
      },
      timestamp: new Date()
    });
  }

  // Emitir notificación de nuevo comentario
  emitCommentNotification(userId, comment, place) {
    this.io.to(`user:${userId}`).emit('comment:new', {
      type: 'comment_new',
      title: '💬 Nuevo comentario',
      message: `${comment.username} ha comentado en ${place.name}`,
      data: {
        commentId: comment._id,
        placeId: place._id,
        placeName: place.name,
        userName: comment.username,
        text: comment.text
      },
      timestamp: new Date()
    });
  }

  // Emitir notificación de respuesta a comentario
  emitCommentReplyNotification(userId, reply, originalComment, place) {
    this.io.to(`user:${userId}`).emit('comment:reply', {
      type: 'comment_reply',
      title: '↩️ Respuesta a comentario',
      message: `${reply.username} respondió tu comentario en ${place.name}`,
      data: {
        replyId: reply._id,
        commentId: originalComment._id,
        placeId: place._id,
        placeName: place.name,
        userName: reply.username,
        text: reply.text
      },
      timestamp: new Date()
    });
  }

  // Emitir notificación de like en comentario
  emitCommentLikeNotification(userId, username, comment, place) {
    this.io.to(`user:${userId}`).emit('comment:liked', {
      type: 'comment_liked',
      title: '👍 Like en comentario',
      message: `${username} le dio like a tu comentario en ${place.name}`,
      data: {
        commentId: comment._id,
        placeId: place._id,
        placeName: place.name,
        userName: username,
        likeCount: comment.upvotes || 0
      },
      timestamp: new Date()
    });
  }

  // Emitir notificación de dislike en comentario
  emitCommentDislikeNotification(userId, username, comment, place) {
    this.io.to(`user:${userId}`).emit('comment:disliked', {
      type: 'comment_disliked',
      title: '👎 Dislike en comentario',
      message: `${username} le dio dislike a tu comentario en ${place.name}`,
      data: {
        commentId: comment._id,
        placeId: place._id,
        placeName: place.name,
        userName: username,
        dislikeCount: comment.downvotes || 0
      },
      timestamp: new Date()
    });
  }

  // Emitir notificación de evento RSVP
  emitEventRSVPNotification(userId, username, event, status) {
    const statusMap = {
      'interested': 'interested',
      'going': 'going',
      'not_interested': 'not_interested'
    };
    
    this.io.to(`user:${userId}`).emit('event:rsvp', {
      type: 'event_rsvp',
      title: '📅 Respuesta a evento',
      message: `${username} ${statusMap[status] || status} a tu evento "${event.title}"`,
      data: {
        eventId: event._id,
        eventName: event.title,
        userName: username,
        response: statusMap[status] || status
      },
      timestamp: new Date()
    });
  }

  // ============ MÉTODOS PÚBLICOS ============

  // Emitir a usuario específico
  emitToUser(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Emitir a rol específico
  emitToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  // Emitir a todos
  emitToAll(event, data) {
    this.io.emit(event, data);
  }

  // Obtener usuarios conectados
  getConnectedUsers() {
    const users = [];
    this.io.sockets.sockets.forEach((socket) => {
      users.push({
        socketId: socket.id,
        userId: socket.userId,
        role: socket.role
      });
    });
    return users;
  }

  // Obtener número de usuarios conectados
  getConnectedCount() {
    return this.io.engine.clientsCount;
  }
}

module.exports = WebSocketService;
