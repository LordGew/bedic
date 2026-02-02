import { Routes } from '@angular/router';
import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService } from '../../core/services/admin.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-appeals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslatePipe
  ],
  template: `
    <div class="appeals-container">
      <div class="appeals-header">
        <h2>{{ 'appeals.title' | translate }}</h2>
        <button mat-raised-button color="primary" (click)="refreshAppeals()">
          <mat-icon>refresh</mat-icon>
          {{ 'common.refresh' | translate }}
        </button>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>{{ 'appeals.loading' | translate }}</p>
      </div>

      <div class="table-wrapper" *ngIf="!loading && appeals.length">
        <div class="table-info">
          <p>{{ 'appeals.total' | translate }}: <strong>{{ appeals.length }}</strong></p>
        </div>
        <table mat-table [dataSource]="appeals" class="appeals-table">
          <!-- Usuario -->
          <ng-container matColumnDef="user">
            <th mat-header-cell>{{ 'appeals.user' | translate }}</th>
            <td mat-cell *matCellDef="let element">{{ element.user?.username || element.user?.email }}</td>
          </ng-container>

          <!-- Razón -->
          <ng-container matColumnDef="reason">
            <th mat-header-cell>{{ 'appeals.reason' | translate }}</th>
            <td mat-cell *matCellDef="let element">{{ element.reason || '-' }}</td>
          </ng-container>

          <!-- Estado -->
          <ng-container matColumnDef="status">
            <th mat-header-cell>{{ 'appeals.status' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              <mat-chip [ngClass]="'status-' + element.status">
                {{ getStatusLabel(element.status) }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Creado -->
          <ng-container matColumnDef="date">
            <th mat-header-cell>{{ 'appeals.created' | translate }}</th>
            <td mat-cell *matCellDef="let element">{{ element.createdAt | date:'short' }}</td>
          </ng-container>

          <!-- Acciones -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell>{{ 'common.actions' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button (click)="viewDetail(element)" [matTooltip]="'appeals.view' | translate">
                <mat-icon>visibility</mat-icon>
              </button>
              <ng-container *ngIf="element.status === 'pending'">
                <button mat-icon-button (click)="approveAppeal(element)" [matTooltip]="'appeals.approve' | translate" color="primary">
                  <mat-icon>check_circle</mat-icon>
                </button>
                <button mat-icon-button (click)="rejectAppeal(element)" [matTooltip]="'appeals.reject' | translate" color="warn">
                  <mat-icon>cancel</mat-icon>
                </button>
              </ng-container>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>

      <p *ngIf="!loading && !appeals.length" class="no-data">{{ 'appeals.no_found' | translate }}</p>
    </div>
  `,
  styles: [`
    .appeals-container {
      padding: 20px;
      background-color: var(--background-color);
      color: var(--text-primary);
      min-height: 100vh;
    }

    .appeals-header {
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

    .appeals-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .appeals-table th,
    .appeals-table td {
      border-bottom: 1px solid var(--border-color);
      padding: 12px;
      text-align: left;
      color: var(--text-primary);
    }

    .appeals-table th {
      background-color: var(--background-color);
      font-weight: 600;
      color: var(--text-primary);
    }

    .appeals-table tbody tr:hover {
      background-color: rgba(102, 126, 234, 0.05);
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-badge.status-pending {
      background-color: rgba(255, 193, 7, 0.15);
      color: #ffc107;
    }

    .status-badge.status-approved {
      background-color: rgba(76, 175, 80, 0.15);
      color: #4caf50;
    }

    .status-badge.status-rejected {
      background-color: rgba(244, 67, 54, 0.15);
      color: #f44336;
    }

    .table-info {
      padding: 16px;
      background-color: rgba(102, 126, 234, 0.05);
      border-bottom: 1px solid var(--border-color);
      
      p {
        margin: 0;
        font-size: 14px;
        color: var(--text-primary);
        
        strong {
          color: var(--primary-color);
          font-weight: 600;
        }
      }
    }
  `]
})
class AppealsComponent implements OnInit {
  displayedColumns: string[] = ['user', 'reason', 'status', 'date', 'actions'];
  appeals: any[] = [];
  loading = false;

