import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = 'http://localhost:5000/api/admin';

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem('adminSettings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings && settings.apiUrl) {
          const base = (settings.apiUrl as string).replace(/\/$/, '');
          this.apiUrl = `${base}/api/admin`;
        }
      } catch {
        // Si falla el parseo, mantener URL por defecto
      }
    }
  }

  getBackendBaseUrl(): string {
    return this.apiUrl.replace(/\/api\/admin$/, '');
  }

  // ============ STATS ============
  getOverviewStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats/overview`).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  // ============ MODERATION ============
  getModerationFeed(filters?: any): Observable<any[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/moderation/feed`, { params }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  getReportDetail(reportId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/${reportId}`);
  }

  moderateReport(reportId: string, body: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/reports/${reportId}/moderate`, body);
  }

  // ============ APPEALS ============
  getModerationAppeals(status?: string): Observable<any[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<any>(`${this.apiUrl}/moderation/appeals`, { params }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  getAppealDetail(appealId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/moderation/appeals/${appealId}`);
  }

  resolveAppeal(appealId: string, body: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/moderation/appeals/${appealId}`, body);
  }

  approveAppeal(appealId: string, body: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/moderation/appeals/${appealId}/approve`, body);
  }

  rejectAppeal(appealId: string, body: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/moderation/appeals/${appealId}/reject`, body);
  }

  // ============ USERS ============
  getUsers(filters?: any): Observable<any[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/users`, { params }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  getUserById(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${userId}`).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  getUserStats(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${userId}/stats`).pipe(
      map((res: any) => res?.data ?? res ?? {
        totalPlaces: 0,
        totalReviews: 0,
        averageRating: 0,
        reportsCount: 0
      })
    );
  }

  updateUser(userId: string, body: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${userId}`, body).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  muteUser(userId: string, hours: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/mute`, { hours });
  }

  banUser(userId: string, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/ban`, { reason });
  }

  resetUserPassword(userId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/reset-password`, {});
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  // ============ PLACES ============
  getPlaces(filters?: any): Observable<any[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any[]>(`${this.apiUrl}/places`, { params });
  }

  getPlaceById(placeId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/places/${placeId}`);
  }

  createPlace(body: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/places`, body);
  }

  updatePlace(placeId: string, body: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/places/${placeId}`, body);
  }

  uploadPlaceImage(placeId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/places/${placeId}/images`, formData);
  }

  deletePlaceImage(placeId: string, imageId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/places/${placeId}/images/${imageId}`);
  }

  setMainPlaceImage(placeId: string, imageId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/places/${placeId}/images/${imageId}/main`, {});
  }

  deletePlace(placeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/places/${placeId}`);
  }

  verifyPlace(placeId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/places/${placeId}/verify`, {});
  }

  // ============ REPORTS ============
  getReportsStats(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/reports/stats`, { params }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  getAllReports(filters?: any): Observable<any[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/reports`, { params }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  exportReports(format: 'csv' | 'excel' | 'pdf', filters?: any): Observable<Blob> {
    let params = new HttpParams();
    params = params.set('format', format);
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get(`${this.apiUrl}/reports/export`, { 
      params,
      responseType: 'blob'
    });
  }

  // ============ USER PROFILE ============
  getUserProfile(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}/profile`);
  }

  updateUserProfile(userId: string, body: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/profile`, body);
  }

  // ============ BADGES ============
  getBadges(): Observable<any> {
    return this.http.get(`${this.apiUrl}/badges`);
  }

  assignBadgeToUser(userId: string, badge: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/badges`, { badge });
  }

  removeBadgeFromUser(userId: string, badge: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}/badges/${badge}`);
  }

  // ============ SAVED PLACES ============
  getUserSavedPlaces(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}/saved-places`);
  }

  // ============ VERIFICATIONS ============
  getVerifications(status?: string): Observable<any> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get(`${this.apiUrl}/verifications`, { params });
  }

  approveVerification(userId: string, body: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/verifications/${userId}/approve`, body);
  }

  rejectVerification(userId: string, body: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/verifications/${userId}/reject`, body);
  }

  // ============ REVIEWS ============
  getReviews(placeId?: string): Observable<any> {
    let params = new HttpParams();
    if (placeId) {
      params = params.set('placeId', placeId);
    }
    return this.http.get(`${this.apiUrl}/reviews`, { params });
  }

  verifyReview(reviewId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/reviews/${reviewId}/verify`, {});
  }

  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reviews/${reviewId}`);
  }

  // ============ ANNOUNCEMENTS ============
  getAnnouncements(filters?: any): Observable<any[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any[]>(`${this.apiUrl}/announcements`, { params });
  }

  createAnnouncement(body: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/announcements`, body);
  }

  updateAnnouncement(announcementId: string, body: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/announcements/${announcementId}`, body);
  }

  deleteAnnouncement(announcementId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/announcements/${announcementId}`);
  }

  pinAnnouncement(announcementId: string, pinned: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/announcements/${announcementId}/pin`, { pinned });
  }

  // ============ REPORT STATUS UPDATE ============
  updateReportStatus(reportId: string, updateData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/reports/${reportId}/status`, updateData).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  // ============ ADVANCED MODERATION ============
  getModerationLogs(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/moderation/logs`, { params }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  getModerationDashboard(days: number = 30): Observable<any> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<any>(`${this.apiUrl}/moderation/dashboard`, { params }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  getUserViolations(userId: string, days: number = 30): Observable<any> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<any>(`${this.apiUrl}/moderation/user/${userId}/violations`, { params }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  getModerationStats(days: number = 30): Observable<any> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<any>(`${this.apiUrl}/moderation/stats`, { params }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  reviewModerationLog(logId: string, body: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/moderation/review/${logId}`, body).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  appealModerationAction(logId: string, reason: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/moderation/appeal/${logId}`, { reason }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  resolveModerationAppeal(logId: string, status: string, notes: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/moderation/appeal/${logId}/resolve`, { status, notes }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  // ============ VERIFICATION ============
  getVerificationUsers(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/verification/users`, { params }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  getVerificationStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verification/stats/overview`).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  getUserVerificationStatus(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verification/users/${userId}`).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  manuallyVerifyUser(userId: string, reason: string = ''): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verification/users/${userId}/verify`, { reason }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  rejectUserVerification(userId: string, reason: string = ''): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verification/users/${userId}/reject`, { reason }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }
}
