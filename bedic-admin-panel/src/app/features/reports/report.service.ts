import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Report, ReportActionRequest, ReportStatusUpdate, ReportsPaginatedResponse } from './report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = '/api/reports';

  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los reportes (admin)
   */
  getAllReports(
    status?: string,
    contentType?: string,
    page: number = 1,
    limit: number = 20
  ): Observable<ReportsPaginatedResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }
    if (contentType) {
      params = params.set('contentType', contentType);
    }

    return this.http.get<ReportsPaginatedResponse>(`${this.apiUrl}/admin/all`, { params });
  }

  /**
   * Obtener reporte por ID
   */
  getReportById(id: string): Observable<{ success: boolean; data: Report }> {
    return this.http.get<{ success: boolean; data: Report }>(`${this.apiUrl}/admin/${id}`);
  }

  /**
   * Tomar acción manual en un reporte
   */
  takeReportAction(reportId: string, action: ReportActionRequest): Observable<{ success: boolean; data: Report }> {
    return this.http.post<{ success: boolean; data: Report }>(
      `${this.apiUrl}/admin/${reportId}/action`,
      action
    );
  }

  /**
   * Actualizar estado de reporte
   */
  updateReportStatus(reportId: string, statusUpdate: ReportStatusUpdate): Observable<{ success: boolean; data: Report }> {
    return this.http.put<{ success: boolean; data: Report }>(
      `${this.apiUrl}/admin/${reportId}/status`,
      statusUpdate
    );
  }

  /**
   * Obtener reportes por lugar
   */
  getReportsByPlace(placeId: string): Observable<{ success: boolean; data: Report[] }> {
    return this.http.get<{ success: boolean; data: Report[] }>(`${this.apiUrl}/place/${placeId}`);
  }

  /**
   * Obtener reportes por usuario
   */
  getReportsByUser(userId: string): Observable<{ success: boolean; data: Report[] }> {
    return this.http.get<{ success: boolean; data: Report[] }>(`${this.apiUrl}/user/${userId}`);
  }
}
