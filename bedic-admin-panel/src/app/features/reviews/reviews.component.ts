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
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';

interface Review {
  id: string;
  placeId: string;
  placeName: string;
  userId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  verified: boolean;
  reported: boolean;
}

@Component({
  selector: 'app-reviews',
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
    TranslatePipe
  ],
  template: `
    <div class="reviews-container">
      <div class="header">
        <h1>{{ 'reviews.title' | translate }}</h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            {{ 'common.refresh' | translate }}
          </button>
        </div>
      </div>

      <div class="info-banner">
        <mat-icon>info</mat-icon>
        <span>{{ 'reviews.info_banner' | translate }}</span>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'reviews.search_place' | translate }}</mat-label>
          <input matInput (keyup)="applyFilter($event)" [placeholder]="'reviews.search_place' | translate">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'reviews.filter_place' | translate }}</mat-label>
          <mat-select (selectionChange)="filterByPlace($event.value)">
            <mat-option value="">{{ 'common.all' | translate }}</mat-option>
            <mat-option *ngFor="let place of places" [value]="place.id">
              {{ place.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'reviews.filter_status' | translate }}</mat-label>
          <mat-select (selectionChange)="filterByStatus($event.value)">
            <mat-option value="">{{ 'common.all' | translate }}</mat-option>
            <mat-option value="verified">{{ 'reviews.verified' | translate }}</mat-option>
            <mat-option value="unverified">{{ 'reviews.unverified' | translate }}</mat-option>
            <mat-option value="reported">{{ 'reviews.reported' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="table-container">
        <div class="table-info">
          <p>{{ 'reviews.total' | translate }}: <strong>{{ dataSource.data.length }}</strong></p>
        </div>
        <table mat-table [dataSource]="dataSource" matSort class="reviews-table">
          <!-- Place Column -->
          <ng-container matColumnDef="place">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'reviews.place' | translate }}</th>
            <td mat-cell *matCellDef="let element">{{ element.placeName }}</td>
          </ng-container>

          <!-- User Column -->
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'reviews.user' | translate }}</th>
            <td mat-cell *matCellDef="let element">{{ element.userName }}</td>
          </ng-container>

          <!-- Rating Column -->
          <ng-container matColumnDef="rating">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'reviews.rating' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              <div class="rating">
                <mat-icon class="star">star</mat-icon>
                <span>{{ element.rating.toFixed(1) }}</span>
              </div>
            </td>
          </ng-container>

          <!-- Title Column -->
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>{{ 'reviews.title' | translate }}</th>
            <td mat-cell *matCellDef="let element">{{ element.title }}</td>
          </ng-container>

          <!-- Date Column -->
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'reviews.date' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              {{ element.createdAt | date:'short' }}
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>{{ 'reviews.status' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              <mat-chip [ngClass]="element.reported ? 'reported' : (element.verified ? 'verified' : 'unverified')">
                {{ element.reported ? ('reviews.reported' | translate) : (element.verified ? ('reviews.verified' | translate) : ('reviews.unverified' | translate)) }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>{{ 'common.actions' | translate }}</th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button (click)="viewDetail(element)" [matTooltip]="'reviews.view_detail' | translate">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button [matMenuTriggerFor]="menu" [matTooltip]="'common.more' | translate">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="verifyReview(element)" *ngIf="!element.verified">
                  <mat-icon>check_circle</mat-icon>
                  <span>{{ 'reviews.verify' | translate }}</span>
                </button>
                <button mat-menu-item (click)="deleteReview(element)">
                  <mat-icon>delete</mat-icon>
                  <span>{{ 'common.delete' | translate }}</span>
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
          aria-label="Select page of reviews">
        </mat-paginator>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>{{ 'reviews.loading' | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .reviews-container {
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

    .rating {
      display: flex;
      align-items: center;
      gap: 5px;

      .star {
        color: #ffc107;
        font-size: 18px;
      }
    }

    mat-chip {
      &.verified {
        background-color: rgba(76, 175, 80, 0.15) !important;
        color: #4caf50 !important;
      }

      &.unverified {
        background-color: rgba(158, 158, 158, 0.15) !important;
        color: #9e9e9e !important;
      }

      &.reported {
        background-color: rgba(244, 67, 54, 0.15) !important;
        color: #f44336 !important;
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
export class ReviewsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['place', 'user', 'rating', 'title', 'date', 'status', 'actions'];
  dataSource = new MatTableDataSource<Review>([]);
  loading = false;
  allReviews: Review[] = [];
  places: any[] = [];

  constructor(
    private adminService: AdminService,
    private languageService: LanguageService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadReviews();
    this.loadPlaces();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadReviews(): void {
    this.loading = true;
    // TODO: Implementar endpoint en AdminService
    this.adminService.getReviews().subscribe({
      next: (data: any) => {
        this.allReviews = data.data || [];
        this.dataSource.data = this.allReviews;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading reviews:', err);
        this.loading = false;
      }
    });
  }

  loadPlaces(): void {
    this.adminService.getPlaces().subscribe({
      next: (data: any) => {
        this.places = data.data || [];
      },
      error: (err: any) => {
        console.error('Error loading places:', err);
      }
    });
  }

  refreshData(): void {
    this.loadReviews();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByPlace(placeId: string): void {
    if (!placeId) {
      this.dataSource.data = this.allReviews;
    } else {
      this.dataSource.data = this.allReviews.filter(r => r.placeId === placeId);
    }
  }

  filterByStatus(status: string): void {
    if (!status) {
      this.dataSource.data = this.allReviews;
    } else if (status === 'verified') {
      this.dataSource.data = this.allReviews.filter(r => r.verified && !r.reported);
    } else if (status === 'unverified') {
      this.dataSource.data = this.allReviews.filter(r => !r.verified && !r.reported);
    } else if (status === 'reported') {
      this.dataSource.data = this.allReviews.filter(r => r.reported);
    }
  }

  viewDetail(review: Review): void {
    this.dialog.open(ReviewDetailDialogComponent, {
      width: '600px',
      data: review
    });
  }

  verifyReview(review: Review): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: this.languageService.translate('reviews.verify'),
        message: `${this.languageService.translate('reviews.verify_confirm')} "${review.title}"?`,
        confirmText: this.languageService.translate('common.confirm'),
        cancelText: this.languageService.translate('common.cancel')
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.adminService.verifyReview(review.id).subscribe({
          next: () => {
            this.loadReviews();
            this.dialog.open(SuccessDialogComponent, {
              width: '400px',
              data: { message: this.languageService.translate('reviews.verified_success') }
            });
          },
          error: (err: any) => {
            console.error('Error verifying review:', err);
            this.dialog.open(ErrorDialogComponent, {
              width: '400px',
              data: { message: this.languageService.translate('common.error') }
            });
          }
        });
      }
    });
  }

  deleteReview(review: Review): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: this.languageService.translate('common.delete'),
        message: `${this.languageService.translate('common.delete')} "${review.title}"?`,
        confirmText: this.languageService.translate('common.delete'),
        cancelText: this.languageService.translate('common.cancel'),
        isDangerous: true
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.adminService.deleteReview(review.id).subscribe({
          next: () => {
            this.loadReviews();
            this.dialog.open(SuccessDialogComponent, {
              width: '400px',
              data: { message: this.languageService.translate('reviews.deleted_success') }
            });
          },
          error: (err: any) => {
            console.error('Error deleting review:', err);
            this.dialog.open(ErrorDialogComponent, {
              width: '400px',
              data: { message: this.languageService.translate('common.error') }
            });
          }
        });
      }
    });
  }
}

// ============ DIALOG COMPONENTS ============

@Component({
  selector: 'app-review-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>{{ 'reviews.view_detail' | translate }}</h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="dialog-content">
        <div class="detail-item">
          <label>{{ 'reviews.place' | translate }}:</label>
          <span>{{ data.placeName }}</span>
        </div>
        <div class="detail-item">
          <label>{{ 'reviews.user' | translate }}:</label>
          <span>{{ data.userName }}</span>
        </div>
        <div class="detail-item">
          <label>{{ 'reviews.rating' | translate }}:</label>
          <span>⭐ {{ data.rating.toFixed(1) }}</span>
        </div>
        <div class="detail-item">
          <label>{{ 'reviews.title' | translate }}:</label>
          <span>{{ data.title }}</span>
        </div>
        <div class="detail-item">
          <label>{{ 'reviews.content' | translate }}:</label>
          <p class="content-text">{{ data.content }}</p>
        </div>
        <div class="detail-item">
          <label>{{ 'reviews.date' | translate }}:</label>
          <span>{{ data.createdAt | date:'medium' }}</span>
        </div>
      </div>
      <div class="dialog-actions">
        <button mat-raised-button color="primary" (click)="close()">
          {{ 'common.close' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 0;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
      
      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }
    }

    .dialog-content {
      padding: 20px;
      max-height: 400px;
      overflow-y: auto;
    }

    .detail-item {
      margin-bottom: 16px;
      
      label {
        display: block;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 4px;
        font-size: 12px;
        text-transform: uppercase;
      }
      
      span {
        display: block;
        color: var(--text-primary);
        font-size: 14px;
      }
      
      .content-text {
        margin: 0;
        color: var(--text-primary);
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
      }
    }

    .dialog-actions {
      padding: 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class ReviewDetailDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ReviewDetailDialogComponent>
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>{{ data.title }}</h2>
        <button mat-icon-button (click)="cancel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="dialog-content">
        <p>{{ data.message }}</p>
      </div>
      <div class="dialog-actions">
        <button mat-stroked-button (click)="cancel()">
          {{ data.cancelText }}
        </button>
        <button mat-raised-button [color]="data.isDangerous ? 'warn' : 'primary'" (click)="confirm()">
          {{ data.confirmText }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 0;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
      
      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
    }

    .dialog-content {
      padding: 20px;
      
      p {
        margin: 0;
        color: var(--text-primary);
        font-size: 14px;
      }
    }

    .dialog-actions {
      padding: 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ConfirmDialogComponent>
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container success">
      <div class="dialog-icon">
        <mat-icon>check_circle</mat-icon>
      </div>
      <div class="dialog-content">
        <p>{{ data.message }}</p>
      </div>
      <div class="dialog-actions">
        <button mat-raised-button color="primary" (click)="close()">
          OK
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 30px;
      text-align: center;
      
      &.success {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);
      }
    }

    .dialog-icon {
      margin-bottom: 20px;
      
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #4caf50;
      }
    }

    .dialog-content {
      margin-bottom: 20px;
      
      p {
        margin: 0;
        color: var(--text-primary);
        font-size: 14px;
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: center;
    }
  `]
})
export class SuccessDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<SuccessDialogComponent>
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container error">
      <div class="dialog-icon">
        <mat-icon>error</mat-icon>
      </div>
      <div class="dialog-content">
        <p>{{ data.message }}</p>
      </div>
      <div class="dialog-actions">
        <button mat-raised-button color="warn" (click)="close()">
          OK
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 30px;
      text-align: center;
      
      &.error {
        background: linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%);
      }
    }

    .dialog-icon {
      margin-bottom: 20px;
      
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #f44336;
      }
    }

    .dialog-content {
      margin-bottom: 20px;
      
      p {
        margin: 0;
        color: var(--text-primary);
        font-size: 14px;
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: center;
    }
  `]
})
export class ErrorDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ErrorDialogComponent>
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
