import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="edit-container">
      <div *ngIf="loading" class="loading">Cargando usuario...</div>

      <div *ngIf="!loading && user" class="edit-card">
        <div class="edit-header">
          <h1>Editar Usuario</h1>
          <p class="subtitle">{{ user.email }}</p>
        </div>

        <form (ngSubmit)="saveUser()" class="edit-form">
          <div class="form-section">
            <h3>Información Personal</h3>
            
            <div class="form-group">
              <label>Nombre</label>
              <input 
                type="text" 
                [(ngModel)]="user.name" 
                name="name"
                class="form-control"
                placeholder="Nombre del usuario"
              />
            </div>

            <div class="form-group">
              <label>Email</label>
              <input 
                type="email" 
                [(ngModel)]="user.email" 
                name="email"
                class="form-control"
                placeholder="Email del usuario"
              />
            </div>

            <div class="form-group">
              <label>Rol</label>
              <select [(ngModel)]="user.role" name="role" class="form-control">
                <option value="user">Usuario</option>
                <option value="moderator">Moderador</option>
                <option value="admin">Administrador</option>
                <option value="support_agent">Agente de Soporte</option>
              </select>
            </div>

            <div class="form-group">
              <label>Biografía</label>
              <textarea 
                [(ngModel)]="user.bio" 
                name="bio"
                class="form-control"
                rows="3"
                placeholder="Biografía del usuario"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Ubicación</label>
              <input 
                type="text" 
                [(ngModel)]="user.location" 
                name="location"
                class="form-control"
                placeholder="Ubicación del usuario"
              />
            </div>

            <div class="form-group">
              <label>Teléfono</label>
              <input 
                type="tel" 
                [(ngModel)]="user.phone" 
                name="phone"
                class="form-control"
                placeholder="Teléfono del usuario"
              />
            </div>
          </div>

          <div class="form-section">
            <h3>Estado y Restricciones</h3>
            
            <div class="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  [(ngModel)]="user.isBanned" 
                  name="isBanned"
                />
                <span>Usuario Baneado</span>
              </label>
            </div>

            <div *ngIf="user.isBanned" class="form-group">
              <label>Razón del Baneo</label>
              <textarea 
                [(ngModel)]="user.banReason" 
                name="banReason"
                class="form-control"
                rows="2"
                placeholder="Razón del baneo"
              ></textarea>
            </div>

            <div class="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  [(ngModel)]="user.isMuted" 
                  name="isMuted"
                />
                <span>Usuario Silenciado</span>
              </label>
            </div>

            <div *ngIf="user.isMuted" class="form-group">
              <label>Silenciado Hasta</label>
              <input 
                type="datetime-local" 
                [(ngModel)]="muteUntilLocal" 
                name="muteUntil"
                class="form-control"
              />
            </div>

            <div class="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  [(ngModel)]="user.emailVerified" 
                  name="emailVerified"
                />
                <span>Email Verificado</span>
              </label>
            </div>
          </div>

          <div class="form-section">
            <h3>Información de Cuenta</h3>
            
            <div class="form-group">
              <label>ID de Usuario</label>
              <input 
                type="text" 
                [value]="user._id || user.id" 
                class="form-control"
                disabled
              />
            </div>

            <div class="form-group">
              <label>Creado</label>
              <input 
                type="text" 
                [value]="user.createdAt | date:'medium'" 
                class="form-control"
                disabled
              />
            </div>

            <div class="form-group">
              <label>Actualizado</label>
              <input 
                type="text" 
                [value]="user.updatedAt | date:'medium'" 
                class="form-control"
                disabled
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" (click)="goBack()" class="btn-secondary">← Cancelar</button>
            <button type="submit" class="btn-primary">💾 Guardar Cambios</button>
          </div>
        </form>

        <div *ngIf="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>

        <div *ngIf="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>
      </div>

      <div *ngIf="!loading && !user" class="error">
        No se pudo cargar el usuario.
      </div>
    </div>
  `,
  styles: [`
    .edit-container {
      max-width: 900px;
      margin: 20px auto;
      padding: 20px;
    }

    .loading, .error {
      text-align: center;
      padding: 40px;
      font-size: 16px;
      color: var(--text-secondary);
    }

    .error {
      color: var(--error-color);
    }

    .edit-card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .edit-header {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--primary-color);
    }

    .edit-header h1 {
      margin: 0 0 5px 0;
      font-size: 28px;
      color: var(--text-primary);
    }

    .edit-header .subtitle {
      margin: 0;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .form-section {
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 20px;
      background-color: var(--background-color);
    }

    .form-section h3 {
      margin: 0 0 15px 0;
      font-size: 16px;
      color: var(--primary-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background-color: var(--surface-color);
      color: var(--text-primary);
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s;
    }

    .form-control::placeholder {
      color: var(--text-secondary);
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-control:disabled {
      background-color: var(--background-color);
      color: var(--text-secondary);
      cursor: not-allowed;
      opacity: 0.7;
    }

    /* Dark theme overrides for form controls */
    :root.dark-theme .form-control {
      background-color: #2a2a2a;
      color: #ffffff;
      border-color: #444;
    }

    :root.dark-theme .form-control::placeholder {
      color: #999;
    }

    :root.dark-theme .form-control:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }

    :root.dark-theme select.form-control {
      background-color: #2a2a2a;
      color: #ffffff;
    }

    :root.dark-theme select.form-control option {
      background-color: #2a2a2a;
      color: #ffffff;
    }

    textarea.form-control {
      resize: vertical;
      min-height: 80px;
    }

    .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: normal;
    }

    .checkbox-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
    }

    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
      font-size: 14px;
    }

    .btn-primary {
      background-color: var(--primary-color);
      color: white;
    }

    .btn-primary:hover {
      background-color: var(--primary-dark);
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
      background-color: var(--text-secondary);
      color: white;
    }

    .btn-secondary:hover {
      background-color: var(--text-primary);
    }

    .alert {
      padding: 12px 16px;
      border-radius: 4px;
      margin-top: 20px;
      font-size: 14px;
    }

    .alert-success {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4caf50;
      border: 1px solid #4caf50;
    }

    .alert-error {
      background-color: rgba(244, 67, 54, 0.1);
      color: #f44336;
      border: 1px solid #f44336;
    }

    @media (max-width: 600px) {
      .edit-container {
        padding: 10px;
      }

      .edit-card {
        padding: 20px;
      }

      .form-actions {
        flex-direction: column;
      }

      .btn-primary, .btn-secondary {
        width: 100%;
      }
    }
  `]
})
export class UserEditComponent implements OnInit {
  user: any;
  loading = true;
  successMessage = '';
  errorMessage = '';
  muteUntilLocal = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private admin: AdminService
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUser(userId);
    }
  }

  loadUser(userId: string): void {
    this.loading = true;
    this.admin.getUserById(userId).subscribe({
      next: (user: any) => {
        this.user = user;
        if (user.muteUntil) {
          this.muteUntilLocal = this.formatDateTimeLocal(new Date(user.muteUntil));
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading user:', err);
        this.errorMessage = 'Error al cargar el usuario';
        this.loading = false;
      }
    });
  }

  saveUser(): void {
    if (!this.user.name || !this.user.email) {
      this.errorMessage = 'El nombre y email son requeridos';
      return;
    }

    const userData = { ...this.user };
    if (this.muteUntilLocal) {
      userData.muteUntil = new Date(this.muteUntilLocal).toISOString();
    }

    this.admin.updateUser(this.user._id || this.user.id, userData).subscribe({
      next: () => {
        this.successMessage = 'Usuario actualizado exitosamente';
        this.errorMessage = '';
        setTimeout(() => {
          this.goBack();
        }, 1500);
      },
      error: (err: any) => {
        console.error('Error updating user:', err);
        this.errorMessage = 'Error al actualizar el usuario';
        this.successMessage = '';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/users']);
  }

  private formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
