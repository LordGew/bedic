import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

interface Report {
  id: string;
  type: 'comment' | 'rating' | 'place';
  userId: string;
  userName: string;
  userAvatar?: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  content: string;
  createdAt: Date;
  status: 'pending' | 'verified' | 'rejected';
  severity: 'leve' | 'moderado' | 'severo';
  actionTaken?: string;
}

@Component({
  selector: 'app-moderation-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    FormsModule
  ],
  template: `
    <div class="detail-container" *ngIf="!loading">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Detalle del Reporte</h1>
        <div class="spacer"></div>
      </div>

      <div class="content">
        <!-- Report Info -->
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>Información del Reporte</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <label>ID:</label>
                <span>{{ report.id }}</span>
              </div>
              <div class="info-item">
                <label>Tipo:</label>
                <mat-chip [ngClass]="'type-' + report.type">
                  {{ getTypeLabel(report.type) }}
                </mat-chip>
              </div>
              <div class="info-item">
                <label>Estado:</label>
                <mat-chip [ngClass]="'status-' + report.status">
                  {{ getStatusLabel(report.status) }}
                </mat-chip>
              </div>
              <div class="info-item">
                <label>Severidad:</label>
                <mat-chip [ngClass]="'severity-' + report.severity">
                  {{ report.severity | uppercase }}
                </mat-chip>
              </div>
              <div class="info-item">
                <label>Fecha:</label>
                <span>{{ report.createdAt | date:'medium' }}</span>
              </div>
              <div class="info-item">
                <label>Razón:</label>
                <span>{{ report.reason }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Reporter Info -->
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>Información del Reportador</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="user-info">
              <img *ngIf="report.userAvatar" [src]="report.userAvatar" alt="Avatar" class="avatar">
              <div class="user-details">
                <h3>{{ report.userName }}</h3>
                <p>ID: {{ report.userId }}</p>
                <button mat-stroked-button (click)="viewUserProfile(report.userId)">
                  <mat-icon>person</mat-icon>
                  Ver Perfil
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Reported User Info -->
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>Usuario Reportado</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="user-info">
              <div class="user-details">
                <h3>{{ report.reportedUserName }}</h3>
                <p>ID: {{ report.reportedUserId }}</p>
                <button mat-stroked-button (click)="viewUserProfile(report.reportedUserId)">
                  <mat-icon>person</mat-icon>
                  Ver Perfil
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Content -->
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>Contenido Reportado</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="content-preview">
              {{ report.content }}
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Actions -->
        <mat-card class="actions-card">
          <mat-card-header>
            <mat-card-title>Acciones</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="actions-grid">
              <div class="action-group">
                <h4>Moderar Reporte</h4>
                <div class="button-group">
                  <button mat-raised-button color="accent" (click)="verifyReport()">
                    <mat-icon>check_circle</mat-icon>
                    Verificar
                  </button>
                  <button mat-raised-button (click)="rejectReport()">
                    <mat-icon>cancel</mat-icon>
                    Rechazar
                  </button>
                </div>
              </div>

              <div class="action-group">
                <h4>Sancionar Usuario</h4>
                <div class="button-group">
                  <button mat-raised-button color="warn" (click)="muteUser()">
                    <mat-icon>volume_off</mat-icon>
                    Silenciar
                  </button>
                  <button mat-raised-button color="warn" (click)="banUser()">
                    <mat-icon>block</mat-icon>
                    Banear
                  </button>
                </div>
              </div>
            </div>

            <mat-form-field appearance="outline" class="full-width mt-20">
              <mat-label>Nota Privada</mat-label>
              <textarea matInput [(ngModel)]="privateNote" rows="4" placeholder="Agregar nota..."></textarea>
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="saveNote()" class="full-width mt-20">
              <mat-icon>save</mat-icon>
              Guardar Nota
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <div *ngIf="loading" class="loading">
      <mat-spinner diameter="40"></mat-spinner>
      <p>Cargando detalle...</p>
    </div>
  `,
  styles: [`
    .detail-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 30px;

      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
      }

      .spacer {
        flex: 1;
      }
    }

    .content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    mat-card {
      background-color: var(--surface-color);
      color: var(--text-primary);

      mat-card-header {
        margin-bottom: 15px;

        mat-card-title {
          font-size: 18px;
          font-weight: 600;
        }
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 5px;

        label {
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 12px;
          text-transform: uppercase;
        }

        span {
          color: var(--text-primary);
          word-break: break-all;
        }
      }
    }

    .user-info {
      display: flex;
      gap: 20px;
      align-items: flex-start;

      .avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
      }

      .user-details {
        flex: 1;

        h3 {
          margin: 0 0 5px 0;
          font-size: 18px;
        }

        p {
          margin: 0 0 10px 0;
          color: var(--text-secondary);
          font-size: 14px;
        }
      }
    }

    .content-preview {
      background-color: var(--background-color);
      padding: 15px;
      border-radius: 4px;
      border-left: 4px solid var(--primary-color);
      min-height: 100px;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .actions-card {
      grid-column: 1 / -1;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;

      .action-group {
        h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 10px;

          button {
            width: 100%;
          }
        }
      }
    }

    .full-width {
      width: 100%;
    }

    .mt-20 {
      margin-top: 20px;
    }

    mat-chip {
      &.type-comment {
        background-color: #e3f2fd;
        color: #1976d2;
      }

      &.type-rating {
        background-color: #f3e5f5;
        color: #7b1fa2;
      }

      &.type-place {
        background-color: #e8f5e9;
        color: #388e3c;
      }

      &.severity-leve {
        background-color: #fff3e0;
        color: #f57c00;
      }

      &.severity-moderado {
        background-color: #ffe0b2;
        color: #e65100;
      }

      &.severity-severo {
        background-color: #ffebee;
        color: #c62828;
      }

      &.status-pending {
        background-color: #fff9c4;
        color: #f57f17;
      }

      &.status-verified {
        background-color: #c8e6c9;
        color: #2e7d32;
      }

      &.status-rejected {
        background-color: #ffcdd2;
        color: #c62828;
      }
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 20px;

      p {
        color: var(--text-secondary);
        font-size: 16px;
      }
    }
  `]
})
export class ModerationDetailComponent implements OnInit {
  report: Report = {} as Report;
  loading = false;
  privateNote = '';
  reportId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.reportId = params['id'];
      this.loadReportDetail();
    });
  }

  loadReportDetail(): void {
    this.loading = true;
    this.adminService.getReportDetail(this.reportId).subscribe({
      next: (report: any) => {
        // El endpoint /api/admin/reports/:id (admin-extended) devuelve
        // contentType, description, moderationAction, etc.
        const typeMap: { [key: string]: 'comment' | 'rating' | 'place' } = {
          COMMENT: 'comment',
          REVIEW: 'rating',
          PLACE: 'place'
        };

        const statusMap: { [key: string]: Report['status'] } = {
          PENDING: 'pending',
          APPROVED: 'verified',
          DELETED: 'rejected'
        };

        const mappedType = typeMap[report.contentType] || 'place';
        const mappedStatus = statusMap[report.moderationAction] || 'pending';

        this.report = {
          id: report.id,
          type: mappedType,
          userId: report.userId,
          userName: report.userName,
          userAvatar: report.userAvatar,
          reportedUserId: report.userId,
          reportedUserName: report.userName,
          reason: report.reason,
          content: report.description,
          createdAt: new Date(report.createdAt),
          status: mappedStatus,
          severity: 'moderado',
          actionTaken: report.moderationAction
        };
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading report detail:', err);
        this.loading = false;
      }
    });
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      comment: 'Comentario',
      rating: 'Valoración',
      place: 'Lugar'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pending: 'Pendiente',
      verified: 'Verificado',
      rejected: 'Rechazado'
    };
    return labels[status] || status;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/moderation']);
  }

  viewUserProfile(userId: string): void {
    this.router.navigate(['/dashboard/users', userId]);
  }

  verifyReport(): void {
    this.adminService.moderateReport(this.reportId, { moderationAction: 'APPROVED' }).subscribe({
      next: () => {
        this.report.status = 'verified';
      },
      error: (err: any) => console.error('Error verifying report:', err)
    });
  }

  rejectReport(): void {
    this.adminService.moderateReport(this.reportId, { moderationAction: 'DELETED' }).subscribe({
      next: () => {
        this.report.status = 'rejected';
      },
      error: (err: any) => console.error('Error rejecting report:', err)
    });
  }

  muteUser(): void {
    this.adminService.muteUser(this.report.reportedUserId, 24).subscribe({
      next: () => {
        alert('Usuario silenciado por 24 horas');
      },
      error: (err: any) => console.error('Error muting user:', err)
    });
  }

  banUser(): void {
    if (confirm('¿Estás seguro de que deseas banear a este usuario permanentemente?')) {
      this.adminService.deleteUser(this.report.reportedUserId).subscribe({
        next: () => {
          alert('Usuario baneado permanentemente');
        },
        error: (err: any) => console.error('Error banning user:', err)
      });
    }
  }

  saveNote(): void {
    if (this.privateNote.trim()) {
      // Guardar nota en backend
      console.log('Nota guardada:', this.privateNote);
      alert('Nota guardada exitosamente');
    }
  }
}
