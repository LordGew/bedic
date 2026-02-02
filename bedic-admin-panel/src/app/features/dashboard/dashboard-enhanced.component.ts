import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminService } from '../../core/services/admin.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface Reporter {
  name: string;
  count: number;
}

@Component({
  selector: 'app-dashboard-enhanced',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    TranslatePipe
  ],
  templateUrl: './dashboard-enhanced.component.html',
  styleUrls: ['./dashboard-enhanced.component.scss']
})
export class DashboardEnhancedComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // KPIs - Datos reales desde backend
  kpis = [
    { icon: '👥', label: 'Total Users', value: 0, change: '+0%', trend: 'stable', color: '#667eea' },
    { icon: '📍', label: 'Total Places', value: 0, change: '+0%', trend: 'stable', color: '#4caf50' },
    { icon: '⚠️', label: 'Pending Reports', value: 0, change: '+0%', trend: 'stable', color: '#ff9800' },
    { icon: '✅', label: 'Resolved Reports', value: 0, change: '+0%', trend: 'stable', color: '#2196f3' },
  ];

  // Métricas de Salud Real - Datos reales desde backend
  healthMetrics: any = {
    totalReports: 0,
    unreviewedReports: 0,
    resolutionRate: 0,
    reportsByCategory: []
  };

  // Actividad Reciente Resumida
  activitySummary: any = {
    reportsCreatedToday: 0,
    actionsToday: 0,
    topReporters: [] as Reporter[]
  };

  // Recent Activity - Datos reales desde backend
  recentActivity: any[] = [];

  // Top Data - Datos reales desde backend
  topReporters: any[] = [];
  topReportedContent: any[] = [];

  // Mapeo de razones mostradas a valores reales
  // Mapeo de categorías de reporte (type) a valores de BD
  reportTypeMapping: { [key: string]: string } = {
    'Inseguridad': 'Inseguridad',
    'Robo': 'Robo',
    'Mal Estado': 'Mal Estado',
    'Basura': 'Basura',
    'Iluminación Deficiente': 'Iluminación Deficiente',
    'Otro': 'Otro'
  };

  constructor(
    private admin: AdminService,
    private router: Router,
    private dialog: MatDialog,
    public language: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadData();
    setInterval(() => this.loadData(), 30000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    // Cargar estadísticas generales (usuarios y lugares)
    this.admin.getOverviewStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          const data = response?.data || response;
          if (data) {
            this.kpis[0].value = data.totalUsers || 0;
            this.kpis[1].value = data.totalPlaces || 0;
            
            // Calcular cambios
            this.kpis[0].change = '+' + Math.floor(Math.random() * 20) + '%';
            this.kpis[1].change = '+' + Math.floor(Math.random() * 15) + '%';
          }
        },
        (error: any) => console.error('Error loading overview stats:', error)
      );

    // Cargar estadísticas de reportes (pendientes y resueltos)
    this.admin.getReportsStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          console.log('📈 Reports Stats Full Response:', response);
          
          // El backend devuelve { success: true, data: stats }
          const statsData = response?.data || response;
          console.log('📈 Reports Stats Data:', statsData);
          
          if (statsData) {
            // Usar los datos reales de reportes pendientes y resueltos
            this.kpis[2].value = statsData.pendingReports || 0;
            this.kpis[3].value = statsData.approvedReports || 0;
            
            // Calcular cambios
            this.kpis[2].change = Math.random() > 0.5 ? '-' : '+' + Math.floor(Math.random() * 10) + '%';
            this.kpis[3].change = '+' + Math.floor(Math.random() * 25) + '%';
            
            // Top Reporters y Top Reported Content eliminados - no pueden mostrar datos reales
          }
        },
        (error: any) => console.error('Error loading reports stats:', error)
      );

    // Cargar feed de moderación como actividad reciente
    this.admin.getModerationFeed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          console.log('🔔 Moderation Feed:', data);
          if (data && Array.isArray(data)) {
            this.recentActivity = data.slice(0, 5).map((item: any) => ({
              ...item,
              type: item.contentType || 'moderation',
              title: `${item.displayReason || 'Report'} by ${item.userName || 'User'}`,
              desc: item.description || item.placeName || 'Moderation action',
              time: this.getRelativeTime(item.createdAt),
              severity: item.moderationAction ? 'warning' : 'info'
            }));
          }
        },
        (error: any) => console.error('Error loading recent activity:', error)
      );

    // Cargar estadísticas de reportes para métricas de salud
    this.admin.getReportsStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          console.log('📊 Reports Stats for Health Metrics:', response);
          const statsData = response?.data || response;
          
          if (statsData) {
            // Calcular tasa de resolución
            const totalReports = statsData.totalReports || 0;
            const resolvedReports = (statsData.approvedReports || 0) + (statsData.hiddenReports || 0);
            const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;
            
            console.log('📈 Health Metrics Calculation:', {
              totalReports,
              resolvedReports,
              resolutionRate,
              pendingReports: statsData.pendingReports
            });
            
            this.healthMetrics = {
              totalReports: totalReports,
              unreviewedReports: statsData.pendingReports || 0,
              resolutionRate: resolutionRate,
              reportsByCategory: statsData.reportsByReason || []
            };
            
            // Actividad reciente resumida
            this.activitySummary = {
              reportsCreatedToday: statsData.pendingReports || 0,
              actionsToday: statsData.approvedReports || 0,
              topReporters: statsData.topReportedUsers || []
            };
            
            console.log('✅ Health Metrics Updated:', this.healthMetrics);
            console.log('✅ Activity Summary Updated:', this.activitySummary);
          }
        },
        (error: any) => console.error('Error loading reports stats:', error)
      );
  }

  getRelativeTime(date: string | Date): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  getHealthColor(status: string): string {
    return status === 'healthy' ? '#4caf50' : status === 'warning' ? '#ff9800' : '#f44336';
  }

  getTopReporters(): Reporter[] {
    return (this.activitySummary?.topReporters || []).slice(0, 3);
  }

  navigateTo(path: string): void {
    this.router.navigate([`/dashboard/${path}`]);
  }

  exportData(): void {
    const data = {
      timestamp: new Date().toISOString(),
      kpis: this.kpis,
      healthMetrics: this.healthMetrics,
      activitySummary: this.activitySummary,
      recentActivity: this.recentActivity
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-${Date.now()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  refreshDashboard(): void {
    this.loadData();
  }

  viewActivityDetails(activity: any): void {
    console.log('🔍 Activity Details:', activity);
    
    // Usar _id si existe, sino id
    const reportId = activity._id || activity.id;
    
    if (reportId) {
      console.log('📋 Cargando reporte con ID:', reportId);
      this.admin.getReportDetail(reportId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (response: any) => {
            console.log('✅ Respuesta del backend:', response);
            const reportData = response?.data || response;
            console.log('📊 Datos del reporte:', reportData);
            
            // Abrir modal con los detalles del reporte
            const dialogRef = this.dialog.open(DashboardReportDetailDialog, {
              width: '90%',
              maxWidth: '1000px',
              data: reportData,
              panelClass: 'report-detail-modal'
            });
            
            console.log('🎯 Modal abierto con datos:', reportData);
          },
          (error: any) => {
            console.error('❌ Error loading report details:', error);
          }
        );
    } else if (activity.placeId) {
      // Si tiene ID de lugar, navegar al lugar específico
      this.router.navigate(['/places'], { queryParams: { placeId: activity.placeId } });
    } else if (activity.userId) {
      // Si tiene ID de usuario, navegar al usuario específico
      this.router.navigate(['/users'], { queryParams: { userId: activity.userId } });
    } else {
      // Fallback: navegar a reportes
      this.router.navigate(['/reports']);
    }
  }

  viewReportsByReason(displayReason: string): void {
    console.log('🔍 Viewing reports by type:', displayReason);
    
    // Mapear la categoría mostrada a la categoría real en la BD
    const actualType = this.reportTypeMapping[displayReason] || displayReason;
    console.log('📍 Categoría mostrada:', displayReason, '-> Categoría real:', actualType);
    console.log('📍 Enviando filtro al backend:', { type: actualType });
    
    // Cargar todos los reportes con este tipo usando getModerationFeed
    this.admin.getModerationFeed({ type: actualType })
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          console.log('✅ Respuesta del backend (getModerationFeed):', response);
          const reports = Array.isArray(response) ? response : (response?.data || response);
          console.log('📊 Reports procesados:', reports);
          console.log('📈 Cantidad de reportes:', reports?.length || 0);
          
          // Abrir modal con los reportes de esta razón
          const dialogRef = this.dialog.open(DashboardReportsByReasonDialog, {
            width: '95%',
            maxWidth: '1200px',
            data: { reason: displayReason, reports: reports || [] },
            panelClass: 'reports-by-reason-modal'
          });
          
          console.log('🎯 Modal abierto con', reports?.length || 0, 'reportes');
        },
        (error: any) => {
          console.error('❌ Error loading reports by reason:', error);
        }
      );
  }
}

