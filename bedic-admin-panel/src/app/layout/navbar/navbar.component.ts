import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageService, SupportedLang } from '../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="sidenav.toggle()">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="spacer"></span>
      <span>{{ 'app.title' | translate }}</span>
      <span class="spacer"></span>
      <button mat-button (click)="toggleLanguage()" [title]="currentLang === 'es' ? 'Español' : 'English'">
        {{ currentLang.toUpperCase() }}
      </button>
      <button mat-icon-button (click)="toggleTheme()" [title]="darkMode ? 'Modo claro' : 'Modo oscuro'">
        <mat-icon>{{ darkMode ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>
      <button mat-icon-button (click)="logout()" [title]="'nav.logout' | translate">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
  `]
})
export class NavbarComponent implements OnInit {
  @Input() sidenav: any;
  darkMode = false;
  currentLang: SupportedLang = 'es';

  constructor(
    private auth: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.themeService.darkMode$.subscribe(isDark => {
      this.darkMode = isDark;
    });

    this.languageService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }

  toggleLanguage(): void {
    const nextLang: SupportedLang = this.currentLang === 'es' ? 'en' : 'es';
    this.languageService.setLanguage(nextLang);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
