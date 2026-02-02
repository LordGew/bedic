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
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { LanguageService } from '../../../core/services/language.service';

interface Report {
  _id: string;
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
  selector: 'app-moderation-feed-complete',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatCardModule,
    MatTabsModule,
    MatProgressBarModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './moderation-feed-complete.component.html',
  styleUrls: ['./moderation-feed-complete.component.scss']
})
export class ModerationFeedCompleteComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Data
  displayedColumns: string[] = ['place', 'type', 'userName', 'reason', 'status', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Report>([]);
  allReports: Report[] = [];
  
  // Statistics
  stats = {
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    deletedReports: 0,
    bannedUsers: 0,
    autoModeratedCount: 0,
    manualModeratedCount: 0
  };

  // Filters
  selectedStatus = '';
  selectedType = '';
  selectedAutoModerated = '';
  searchTerm = '';

  // UI State
  loading = false;
  activeTab = 0;

  constructor(
    private adminService: AdminService,
    public languageService: LanguageService
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
        // Eliminar duplicados usando un Set de IDs
        const uniqueReports = new Map<string, Report>();
        
        reports.forEach(r => {
          const reportId = r._id || r.id;
          if (!uniqueReports.has(reportId)) {
            uniqueReports.set(reportId, {
              ...r,
              createdAt: new Date(r.createdAt)
            });
          }
        });

        this.allReports = Array.from(uniqueReports.values());
        this.dataSource.data = this.allReports;
        this.calculateStats();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading reports:', err);
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats = {
      totalReports: this.allReports.length,
      pendingReports: this.allReports.filter(r => r.moderationAction === 'PENDING').length,
      approvedReports: this.allReports.filter(r => r.moderationAction === 'APPROVED').length,
      deletedReports: this.allReports.filter(r => r.moderationAction === 'DELETED' || r.moderationAction === 'HIDDEN').length,
      bannedUsers: this.allReports.filter(r => r.moderationAction === 'USER_BANNED').length,
      autoModeratedCount: this.allReports.filter(r => r.autoModerated).length,
      manualModeratedCount: this.allReports.filter(r => !r.autoModerated).length
    };
  }

  applyFilters(): void {
    let filtered = [...this.allReports];

    if (this.selectedStatus) {
      filtered = filtered.filter(r => r.moderationAction === this.selectedStatus);
    }

    if (this.selectedType) {
      filtered = filtered.filter(r => r.contentType === this.selectedType);
    }

    if (this.selectedAutoModerated) {
      const isAuto = this.selectedAutoModerated === 'yes';
      filtered = filtered.filter(r => r.autoModerated === isAuto);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.placeName.toLowerCase().includes(term) ||
        r.userName.toLowerCase().includes(term) ||
        r.reason.toLowerCase().includes(term)
      );
    }

    this.dataSource.data = filtered;
  }

  refreshData(): void {
    this.loadReports();
  }

  exportToCSV(): void {
    const headers = ['Lugar', 'Tipo', 'Usuario', 'Razón', 'Estado', 'Auto-Moderado', 'Fecha'];
    const rows = this.dataSource.data.map(r => [
      r.placeName,
      r.contentType,
      r.userName,
      r.reason,
      r.moderationAction,
      r.autoModerated ? 'Sí' : 'No',
      new Date(r.createdAt).toLocaleString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moderation-reports-${new Date().getTime()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return '#ffc107';
      case 'APPROVED': return '#4caf50';
      case 'DELETED': return '#f44336';
      case 'HIDDEN': return '#9e9e9e';
      case 'USER_BANNED': return '#e91e63';
      default: return '#666';
    }
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'COMMENT': 'Comentario',
      'REVIEW': 'Reseña',
      'PLACE': 'Lugar',
      'USER': 'Usuario',
      'PHOTO': 'Foto'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'APPROVED': 'Aprobado',
      'DELETED': 'Eliminado',
      'HIDDEN': 'Oculto',
      'USER_BANNED': 'Usuario Baneado'
    };
    return labels[status] || status;
  }

  moderateReport(report: Report, action: string): void {
    this.adminService.moderateReport(report._id || report.id, { moderationAction: action }).subscribe({
      next: () => {
        report.moderationAction = action as any;
        this.calculateStats();
        alert('Acción completada exitosamente');
      },
      error: (err: any) => {
        console.error('Error moderating report:', err);
        alert('Error al procesar la acción');
      }
    });
  }

  getProgressPercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }
}