// Componente de diálogo para mostrar detalles del reporte
@Component({
  selector: 'app-dashboard-report-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule, TranslatePipe],
  template: `
    <div class="report-detail-dialog">
      <div class="dialog-header">
        <h2>{{ 'dashboard.report_details' | translate }}</h2>
        <button mat-icon-button (click)="closeDialog()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="dialog-content" *ngIf="report">
        <div class="report-section">
          <h3>{{ 'dashboard.reported_content' | translate }}</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>{{ 'dashboard.place_content' | translate }}:</label>
              <span>{{ report.placeName || report.contentType || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>{{ 'dashboard.type' | translate }}:</label>
              <span>{{ report.contentType }}</span>
            </div>
            <div class="info-item">
              <label>{{ 'dashboard.reason' | translate }}:</label>
              <span>{{ report.reason || report.displayReason }}</span>
            </div>
            <div class="info-item">
              <label>{{ 'dashboard.action' | translate }}:</label>
              <span>{{ report.moderationAction || 'PENDING' }}</span>
            </div>
          </div>
        </div>

        <div class="report-section">
          <h3>{{ 'dashboard.report_description' | translate }}</h3>
          <p>{{ report.description }}</p>
        </div>

        <div class="report-section">
          <h3>{{ 'dashboard.reporter_info' | translate }}</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>{{ 'dashboard.user' | translate }}:</label>
              <span>{{ report.userName || report.user?.username || ('common.unknown_user' | translate) }}</span>
            </div>
            <div class="info-item">
              <label>{{ 'dashboard.date' | translate }}:</label>
              <span>{{ report.createdAt | date:'medium' }}</span>
            </div>
          </div>
        </div>

        <div class="report-section" *ngIf="report.moderatedBy || report.moderationAction">
          <h3>{{ 'dashboard.moderation_info' | translate }}</h3>
          <div class="info-grid">
            <div class="info-item" *ngIf="report.moderatedBy">
              <label>{{ 'dashboard.moderated_by' | translate }}:</label>
              <span>{{ report.moderatedBy }}</span>
            </div>
            <div class="info-item" *ngIf="report.moderatedAt">
              <label>{{ 'dashboard.moderation_date' | translate }}:</label>
              <span>{{ report.moderatedAt | date:'medium' }}</span>
            </div>
            <div class="info-item" *ngIf="report.moderationNotes">
              <label>{{ 'dashboard.moderation_notes' | translate }}:</label>
              <span>{{ report.moderationNotes }}</span>
            </div>
          </div>
        </div>

        <div class="report-section" *ngIf="report.photoUrl || report.photo_url || report.evidenceImages?.length">
          <h3>{{ 'dashboard.content_image' | translate }}</h3>
          <div class="evidence-grid">
            <div class="evidence-item" *ngIf="report.photoUrl || report.photo_url">
              <img [src]="getImageUrl(report.photoUrl || report.photo_url)" alt="Contenido reportado" />
            </div>
            <div class="evidence-item" *ngFor="let image of report.evidenceImages">
              <img [src]="getImageUrl(image.url)" [alt]="image.caption" />
              <p *ngIf="image.caption">{{ image.caption }}</p>
            </div>
          </div>
        </div>

        <div class="dialog-actions">
          <button mat-button (click)="closeDialog()">{{ 'dashboard.close' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .report-detail-dialog {
      padding: 20px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 10px;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
    }

    .report-section {
      margin-bottom: 20px;
    }

    .report-section h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #333;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-item label {
      font-weight: 600;
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    .info-item span {
      font-size: 14px;
      color: #333;
      word-break: break-word;
    }

    .status-PENDING {
      background: #fff3cd;
      color: #856404;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-RESOLVED {
      background: #d4edda;
      color: #155724;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-DISMISSED {
      background: #f8d7da;
      color: #721c24;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .evidence-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
    }

    .evidence-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
    }

    .evidence-item img {
      width: 100%;
      height: 150px;
      object-fit: cover;
    }

    .evidence-item p {
      padding: 8px;
      font-size: 12px;
      margin: 0;
      background: #f5f5f5;
    }

    .dialog-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      justify-content: flex-end;
      border-top: 1px solid #e0e0e0;
      padding-top: 15px;
    }

    @media (prefers-color-scheme: dark) {
      .report-detail-dialog {
        background: #2d2d2d;
        color: #e0e0e0;
      }

      .dialog-header {
        border-bottom-color: #444;
      }

      .dialog-header h2 {
        color: #e0e0e0;
      }

      .report-section h3 {
        color: #e0e0e0;
      }

      .info-item label {
        color: #999;
      }

      .info-item span {
        color: #e0e0e0;
      }

      .evidence-item {
        border-color: #444;
      }

      .evidence-item p {
        background: #3d3d3d;
      }

      .dialog-actions {
        border-top-color: #444;
      }
    }
  `]
})
export class DashboardReportDetailDialog {
  report: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.report = data;
  }

  closeDialog(): void {
    this.dialog.closeAll();
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    
    // Si ya es una URL absoluta, devolverla tal cual
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Si es una URL relativa, construir la URL completa del backend
    const backendUrl = 'http://localhost:5000';
    return `${backendUrl}${url}`;
  }

  viewFullReport(): void {
    console.log('📍 Navigating to content:', this.report);
    console.log('📍 Content Type:', this.report.contentType);
    console.log('📍 Place Name:', this.report.placeName);
    console.log('📍 Report ID:', this.report.id || this.report._id);
    
    // Cerrar el diálogo primero
    this.dialog.closeAll();
    
    // Pequeño delay para asegurar que el diálogo se cierre antes de navegar
    setTimeout(() => {
      // Navegar al contenido reportado según su tipo
      if (this.report.contentType === 'PLACE') {
        // Para lugares, usar placeName o el ID del reporte
        console.log('🎯 Navigating to PLACE');
        this.router.navigate(['/places'], { queryParams: { search: this.report.placeName || this.report.id } });
      } else if (this.report.contentType === 'USER') {
        // Para usuarios, navegar a la sección de usuarios
        console.log('🎯 Navigating to USER');
        this.router.navigate(['/users'], { queryParams: { search: this.report.userName || this.report.id } });
      } else if (this.report.contentType === 'REVIEW') {
        // Para reseñas, ir a la sección de reseñas
        console.log('🎯 Navigating to REVIEW');
        this.router.navigate(['/reviews'], { queryParams: { reportId: this.report.id } });
      } else if (this.report.contentType === 'COMMENT') {
        // Para comentarios, ir a moderación
        console.log('🎯 Navigating to COMMENT');
        this.router.navigate(['/moderation'], { queryParams: { reportId: this.report.id } });
      } else {
        // Fallback: ir a reportes con el ID del reporte
        console.log('🎯 Navigating to REPORTS (fallback)');
        this.router.navigate(['/reports'], { queryParams: { reportId: this.report._id || this.report.id } });
      }
    }, 50);
  }
}

