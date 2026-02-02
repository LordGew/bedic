import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Achievement, LevelConfig, TitleConfig } from './achievement.model';

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private apiUrl = '/api/achievements';
  private titlesUrl = '/api/titles';
  private levelsUrl = '/api/levels';

  constructor(private http: HttpClient) { }

  // ========================================
  // LOGROS
  // ========================================

  /**
   * Obtener todos los logros disponibles
   */
  getAllAchievements(category?: string, isActive?: boolean): Observable<{ success: boolean; data: Achievement[] }> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.get<{ success: boolean; data: Achievement[] }>(`${this.apiUrl}`, { params });
  }

  /**
   * Obtener logro por ID
   */
  getAchievementById(id: string): Observable<{ success: boolean; data: Achievement }> {
    return this.http.get<{ success: boolean; data: Achievement }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nuevo logro (admin)
   */
  createAchievement(achievement: Partial<Achievement>): Observable<{ success: boolean; data: Achievement }> {
    return this.http.post<{ success: boolean; data: Achievement }>(`${this.apiUrl}`, achievement);
  }

  /**
   * Actualizar logro (admin)
   */
  updateAchievement(id: string, achievement: Partial<Achievement>): Observable<{ success: boolean; data: Achievement }> {
    return this.http.put<{ success: boolean; data: Achievement }>(`${this.apiUrl}/${id}`, achievement);
  }

  /**
   * Eliminar logro (admin)
   */
  deleteAchievement(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Otorgar logro manualmente a un usuario (admin)
   */
  grantAchievementToUser(userId: string, achievementId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/grant`,
      { userId, achievementId }
    );
  }

  /**
   * Obtener logros de un usuario
   */
  getUserAchievements(userId: string): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/user/${userId}`);
  }

  // ========================================
  // TÍTULOS
  // ========================================

  /**
   * Obtener todos los títulos disponibles
   */
  getAllTitles(category?: string, active?: boolean): Observable<{ success: boolean; data: TitleConfig[] }> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (active !== undefined) params = params.set('active', active.toString());

    return this.http.get<{ success: boolean; data: TitleConfig[] }>(`${this.titlesUrl}`, { params });
  }

  /**
   * Obtener título por ID
   */
  getTitleById(id: string): Observable<{ success: boolean; data: TitleConfig }> {
    return this.http.get<{ success: boolean; data: TitleConfig }>(`${this.titlesUrl}/${id}`);
  }

  /**
   * Crear nuevo título (admin)
   */
  createTitle(title: Partial<TitleConfig>): Observable<{ success: boolean; data: TitleConfig }> {
    return this.http.post<{ success: boolean; data: TitleConfig }>(`${this.titlesUrl}`, title);
  }

  /**
   * Actualizar título (admin)
   */
  updateTitle(id: string, title: Partial<TitleConfig>): Observable<{ success: boolean; data: TitleConfig }> {
    return this.http.put<{ success: boolean; data: TitleConfig }>(`${this.titlesUrl}/${id}`, title);
  }

  /**
   * Eliminar título (admin)
   */
  deleteTitle(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.titlesUrl}/${id}`);
  }

  /**
   * Otorgar título manualmente a un usuario (admin)
   */
  grantTitleToUser(userId: string, titleId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.titlesUrl}/grant`,
      { userId, titleId }
    );
  }

  /**
   * Obtener títulos de un usuario
   */
  getUserTitles(userId: string): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.titlesUrl}/user/${userId}`);
  }

  /**
   * Establecer título seleccionado del usuario
   */
  setUserSelectedTitle(userId: string, titleId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.titlesUrl}/user/${userId}/select`,
      { titleId }
    );
  }

  // ========================================
  // NIVELES
  // ========================================

  /**
   * Obtener configuración de niveles
   */
  getLevelConfigs(): Observable<{ success: boolean; data: LevelConfig[] }> {
    return this.http.get<{ success: boolean; data: LevelConfig[] }>(`${this.levelsUrl}`);
  }

  /**
   * Crear configuración de nivel (admin)
   */
  createLevelConfig(level: Partial<LevelConfig>): Observable<{ success: boolean; data: LevelConfig }> {
    return this.http.post<{ success: boolean; data: LevelConfig }>(`${this.levelsUrl}`, level);
  }

  /**
   * Actualizar configuración de nivel (admin)
   */
  updateLevelConfig(levelNumber: number, config: Partial<LevelConfig>): Observable<{ success: boolean; data: LevelConfig }> {
    return this.http.put<{ success: boolean; data: LevelConfig }>(`${this.levelsUrl}/${levelNumber}`, config);
  }

  /**
   * Obtener nivel actual del usuario basado en XP
   */
  getUserLevel(userId: string): Observable<{ success: boolean; data: { level: number; xp: number; nextLevelXP: number } }> {
    return this.http.get<{ success: boolean; data: { level: number; xp: number; nextLevelXP: number } }>(
      `${this.levelsUrl}/user/${userId}`
    );
  }
}
