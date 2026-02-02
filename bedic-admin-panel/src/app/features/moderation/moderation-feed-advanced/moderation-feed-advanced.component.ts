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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { LanguageService } from '../../../core/services/language.service';

interface ModerationLog {
  _id: string;
  actionType: string;
  reason: string;
  severity: 'LEVE' | 'MODERADO' | 'SEVERO';
  contentType: string;
  contentText: string;
  userId: string;
  userName: string;
  userEmail: string;
  detectedIssues: string[];
  toxicityScore?: number;
  spamScore?: number;
  trustScore?: number;
  automatedAction: boolean;
  createdAt: Date;
  actionDetails: any;
  userStats: any;
}

interface DashboardStats {
  totalActions: number;
  byActionType: Array<{ _id: string; count: number }>;
  bySeverity: Array<{ _id: string; count: number }>;
  byReason: Array<{ _id: string; count: number }>;
  uniqueUsers: string[];
  avgToxicityScore: number;
  avgSpamScore: number;
}

@Component({
  selector: 'app-moderation-feed-advanced',
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
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './moderation-feed-advanced.component.html',
  styleUrls: ['./moderation-feed-advanced.component.scss']
})
export class ModerationFeedAdvancedComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Data
  displayedColumns: string[] = ['actionType', 'reason', 'severity', 'userName', 'detectedIssues', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<ModerationLog>([]);
  allLogs: ModerationLog[] = [];
  dashboardStats: DashboardStats | null = null;

  // Filters
  selectedPeriod = 30;
  selectedActionType = '';
  selectedSeverity = '';
  selectedReason = '';
  selectedAutomated = '';
  searchTerm = '';

  // UI State
  loading = false;
  activeTab = 0;

  constructor(
    private adminService: AdminService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadData(): void {
    this.loading = true;
    this.adminService.getModerationLogs({
      days: this.selectedPeriod,
      automatedOnly: true
    }).subscribe({
      next: (response: any) => {
        this.allLogs = response.data.map((log: any) => ({
          ...log,
          createdAt: new Date(log.createdAt)
        }));
        this.dataSource.data = this.allLogs;
        this.applyFilters();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading moderation logs:', err);
        this.loading = false;
      }
    });

    this.adminService.getModerationDashboard(this.selectedPeriod).subscribe({
      next: (stats: any) => {
        this.dashboardStats = stats;
      },
      error: (err: any) => {
        console.error('Error loading dashboard stats:', err);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allLogs];

    if (this.selectedActionType) {
      filtered = filtered.filter(log => log.actionType === this.selectedActionType);
    }

    if (this.selectedSeverity) {
      filtered = filtered.filter(log => log.severity === this.selectedSeverity);
    }

    if (this.selectedReason) {
      filtered = filtered.filter(log => log.reason === this.selectedReason);
    }

    if (this.selectedAutomated) {
      const isAuto = this.selectedAutomated === 'yes';
      filtered = filtered.filter(log => log.automatedAction === isAuto);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.userName.toLowerCase().includes(term) ||
        log.userEmail.toLowerCase().includes(term) ||
        log.contentText.toLowerCase().includes(term)
      );
    }

    this.dataSource.data = filtered;
  }

  onPeriodChange(): void {
    this.loadData();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  refreshData(): void {
    this.loadData();
  }

  exportData(): void {
    const csv = this.convertToCSV(this.dataSource.data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moderation-logs-${new Date().toISOString()}.csv`;
    link.click();
  }

  private convertToCSV(data: ModerationLog[]): string {
    const headers = ['Tipo de Acción', 'Razón', 'Severidad', 'Usuario', 'Problemas Detectados', 'Fecha'];
    const rows = data.map(log => [
      log.actionType,
      log.reason,
      log.severity,
      log.userName,
      log.detectedIssues.join('; '),
      new Date(log.createdAt).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  getSeverityColor(severity: string): string {
    const colors: { [key: string]: string } = {
      'LEVE': '#ff9800',
      'MODERADO': '#ff6f00',
      'SEVERO': '#d32f2f'
    };
    return colors[severity] || '#757575';
  }

  getActionTypeIcon(actionType: string): string {
    const icons: { [key: string]: string } = {
      'COMMENT_HIDDEN': 'visibility_off',
      'COMMENT_DELETED': 'delete',
      'USER_MUTED': 'volume_off',
      'USER_BANNED': 'block',
      'CONTENT_FLAGGED': 'flag',
      'SPAM_DETECTED': 'warning'
    };
    return icons[actionType] || 'info';
  }

  getPercentage(value: number, max: number): number {
    return max > 0 ? (value / max) * 100 : 0;
  }

  viewUserViolations(userId: string): void {
    this.adminService.getUserViolations(userId).subscribe({
      next: (violations: any) => {
        console.log('User violations:', violations);
        // Mostrar en un dialog
      },
      error: (err: any) => {
        console.error('Error loading user violations:', err);
      }
    });
  }
}
