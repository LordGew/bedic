import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string[];
  twoFactorEnabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/admin/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUser();
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response: any) => {
          if (response && response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
            this.loadUser();
          }
        }),
        catchError(err => {
          console.error('Error en login:', err);
          throw err;
        })
      );
  }

  loadUser(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    this.http.get<User>(`${this.apiUrl}/me`).subscribe({
      next: (user: User) => {
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
      },
      error: () => {
        this.logout();
      }
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  hasRole(role: string): boolean {
    return this.currentUserSubject.value?.role?.includes(role) ?? false;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
