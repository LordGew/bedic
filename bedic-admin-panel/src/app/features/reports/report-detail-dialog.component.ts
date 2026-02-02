import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../core/services/admin.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-report-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    FormsModule,
    TranslatePipe
  ],
  template: `
    <div class="report-detail-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>report</mat-icon>
          {{ 'dashboard.report_details' | translate }}
        </h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <!-- Información del Usuario -->
        <div class="section">
          <h3><mat-icon>person</mat-icon> {{ 'dashboard.reporter_info' | translate }}</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">{{ 'reports.username_label' | translate }}</span>
              <span class="value">{{ '@' + (report?.userName || ('common.unknown_user' | translate)) }}</span>
            </div>
            <div class="info-item">
              <span class="label">{{ 'reports.email_label' | translate }}</span>
              <span class="value">{{ report?.userEmail || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="label">{{ 'dashboard.date' | translate }}</span>
              <span class="value">{{ report?.createdAt | date:'medium' }}</span>
            </div>
          </div>
        </div>

        <!-- Información del Contenido Reportado -->
        <div class="section">
          <h3><mat-icon>info</mat-icon> {{ 'dashboard.reported_content' | translate }}</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">{{ 'dashboard.type' | translate }}</span>
              <mat-chip [ngClass]="'chip-' + (report?.contentType || 'other')">
                {{ getContentTypeLabel(report?.contentType) }}
              </mat-chip>
            </div>
            <div class="info-item">
              <span class="label">{{ 'dashboard.place_content' | translate }}</span>
              <span class="value">
                {{ report?.placeName || 'N/D' }}
                <ng-container *ngIf="report?.placeId">
                  (ID: {{ report.placeId }})
                </ng-container>
              </span>
            </div>
          </div>
        </div>

        <!-- Razón del Reporte -->
        <div class="section">
          <h3><mat-icon>description</mat-icon> {{ 'dashboard.reason' | translate }}</h3>
          <mat-chip class="reason-chip">{{ report?.displayReason || report?.reason }}</mat-chip>
          <div class="description-box" *ngIf="report?.description">
            <p><strong>{{ 'dashboard.report_description' | translate }}:</strong></p>
            <p>{{ report?.description }}</p>
          </div>
        </div>

        <!-- Estado y Moderación -->
        <div class="section">
          <h3><mat-icon>admin_panel_settings</mat-icon> {{ 'dashboard.moderation_info' | translate }}</h3>
          <div class="moderation-controls">
            <mat-form-field appearance="outline" class="action-field">
              <mat-label>{{ 'reports.action_label' | translate }}</mat-label>
              <mat-select [(ngModel)]="selectedAction">
                <mat-option value="PENDING">
                  <mat-icon class="action-icon pending">schedule</mat-icon>
                  {{ 'reports.action_pending' | translate }}
                </mat-option>
                <mat-option value="APPROVED">
                  <mat-icon class="action-icon approved">check_circle</mat-icon>
                  {{ 'reports.action_approved' | translate }}
                </mat-option>
                <mat-option value="HIDDEN">
                  <mat-icon class="action-icon hidden">visibility_off</mat-icon>
                  {{ 'reports.action_hidden' | translate }}
                </mat-option>
                <mat-option value="DELETED">
                  <mat-icon class="action-icon deleted">delete</mat-icon>
                  {{ 'reports.action_deleted' | translate }}
                </mat-option>
                <mat-option value="USER_BANNED">
                  <mat-icon class="action-icon banned">block</mat-icon>
                  {{ 'reports.action_banned' | translate }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="notes-field">
            <mat-label>{{ 'reports.notes_label' | translate }}</mat-label>
            <textarea matInput
                      [(ngModel)]="moderatorNotes"
                      rows="3"
                      [placeholder]="'reports.notes_placeholder' | translate"></textarea>
          </mat-form-field>

          <div class="current-status">
            <p><strong>{{ 'reports.current_status' | translate }}:</strong></p>
            <mat-chip [ngClass]="'action-' + (report?.moderationAction || 'PENDING')">
              {{ getActionLabel(report?.moderationAction || 'PENDING') }}
            </mat-chip>
            <span class="meta" *ngIf="report?.moderatedBy || report?.moderatedAt">
              <ng-container *ngIf="report?.moderatedBy">
                {{ 'dashboard.moderated_by' | translate }} <strong>{{ report?.moderatedBy }}</strong>
              </ng-container>
              <ng-container *ngIf="report?.moderatedAt">
                {{ 'reports.moderated_at' | translate }} {{ report?.moderatedAt | date:'medium' }}
              </ng-container>
            </span>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button mat-button (click)="close()">
          <mat-icon>close</mat-icon>
          {{ 'dashboard.close' | translate }}
        </button>
        <button mat-raised-button color="primary" (click)="saveChanges()" [disabled]="saving">
          <mat-icon>save</mat-icon>
          {{ saving ? ('reports.saving' | translate) : ('reports.save_changes' | translate) }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .report-detail-dialog {
      max-width: 800px;
      width: 100%;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);

      h2 {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
        color: var(--text-primary);
        font-size: 24px;

        mat-icon {
          color: var(--primary-color);
        }
      }
    }

    mat-dialog-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .section {
      margin-bottom: 30px;
      padding: 20px;
      background-color: var(--surface-color);
      border-radius: 8px;
      border: 1px solid var(--border-color);

      h3 {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 0 15px 0;
        color: var(--text-primary);
        font-size: 18px;
        font-weight: 600;

        mat-icon {
          color: var(--primary-color);
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 5px;

      .label {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: 600;
        text-transform: uppercase;
      }

      .value {
        font-size: 14px;
        color: var(--text-primary);
      }
    }

    .reason-chip {
      background-color: rgba(255, 152, 0, 0.15);
      color: #ff9800;
      font-weight: 600;
      padding: 8px 16px;
      font-size: 14px;
    }

    .description-box {
      margin-top: 15px;
      padding: 15px;
      background-color: var(--background-color);
      border-radius: 4px;
      border-left: 3px solid var(--primary-color);

      p {
        margin: 0 0 10px 0;
        color: var(--text-primary);

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .content-box {
      padding: 15px;
      background-color: var(--background-color);
      border-radius: 4px;
      border: 1px solid var(--border-color);

      p {
        margin: 0 0 10px 0;
        color: var(--text-primary);
      }
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
      margin-top: 10px;

      .content-image {
        width: 100%;
        height: 100px;
        object-fit: cover;
        border-radius: 4px;
        border: 1px solid var(--border-color);
      }
    }

    .moderation-controls {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;

      mat-form-field {
        width: 100%;
      }
    }

    .notes-field {
      width: 100%;
    }

    .current-status {
      margin-top: 20px;
      padding: 15px;
      background-color: var(--background-color);
      border-radius: 4px;

      p {
        margin: 0 0 10px 0;
        color: var(--text-primary);
        font-weight: 600;
      }

      mat-chip {
        margin-right: 10px;
      }
    }

    .moderation-history {
      margin-top: 15px;
      padding: 15px;
      background-color: var(--background-color);
      border-radius: 4px;
      border-left: 3px solid #4caf50;

      p {
        margin: 5px 0;
        color: var(--text-primary);
        font-size: 13px;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .chip-comment {
      background-color: rgba(33, 150, 243, 0.15);
      color: #2196f3;
    }

    .chip-rating {
      background-color: rgba(255, 193, 7, 0.15);
      color: #ffc107;
    }

    .chip-place {
      background-color: rgba(76, 175, 80, 0.15);
      color: #4caf50;
    }

    .chip-user {
      background-color: rgba(156, 39, 176, 0.15);
      color: #9c27b0;
    }

    .status-pending {
      background-color: rgba(255, 152, 0, 0.15);
      color: #ff9800;
    }

    .status-verified {
      background-color: rgba(76, 175, 80, 0.15);
      color: #4caf50;
    }

    .status-rejected {
      background-color: rgba(244, 67, 54, 0.15);
      color: #f44336;
    }

    .action-approved {
      background-color: rgba(76, 175, 80, 0.15);
      color: #4caf50;
    }

    .action-hidden {
      background-color: rgba(156, 39, 176, 0.15);
      color: #9c27b0;
    }

    .action-deleted {
      background-color: rgba(244, 67, 54, 0.15);
      color: #f44336;
    }

    .action-user_banned {
      background-color: rgba(244, 67, 54, 0.15);
      color: #f44336;
    }

    .status-icon, .action-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 8px;
      vertical-align: middle;

      &.pending { color: #ff9800; }
      &.verified { color: #4caf50; }
      &.rejected { color: #f44336; }
      &.approved { color: #4caf50; }
      &.hidden { color: #9c27b0; }
      &.deleted { color: #f44336; }
      &.banned { color: #f44336; }
    }
  `]
})
export class ReportDetailDialogComponent implements OnInit {
  report: any;
  selectedAction: string;
  moderatorNotes: string = '';
  saving = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ReportDetailDialogComponent>,
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {
    this.report = data.report;
    this.selectedAction = this.report?.moderationAction || 'PENDING';
  }

