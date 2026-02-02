import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule,
    FormsModule,
    TranslatePipe
  ],
  template: `
    <div class="verification-container">
      <!-- Header -->
      <div class="verification-header">
        <h1>{{ 'verification.title' | translate }}</h1>
        <p>{{ 'verification.subtitle' | translate }}</p>
      </div>

      <!-- Estadísticas -->
      <div class="stats-grid" *ngIf="stats">
        <mat-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">{{ 'verification.total_users' | translate }}</div>
          </div>
        </mat-card>

        <mat-card class="stat-card verified">
          <div class="stat-content">
            <div class="stat-value">{{ stats.verifiedUsers }}</div>
            <div class="stat-label">{{ 'verification.verified_users' | translate }}</div>
            <div class="stat-percentage">{{ stats.verificationRate }}%</div>
          </div>
        </mat-card>

        <mat-card class="stat-card partial">
          <div class="stat-content">
            <div class="stat-value">{{ stats.partiallyVerifiedUsers }}</div>
            <div class="stat-label">{{ 'verification.partially_verified' | translate }}</div>
          </div>
        </mat-card>

        <mat-card class="stat-card unverified">
          <div class="stat-content">
            <div class="stat-value">{{ stats.unverifiedUsers }}</div>
            <div class="stat-label">{{ 'verification.unverified_users' | translate }}</div>
          </div>
        </mat-card>

        <mat-card class="stat-card email">
          <div class="stat-content">
            <div class="stat-value">{{ stats.emailVerifiedUsers }}</div>
            <div class="stat-label">{{ 'verification.email_verified' | translate }}</div>
            <div class="stat-percentage">{{ stats.emailVerificationRate }}%</div>
          </div>
        </mat-card>

        <mat-card class="stat-card name">
          <div class="stat-content">
            <div class="stat-value">{{ stats.nameValidatedUsers }}</div>
            <div class="stat-label">{{ 'verification.name_validated' | translate }}</div>
            <div class="stat-percentage">{{ stats.nameValidationRate }}%</div>
          </div>
        </mat-card>
      </div>

      <!-- Filtros -->
      <mat-card class="filters-card">
        <h3>{{ 'verification.filters' | translate }}</h3>
        <div class="filters-grid">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'verification.filter_by_level' | translate }}</mat-label>
            <mat-select [(ngModel)]="selectedLevel" (change)="applyFilters()">
              <mat-option value="">{{ 'verification.all' | translate }}</mat-option>
              <mat-option value="verified">{{ 'verification.verified' | translate }}</mat-option>
              <mat-option value="partially_verified">{{ 'verification.partially_verified' | translate }}</mat-option>
              <mat-option value="unverified">{{ 'verification.unverified' | translate }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'verification.filter_by_email' | translate }}</mat-label>
            <mat-select [(ngModel)]="selectedEmailStatus" (change)="applyFilters()">
              <mat-option value="">{{ 'verification.all' | translate }}</mat-option>
              <mat-option value="true">{{ 'verification.verified' | translate }}</mat-option>
              <mat-option value="false">{{ 'verification.not_verified' | translate }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'verification.filter_by_name' | translate }}</mat-label>
            <mat-select [(ngModel)]="selectedNameStatus" (change)="applyFilters()">
              <mat-option value="">{{ 'verification.all' | translate }}</mat-option>
              <mat-option value="valid">{{ 'verification.valid' | translate }}</mat-option>
              <mat-option value="invalid">{{ 'verification.invalid' | translate }}</mat-option>
              <mat-option value="pending">{{ 'verification.pending' | translate }}</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-raised-button color="primary" (click)="loadUsers()">
            <mat-icon>refresh</mat-icon>
            {{ 'verification.refresh' | translate }}
          </button>
        </div>
      </mat-card>

      <!-- Tabla de usuarios -->
      <mat-card class="users-table-card">
        <h3>{{ 'verification.users_list' | translate }}</h3>
        <div class="table-container">
          <table mat-table [dataSource]="users" class="users-table">
            <!-- Nombre -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>{{ 'verification.name' | translate }}</th>
              <td mat-cell *matCellDef="let element">{{ element.name }}</td>
            </ng-container>

            <!-- Username -->
            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef>{{ 'verification.username' | translate }}</th>
              <td mat-cell *matCellDef="let element">@{{ element.username }}</td>
            </ng-container>

            <!-- Email -->
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>{{ 'verification.email' | translate }}</th>
              <td mat-cell *matCellDef="let element">{{ element.email }}</td>
            </ng-container>

            <!-- Email Verificado -->
            <ng-container matColumnDef="emailVerified">
              <th mat-header-cell *matHeaderCellDef>{{ 'verification.email_status' | translate }}</th>
              <td mat-cell *matCellDef="let element">
                <mat-chip [ngClass]="element.verification?.emailVerified ? 'verified' : 'unverified'">
                  <mat-icon>{{ element.verification?.emailVerified ? 'check_circle' : 'cancel' }}</mat-icon>
                  {{ element.verification?.emailVerified ? ('verification.verified' | translate) : ('verification.not_verified' | translate) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Nombre Validado -->
            <ng-container matColumnDef="nameValidation">
              <th mat-header-cell *matHeaderCellDef>{{ 'verification.name_status' | translate }}</th>
              <td mat-cell *matCellDef="let element">
                <mat-chip [ngClass]="'name-' + (element.verification?.nameValidationStatus || 'pending')">
                  <mat-icon>{{ getNameValidationIcon(element.verification?.nameValidationStatus) }}</mat-icon>
                  {{ getNameValidationLabel(element.verification?.nameValidationStatus) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Nivel de Verificación -->
            <ng-container matColumnDef="verificationLevel">
              <th mat-header-cell *matHeaderCellDef>{{ 'verification.level' | translate }}</th>
              <td mat-cell *matCellDef="let element">
                <mat-chip [ngClass]="'level-' + (element.verification?.verificationLevel || 'unverified')">
                  <mat-icon>{{ getVerificationLevelIcon(element.verification?.verificationLevel) }}</mat-icon>
                  {{ getVerificationLevelLabel(element.verification?.verificationLevel) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Acciones -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>{{ 'verification.actions' | translate }}</th>
              <td mat-cell *matCellDef="let element">
                <button mat-icon-button (click)="viewDetails(element)" matTooltip="{{ 'verification.view_details' | translate }}">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button (click)="verifyUser(element)" matTooltip="{{ 'verification.manually_verify' | translate }}" *ngIf="element.verification?.verificationLevel !== 'verified'">
                  <mat-icon>check</mat-icon>
                </button>
                <button mat-icon-button (click)="rejectUser(element)" matTooltip="{{ 'verification.reject' | translate }}" *ngIf="element.verification?.verificationLevel === 'verified'">
                  <mat-icon>close</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
        <div *ngIf="users.length === 0" class="no-data">
          <p>{{ 'verification.no_users' | translate }}</p>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .verification-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .verification-header {
      margin-bottom: 30px;
      h1 {
        margin: 0 0 10px 0;
        font-size: 28px;
        font-weight: 600;
        color: var(--text-primary);
      }
      p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 14px;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }

    .stat-card {
      padding: 20px;
      border-radius: 8px;
      background: var(--surface-color);
      border-left: 4px solid var(--primary-color);

      &.verified {
        border-left-color: #4caf50;
      }

      &.partial {
        border-left-color: #ff9800;
      }

      &.unverified {
        border-left-color: #f44336;
      }

      &.email {
        border-left-color: #2196f3;
      }

      &.name {
        border-left-color: #9c27b0;
      }

      .stat-content {
        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 13px;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 5px;
        }

        .stat-percentage {
          font-size: 12px;
          color: var(--primary-color);
          font-weight: 600;
        }
      }
    }

    .filters-card {
      padding: 20px;
      margin-bottom: 30px;
      background: var(--surface-color);

      h3 {
        margin: 0 0 15px 0;
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
      }

      .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
      }
    }

    .users-table-card {
      padding: 20px;
      background: var(--surface-color);

      h3 {
        margin: 0 0 15px 0;
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
      }

      .table-container {
        overflow-x: auto;
      }

      .users-table {
        width: 100%;

        th {
          background-color: var(--background-color);
          color: var(--text-primary);
          font-weight: 600;
          padding: 12px;
          text-align: left;
          border-bottom: 2px solid var(--border-color);
        }

        td {
          padding: 12px;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
        }

        tr:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }

        mat-chip {
          &.verified {
            background-color: rgba(76, 175, 80, 0.15);
            color: #4caf50;
          }

          &.unverified {
            background-color: rgba(244, 67, 54, 0.15);
            color: #f44336;
          }

          &.name-valid {
            background-color: rgba(76, 175, 80, 0.15);
            color: #4caf50;
          }

          &.name-invalid {
            background-color: rgba(244, 67, 54, 0.15);
            color: #f44336;
          }

          &.name-pending {
            background-color: rgba(255, 152, 0, 0.15);
            color: #ff9800;
          }

          &.level-verified {
            background-color: rgba(76, 175, 80, 0.15);
            color: #4caf50;
          }

          &.level-partially_verified {
            background-color: rgba(255, 152, 0, 0.15);
            color: #ff9800;
          }

          &.level-unverified {
            background-color: rgba(244, 67, 54, 0.15);
            color: #f44336;
          }
        }
      }
    }

    .no-data {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-secondary);
      p {
        margin: 0;
        font-size: 14px;
      }
    }

    @media (prefers-color-scheme: dark) {
      .stat-card {
        background: #2d2d2d;
      }

      .filters-card {
        background: #2d2d2d;
      }

      .users-table-card {
        background: #2d2d2d;
      }

      .users-table {
        tr:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
      }
    }
  `]
})
export class VerificationComponent implements OnInit, OnDestroy {
  users: any[] = [];
  stats: any = null;
  loading = false;

