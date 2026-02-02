import { Component, OnInit, AfterViewInit, ViewChild, Inject } from '@angular/core';
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
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';

interface Verification {
  id: string;
  name: string;
  username: string;
  email: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationEvidence: string;
  verificationRequestedAt: Date;
  verificationApprovedAt?: Date;
}

@Component({
  selector: 'app-verifications',
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
    MatDialogModule,
    MatTooltipModule,
    MatCardModule,
    MatSnackBarModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './verifications.component.html',
  styleUrls: ['./verifications.component.scss']
})
export class VerificationsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['name', 'username', 'email', 'status', 'date', 'actions'];
  dataSource = new MatTableDataSource<Verification>([]);
  loading = false;
  allVerifications: Verification[] = [];

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private languageService: LanguageService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadVerifications();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadVerifications(): void {
    this.loading = true;
    this.adminService.getVerifications().subscribe({
      next: (data: any) => {
        this.allVerifications = data.data || [];
        this.dataSource.data = this.allVerifications;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading verifications:', err);
        this.loading = false;
      }
    });
  }

  refreshData(): void {
    this.loadVerifications();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByStatus(status: string): void {
    if (!status) {
      this.dataSource.data = this.allVerifications;
    } else {
      this.dataSource.data = this.allVerifications.filter(v => v.verificationStatus === status);
    }
  }

  getStatusLabel(status: string): string {
    const keyMap: { [key: string]: string } = {
      pending: 'verifications.pending',
      approved: 'verifications.approved',
      rejected: 'verifications.rejected'
    };
    const key = keyMap[status] || status;
    return this.languageService.translate(key);
  }

  viewEvidence(verification: Verification): void {
    this.dialog.open(EvidenceDialogComponent, {
      width: '600px',
      data: {
        title: this.languageService.translate('verifications.view_detail'),
        evidence: verification.verificationEvidence,
        userName: verification.name
      }
    });
  }

  approveVerification(verification: Verification): void {
    const confirmMsg = `${this.languageService.translate('verifications.approve')} ${verification.name}?`;
    if (confirm(confirmMsg)) {
      this.adminService.approveVerification(verification.id, { note: 'Aprobado por admin' }).subscribe({
        next: () => {
          this.loadVerifications();
          this.snackBar.open(this.languageService.translate('verifications.approved'), 'Cerrar', { duration: 3000 });
        },
        error: (err: any) => {
          console.error('Error approving verification:', err);
          this.snackBar.open(this.languageService.translate('common.error'), 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  rejectVerification(verification: Verification): void {
    const reason = prompt(`${this.languageService.translate('verifications.reject')}:`);
    if (reason) {
      this.adminService.rejectVerification(verification.id, { reason }).subscribe({
        next: () => {
          this.loadVerifications();
          this.snackBar.open(this.languageService.translate('verifications.rejected'), 'Cerrar', { duration: 3000 });
        },
        error: (err: any) => {
          console.error('Error rejecting verification:', err);
          this.snackBar.open(this.languageService.translate('common.error'), 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}

// Evidence Dialog Component
@Component({
  selector: 'app-evidence-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="evidence-dialog">
      <div class="dialog-header">
        <h2>{{ data.title }}</h2>
        <button mat-icon-button (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="dialog-content">
        <p class="user-name"><strong>{{ data.userName }}</strong></p>
        <div class="evidence-container">
          <img *ngIf="isImage(data.evidence)" [src]="data.evidence" alt="Evidence" class="evidence-image">
          <div *ngIf="!isImage(data.evidence)" class="evidence-text">
            {{ data.evidence }}
          </div>
        </div>
      </div>
      <div class="dialog-actions">
        <button mat-raised-button (click)="onClose()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .evidence-dialog {
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

      .user-name {
        color: var(--text-secondary);
        font-size: 14px;
        margin: 0;
      }

      .evidence-container {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 15px;
        background-color: var(--background-color);

        .evidence-image {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }

        .evidence-text {
          white-space: pre-wrap;
          word-break: break-word;
          color: var(--text-primary);
          font-size: 14px;
          line-height: 1.6;
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
export class EvidenceDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  isImage(url: string): boolean {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  onClose(): void {
    // Dialog will close automatically
  }
}
