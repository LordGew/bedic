import { Component, OnInit, ViewChild, AfterViewInit, Inject } from '@angular/core';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';

interface Announcement {
  id: string;
  title: string;
  message: string;
  description?: string;
  type: 'promotion' | 'event' | 'alert' | 'general';
  durationDays: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'draft' | 'archived';
  location?: {
    coordinates?: [number, number];
    address?: string;
  };
  imageUrl?: string;
  externalLink?: string;
  pinned: boolean;
  createdBy?: any;
  views: number;
  clicks: number;
  createdAt: Date;
  updatedAt?: Date;
}

interface AnnouncementDialogData {
  mode: 'create' | 'edit';
  announcement?: Announcement;
}

interface AnnouncementDialogResult {
  title: string;
  message: string;
  type: 'promotion' | 'event' | 'alert' | 'general';
  durationHours: number;
}

@Component({
  selector: 'app-announcement-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ (data.mode === 'create' ? 'announcements.create' : 'announcements.edit') | translate }}
    </h2>
    <div mat-dialog-content [formGroup]="form" class="dialog-content">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'announcements.title_label' | translate }}</mat-label>
        <input matInput formControlName="title">
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'announcements.message' | translate }}</mat-label>
        <textarea matInput rows="3" formControlName="message"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'announcements.type' | translate }}</mat-label>
        <mat-select formControlName="type">
          <mat-option value="promotion">{{ 'announcements.type_promotion' | translate }}</mat-option>
          <mat-option value="event">{{ 'announcements.type_event' | translate }}</mat-option>
          <mat-option value="alert">{{ 'announcements.type_alert' | translate }}</mat-option>
          <mat-option value="general">{{ 'announcements.type_general' | translate }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'announcements.duration' | translate }} ({{ 'common.hours' | translate }})</mat-label>
        <input matInput type="number" min="1" formControlName="durationHours">
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="form.invalid">
        {{ 'common.save' | translate }}
      </button>
    </div>
  `,
  styles: [`
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 320px;
      max-width: 480px;
    }

    .full-width {
      width: 100%;
    }

    .dialog-actions {
      margin-top: 8px;
    }
  `]
})
export class AnnouncementDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private languageService: LanguageService,
    private dialogRef: MatDialogRef<AnnouncementDialogComponent, AnnouncementDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: AnnouncementDialogData,
  ) {
    const hoursFromDays = (days?: number) => {
      if (!days || days <= 0) return 24;
      return Math.round(days * 24);
    };

    this.form = this.fb.group({
      title: [data.announcement?.title || '', Validators.required],
      message: [data.announcement?.message || '', Validators.required],
      type: [data.announcement?.type || 'general', Validators.required],
      durationHours: [hoursFromDays(data.announcement?.durationDays), [Validators.required, Validators.min(1)]],
    });
  }

  onSave(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    const result: AnnouncementDialogResult = {
      title: value.title,
      message: value.message,
      type: value.type,
      durationHours: Number(value.durationHours),
    };
    this.dialogRef.close(result);
  }
}

@Component({
  selector: 'app-announcements',
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
    MatMenuModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTooltipModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    TranslatePipe,
    AnnouncementDialogComponent
  ],
  template: `
    <div class="announcements-container">
      <div class="header">
        <h1>{{ 'announcements.title' | translate }}</h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            {{ 'announcements.create' | translate }}
          </button>
          <button mat-raised-button color="primary" (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            {{ 'common.refresh' | translate }}
          </button>
        </div>
      </div>

      <div class="info-banner">
        <mat-icon>info</mat-icon>
        <span>{{ 'announcements.info_banner' | translate }}</span>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'announcements.status' | translate }}</mat-label>
          <mat-select (selectionChange)="filterByStatus($event.value)">
            <mat-option value="">{{ 'common.all' | translate }}</mat-option>
            <mat-option value="active">{{ 'announcements.status_active' | translate }}</mat-option>
            <mat-option value="expired">{{ 'announcements.status_expired' | translate }}</mat-option>
            <mat-option value="draft">{{ 'announcements.status_draft' | translate }}</mat-option>
            <mat-option value="archived">{{ 'announcements.status_archived' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'announcements.type' | translate }}</mat-label>
          <mat-select (selectionChange)="filterByType($event.value)">
            <mat-option value="">{{ 'common.all' | translate }}</mat-option>
            <mat-option value="promotion">{{ 'announcements.type_promotion' | translate }}</mat-option>
            <mat-option value="event">{{ 'announcements.type_event' | translate }}</mat-option>
            <mat-option value="alert">{{ 'announcements.type_alert' | translate }}</mat-option>
            <mat-option value="general">{{ 'announcements.type_general' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'common.search' | translate }}</mat-label>
          <input matInput (keyup)="applyFilter($event)" [placeholder]="'common.search' | translate">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <div class="table-container">
        <div class="table-info">
          <p>{{ 'announcements.total' | translate }}: <strong>{{ dataSource.data.length }}</strong></p>
        </div>
        <table mat-table [dataSource]="dataSource" matSort class="announcements-table">
          <!-- Title Column -->
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'announcements.title_label' | translate }}</th>
            <td mat-cell *matCellDef="let element">{{ element.title }}</td>
          </ng-container>

          <!-- Type Column -->
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'announcements.type' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              <mat-chip [ngClass]="'type-' + element.type">
                {{ getTypeLabel(element.type) }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'announcements.status' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              <mat-chip [ngClass]="'status-' + element.status">
                {{ getStatusLabel(element.status) }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Duration Column -->
          <ng-container matColumnDef="duration">
            <th mat-header-cell *matHeaderCellDef>{{ 'announcements.duration' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              {{ formatDuration(element.durationDays) }}
            </td>
          </ng-container>

          <!-- Created By Column -->
          <ng-container matColumnDef="createdBy">
            <th mat-header-cell *matHeaderCellDef>{{ 'announcements.created_by' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              {{ element.createdBy?.username || element.createdBy?.email || '-' }}
            </td>
          </ng-container>

          <!-- End Date Column -->
          <ng-container matColumnDef="endDate">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'announcements.end_date' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              {{ element.endDate | date:'short' }}
            </td>
          </ng-container>

          <!-- Pinned Column -->
          <ng-container matColumnDef="pinned">
            <th mat-header-cell *matHeaderCellDef>{{ 'announcements.pinned' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              <mat-icon *ngIf="element.pinned" class="pinned-icon">push_pin</mat-icon>
              <span *ngIf="!element.pinned" class="not-pinned">-</span>
            </td>
          </ng-container>

          <!-- Views Column -->
          <ng-container matColumnDef="views">
            <th mat-header-cell *matHeaderCellDef>{{ 'announcements.views' | translate }}</th>
            <td mat-cell *matCellDef="let element">{{ element.views }}</td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>{{ 'common.actions' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button (click)="editAnnouncement(element)" [matTooltip]="'announcements.edit' | translate">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button (click)="togglePin(element)" [matTooltip]="element.pinned ? 'Desanclar' : 'Anclar'">
                <mat-icon>{{ element.pinned ? 'push_pin' : 'push_pin_outline' }}</mat-icon>
              </button>
              <button mat-icon-button (click)="deleteAnnouncement(element)" [matTooltip]="'announcements.delete' | translate">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]" showFirstLastButtons></mat-paginator>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>{{ 'announcements.loading' | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .announcements-container {
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

    .info-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background-color: rgba(102, 126, 234, 0.1);
      border-left: 4px solid var(--primary-color);
      border-radius: 4px;
      margin-bottom: 20px;
      color: var(--text-primary);
      font-size: 14px;

      mat-icon {
        color: var(--primary-color);
        font-size: 20px;
        width: 20px;
        height: 20px;
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
    }

    mat-chip {
      &.type-promotion {
        background-color: rgba(76, 175, 80, 0.15) !important;
        color: #4caf50 !important;
      }

      &.type-event {
        background-color: rgba(33, 150, 243, 0.15) !important;
        color: #2196f3 !important;
      }

      &.type-alert {
        background-color: rgba(255, 152, 0, 0.15) !important;
        color: #ff9800 !important;
      }

      &.type-general {
        background-color: rgba(158, 158, 158, 0.15) !important;
        color: #9e9e9e !important;
      }

      &.status-active {
        background-color: rgba(76, 175, 80, 0.15) !important;
        color: #4caf50 !important;
      }

      &.status-expired {
        background-color: rgba(244, 67, 54, 0.15) !important;
        color: #f44336 !important;
      }

      &.status-draft {
        background-color: rgba(255, 193, 7, 0.15) !important;
        color: #ffc107 !important;
      }

      &.status-archived {
        background-color: rgba(158, 158, 158, 0.15) !important;
        color: #9e9e9e !important;
      }
    }

    .pinned-icon {
      color: var(--primary-color);
      font-size: 20px;
    }

    .not-pinned {
      color: var(--text-secondary);
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
export class AnnouncementsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['title', 'type', 'status', 'createdBy', 'duration', 'endDate', 'pinned', 'views', 'actions'];
  dataSource = new MatTableDataSource<Announcement>([]);
  loading = false;
  allAnnouncements: Announcement[] = [];

  constructor(
    private adminService: AdminService,
    private languageService: LanguageService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadAnnouncements(): void {
    this.loading = true;
    this.adminService.getAnnouncements().subscribe({
      next: (data: any) => {
        const announcements = data.data || data || [];
        // Mapear _id a id para compatibilidad
        this.allAnnouncements = announcements.map((ann: any) => ({
          ...ann,
          id: ann._id || ann.id
        }));
        this.dataSource.data = this.allAnnouncements;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading announcements:', err);
        this.loading = false;
      }
    });
  }

  refreshData(): void {
    this.loadAnnouncements();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByStatus(status: string): void {
    if (!status) {
      this.dataSource.data = this.allAnnouncements;
    } else {
      this.dataSource.data = this.allAnnouncements.filter(a => a.status === status);
    }
  }

  filterByType(type: string): void {
    if (!type) {
      this.dataSource.data = this.allAnnouncements;
    } else {
      this.dataSource.data = this.allAnnouncements.filter(a => a.type === type);
    }
  }

  getTypeLabel(type: string): string {
    const keyMap: { [key: string]: string } = {
      promotion: 'announcements.type_promotion',
      event: 'announcements.type_event',
      alert: 'announcements.type_alert',
      general: 'announcements.type_general'
    };
    const key = keyMap[type] || type;
    return this.languageService.translate(key);
  }

  getStatusLabel(status: string): string {
    const keyMap: { [key: string]: string } = {
      active: 'announcements.status_active',
      expired: 'announcements.status_expired',
      draft: 'announcements.status_draft',
      archived: 'announcements.status_archived'
    };
    const key = keyMap[status] || status;
    return this.languageService.translate(key);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open<AnnouncementDialogComponent, AnnouncementDialogData, AnnouncementDialogResult>(
      AnnouncementDialogComponent,
      {
        width: '480px',
        data: { mode: 'create' },
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) { return; }

      const durationDays = result.durationHours / 24;
      const body: any = {
        title: result.title,
        message: result.message,
        type: result.type,
        durationDays,
      };

      this.adminService.createAnnouncement(body).subscribe({
        next: () => {
          this.loadAnnouncements();
          alert(this.languageService.translate('announcements.created_success'));
        },
        error: (err: any) => {
          console.error('Error creando anuncio:', err);
          alert(this.languageService.translate('common.error'));
        }
      });
    });
  }

  editAnnouncement(announcement: Announcement): void {
    const dialogRef = this.dialog.open<AnnouncementDialogComponent, AnnouncementDialogData, AnnouncementDialogResult>(
      AnnouncementDialogComponent,
      {
        width: '480px',
        data: { mode: 'edit', announcement },
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) { return; }

      const durationDays = result.durationHours / 24;
      const body: any = {
        title: result.title,
        message: result.message,
        type: result.type,
        durationDays,
      };

      this.adminService.updateAnnouncement(announcement.id, body).subscribe({
        next: () => {
          this.loadAnnouncements();
          alert(this.languageService.translate('announcements.updated_success'));
        },
        error: (err: any) => {
          console.error('Error actualizando anuncio:', err);
          alert(this.languageService.translate('common.error'));
        }
      });
    });
  }

  formatDuration(durationDays: number): string {
    if (!durationDays || durationDays <= 0) {
      return '-';
    }

    const totalHours = Math.round(durationDays * 24);
    if (totalHours < 24) {
      return `${totalHours} ${this.languageService.translate('common.hours')}`;
    }

    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const daysLabel = this.languageService.translate('common.days');
    const hoursLabel = this.languageService.translate('common.hours');

    if (hours === 0) {
      return `${days} ${daysLabel}`;
    }

    return `${days} ${daysLabel} ${hours} ${hoursLabel}`;
  }

  togglePin(announcement: Announcement): void {
    this.adminService.pinAnnouncement(announcement.id, !announcement.pinned).subscribe({
      next: () => {
        this.loadAnnouncements();
        const msg = announcement.pinned ? 
          this.languageService.translate('announcements.unpinned_success') :
          this.languageService.translate('announcements.pinned_success');
        alert(msg);
      },
      error: (err: any) => {
        console.error('Error toggling pin:', err);
        alert(this.languageService.translate('common.error'));
      }
    });
  }

  deleteAnnouncement(announcement: Announcement): void {
    if (confirm(`${this.languageService.translate('announcements.delete')} "${announcement.title}"?`)) {
      this.adminService.deleteAnnouncement(announcement.id).subscribe({
        next: () => {
          this.loadAnnouncements();
          alert(this.languageService.translate('announcements.deleted_success'));
        },
        error: (err: any) => {
          console.error('Error deleting announcement:', err);
          alert(this.languageService.translate('common.error'));
        }
      });
    }
  }
}
