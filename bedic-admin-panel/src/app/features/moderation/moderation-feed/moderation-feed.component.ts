import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';

interface Report {
  id: string;
  contentType: string;
  reason: string;
  description: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  placeName: string;
  placeId: string;
  photoUrl?: string;
  createdAt: Date;
  moderationAction: 'PENDING' | 'APPROVED' | 'HIDDEN' | 'DELETED' | 'USER_BANNED';
  moderatedBy?: string;
  moderatedAt?: Date;
  autoModerated: boolean;
  upvotes: number;
  downvotes: number;
}

@Component({
  selector: 'app-moderation-feed',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslatePipe
  ],
  template: `
    <div class="moderation-container">
      <div class="header">
        <h1>{{ 'moderation.title' | translate }}</h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            {{ 'moderation.refresh' | translate }}
          </button>
        </div>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'moderation.search' | translate }}</mat-label>
          <input matInput (keyup)="applyFilter($event)" [placeholder]="'moderation.search' | translate">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'moderation.type' | translate }}</mat-label>
          <mat-select (selectionChange)="filterByType($event.value)">
            <mat-option value="">{{ 'moderation.all' | translate }}</mat-option>
            <mat-option value="COMMENT">{{ 'moderation.comment' | translate }}</mat-option>
            <mat-option value="REVIEW">{{ 'moderation.review' | translate }}</mat-option>
            <mat-option value="PLACE">{{ 'moderation.place' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'moderation.status' | translate }}</mat-label>
          <mat-select (selectionChange)="filterByStatus($event.value)">
            <mat-option value="">{{ 'moderation.all' | translate }}</mat-option>
            <mat-option value="PENDING">{{ 'moderation.pending' | translate }}</mat-option>
            <mat-option value="APPROVED">{{ 'moderation.approved' | translate }}</mat-option>
            <mat-option value="DELETED">{{ 'moderation.deleted' | translate }}</mat-option>
            <mat-option value="USER_BANNED">{{ 'moderation.user_banned' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'moderation.automoderated' | translate }}</mat-label>
          <mat-select (selectionChange)="filterBySeverity($event.value)">
            <mat-option value="">{{ 'moderation.all' | translate }}</mat-option>
            <mat-option value="yes">{{ 'moderation.yes' | translate }}</mat-option>
            <mat-option value="no">{{ 'moderation.no' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="table-container">
        <div class="table-info">
          <p>{{ 'moderation.total_reports' | translate }}: <strong>{{ dataSource.data.length }}</strong></p>
        </div>
        <table mat-table [dataSource]="dataSource" matSort class="moderation-table">
          <!-- Place Column -->
          <ng-container matColumnDef="place">
            <th mat-header-cell *matHeaderCellDef>{{ 'moderation.place' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              <div class="place-info">
                <strong>{{ element.placeName }}</strong>
              </div>
            </td>
          </ng-container>

          <!-- Type Column -->
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'moderation.type_label' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              <mat-chip [ngClass]="'type-' + element.contentType">
                {{ getTypeLabel(element.contentType) }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- User Column -->
          <ng-container matColumnDef="userName">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'moderation.user' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              <div class="user-info">
                <strong>&#64;{{ element.userName }}</strong>
              </div>
            </td>
          </ng-container>

          <!-- Action Column (Severity/Status) -->
          <ng-container matColumnDef="severity">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'moderation.action' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              <mat-chip [ngClass]="'status-' + element.moderationAction">
                {{ getStatusLabel(element.moderationAction) }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Date Column -->
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'moderation.date' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              {{ element.createdAt | date:'short' }}
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>{{ 'moderation.actions' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button (click)="viewDetail(element)" [matTooltip]="'moderation.view_detail' | translate">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Más acciones">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="moderateReport(element)">
                  <mat-icon>check_circle</mat-icon>
                  <span>{{ 'moderation.verify' | translate }}</span>
                </button>
                <button mat-menu-item (click)="rejectReport(element)">
                  <mat-icon>cancel</mat-icon>
                  <span>{{ 'moderation.reject' | translate }}</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator
          [pageSizeOptions]="[10, 25, 50, 100]"
          showFirstLastButtons
          aria-label="Select page of reports">
        </mat-paginator>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>{{ 'common.loading' | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .moderation-container {
      padding: 20px;
      background-color: var(--background-color);
      color: var(--text-primary);
      min-height: 100vh;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;

      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
        color: var(--text-primary);
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }
    }

    .filters {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;

      mat-form-field {
        width: 100%;
      }
    }

    .table-container {
      background-color: var(--surface-color);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid var(--border-color);

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

      table {
        width: 100%;
      }

      th {
        background-color: var(--background-color);
        color: var(--text-primary);
        font-weight: 600;
        border-bottom: 2px solid var(--border-color);
        padding: 16px 12px !important;
        text-align: left;
      }

      td {
        padding: 16px 12px;
        color: var(--text-primary);
        border-bottom: 1px solid var(--border-color);
      }

      tr:hover {
        background-color: rgba(102, 126, 234, 0.05);
      }

      .place-info,
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;

        strong {
          font-weight: 600;
          color: var(--text-primary);
        }
      }

      .reason-text {
        font-size: 13px;
        color: var(--text-secondary);
        font-weight: 500;
      }
    }

    mat-chip {
      /* Content Type Chips */
      &.type-COMMENT {
        background-color: rgba(25, 118, 210, 0.15) !important;
        color: #1976d2 !important;
      }

      &.type-REVIEW {
        background-color: rgba(123, 31, 162, 0.15) !important;
        color: #7b1fa2 !important;
      }

      &.type-PLACE {
        background-color: rgba(56, 142, 60, 0.15) !important;
        color: #388e3c !important;
      }

      &.type-USER {
        background-color: rgba(255, 152, 0, 0.15) !important;
        color: #ff9800 !important;
      }

      &.type-PHOTO {
        background-color: rgba(103, 58, 183, 0.15) !important;
        color: #673ab7 !important;
      }

      /* Status Chips */
      &.status-PENDING {
        background-color: rgba(255, 193, 7, 0.15) !important;
        color: #ffc107 !important;
      }

      &.status-APPROVED {
        background-color: rgba(76, 175, 80, 0.15) !important;
        color: #4caf50 !important;
      }

      &.status-DELETED {
        background-color: rgba(244, 67, 54, 0.15) !important;
        color: #f44336 !important;
      }

      &.status-HIDDEN {
        background-color: rgba(158, 158, 158, 0.15) !important;
        color: #9e9e9e !important;
      }

      &.status-USER_BANNED {
        background-color: rgba(233, 30, 99, 0.15) !important;
        color: #e91e63 !important;
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
export class ModerationFeedComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['place', 'type', 'userName', 'createdAt', 'severity', 'actions'];
  dataSource = new MatTableDataSource<Report>([]);
  loading = false;
  allReports: Report[] = [];

  constructor(
    private adminService: AdminService,
    private router: Router,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadReports(): void {
    this.loading = true;
    this.adminService.getModerationFeed().subscribe({
      next: (reports: any[]) => {
        this.allReports = reports.map(r => ({
          ...r,
          createdAt: new Date(r.createdAt)
        }));
        this.dataSource.data = this.allReports;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading reports:', err);
        this.loading = false;
      }
    });
  }

  refreshData(): void {
    this.loadReports();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByType(type: string): void {
    if (!type) {
      this.dataSource.data = this.allReports;
    } else {
      this.dataSource.data = this.allReports.filter(r => r.contentType === type);
    }
  }

  filterByStatus(status: string): void {
    if (!status) {
      this.dataSource.data = this.allReports;
    } else {
      this.dataSource.data = this.allReports.filter(r => r.moderationAction === status);
    }
  }

  filterBySeverity(value: string): void {
    if (!value) {
      this.dataSource.data = this.allReports;
    } else {
      const shouldBeAuto = value === 'yes';
      this.dataSource.data = this.allReports.filter(r => r.autoModerated === shouldBeAuto);
    }
  }

  getTypeLabel(type: string): string {
    const keyMap: { [key: string]: string } = {
      COMMENT: 'moderation.comment',
      REVIEW: 'moderation.review',
      PLACE: 'moderation.place',
      USER: 'moderation.user',
      PHOTO: 'moderation.photo'
    };
    const key = keyMap[type] || type;
    return this.languageService.translate(key);
  }

  getStatusLabel(status: string): string {
    const keyMap: { [key: string]: string } = {
      PENDING: 'moderation.pending',
      APPROVED: 'moderation.approved',
      HIDDEN: 'moderation.deleted',
      DELETED: 'moderation.deleted',
      USER_BANNED: 'moderation.user_banned'
    };
    const key = keyMap[status] || status;
    return this.languageService.translate(key);
  }

  getReasonLabel(reason: string): string {
    const keyMap: { [key: string]: string } = {
      SPAM: 'reason.spam',
      HARASSMENT: 'reason.harassment',
      HATE_SPEECH: 'reason.hate_speech',
      VIOLENCE: 'reason.violence',
      SEXUAL_CONTENT: 'reason.sexual_content',
      FALSE_INFO: 'reason.false_info',
      COPYRIGHT: 'reason.copyright',
      OTHER: 'reason.other'
    };
    const key = keyMap[reason] || reason;
    return this.languageService.translate(key);
  }

  viewDetail(report: Report): void {
    this.router.navigate(['/dashboard/moderation', report.id]);
  }

  moderateReport(report: Report): void {
    this.adminService.moderateReport(report.id, { moderationAction: 'APPROVED' }).subscribe({
      next: () => {
        report.moderationAction = 'APPROVED';
        this.loadReports();
        alert('Reporte aprobado exitosamente');
      },
      error: (err: any) => {
        console.error('Error moderating report:', err);
        alert('Error al aprobar el reporte');
      }
    });
  }

  rejectReport(report: Report): void {
    this.adminService.moderateReport(report.id, { moderationAction: 'DELETED' }).subscribe({
      next: () => {
        report.moderationAction = 'DELETED';
        this.loadReports();
        alert('Reporte eliminado exitosamente');
      },
      error: (err: any) => {
        console.error('Error rejecting report:', err);
        alert('Error al rechazar el reporte');
      }
    });
  }
}
