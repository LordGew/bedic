import { Component, OnInit } from '@angular/core';
import { ReportService } from '../report.service';
import { Report, ReportActionRequest } from '../report.model';

@Component({
  selector: 'app-reports-list',
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.scss']
})
export class ReportsListComponent implements OnInit {
  reports: Report[] = [];
  loading = false;
  error: string | null = null;

  // Filtros
  selectedStatus = 'ALL';
  selectedContentType = 'ALL';
  currentPage = 1;
  pageSize = 20;
  totalReports = 0;
  totalPages = 0;

  // Modal
  selectedReport: Report | null = null;
  showActionModal = false;
  actionType = '';
  actionReason = '';
  actionDuration = 0;
  moderationNotes = '';
  takingAction = false;

  statusOptions = [
    { value: 'ALL', label: 'Todos' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'UNDER_REVIEW', label: 'En revisión' },
    { value: 'RESOLVED', label: 'Resuelto' },
    { value: 'DISMISSED', label: 'Desestimado' },
    { value: 'ESCALATED', label: 'Escalado' }
  ];

  contentTypeOptions = [
    { value: 'ALL', label: 'Todos' },
    { value: 'USER', label: 'Usuario' },
    { value: 'PLACE', label: 'Lugar' },
    { value: 'REVIEW', label: 'Reseña' },
    { value: 'COMMENT', label: 'Comentario' },
    { value: 'PHOTO', label: 'Foto' }
  ];

  actionTypeOptions = [
    { value: 'CONTENT_HIDDEN', label: '🙈 Ocultar contenido' },
    { value: 'CONTENT_DELETED', label: '🗑️ Eliminar contenido' },
    { value: 'USER_WARNED', label: '⚠️ Advertir usuario' },
    { value: 'USER_MUTED', label: '🔇 Silenciar usuario' },
    { value: 'USER_BANNED', label: '🚫 Banear usuario' },
    { value: 'CONTENT_WARNING_ADDED', label: '⚠️ Agregar advertencia' }
  ];

  constructor(private reportService: ReportService) { }

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.error = null;

    const status = this.selectedStatus === 'ALL' ? undefined : this.selectedStatus;
    const contentType = this.selectedContentType === 'ALL' ? undefined : this.selectedContentType;

    this.reportService.getAllReports(status, contentType, this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.reports = response.data;
          this.totalReports = response.pagination.total;
          this.totalPages = response.pagination.pages;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar reportes: ' + err.message;
          this.loading = false;
        }
      });
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.loadReports();
  }

  onContentTypeChange(): void {
    this.currentPage = 1;
    this.loadReports();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReports();
    }
  }

  openActionModal(report: Report): void {
    this.selectedReport = report;
    this.showActionModal = true;
    this.actionType = '';
    this.actionReason = '';
    this.actionDuration = 0;
    this.moderationNotes = '';
  }

  closeActionModal(): void {
    this.showActionModal = false;
    this.selectedReport = null;
  }

  takeAction(): void {
    if (!this.selectedReport || !this.actionType || !this.actionReason) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    this.takingAction = true;

    const actionRequest: ReportActionRequest = {
      actionType: this.actionType as any,
      reason: this.actionReason,
      duration: this.actionDuration || undefined,
      moderationNotes: this.moderationNotes
    };

    this.reportService.takeReportAction(this.selectedReport._id, actionRequest)
      .subscribe({
        next: (response) => {
          alert('Acción tomada exitosamente');
          this.closeActionModal();
          this.loadReports();
          this.takingAction = false;
        },
        error: (err) => {
          alert('Error al tomar acción: ' + err.message);
          this.takingAction = false;
        }
      });
  }

  updateStatus(report: Report, newStatus: string): void {
    this.reportService.updateReportStatus(report._id, { status: newStatus as any })
      .subscribe({
        next: () => {
          alert('Estado actualizado');
          this.loadReports();
        },
        error: (err) => {
          alert('Error al actualizar estado: ' + err.message);
        }
      });
  }

  getStatusLabel(status: string): string {
    const option = this.statusOptions.find(o => o.value === status);
    return option ? option.label : status;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return '#ff9800';
      case 'UNDER_REVIEW':
        return '#2196f3';
      case 'RESOLVED':
        return '#4caf50';
      case 'DISMISSED':
        return '#9e9e9e';
      case 'ESCALATED':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  }

  getContentTypeLabel(type: string): string {
    const option = this.contentTypeOptions.find(o => o.value === type);
    return option ? option.label : type;
  }

  getReasonLabel(reason: string): string {
    const reasons: { [key: string]: string } = {
      'SPAM': 'Spam',
      'HARASSMENT': 'Acoso',
      'HATE_SPEECH': 'Discurso de odio',
      'VIOLENCE': 'Violencia',
      'SEXUAL_CONTENT': 'Contenido sexual',
      'FALSE_INFO': 'Información falsa',
      'COPYRIGHT': 'Derechos de autor',
      'OTHER': 'Otro'
    };
    return reasons[reason] || reason;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
