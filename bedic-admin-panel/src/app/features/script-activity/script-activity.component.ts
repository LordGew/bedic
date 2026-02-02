import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ScriptActivity {
  _id: string;
  scriptName: string;
  status: 'success' | 'error' | 'running' | 'warning';
  message: string;
  stats: {
    totalFound?: number;
    totalAdded?: number;
    totalSkipped?: number;
    citiesProcessed?: Array<{
      name: string;
      added: number;
      skipped: number;
    }>;
    duration?: string;
  };
  timestamp: string;
  createdAt: string;
}

interface Stats {
  totalRuns: number;
  successRuns: number;
  errorRuns: number;
  successRate: string;
  lastRun: {
    timestamp: string;
    status: string;
    message: string;
    stats: any;
  } | null;
  nextRun: string;
  last30Days: {
    totalPlacesAdded: number;
    totalPlacesFound: number;
    runs: number;
  };
}

@Component({
  selector: 'app-script-activity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './script-activity.component.html',
  styleUrls: ['./script-activity.component.scss']
})
export class ScriptActivityComponent implements OnInit, OnDestroy {
  activities: ScriptActivity[] = [];
  stats: Stats | null = null;
  loading = false;
  error: string | null = null;
  currentPage = 1;
  totalPages = 1;
  limit = 20;
  
  private refreshSubscription?: Subscription;
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadActivities();
    
    // Auto-refresh cada 30 segundos
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadStats();
      this.loadActivities();
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('admin_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadStats(): void {
    this.http.get<Stats>(`${this.API_URL}/script-activity/stats`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.error = 'Error cargando estadísticas';
      }
    });
  }

  loadActivities(): void {
    this.loading = true;
    this.error = null;

    this.http.get<{
      activities: ScriptActivity[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`${this.API_URL}/script-activity/activities`, {
      headers: this.getHeaders(),
      params: {
        page: this.currentPage.toString(),
        limit: this.limit.toString()
      }
    }).subscribe({
      next: (response) => {
        this.activities = response.activities;
        this.totalPages = response.pagination.pages;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading activities:', err);
        this.error = 'Error cargando actividades';
        this.loading = false;
      }
    });
  }

  runManually(): void {
    if (!confirm('¿Ejecutar el script de auto-descubrimiento manualmente? Esto puede tomar varios minutos.')) {
      return;
    }

    this.loading = true;
    this.http.post(`${this.API_URL}/script-activity/run`, {}, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response: any) => {
        alert('Script iniciado en segundo plano. Actualiza la página en unos minutos para ver los resultados.');
        this.loadStats();
        this.loadActivities();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error running script:', err);
        alert('Error ejecutando el script');
        this.loading = false;
      }
    });
  }

  cleanOldActivities(): void {
    if (!confirm('¿Eliminar actividades antiguas (más de 90 días)?')) {
      return;
    }

    this.http.delete(`${this.API_URL}/script-activity/clean`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response: any) => {
        alert(`${response.deletedCount} actividades eliminadas`);
        this.loadActivities();
      },
      error: (err) => {
        console.error('Error cleaning activities:', err);
        alert('Error limpiando actividades');
      }
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadActivities();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadActivities();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'success': return 'status-success';
      case 'error': return 'status-error';
      case 'running': return 'status-running';
      case 'warning': return 'status-warning';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'running': return '⟳';
      case 'warning': return '⚠';
      default: return '•';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeUntilNext(): string {
    if (!this.stats?.nextRun) return '';
    
    const now = new Date();
    const next = new Date(this.stats.nextRun);
    const diff = next.getTime() - now.getTime();
    
    if (diff < 0) return 'Próximamente';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }
}
