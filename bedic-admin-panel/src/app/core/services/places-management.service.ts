import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Place {
  _id: string;
  name: string;
  category: string;
  description?: string;
  coordinates: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  address?: string;
  city?: string;
  department?: string;
  sector?: string;
  rating: number;
  verified: boolean;
  source: string;
  concurrence: number;
  adminCreated: boolean;
  officialImages: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlacesResponse {
  success: boolean;
  data: Place[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface PlaceStats {
  total: number;
  verified: number;
  unverified: number;
  byCity: { city: string; count: number }[];
  byCategory: { category: string; count: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class PlacesManagementService {
  private apiUrl = `${environment.apiUrl}/management/places`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los lugares con filtros y paginación
   */
  getPlaces(filters?: {
    city?: string;
    department?: string;
    category?: string;
    verified?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<PlacesResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.city) params = params.set('city', filters.city);
      if (filters.department) params = params.set('department', filters.department);
      if (filters.category) params = params.set('category', filters.category);
      if (filters.verified !== undefined) params = params.set('verified', filters.verified.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<PlacesResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener un lugar por ID
   */
  getPlaceById(id: string): Observable<{ success: boolean; data: Place }> {
    console.log('🔵 PlacesManagementService.getPlaceById() llamado', id);
    return this.http.get<{ success: boolean; data: Place }>(`${this.apiUrl}/${id}`).pipe(
      tap(response => console.log('✅ Lugar obtenido:', response)),
      catchError(error => {
        console.error('❌ Error obteniendo lugar:', error);
        throw error;
      })
    );
  }

  /**
   * Crear nuevo lugar (con protección contra duplicados)
   */
  createPlace(placeData: {
    name: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    department: string;
    sector: string;
  }): Observable<{ success: boolean; message: string; data: Place }> {
    console.log('🔵 PlacesManagementService.createPlace() llamado', placeData);
    return this.http.post<{ success: boolean; message: string; data: Place }>(
      this.apiUrl,
      placeData
    ).pipe(
      tap(response => console.log('✅ Lugar creado:', response)),
      catchError(error => {
        console.error('❌ Error creando lugar:', error);
        throw error;
      })
    );
  }

  /**
   * Actualizar lugar existente
   */
  updatePlace(id: string, placeData: Partial<{
    name: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    department: string;
    sector: string;
    verified: boolean;
  }>): Observable<{ success: boolean; message: string; data: Place }> {
    return this.http.put<{ success: boolean; message: string; data: Place }>(
      `${this.apiUrl}/${id}`,
      placeData
    );
  }

  /**
   * Eliminar lugar
   */
  deletePlace(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Subir imagen para un lugar
   */
  uploadPlaceImage(id: string, imageFile: File): Observable<{ success: boolean; message: string; data: any }> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.post<{ success: boolean; message: string; data: any }>(
      `${this.apiUrl}/${id}/images`,
      formData
    );
  }

  /**
   * Eliminar imagen de un lugar
   */
  deletePlaceImage(id: string, imagePath: string): Observable<{ success: boolean; message: string; data: Place }> {
    // Codificar la ruta de la imagen para la URL
    const encodedPath = encodeURIComponent(imagePath);
    return this.http.delete<{ success: boolean; message: string; data: Place }>(
      `${this.apiUrl}/${id}/images/${encodedPath}`
    );
  }

  /**
   * Obtener estadísticas de lugares
   */
  getStats(): Observable<{ success: boolean; data: PlaceStats }> {
    return this.http.get<{ success: boolean; data: PlaceStats }>(`${this.apiUrl}/stats`);
  }

  /**
   * Obtener lista de ciudades disponibles
   */
  getCities(): Observable<{ success: boolean; data: string[] }> {
    return this.http.get<{ success: boolean; data: string[] }>(`${this.apiUrl}/cities`);
  }

  /**
   * Obtener lista de categorías disponibles
   */
  getCategories(): Observable<{ success: boolean; data: string[] }> {
    return this.http.get<{ success: boolean; data: string[] }>(`${this.apiUrl}/categories`);
  }
}