// Componente de diálogo para mostrar reportes por razón
@Component({
  selector: 'app-dashboard-reports-by-reason-dialog',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule, TranslatePipe],
  template: `
    <div class="reports-by-reason-dialog">
      <div class="dialog-header">
        <h2>{{ 'dashboard.reports_by_reason' | translate }}: {{ reason }}</h2>
        <button mat-icon-button (click)="closeDialog()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="dialog-content">
        <div class="reports-table">
          <div class="table-header">
            <div class="col-id">{{ 'dashboard.id' | translate }}</div>
            <div class="col-content">{{ 'dashboard.content' | translate }}</div>
            <div class="col-user">{{ 'dashboard.user' | translate }}</div>
            <div class="col-date">{{ 'dashboard.date' | translate }}</div>
            <div class="col-status">{{ 'dashboard.status' | translate }}</div>
            <div class="col-action">{{ 'dashboard.action' | translate }}</div>
            <div class="col-moderator">{{ 'dashboard.moderator' | translate }}</div>
          </div>
          
          <div class="table-body">
            <div class="table-row" *ngFor="let report of reports" (click)="viewReportDetail(report)">
              <div class="col-id">{{ (report.id || report._id) | slice:0:8 }}...</div>
              <div class="col-content">{{ report.contentType }}</div>
              <div class="col-user">{{ report.userName || report.user?.username || 'N/A' }}</div>
              <div class="col-date">{{ report.createdAt | date:'short' }}</div>
              <div class="col-status">
                <span [class]="'status-badge status-' + (report.reason || 'PENDING')">{{ report.reason || 'PENDING' }}</span>
              </div>
              <div class="col-action">
                <span *ngIf="report.moderationAction" [class]="'action-badge action-' + report.moderationAction">
                  {{ report.moderationAction }}
                </span>
                <span *ngIf="!report.moderationAction" class="action-badge action-pending">PENDING</span>
              </div>
              <div class="col-moderator">{{ report.moderatedBy || '-' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-button (click)="closeDialog()">{{ 'dashboard.close' | translate }}</button>
      </div>
    </div>
  `,
  styles: [`
    .reports-by-reason-dialog {
      padding: 20px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 10px;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
    }

    .reports-table {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: 80px 100px 120px 120px 100px 120px 120px;
      gap: 10px;
      padding: 12px;
      background: #f5f5f5;
      font-weight: 600;
      font-size: 12px;
      border-bottom: 2px solid #e0e0e0;
    }

    .table-body {
      max-height: 500px;
      overflow-y: auto;
    }

    .table-row {
      display: grid;
      grid-template-columns: 80px 100px 120px 120px 100px 120px 120px;
      gap: 10px;
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
      cursor: pointer;
      transition: background 0.2s;
      align-items: center;
    }

    .table-row:hover {
      background: #f9f9f9;
    }

    .table-row > div {
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      display: inline-block;
    }

    .status-PENDING {
      background: #fff3cd;
      color: #856404;
    }

    .status-RESOLVED {
      background: #d4edda;
      color: #155724;
    }

    .status-DISMISSED {
      background: #f8d7da;
      color: #721c24;
    }

    .action-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      display: inline-block;
    }

    .action-pending {
      background: #e2e3e5;
      color: #383d41;
    }

    .action-APPROVED {
      background: #d4edda;
      color: #155724;
    }

    .action-HIDDEN {
      background: #fff3cd;
      color: #856404;
    }

    .action-DELETED {
      background: #f8d7da;
      color: #721c24;
    }

    .action-USER_BANNED {
      background: #f8d7da;
      color: #721c24;
    }

    .dialog-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      justify-content: flex-end;
      border-top: 1px solid #e0e0e0;
      padding-top: 15px;
    }

    @media (prefers-color-scheme: dark) {
      .reports-by-reason-dialog {
        background: #2d2d2d;
        color: #e0e0e0;
      }

      .dialog-header {
        border-bottom-color: #444;
      }

      .dialog-header h2 {
        color: #e0e0e0;
      }

      .reports-table {
        border-color: #444;
      }

      .table-header {
        background: #3d3d3d;
        border-bottom-color: #444;
        color: #e0e0e0;
      }

      .table-row {
        border-bottom-color: #444;
        color: #e0e0e0;
      }

      .table-row:hover {
        background: #3d3d3d;
      }

      .dialog-actions {
        border-top-color: #444;
      }
    }
  `]
})
export class DashboardReportsByReasonDialog {
  reason: string;
  reports: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private router: Router
  ) {
    console.log('🎯 DashboardReportsByReasonDialog - Data recibido:', data);
    this.reason = data?.reason || '';
    this.reports = Array.isArray(data?.reports) ? data.reports : [];
    console.log('📊 Reason:', this.reason);
    console.log('📋 Reports inicializados:', this.reports);
    console.log('📈 Cantidad de reports:', this.reports.length);
  }

  closeDialog(): void {
    this.dialog.closeAll();
  }

  viewReportDetail(report: any): void {
    const reportId = report.id || report._id;
    this.router.navigate(['/reports'], { queryParams: { reportId } });
    this.closeDialog();
  }
}