  ngOnInit(): void {
    // Si en el futuro se necesita más detalle, aquí se podría llamar a getReportDetail
    // this.adminService.getReportDetail(this.report.id).subscribe(...)
  }

  getContentTypeLabel(type?: string): string {
    const labels: { [key: string]: string } = {
      'COMMENT': 'Comment',
      'REVIEW': 'Review',
      'PLACE': 'Place',
      'USER': 'User',
      'PHOTO': 'Photo'
    };
    if (!type) {
      return 'Other';
    }
    return labels[String(type).toUpperCase()] || type;
  }

  getActionLabel(action: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Pending',
      'APPROVED': 'Approved',
      'HIDDEN': 'Hidden',
      'DELETED': 'Deleted',
      'USER_BANNED': 'User Banned'
    };
    return labels[action] || action;
  }

  saveChanges(): void {
    if (!this.report?.id) {
      this.showSnackBar('No se pudo identificar el reporte a actualizar', 'error');
      return;
    }

    this.saving = true;

    const body = {
      moderationAction: this.selectedAction,
      note: this.moderatorNotes
    };

    this.adminService.moderateReport(this.report.id, body).subscribe({
      next: (response) => {
        this.saving = false;
        this.showSnackBar('Report updated successfully', 'success');
        this.dialogRef.close({ updated: true, data: response });
      },
      error: (err) => {
        console.error('Error updating report:', err);
        this.saving = false;
        this.showSnackBar('Error updating report', 'error');
      }
    });
  }

  private showSnackBar(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
