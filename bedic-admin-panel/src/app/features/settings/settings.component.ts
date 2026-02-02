import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h1>⚙️ {{ languageService.translate('settings.title') }}</h1>
        <p>{{ languageService.translate('settings.subtitle') }}</p>
      </div>

      <div class="settings-grid">
        <!-- General Settings -->
        <div class="settings-section">
          <h2>{{ languageService.translate('settings.general') }}</h2>
          
          <div class="setting-item">
            <label>{{ languageService.translate('settings.app_name') }}</label>
            <input type="text" [(ngModel)]="settings.appName" placeholder="BDIC Admin Panel" />
          </div>

          <div class="setting-item">
            <label>{{ languageService.translate('settings.support_email') }}</label>
            <input type="email" [(ngModel)]="settings.supportEmail" placeholder="support@bedic.com" />
          </div>

          <div class="setting-item">
            <label>{{ languageService.translate('settings.support_phone') }}</label>
            <input type="tel" [(ngModel)]="settings.supportPhone" placeholder="+57 1 234 5678" />
          </div>

          <div class="setting-item">
            <label>{{ languageService.translate('settings.website_url') }}</label>
            <input type="url" [(ngModel)]="settings.websiteUrl" placeholder="https://bedic.com" />
          </div>
        </div>

        <!-- Theme Settings -->
        <div class="settings-section">
          <h2>{{ languageService.translate('settings.theme') }}</h2>
          
          <div class="setting-item">
            <label>{{ languageService.translate('settings.default_theme') }}</label>
            <select [(ngModel)]="settings.defaultTheme">
              <option value="light">{{ languageService.translate('settings.light') }}</option>
              <option value="dark">{{ languageService.translate('settings.dark') }}</option>
              <option value="auto">{{ languageService.translate('settings.auto') }}</option>
            </select>
          </div>

          <div class="setting-item checkbox">
            <input type="checkbox" [(ngModel)]="settings.enableAnimations" id="animations" />
            <label for="animations">{{ languageService.translate('settings.enable_animations') }}</label>
          </div>

          <div class="setting-item checkbox">
            <input type="checkbox" [(ngModel)]="settings.compactMode" id="compact" />
            <label for="compact">{{ languageService.translate('settings.compact_mode') }}</label>
          </div>

          <div class="setting-item">
            <label>{{ languageService.translate('settings.primary_color') }}</label>
            <div class="color-picker">
              <input type="color" [(ngModel)]="settings.primaryColor" />
              <span>{{ settings.primaryColor }}</span>
            </div>
          </div>
        </div>

        <!-- Security Settings -->
        <div class="settings-section">
          <h2>{{ languageService.translate('settings.security') }}</h2>
          
          <div class="setting-item">
            <label>{{ languageService.translate('settings.session_timeout') }}</label>
            <input type="number" [(ngModel)]="settings.sessionTimeout" min="5" max="480" />
          </div>

          <div class="setting-item checkbox">
            <input type="checkbox" [(ngModel)]="settings.requireTwoFactor" id="2fa" />
            <label for="2fa">{{ languageService.translate('settings.two_factor') }}</label>
          </div>

          <div class="setting-item checkbox">
            <input type="checkbox" [(ngModel)]="settings.enableIpWhitelist" id="ipwhitelist" />
            <label for="ipwhitelist">{{ languageService.translate('settings.ip_whitelist') }}</label>
          </div>

          <div class="setting-item checkbox">
            <input type="checkbox" [(ngModel)]="settings.enableAuditLog" id="auditlog" />
            <label for="auditlog">{{ languageService.translate('settings.audit_log') }}</label>
          </div>
        </div>

        <!-- Moderation Settings -->
        <div class="settings-section">
          <h2>{{ languageService.translate('settings.moderation') }}</h2>
          
          <div class="setting-item">
            <label>{{ languageService.translate('settings.default_mute_hours') }}</label>
            <input type="number" [(ngModel)]="settings.defaultMuteHours" min="1" max="720" />
          </div>

          <div class="setting-item">
            <label>{{ languageService.translate('settings.autoban_threshold') }}</label>
            <input type="number" [(ngModel)]="settings.autobanThreshold" min="1" max="100" />
          </div>

          <div class="setting-item checkbox">
            <input type="checkbox" [(ngModel)]="settings.enableAutoModeration" id="automod" />
            <label for="automod">{{ languageService.translate('settings.enable_automod') }}</label>
          </div>

          <div class="setting-item checkbox">
            <input type="checkbox" [(ngModel)]="settings.notifyOnReport" id="notifyreport" />
            <label for="notifyreport">{{ languageService.translate('settings.notify_reports') }}</label>
          </div>
        </div>

        <!-- Email Settings -->
        <div class="settings-section">
          <h2>{{ languageService.translate('settings.email') }}</h2>
          
          <div class="setting-item">
            <label>{{ languageService.translate('settings.smtp_server') }}</label>
            <input type="text" [(ngModel)]="settings.smtpServer" placeholder="smtp.gmail.com" />
          </div>

          <div class="setting-item">
            <label>{{ languageService.translate('settings.smtp_port') }}</label>
            <input type="number" [(ngModel)]="settings.smtpPort" placeholder="587" />
          </div>

          <div class="setting-item">
            <label>{{ languageService.translate('settings.sender_email') }}</label>
            <input type="email" [(ngModel)]="settings.senderEmail" placeholder="noreply@bedic.com" />
          </div>

          <div class="setting-item checkbox">
            <input type="checkbox" [(ngModel)]="settings.enableEmailNotifications" id="emailnotif" />
            <label for="emailnotif">{{ languageService.translate('settings.enable_email_notif') }}</label>
          </div>
        </div>

        <!-- API Settings -->
        <div class="settings-section">
          <h2>{{ languageService.translate('settings.api') }}</h2>
          
          <div class="setting-item">
            <label>{{ languageService.translate('settings.api_url') }}</label>
            <input type="url" [(ngModel)]="settings.apiUrl" placeholder="http://localhost:5000" />
          </div>

          <div class="setting-item">
            <label>{{ languageService.translate('settings.api_timeout') }}</label>
            <input type="number" [(ngModel)]="settings.apiTimeout" min="5" max="120" />
          </div>

          <div class="setting-item checkbox">
            <input type="checkbox" [(ngModel)]="settings.enableApiLogging" id="apilog" />
            <label for="apilog">{{ languageService.translate('settings.enable_api_logging') }}</label>
          </div>

          <div class="setting-item checkbox">
            <input type="checkbox" [(ngModel)]="settings.enableCaching" id="caching" />
            <label for="caching">{{ languageService.translate('settings.enable_caching') }}</label>
          </div>
        </div>

        <!-- Backup Settings -->
        <div class="settings-section">
          <h2>{{ languageService.translate('settings.backup') }}</h2>
          
          <div class="setting-item">
            <label>{{ languageService.translate('settings.backup_frequency') }}</label>
            <select [(ngModel)]="settings.backupFrequency">
              <option value="daily">{{ languageService.translate('settings.daily') }}</option>
              <option value="weekly">{{ languageService.translate('settings.weekly') }}</option>
              <option value="monthly">{{ languageService.translate('settings.monthly') }}</option>
            </select>
          </div>

          <div class="setting-item">
            <label>{{ languageService.translate('settings.backup_retention') }}</label>
            <input type="number" [(ngModel)]="settings.backupRetention" min="7" max="365" />
          </div>

          <div class="setting-item checkbox">
            <input type="checkbox" [(ngModel)]="settings.autoBackup" id="autobackup" />
            <label for="autobackup">{{ languageService.translate('settings.auto_backup') }}</label>
          </div>

          <button (click)="createBackup()" class="btn-secondary">💾 {{ languageService.translate('settings.create_backup') }}</button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="settings-actions">
        <button (click)="resetSettings()" class="btn-secondary">↻ {{ languageService.translate('settings.reset') }}</button>
        <button (click)="saveSettings()" class="btn-primary">✓ {{ languageService.translate('settings.save') }}</button>
      </div>

      <!-- Success/Error Messages -->
      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <div *ngIf="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 20px;
      background-color: var(--background-color);
      color: var(--text-primary);
      min-height: 100vh;
    }

    .settings-header {
      margin-bottom: 40px;
    }

    .settings-header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      color: var(--text-primary);
    }

    .settings-header p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .settings-section {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
    }

    .settings-section h2 {
      margin: 0 0 20px 0;
      font-size: 16px;
      color: var(--primary-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 10px;
    }

    .setting-item {
      margin-bottom: 15px;
    }

    .setting-item:last-child {
      margin-bottom: 0;
    }

    .setting-item label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 13px;
    }

    .setting-item input[type="text"],
    .setting-item input[type="email"],
    .setting-item input[type="tel"],
    .setting-item input[type="url"],
    .setting-item input[type="number"],
    .setting-item select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background-color: var(--surface-color);
      color: var(--text-primary);
      font-size: 13px;
      font-family: inherit;
      transition: all 0.2s;
    }

    .setting-item input[type="text"]:focus,
    .setting-item input[type="email"]:focus,
    .setting-item input[type="tel"]:focus,
    .setting-item input[type="url"]:focus,
    .setting-item input[type="number"]:focus,
    .setting-item select:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    /* Dark theme overrides */
    :root.dark-theme .setting-item input[type="text"],
    :root.dark-theme .setting-item input[type="email"],
    :root.dark-theme .setting-item input[type="tel"],
    :root.dark-theme .setting-item input[type="url"],
    :root.dark-theme .setting-item input[type="number"],
    :root.dark-theme .setting-item select {
      background-color: #2a2a2a;
      color: #ffffff;
      border-color: #444;
    }

    :root.dark-theme .setting-item input::placeholder {
      color: #999;
    }

    .setting-item.checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .setting-item.checkbox input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary-color);
    }

    .setting-item.checkbox label {
      margin: 0;
      cursor: pointer;
      font-weight: normal;
    }

    .color-picker {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .color-picker input[type="color"] {
      width: 50px;
      height: 40px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      cursor: pointer;
    }

    .color-picker span {
      font-size: 13px;
      color: var(--text-secondary);
      font-family: monospace;
    }

    .settings-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
    }

    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
      font-size: 14px;
    }

    .btn-primary {
      background-color: var(--primary-color);
      color: white;
    }

    .btn-primary:hover {
      background-color: var(--primary-dark);
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
      background-color: var(--text-secondary);
      color: white;
    }

    .btn-secondary:hover {
      background-color: var(--text-primary);
    }

    .alert {
      padding: 12px 16px;
      border-radius: 4px;
      margin-top: 20px;
      font-size: 14px;
    }

    .alert-success {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4caf50;
      border: 1px solid #4caf50;
    }

    .alert-error {
      background-color: rgba(244, 67, 54, 0.1);
      color: #f44336;
      border: 1px solid #f44336;
    }

    @media (max-width: 768px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }

      .settings-actions {
        flex-direction: column;
      }

      .btn-primary, .btn-secondary {
        width: 100%;
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  settings: any = {};
  successMessage = '';
  errorMessage = '';

  constructor(private themeService: ThemeService, public languageService: LanguageService) {}

  defaultSettings = {
    appName: 'BDIC Admin Panel',
    supportEmail: 'support@bedic.com',
    supportPhone: '+57 1 234 5678',
    websiteUrl: 'https://bedic.com',
    defaultTheme: 'auto',
    enableAnimations: true,
    compactMode: false,
    primaryColor: '#667eea',
    sessionTimeout: 30,
    requireTwoFactor: false,
    enableIpWhitelist: false,
    enableAuditLog: true,
    defaultMuteHours: 24,
    autobanThreshold: 10,
    enableAutoModeration: true,
    notifyOnReport: true,
    smtpServer: 'smtp.gmail.com',
    smtpPort: 587,
    senderEmail: 'noreply@bedic.com',
    enableEmailNotifications: true,
    apiUrl: 'http://localhost:5000',
    apiTimeout: 30,
    enableApiLogging: true,
    enableCaching: true,
    backupFrequency: 'daily',
    backupRetention: 30,
    autoBackup: true
  };

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    const saved = localStorage.getItem('adminSettings');
    if (saved) {
      this.settings = JSON.parse(saved);
    } else {
      this.settings = { ...this.defaultSettings };
    }
  }

  saveSettings(): void {
    try {
      localStorage.setItem('adminSettings', JSON.stringify(this.settings));

      // Aplicar tema según configuración
      const theme = this.settings.defaultTheme;
      if (theme === 'dark') {
        this.themeService.setDarkMode(true);
      } else if (theme === 'light') {
        this.themeService.setDarkMode(false);
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.themeService.setDarkMode(prefersDark);
      }

      // Aplicar color primario configurado
      this.themeService.applyPrimaryColor(this.settings.primaryColor);

      this.successMessage = this.languageService.translate('settings.saved_success');
      this.errorMessage = '';
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (err) {
      this.errorMessage = this.languageService.translate('settings.save_error');
      this.successMessage = '';
    }
  }

  resetSettings(): void {
    if (confirm(this.languageService.translate('settings.reset_confirm'))) {
      this.settings = { ...this.defaultSettings };
      this.saveSettings();
    }
  }

  createBackup(): void {
    const backup = {
      timestamp: new Date().toISOString(),
      settings: this.settings,
      version: '1.0'
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-${new Date().getTime()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.successMessage = this.languageService.translate('settings.backup_success');
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}