  constructor(
    private admin: AdminService,
    private dialog: MatDialog,
    private languageService: LanguageService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAppeals();
  }

  loadAppeals(): void {
    this.loading = true;
    this.admin.getModerationAppeals().subscribe({
      next: (appeals: any[]) => {
        this.appeals = appeals || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading appeals:', err);
        this.appeals = [];
        this.loading = false;
      }
    });
  }

  refreshAppeals(): void {
    this.loadAppeals();
  }

  getStatusLabel(status: string): string {
    const keyMap: { [key: string]: string } = {
      pending: 'appeals.pending',
      approved: 'appeals.approved',
      rejected: 'appeals.rejected'
    };
    const key = keyMap[status] || status;
    return this.languageService.translate(key);
  }

  viewDetail(appeal: any): void {
    this.dialog.open(AppealDetailDialogComponent, {
      width: '600px',
      data: appeal
    });
  }

  approveAppeal(appeal: any): void {
    const confirmMsg = `${this.languageService.translate('appeals.approve')} ${appeal.user?.username}?`;
    if (confirm(confirmMsg)) {
      this.admin.approveAppeal(appeal.id, { note: 'Aprobado por admin' }).subscribe({
        next: () => {
          this.loadAppeals();
          this.snackBar.open(this.languageService.translate('appeals.approved'), 'Cerrar', { duration: 3000 });
        },
        error: (err: any) => {
          console.error('Error approving appeal:', err);
          this.snackBar.open(this.languageService.translate('common.error'), 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  rejectAppeal(appeal: any): void {
    const reason = prompt(`${this.languageService.translate('appeals.reject')}:`);
    if (reason) {
      this.admin.rejectAppeal(appeal.id, { reason }).subscribe({
        next: () => {
          this.loadAppeals();
          this.snackBar.open(this.languageService.translate('appeals.rejected'), 'Cerrar', { duration: 3000 });
        },
        error: (err: any) => {
          console.error('Error rejecting appeal:', err);
          this.snackBar.open(this.languageService.translate('common.error'), 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}

@Component({
  selector: 'app-appeal-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, TranslatePipe],
  template: `
    <div class="appeal-detail-dialog">
      <div class="dialog-header">
        <h2>{{ 'appeals.detail' | translate }}</h2>
        <button mat-icon-button (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="dialog-content">
        <div class="detail-item">
          <strong>{{ 'appeals.user' | translate }}:</strong>
          <p>{{ data.user?.username || data.user?.email }}</p>
        </div>
        <div class="detail-item">
          <strong>{{ 'appeals.reason' | translate }}:</strong>
          <p>{{ data.reason || 'N/A' }}</p>
        </div>
        <div class="detail-item">
          <strong>{{ 'appeals.status' | translate }}:</strong>
          <p>{{ data.status }}</p>
        </div>
        <div class="detail-item">
          <strong>{{ 'appeals.created' | translate }}:</strong>
          <p>{{ data.createdAt | date:'medium' }}</p>
        </div>
      </div>
      <div class="dialog-actions">
        <button mat-raised-button (click)="onClose()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .appeal-detail-dialog {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px;
      background-color: var(--surface-color);
      color: var(--text-primary);
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 15px;

      h2 {
        margin: 0;
        font-size: 20px;
        color: var(--text-primary);
      }
    }

    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 15px;

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 5px;

        strong {
          color: var(--text-secondary);
          font-size: 14px;
        }

        p {
          margin: 0;
          color: var(--text-primary);
          font-size: 14px;
          white-space: pre-wrap;
          word-break: break-word;
        }
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      border-top: 1px solid var(--border-color);
      padding-top: 15px;
    }
  `]
})
class AppealDetailDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  onClose(): void {
    // Dialog will close automatically
  }
}

export const APPEALS_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: AppealsComponent }
    ]
  }
];
