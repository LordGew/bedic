import { Routes } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="users-container">
      <div class="users-header">
        <h2>{{ languageService.translate('users.title') }}</h2>
      </div>

      <div *ngIf="loading" class="loading">{{ languageService.translate('users.loading') }}</div>

      <div class="table-wrapper" *ngIf="!loading && users.length">
        <table class="users-table">
          <thead>
            <tr>
              <th>{{ languageService.translate('common.name') || 'Nombre' }}</th>
              <th>{{ languageService.translate('users.email') }}</th>
              <th>{{ languageService.translate('users.role') }}</th>
              <th>{{ languageService.translate('users.status') }}</th>
              <th>{{ languageService.translate('common.created') || 'Creado' }}</th>
              <th>{{ languageService.translate('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users">
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td><span class="role-badge" [ngClass]="'role-' + u.role">{{ u.role }}</span></td>
              <td>
                <span *ngIf="u.isBanned" class="status-badge banned">{{ languageService.translate('users.banned') || 'Baneado' }}</span>
                <span *ngIf="u.isMuted && !u.isBanned" class="status-badge muted">{{ languageService.translate('users.muted') || 'Silenciado' }}</span>
                <span *ngIf="!u.isBanned && !u.isMuted" class="status-badge active">{{ languageService.translate('common.active') || 'Activo' }}</span>
              </td>
              <td>{{ u.createdAt | date:'short' }}</td>
              <td class="actions">
                <button (click)="viewProfile(u)" class="btn-action btn-info" [title]="languageService.translate('users.view_profile')">👁️ {{ languageService.translate('users.view_profile') }}</button>
                <button (click)="editUser(u)" class="btn-action btn-primary" [title]="languageService.translate('users.edit')">✏️ {{ languageService.translate('users.edit') }}</button>
                <button (click)="muteUser(u)" class="btn-action btn-warning" [disabled]="u.isBanned" [title]="languageService.translate('users.mute')">🔇 {{ languageService.translate('users.mute') }}</button>
                <button (click)="resetPassword(u)" class="btn-action btn-secondary" title="Reset Password">🔑 Reset</button>
                <button (click)="banUser(u)" class="btn-action btn-danger" [disabled]="u.isBanned" [title]="languageService.translate('users.ban')">🚫 {{ languageService.translate('users.ban') }}</button>
                <button (click)="deleteUser(u)" class="btn-action btn-delete" title="Delete">🗑️ {{ languageService.translate('common.delete') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p *ngIf="!loading && !users.length" class="no-data">{{ languageService.translate('users.no_data') || 'No hay usuarios registrados.' }}</p>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 20px;
      background-color: var(--background-color);
      color: var(--text-primary);
      min-height: 100vh;
    }

    .users-header {
      margin-bottom: 30px;

      h2 {
        margin: 0;
        font-size: 28px;
        color: var(--text-primary);
      }
    }

    .loading {
      padding: 20px;
      color: var(--text-secondary);
      text-align: center;
    }

    .no-data {
      padding: 20px;
      color: var(--text-secondary);
      text-align: center;
    }

    .table-wrapper {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .users-table th,
    .users-table td {
      border-bottom: 1px solid var(--border-color);
      padding: 12px;
      text-align: left;
      color: var(--text-primary);
    }

    .users-table th {
      background-color: var(--background-color);
      font-weight: 600;
      color: var(--text-primary);
    }

    .users-table tbody tr:hover {
      background-color: rgba(102, 126, 234, 0.05);
    }

    .role-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .role-badge.role-admin {
      background-color: rgba(255, 107, 107, 0.15);
      color: #ff6b6b;
    }

    .role-badge.role-moderator {
      background-color: rgba(78, 205, 196, 0.15);
      color: #4ecdc4;
    }

    .role-badge.role-user {
      background-color: rgba(149, 225, 211, 0.15);
      color: #95e1d3;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-badge.active {
      background-color: rgba(81, 207, 102, 0.15);
      color: #51cf66;
    }

    .status-badge.muted {
      background-color: rgba(255, 212, 59, 0.15);
      color: #ffd43b;
    }

    .status-badge.banned {
      background-color: rgba(255, 107, 107, 0.15);
      color: #ff6b6b;
    }

    .actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .btn-action {
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s ease;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-action:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Info - Ver Perfil (Azul) */
    .btn-action.btn-info {
      background-color: #2196f3;
      color: white;
    }

    .btn-action.btn-info:hover:not(:disabled) {
      background-color: #1976d2;
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
    }

    /* Primary - Editar (Púrpura) */
    .btn-action.btn-primary {
      background-color: #667eea;
      color: white;
    }

    .btn-action.btn-primary:hover:not(:disabled) {
      background-color: #5568d3;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    /* Warning - Silenciar (Amarillo/Naranja) */
    .btn-action.btn-warning {
      background-color: #ff9800;
      color: white;
    }

    .btn-action.btn-warning:hover:not(:disabled) {
      background-color: #f57c00;
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
    }

    /* Secondary - Reset Password (Gris/Azul claro) */
    .btn-action.btn-secondary {
      background-color: #607d8b;
      color: white;
    }

    .btn-action.btn-secondary:hover:not(:disabled) {
      background-color: #455a64;
      box-shadow: 0 2px 8px rgba(96, 125, 139, 0.3);
    }

    /* Danger - Banear (Rojo) */
    .btn-action.btn-danger {
      background-color: #f44336;
      color: white;
    }

    .btn-action.btn-danger:hover:not(:disabled) {
      background-color: #d32f2f;
      box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
    }

    /* Delete - Eliminar (Rojo oscuro) */
    .btn-action.btn-delete {
      background-color: #c62828;
      color: white;
    }

    .btn-action.btn-delete:hover:not(:disabled) {
      background-color: #b71c1c;
      box-shadow: 0 2px 8px rgba(198, 40, 40, 0.3);
    }

    /* Dark theme adjustments */
    :root.dark-theme {
      .users-container {
        background-color: #121212;
      }

      .table-wrapper {
        background-color: #1e1e1e;
        border-color: #333;
      }

      .users-table th {
        background-color: #121212;
        color: #ffffff;
        border-bottom-color: #333;
      }

      .users-table td {
        border-bottom-color: #333;
        color: #ffffff;
      }

      .users-table tbody tr:hover {
        background-color: rgba(102, 126, 234, 0.1);
      }

      .btn-action {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
    }
  `]
})
class UsersComponent implements OnInit {
  users: any[] = [];
  loading = false;

  constructor(private admin: AdminService, private router: Router, public languageService: LanguageService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.admin.getUsers().subscribe({
      next: (users: any[]) => {
        const now = Date.now();
        this.users = users.map(u => {
          const mutedUntil = u.muted_until || u.muteUntil;
          const isMuted = mutedUntil ? new Date(mutedUntil).getTime() > now : false;
          return { ...u, id: u._id || u.id, isMuted, muted_until: mutedUntil };
        });
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading users:', err);
        this.loading = false;
      }
    });
  }

  viewProfile(user: any): void {
    const userId = user.id || user._id;
    if (!userId) {
      alert(this.languageService.translate('users.error_id'));
      return;
    }
    // Navegar al perfil del usuario
    this.router.navigate(['/dashboard/profile', userId]);
  }

  editUser(user: any): void {
    const userId = user.id || user._id;
    if (!userId) {
      alert(this.languageService.translate('users.error_id'));
      return;
    }
    // Navegar a editar usuario
    this.router.navigate(['/dashboard/users', userId, 'edit']);
  }

  muteUser(user: any): void {
    const userId = user.id || user._id;
    if (!userId) {
      alert(this.languageService.translate('users.error_id'));
      return;
    }
    const hours = prompt(this.languageService.translate('users.mute_hours'), '24');
    if (hours && !isNaN(parseInt(hours))) {
      this.admin.muteUser(userId, parseInt(hours)).subscribe({
        next: (res: any) => {
          const mutedUntil = res?.data?.muted_until;
          user.muted_until = mutedUntil || user.muted_until;
          user.isMuted = true;
          alert(`${this.languageService.translate('users.muted_success')} ${hours} ${this.languageService.translate('users.hours')}`);
          this.loadUsers();
        },
        error: (err: any) => {
          console.error('Error muting user:', err);
          alert(this.languageService.translate('users.mute_error'));
        }
      });
    }
  }

  banUser(user: any): void {
    const userId = user.id || user._id;
    if (!userId) {
      alert(this.languageService.translate('users.error_id'));
      return;
    }
    const reason = prompt(this.languageService.translate('users.ban_reason'), 'Terms of Service Violation');
    if (reason !== null) {
      this.admin.banUser(userId, reason).subscribe({
        next: () => {
          user.isBanned = true;
          alert(`${this.languageService.translate('users.ban_success')} ${reason}`);
          this.loadUsers();
        },
        error: (err: any) => {
          console.error('Error banning user:', err);
          alert(this.languageService.translate('users.ban_error'));
        }
      });
    }
  }

  resetPassword(user: any): void {
    const userId = user.id || user._id;
    if (!userId) {
      alert(this.languageService.translate('users.error_id'));
      return;
    }
    if (confirm(`${this.languageService.translate('users.reset_confirm')} ${user.email}?`)) {
      this.admin.resetUserPassword(userId).subscribe({
        next: () => {
          alert(`${this.languageService.translate('users.reset_sent')} ${user.email}`);
        },
        error: (err: any) => {
          console.error('Error resetting password:', err);
          alert(this.languageService.translate('users.reset_error'));
        }
      });
    }
  }

  deleteUser(user: any): void {
    const userId = user.id || user._id;
    if (!userId) {
      alert(this.languageService.translate('users.error_id'));
      return;
    }
    if (confirm(`${this.languageService.translate('users.delete_confirm')} ${user.name}? ${this.languageService.translate('users.delete_warning')}`)) {
      this.admin.deleteUser(userId).subscribe({
        next: () => {
          this.users = this.users.filter(u => (u.id || u._id) !== userId);
          alert(this.languageService.translate('users.delete_success'));
        },
        error: (err: any) => {
          console.error('Error deleting user:', err);
          alert(this.languageService.translate('users.delete_error'));
        }
      });
    }
  }
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="p-20"><h2>Detalle de Usuario</h2><p>Por implementar</p></div>'
})
class UserDetailComponent {}

export const USERS_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: UsersComponent },
      { path: ':id', component: UserDetailComponent }
    ]
  }
];
