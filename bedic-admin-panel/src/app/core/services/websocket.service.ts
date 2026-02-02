import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: Socket | null = null;
  private wsUrl = 'http://localhost:5000';

  // Observables para eventos
  private reportCreated$ = new BehaviorSubject<any>(null);
  private reportUpdated$ = new BehaviorSubject<any>(null);
  private reportModerated$ = new BehaviorSubject<any>(null);
  
  private placeCreated$ = new BehaviorSubject<any>(null);
  private placeUpdated$ = new BehaviorSubject<any>(null);
  private placeVerified$ = new BehaviorSubject<any>(null);
  private placeDeleted$ = new BehaviorSubject<any>(null);
  
  private userMuted$ = new BehaviorSubject<any>(null);
  private userBanned$ = new BehaviorSubject<any>(null);
  private userSanctioned$ = new BehaviorSubject<any>(null);
  
  private connectionStatus$ = new BehaviorSubject<boolean>(false);
  private notifications$ = new BehaviorSubject<any[]>([]);

  constructor() {}

  // ============ CONEXIÓN ============
  connect(userId: string, role: string, token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.wsUrl, {
      auth: {
        token,
        userId,
        role
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus$.next(false);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // ============ EVENT LISTENERS ============
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Conexión
    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      this.connectionStatus$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      this.connectionStatus$.next(false);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Error WebSocket:', error);
    });

    // Reportes
    this.socket.on('report:new', (data) => {
      this.reportCreated$.next(data);
      this.addNotification('Nuevo reporte', data.message, 'report');
    });

    this.socket.on('report:updated', (data) => {
      this.reportUpdated$.next(data);
    });

    this.socket.on('report:moderated', (data) => {
      this.reportModerated$.next(data);
      this.addNotification('Reporte moderado', data.message, 'moderation');
    });

    // Lugares
    this.socket.on('place:new', (data) => {
      this.placeCreated$.next(data);
      this.addNotification('Nuevo lugar', data.message, 'place');
    });

    this.socket.on('place:updated', (data) => {
      this.placeUpdated$.next(data);
      this.addNotification('Lugar actualizado', data.message, 'place');
    });

    this.socket.on('place:verified', (data) => {
      this.placeVerified$.next(data);
      this.addNotification('Lugar verificado', data.message, 'place');
    });

    this.socket.on('place:deleted', (data) => {
      this.placeDeleted$.next(data);
      this.addNotification('Lugar eliminado', data.message, 'place');
    });

    // Usuarios
    this.socket.on('user:muted', (data) => {
      this.userMuted$.next(data);
      this.addNotification('Usuario silenciado', data.message, 'user');
    });

    this.socket.on('user:banned', (data) => {
      this.userBanned$.next(data);
      this.addNotification('Usuario baneado', data.message, 'user');
    });

    this.socket.on('user:sanctioned', (data) => {
      this.userSanctioned$.next(data);
      this.addNotification('Sanción aplicada', data.message, 'user');
    });

    // Notificaciones
    this.socket.on('notification:read', (data) => {
      console.log('Notificación leída:', data);
    });
  }

  // ============ EMITIR EVENTOS ============
  emitReportCreated(data: any): void {
    this.socket?.emit('report:created', data);
  }

  emitReportUpdated(data: any): void {
    this.socket?.emit('report:updated', data);
  }

  emitReportModerated(data: any): void {
    this.socket?.emit('report:moderated', data);
  }

  emitPlaceCreated(data: any): void {
    this.socket?.emit('place:created', data);
  }

  emitPlaceUpdated(data: any): void {
    this.socket?.emit('place:updated', data);
  }

  emitPlaceVerified(data: any): void {
    this.socket?.emit('place:verified', data);
  }

  emitPlaceDeleted(data: any): void {
    this.socket?.emit('place:deleted', data);
  }

  emitUserMuted(data: any): void {
    this.socket?.emit('user:muted', data);
  }

  emitUserBanned(data: any): void {
    this.socket?.emit('user:banned', data);
  }

  // ============ OBSERVABLES ============
  getReportCreated$(): Observable<any> {
    return this.reportCreated$.asObservable();
  }

  getReportUpdated$(): Observable<any> {
    return this.reportUpdated$.asObservable();
  }

  getReportModerated$(): Observable<any> {
    return this.reportModerated$.asObservable();
  }

  getPlaceCreated$(): Observable<any> {
    return this.placeCreated$.asObservable();
  }

  getPlaceUpdated$(): Observable<any> {
    return this.placeUpdated$.asObservable();
  }

  getPlaceVerified$(): Observable<any> {
    return this.placeVerified$.asObservable();
  }

  getPlaceDeleted$(): Observable<any> {
    return this.placeDeleted$.asObservable();
  }

  getUserMuted$(): Observable<any> {
    return this.userMuted$.asObservable();
  }

  getUserBanned$(): Observable<any> {
    return this.userBanned$.asObservable();
  }

  getUserSanctioned$(): Observable<any> {
    return this.userSanctioned$.asObservable();
  }

  getConnectionStatus$(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  getNotifications$(): Observable<any[]> {
    return this.notifications$.asObservable();
  }

  // ============ NOTIFICACIONES ============
  private addNotification(title: string, message: string, type: string): void {
    const notification = {
      id: Date.now(),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false
    };

    const current = this.notifications$.value;
    this.notifications$.next([notification, ...current]);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      const updated = this.notifications$.value.filter(n => n.id !== notification.id);
      this.notifications$.next(updated);
    }, 5000);
  }

  markNotificationAsRead(notificationId: number): void {
    const current = this.notifications$.value;
    const updated = current.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notifications$.next(updated);

    this.socket?.emit('notification:read', { notificationId });
  }

  clearNotifications(): void {
    this.notifications$.next([]);
  }

  // ============ UTILIDADES ============
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  getConnectionStats(): any {
    return {
      connected: this.socket?.connected || false,
      socketId: this.socket?.id,
      url: this.wsUrl
    };
  }
}
