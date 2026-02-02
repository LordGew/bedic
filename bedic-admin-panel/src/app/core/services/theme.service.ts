import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkModeSubject = new BehaviorSubject<boolean>(this.isDarkMode());
  public darkMode$ = this.darkModeSubject.asObservable();

  constructor() {
    const isDark = this.isDarkMode();
    this.applyTheme(isDark);
    this.applyPrimaryColorFromSettings();
  }

  isDarkMode(): boolean {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Cambia explícitamente entre tema claro/oscuro y lo persiste en localStorage.
   */
  setDarkMode(isDark: boolean): void {
    this.darkModeSubject.next(isDark);
    localStorage.setItem('darkMode', isDark.toString());
    this.applyTheme(isDark);
  }

  toggleDarkMode(): void {
    const newMode = !this.darkModeSubject.value;
    this.setDarkMode(newMode);
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }

  getThemeClass(): string {
    return this.darkModeSubject.value ? 'dark-theme' : 'light-theme';
  }

  /**
   * Aplica el color primario guardado en la configuración (si existe).
   */
  private applyPrimaryColorFromSettings(): void {
    const saved = localStorage.getItem('adminSettings');
    if (!saved) {
      return;
    }
    try {
      const settings = JSON.parse(saved);
      if (settings && settings.primaryColor) {
        this.applyPrimaryColor(settings.primaryColor);
      }
    } catch {
      // Ignorar errores de parseo y mantener colores por defecto
    }
  }

  /**
   * Permite aplicar dinámicamente el color primario desde la pantalla de configuración.
   */
  applyPrimaryColor(color: string | null | undefined): void {
    if (!color) {
      return;
    }
    const root = document.documentElement;
    root.style.setProperty('--primary-color', color);
    // Opcional: usar el mismo valor para primary-dark si no calculamos un tono distinto
    root.style.setProperty('--primary-dark', color);
  }
}
