import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-places-management-simple',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="places-simple-container">
      <mat-card class="main-card">
        <mat-card-header>
          <mat-card-title>
            <h1>📍 Gestión de Lugares - BDIC</h1>
          </mat-card-title>
          <mat-card-subtitle>
            Sistema de gestión de lugares propios
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="status-section">
            <h2>Estado del Sistema</h2>
            <div class="status-grid">
              <div class="status-item">
                <mat-icon color="primary">check_circle</mat-icon>
                <div class="status-text">
                  <strong>Backend</strong>
                  <span>Funcionando en puerto 5000</span>
                </div>
              </div>
              <div class="status-item">
                <mat-icon color="primary">check_circle</mat-icon>
                <div class="status-text">
                  <strong>Base de datos</strong>
                  <span>Limpia y lista (0 lugares)</span>
                </div>
              </div>
              <div class="status-item">
                <mat-icon color="primary">check_circle</mat-icon>
                <div class="status-text">
                  <strong>API REST</strong>
                  <span>9 endpoints disponibles</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>🎯 Próximos pasos</h2>
            <ol class="steps-list">
              <li>Usar Postman para probar la API</li>
              <li>Crear lugares manualmente</li>
              <li>Verificar en Flutter</li>
            </ol>
          </div>

          <div class="section">
            <h2>📡 Endpoints disponibles</h2>
            <div class="endpoints-list">
              <div class="endpoint-item">
                <span class="method get">GET</span>
                <code>/api/management/places</code>
              </div>
              <div class="endpoint-item">
                <span class="method get">GET</span>
                <code>/api/management/places/stats</code>
              </div>
              <div class="endpoint-item">
                <span class="method get">GET</span>
                <code>/api/management/places/cities</code>
              </div>
              <div class="endpoint-item">
                <span class="method post">POST</span>
                <code>/api/management/places</code>
                <span class="auth-required">(requiere auth)</span>
              </div>
            </div>
          </div>

          <button mat-raised-button color="primary" class="doc-button">
            <mat-icon>info</mat-icon>
            Ver Documentación
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .places-simple-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .main-card {
      margin-bottom: 24px;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    h2 {
      font-size: 18px;
      font-weight: 500;
      margin: 0 0 16px 0;
      opacity: 0.87;
    }

    .status-section {
      margin-bottom: 32px;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      background: rgba(25, 118, 210, 0.08);
    }

    .status-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .status-text strong {
      font-size: 14px;
      font-weight: 500;
      color: inherit;
    }

    .status-text span {
      font-size: 13px;
      color: inherit;
      opacity: 0.8;
    }

    .section {
      margin-bottom: 32px;
    }

    .steps-list {
      margin: 0;
      padding-left: 24px;
    }

    .steps-list li {
      margin-bottom: 8px;
      line-height: 1.6;
      color: inherit;
    }

    .endpoints-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .endpoint-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.04);
      font-family: monospace;
    }

    .method {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      min-width: 50px;
      text-align: center;
    }

    .method.get {
      background: #4caf50;
      color: white;
    }

    .method.post {
      background: #2196f3;
      color: white;
    }

    code {
      flex: 1;
      font-size: 13px;
      color: inherit;
      opacity: 0.9;
    }

    .auth-required {
      font-size: 12px;
      color: inherit;
      opacity: 0.7;
      font-style: italic;
    }

    .doc-button {
      margin-top: 16px;
    }

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      .endpoint-item {
        background: rgba(255, 255, 255, 0.05);
      }
    }
  `]
})
export class PlacesManagementSimpleComponent {}
