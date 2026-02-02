import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

import { 
  Category, 
  CreateCategoryRequest, 
  UpdateCategoryRequest, 
  CategoryResponse, 
  CategoryStats 
} from './category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Obtener todas las categorías con paginación
  getCategories(page = 1, limit = 10, search?: string, isActive?: boolean): Observable<CategoryResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<CategoryResponse>(`${this.apiUrl}/categories`, { params });
  }

  // Obtener una categoría por ID
  getCategoryById(id: string): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(`${this.apiUrl}/categories/${id}`);
  }

  // Crear una nueva categoría
  createCategory(category: CreateCategoryRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(`${this.apiUrl}/categories`, category);
  }

  // Actualizar una categoría
  updateCategory(id: string, category: UpdateCategoryRequest): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(`${this.apiUrl}/categories/${id}`, category);
  }

  // Eliminar (desactivar) una categoría
  deleteCategory(id: string): Observable<CategoryResponse> {
    return this.http.delete<CategoryResponse>(`${this.apiUrl}/categories/${id}`);
  }

  // Obtener estadísticas de categorías
  getCategoryStats(): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(`${this.apiUrl}/categories/stats`);
  }

  // Obtener categorías activas para select/dropdown
  getActiveCategories(): Observable<CategoryResponse> {
    return this.getCategories(1, 100, undefined, true);
  }
}