  selectedLevel = '';
  selectedEmailStatus = '';
  selectedNameStatus = '';

  displayedColumns: string[] = ['name', 'username', 'email', 'emailVerified', 'nameValidation', 'verificationLevel', 'actions'];

  private destroy$ = new Subject<void>();

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getVerificationUsers({
      verificationLevel: this.selectedLevel || undefined,
      emailVerified: this.selectedEmailStatus ? this.selectedEmailStatus === 'true' : undefined,
      nameValidationStatus: this.selectedNameStatus || undefined
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.users = response.data || [];
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.snackBar.open('Error cargando usuarios', 'Cerrar', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  loadStats(): void {
    this.adminService.getVerificationStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.stats = response.data || null;
        },
        error: (error) => {
          console.error('Error loading stats:', error);
        }
      });
  }

  applyFilters(): void {
    this.loadUsers();
  }

  viewDetails(user: any): void {
    console.log('Ver detalles del usuario:', user);
    // TODO: Implementar modal de detalles
  }

  verifyUser(user: any): void {
    const reason = prompt('Razón de verificación manual (opcional):');
    if (reason !== null) {
      this.adminService.manuallyVerifyUser(user._id, reason)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Usuario verificado correctamente', 'Cerrar', { duration: 3000 });
            this.loadUsers();
            this.loadStats();
          },
          error: (error) => {
            console.error('Error verificando usuario:', error);
            this.snackBar.open('Error verificando usuario', 'Cerrar', { duration: 3000 });
          }
        });
    }
  }

  rejectUser(user: any): void {
    const reason = prompt('Razón del rechazo:');
    if (reason !== null) {
      this.adminService.rejectUserVerification(user._id, reason)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Verificación rechazada', 'Cerrar', { duration: 3000 });
            this.loadUsers();
            this.loadStats();
          },
          error: (error) => {
            console.error('Error rechazando verificación:', error);
            this.snackBar.open('Error rechazando verificación', 'Cerrar', { duration: 3000 });
          }
        });
    }
  }

  getVerificationLevelIcon(level: string): string {
    switch (level) {
      case 'verified':
        return 'verified_user';
      case 'partially_verified':
        return 'person_check';
      default:
        return 'person';
    }
  }

  getVerificationLevelLabel(level: string): string {
    switch (level) {
      case 'verified':
        return 'Verificado';
      case 'partially_verified':
        return 'Parcialmente Verificado';
      default:
        return 'No Verificado';
    }
  }

  getNameValidationIcon(status: string): string {
    switch (status) {
      case 'valid':
        return 'check_circle';
      case 'invalid':
        return 'cancel';
      default:
        return 'schedule';
    }
  }

  getNameValidationLabel(status: string): string {
    switch (status) {
      case 'valid':
        return 'Válido';
      case 'invalid':
        return 'Inválido';
      default:
        return 'Pendiente';
    }
  }
}
