import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatListModule,
    MatChipsModule
  ],
  template: `
    <div class="notifications-container">
      <!-- Notificaciones en tiempo real -->
      <div class="toast-container">
        <div *ngFor="let notification of toastNotifications" 
             class="toast" 
             [ngClass]="'toast-' + notification.type"
             [@slideIn]>
          <div class="toast-content">
            <mat-icon class="toast-icon">{{ getIcon(notification.type) }}</mat-icon>
            <div class="toast-text">
              <strong>{{ notification.title }}</strong>
              <p>{{ notification.message }}</p>
            </div>
          </div>
          <button mat-icon-button (click)="removeToast(notification.id)" class="toast-close">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Badge con contador -->
      <button mat-icon-button 
              [matMenuTriggerFor]="notificationMenu"
              [matBadge]="unreadCount"
              matBadgeColor="warn"
              [matBadgeHidden]="unreadCount === 0"
              class="notification-button">
        <mat-icon>notifications</mat-icon>
      </button>

      <!-- Menu de notificaciones -->
      <mat-menu #notificationMenu="matMenu" class="notification-menu">
        <div class="menu-header">
          <h3>Notificaciones</h3>
          <button mat-icon-button (click)="clearAll()" *ngIf="notifications.length > 0">
            <mat-icon>clear_all</mat-icon>
          </button>
        </div>

        <mat-divider></mat-divider>

        <div *ngIf="notifications.length === 0" class="empty-state">
          <mat-icon>notifications_none</mat-icon>
          <p>Sin notificaciones</p>
        </div>

        <mat-list *ngIf="notifications.length > 0">
          <mat-list-item *ngFor="let notification of notifications" 
                         class="notification-item"
                         [ngClass]="{ 'unread': !notification.read }">
            <mat-icon matListItemIcon [ngClass]="'icon-' + notification.type">
              {{ getIcon(notification.type) }}
            </mat-icon>
            <div matListItemTitle>{{ notification.title }}</div>
            <div matListItemLine>{{ notification.message }}</div>
            <div matListItemMeta class="notification-time">
              {{ getTimeAgo(notification.timestamp) }}
            </div>
            <button mat-icon-button 
                    (click)="markAsRead(notification.id)"
                    *ngIf="!notification.read"
                    matListItemMeta>
              <mat-icon>done</mat-icon>
            </button>
          </mat-list-item>
        </mat-list>
      </mat-menu>

      <!-- Estado de conexión -->
      <div class="connection-status" [ngClass]="{ 'connected': isConnected }">
        <span class="status-dot"></span>
        <span class="status-text">{{ isConnected ? 'Conectado' : 'Desconectado' }}</span>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .notification-button {
      position: relative;
    }

    .menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
    }

    .menu-header h3 {
      margin: 0;
      font-size: 1rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      color: var(--text-secondary);
    }

    .empty-state mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      margin-bottom: 0.5rem;
    }

    .notification-item {
      border-left: 3px solid transparent;
      transition: all 0.3s ease;
    }

    .notification-item.unread {
      background-color: var(--surface-variant);
      border-left-color: var(--primary);
    }

    .notification-time {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .icon-report {
      color: var(--error);
    }

    .icon-place {
      color: var(--success);
    }

    .icon-user {
      color: var(--warning);
    }

    .icon-moderation {
      color: var(--primary);
    }

    /* Toast Notifications */
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-radius: 0.5rem;
      background-color: var(--surface);
      border-left: 4px solid var(--primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease;
    }

    .toast-content {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      flex: 1;
    }

    .toast-icon {
      flex-shrink: 0;
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
    }

    .toast-text {
      flex: 1;
    }

    .toast-text strong {
      display: block;
      margin-bottom: 0.25rem;
    }

    .toast-text p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .toast-close {
      flex-shrink: 0;
    }

    .toast-report {
      border-left-color: var(--error);
    }

    .toast-report .toast-icon {
      color: var(--error);
    }

    .toast-place {
      border-left-color: var(--success);
    }

    .toast-place .toast-icon {
      color: var(--success);
    }

    .toast-user {
      border-left-color: var(--warning);
    }

    .toast-user .toast-icon {
      color: var(--warning);
    }

    .toast-moderation {
      border-left-color: var(--primary);
    }

    .toast-moderation .toast-icon {
      color: var(--primary);
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Connection Status */
    .connection-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      background-color: var(--surface-variant);
      font-size: 0.75rem;
      color: var(--text-secondary);
      transition: all 0.3s ease;
    }

    .connection-status.connected {
      background-color: var(--success-container);
      color: var(--success);
    }

    .status-dot {
      display: inline-block;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background-color: currentColor;
      animation: pulse 2s infinite;
    }

    .connection-status.connected .status-dot {
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    @media (max-width: 600px) {
      .toast-container {
        max-width: 90vw;
        right: 0.5rem;
        left: 0.5rem;
      }

      .connection-status {
        display: none;
      }
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: any[] = [];
  toastNotifications: any[] = [];
  unreadCount = 0;
  isConnected = false;

  private destroy$ = new Subject<void>();

  constructor(private wsService: WebSocketService) {}

  ngOnInit(): void {
    // Escuchar notificaciones
    this.wsService.getNotifications$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
        this.updateUnreadCount();
        this.updateToastNotifications();
      });

    // Escuchar estado de conexión
    this.wsService.getConnectionStatus$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isConnected = connected;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getIcon(type: string): string {
    const icons: { [key: string]: string } = {
      report: 'warning',
      place: 'location_on',
      user: 'person',
      moderation: 'gavel'
    };
    return icons[type] || 'notifications';
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Hace poco';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  }

  markAsRead(notificationId: number): void {
    this.wsService.markNotificationAsRead(notificationId);
  }

  removeToast(notificationId: number): void {
    this.toastNotifications = this.toastNotifications.filter(n => n.id !== notificationId);
  }

  clearAll(): void {
    this.wsService.clearNotifications();
  }

  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  private updateToastNotifications(): void {
    // Mostrar solo las últimas 3 notificaciones como toast
    this.toastNotifications = this.notifications.slice(0, 3);
  }
}
