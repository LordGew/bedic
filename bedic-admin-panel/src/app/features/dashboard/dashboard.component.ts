import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { DetailsModalComponent } from './details-modal.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatGridListModule, MatProgressBarModule, MatButtonModule, MatIconModule, MatDialogModule, TranslatePipe],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>{{ 'dashboard.title' | translate }}</h1>
        <button (click)="exportDashboard()" class="btn-export">📊 {{ 'dashboard.export' | translate }}</button>
      </div>
      
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card clickable" (click)="goToUsers()">
          <div class="stat-icon users">👥</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.totalUsers || 0 }}</div>
            <div class="stat-label">{{ 'dashboard.total_users' | translate }}</div>
          </div>
        </div>

        <div class="stat-card clickable" (click)="goToPlaces()">
          <div class="stat-icon places">📍</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.totalPlaces || 0 }}</div>
            <div class="stat-label">{{ 'dashboard.total_places' | translate }}</div>
          </div>
        </div>

        <div class="stat-card clickable" (click)="goToReports()">
          <div class="stat-icon reports">⚠️</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.totalReports || 0 }}</div>
            <div class="stat-label">{{ 'dashboard.total_reports' | translate }}</div>
          </div>
        </div>

        <div class="stat-card clickable" (click)="goToRatings()">
          <div class="stat-icon ratings">⭐</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.totalRatings || 0 }}</div>
            <div class="stat-label">{{ 'dashboard.total_ratings' | translate }}</div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-container">
          <h3>{{ 'dashboard.users_by_role' | translate }}</h3>
          <canvas id="usersRoleChart"></canvas>
        </div>

        <div class="chart-container">
          <h3>{{ 'dashboard.places_by_category' | translate }}</h3>
          <canvas id="placesCategoryChart"></canvas>
        </div>

        <div class="chart-container">
          <h3>{{ 'dashboard.reports_by_type' | translate }}</h3>
          <canvas id="reportsTypeChart"></canvas>
        </div>

        <div class="chart-container">
          <h3>{{ 'dashboard.activity_7days' | translate }}</h3>
          <canvas id="activityChart"></canvas>
        </div>
      </div>

      <!-- Demographics Section -->
      <div class="demographics-section">
        <h2>{{ 'dashboard.demographics' | translate }}</h2>
        
        <div class="demographics-grid">
          <div class="demographic-card">
            <h4>{{ 'dashboard.user_locations' | translate }}</h4>
            <div class="demographic-list">
              <div class="demographic-item clickable" *ngFor="let location of userLocations" (click)="openLocationDetails(location)">
                <span class="location-name">{{ location.name }}</span>
                <span class="location-count">{{ location.count }}</span>
                <span class="detail-icon">→</span>
              </div>
            </div>
          </div>

          <div class="demographic-card">
            <h4>{{ 'dashboard.top_places' | translate }}</h4>
            <div class="demographic-list">
              <div class="demographic-item clickable" *ngFor="let place of topPlaces" (click)="openPlaceDetails(place)">
                <span class="place-name">{{ place.name }}</span>
                <span class="place-visits">{{ place.visits }} {{ 'dashboard.visits' | translate }}</span>
                <span class="detail-icon">→</span>
              </div>
            </div>
          </div>

          <div class="demographic-card">
            <h4>{{ 'dashboard.popular_categories' | translate }}</h4>
            <div class="demographic-list">
              <div class="demographic-item clickable" *ngFor="let category of popularCategories" (click)="openCategoryDetails(category)">
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">{{ category.count }}</span>
                <span class="detail-icon">→</span>
              </div>
            </div>
          </div>

          <div class="demographic-card">
            <h4>{{ 'dashboard.report_stats' | translate }}</h4>
            <div class="stats-list">
              <div class="stat-item clickable" (click)="openReportDetails('resolved')">
                <span>{{ 'dashboard.resolved' | translate }}</span>
                <span class="value">{{ reportStats?.resolved || 0 }}</span>
                <span class="detail-icon">→</span>
              </div>
              <div class="stat-item clickable" (click)="openReportDetails('pending')">
                <span>{{ 'dashboard.pending' | translate }}</span>
                <span class="value">{{ reportStats?.pending || 0 }}</span>
                <span class="detail-icon">→</span>
              </div>
              <div class="stat-item">
                <span>{{ 'dashboard.resolution_rate' | translate }}</span>
                <span class="value">{{ reportStats?.resolutionRate || 0 }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      background-color: var(--background-color);
      color: var(--text-primary);
      min-height: 100vh;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .dashboard-header h1 {
      margin: 0;
      font-size: 28px;
      color: var(--text-primary);
    }

    .btn-export {
      padding: 10px 20px;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-export:hover {
      background-color: var(--primary-dark);
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      transition: all 0.3s;
    }

    .stat-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .stat-icon {
      font-size: 32px;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }

    .stat-icon.users {
      background-color: rgba(102, 126, 234, 0.1);
    }

    .stat-icon.places {
      background-color: rgba(76, 175, 80, 0.1);
    }

    .stat-icon.reports {
      background-color: rgba(255, 152, 0, 0.1);
    }

    .stat-icon.ratings {
      background-color: rgba(244, 67, 54, 0.1);
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: var(--primary-color);
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Charts Section */
    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .chart-container {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
    }

    .chart-container h3 {
      margin: 0 0 15px 0;
      color: var(--text-primary);
      font-size: 16px;
    }

    .chart-container canvas {
      max-height: 300px;
    }

    /* Demographics Section */
    .demographics-section {
      margin-top: 40px;
    }

    .demographics-section h2 {
      margin-bottom: 20px;
      color: var(--text-primary);
      font-size: 20px;
    }

    .demographics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .demographic-card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
    }

    .demographic-card h4 {
      margin: 0 0 15px 0;
      color: var(--text-primary);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .demographic-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .demographic-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background-color: var(--background-color);
      border-radius: 4px;
      font-size: 13px;
      transition: all 0.2s ease;
    }

    .demographic-item.clickable {
      cursor: pointer;
    }

    .demographic-item.clickable:hover {
      background-color: rgba(102, 126, 234, 0.1);
      transform: translateX(4px);
    }

    .detail-icon {
      color: var(--primary-color);
      font-weight: bold;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .demographic-item.clickable:hover .detail-icon {
      opacity: 1;
    }

    .location-name, .place-name, .category-name {
      color: var(--text-primary);
      font-weight: 500;
    }

    .location-count, .place-visits, .category-count {
      color: var(--primary-color);
      font-weight: 600;
    }

    .stats-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background-color: var(--background-color);
      border-radius: 4px;
      font-size: 13px;
      color: var(--text-primary);
      transition: all 0.2s ease;
    }

    .stat-item.clickable {
      cursor: pointer;
    }

    .stat-item.clickable:hover {
      background-color: rgba(102, 126, 234, 0.1);
      transform: translateX(4px);
    }

    .stat-item .value {
      color: var(--primary-color);
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .charts-section {
        grid-template-columns: 1fr;
      }

      .demographics-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats: any;
  userLocations: any[] = [];
  topPlaces: any[] = [];
  popularCategories: any[] = [];
  reportStats: any = {};

  constructor(
    private admin: AdminService,
    private dialog: MatDialog,
    private languageService: LanguageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadDemographics();
    this.initCharts();
  }

  loadStats(): void {
    this.admin.getOverviewStats().subscribe(
      data => this.stats = data,
      error => console.error('Error loading stats:', error)
    );

    this.admin.getReportsStats().subscribe({
      next: (stats: any) => {
        this.reportStats = {
          resolved: stats?.approvedReports || 0,
          pending: stats?.pendingReports || 0,
          resolutionRate: stats?.totalReports
            ? Math.round(((stats.approvedReports || 0) / stats.totalReports) * 100)
            : 0,
        };
      },
      error: (err: any) => {
        console.error('Error loading report stats for dashboard:', err);
      },
    });
  }

  loadDemographics(): void {
    // Datos de ejemplo - en producción vendrían del backend
    this.userLocations = [
      { name: 'Bogotá', count: 45 },
      { name: 'Medellín', count: 32 },
      { name: 'Cali', count: 28 },
      { name: 'Barranquilla', count: 18 },
      { name: 'Otros', count: 12 }
    ];

    this.topPlaces = [
      { name: 'Restaurante La Esquina', visits: 234 },
      { name: 'Café Central', visits: 189 },
      { name: 'Hotel Plaza Mayor', visits: 156 },
      { name: 'Parque Metropolitano', visits: 142 },
      { name: 'Centro Comercial', visits: 128 }
    ];

    this.popularCategories = [
      { name: 'Restaurantes', count: 156 },
      { name: 'Cafés', count: 98 },
      { name: 'Hoteles', count: 67 },
      { name: 'Parques', count: 45 },
      { name: 'Tiendas', count: 34 }
    ];
  }

  initCharts(): void {
    // Los gráficos se inicializarán cuando se implemente Chart.js
    setTimeout(() => {
      this.createCharts();
    }, 100);
  }

  createCharts(): void {
    // Placeholder para gráficos - se implementarán con Chart.js
    console.log('Charts initialized');
  }

  goToUsers(): void {
    this.router.navigate(['/dashboard/users']);
  }

  goToPlaces(): void {
    this.router.navigate(['/dashboard/places']);
  }

  goToReports(): void {
    this.router.navigate(['/dashboard/reports']);
  }

  goToRatings(): void {
    this.router.navigate(['/dashboard/reviews']);
  }

  exportDashboard(): void {
    const data = {
      stats: this.stats,
      demographics: {
        userLocations: this.userLocations,
        topPlaces: this.topPlaces,
        popularCategories: this.popularCategories,
        reportStats: this.reportStats
      },
      exportDate: new Date().toISOString()
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-export-${new Date().getTime()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  openLocationDetails(location: any): void {
    const details = {
      title: `Ubicación: ${location.name}`,
      data: {
        'Usuarios': location.count,
        'Porcentaje': `${((location.count / this.userLocations.reduce((sum, l) => sum + l.count, 0)) * 100).toFixed(1)}%`,
        'Crecimiento': '+12% este mes',
        'Actividad': 'Alta',
        'Últimas 24h': Math.floor(location.count * 0.3) + ' usuarios activos'
      }
    };
    this.showDetailsModal(details);
  }

  openPlaceDetails(place: any): void {
    const details = {
      title: `Lugar: ${place.name}`,
      data: {
        'Total de Visitas': place.visits,
        'Visitas Hoy': Math.floor(place.visits * 0.15),
        'Visitas Esta Semana': Math.floor(place.visits * 0.35),
        'Fuente de Descubrimiento': 'Búsqueda Manual (65%), Recomendación (25%), Publicidad (10%)',
        'Calificación Promedio': '4.5/5',
        'Total de Reseñas': Math.floor(place.visits * 0.08),
        'Categoría': 'Restaurante',
        'Estado': 'Verificado'
      }
    };
    this.showDetailsModal(details);
  }

  openCategoryDetails(category: any): void {
    const details = {
      title: `Categoría: ${category.name}`,
      data: {
        'Total de Lugares': category.count,
        'Visitas Totales': Math.floor(category.count * 45),
        'Promedio de Visitas por Lugar': Math.floor(category.count * 45 / category.count),
        'Crecimiento Mensual': '+8%',
        'Lugares Verificados': Math.floor(category.count * 0.85),
        'Lugares No Verificados': Math.floor(category.count * 0.15),
        'Calificación Promedio': '4.3/5',
        'Tendencia': 'En aumento'
      }
    };
    this.showDetailsModal(details);
  }

  openReportDetails(type: string): void {
    const isResolved = type === 'resolved';
    const count = isResolved ? this.reportStats.resolved : this.reportStats.pending;
    
    const details = {
      title: `${isResolved ? 'Reportes Resueltos' : 'Reportes Pendientes'}`,
      data: {
        'Total': count,
        'Hoy': Math.floor(count * 0.15),
        'Esta Semana': Math.floor(count * 0.35),
        'Tiempo Promedio de Resolución': isResolved ? '2.5 horas' : 'Pendiente',
        'Moderadores Asignados': Math.floor(count * 0.05),
        'Tasa de Apelación': isResolved ? '5%' : 'N/A',
        'Razones Principales': isResolved 
          ? 'Contenido Ofensivo (40%), Spam (35%), Otro (25%)'
          : 'En revisión',
        'Acción Más Común': isResolved ? 'Eliminación de Contenido' : 'Pendiente'
      }
    };
    this.showDetailsModal(details);
  }

  showDetailsModal(details: any): void {
    this.dialog.open(DetailsModalComponent, {
      data: details,
      width: '800px',
      maxWidth: '90vw',
      panelClass: 'details-modal-panel'
    });
  }
}
