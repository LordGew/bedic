import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

interface PlaceDetailsData {
  id: string;
  name: string;
  category: string;
  description?: string;
  address?: string;
  city?: string;
  department?: string;
  sector?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  officialImages?: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-place-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>place</mat-icon>
          {{ data.name }}
          <mat-icon *ngIf="data.verified" class="verified-icon">verified</mat-icon>
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="details-grid">
          <!-- Categoría -->
          <div class="detail-item">
            <div class="detail-label">
              <mat-icon>category</mat-icon>
              Categoría
            </div>
            <mat-chip>{{ data.category }}</mat-chip>
          </div>

          <!-- Descripción -->
          <div class="detail-item full-width" *ngIf="data.description">
            <div class="detail-label">
              <mat-icon>description</mat-icon>
              Descripción
            </div>
            <p class="detail-value">{{ data.description }}</p>
          </div>

          <!-- Ubicación -->
          <div class="detail-item full-width">
            <div class="detail-label">
              <mat-icon>location_on</mat-icon>
              Ubicación
            </div>
            <div class="location-info">
              <p *ngIf="data.address"><strong>Dirección:</strong> {{ data.address }}</p>
              <p *ngIf="data.city"><strong>Ciudad:</strong> {{ data.city }}</p>
              <p *ngIf="data.department"><strong>Departamento:</strong> {{ data.department }}</p>
              <p *ngIf="data.sector"><strong>Sector:</strong> {{ data.sector }}</p>
            </div>
          </div>

          <!-- Calificación -->
          <div class="detail-item">
            <div class="detail-label">
              <mat-icon>star</mat-icon>
              Calificación
            </div>
            <div class="rating-info">
              <span class="rating-value">{{ data.rating.toFixed(1) }}</span>
              <span class="review-count">({{ data.reviewCount }} reseñas)</span>
            </div>
          </div>

          <!-- Estado de Verificación -->
          <div class="detail-item">
            <div class="detail-label">
              <mat-icon>{{ data.verified ? 'check_circle' : 'cancel' }}</mat-icon>
              Estado
            </div>
            <mat-chip [class.verified]="data.verified" [class.unverified]="!data.verified">
              {{ data.verified ? 'Verificado' : 'Sin verificar' }}
            </mat-chip>
          </div>

          <!-- Imágenes -->
          <div class="detail-item">
            <div class="detail-label">
              <mat-icon>image</mat-icon>
              Imágenes
            </div>
            <span class="detail-value">{{ data.officialImages?.length || 0 }} imágenes</span>
          </div>

          <!-- Fechas -->
          <div class="detail-item">
            <div class="detail-label">
              <mat-icon>calendar_today</mat-icon>
              Creado
            </div>
            <span class="detail-value">{{ data.createdAt | date:'medium' }}</span>
          </div>

          <div class="detail-item">
            <div class="detail-label">
              <mat-icon>update</mat-icon>
              Actualizado
            </div>
            <span class="detail-value">{{ data.updatedAt | date:'medium' }}</span>
          </div>
        </div>

        <!-- Galería de imágenes -->
        <div class="images-section" *ngIf="data.officialImages && data.officialImages.length > 0">
          <h3>Galería de Imágenes</h3>
          <div class="images-grid">
            <img *ngFor="let image of data.officialImages" 
                 [src]="getImageUrl(image)" 
                 alt="Place image"
                 (error)="onImageError($event)">
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cerrar</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      max-width: 700px;
      width: 100%;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h2 {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
        font-size: 24px;
        color: var(--text-primary);

        mat-icon {
          color: var(--primary-color);
        }

        .verified-icon {
          color: #2196f3;
          font-size: 20px;
        }
      }
    }

    mat-dialog-content {
      padding: 0 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 8px;

      &.full-width {
        grid-column: 1 / -1;
      }
    }

    .detail-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 14px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .detail-value {
      color: var(--text-primary);
      margin: 0;
    }

    .location-info {
      p {
        margin: 4px 0;
        color: var(--text-primary);
      }
    }

    .rating-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .rating-value {
        font-size: 20px;
        font-weight: 700;
        color: #ffc107;
      }

      .review-count {
        color: var(--text-secondary);
        font-size: 14px;
      }
    }

    mat-chip {
      &.verified {
        background-color: rgba(46, 125, 50, 0.15);
        color: #2e7d32;
      }

      &.unverified {
        background-color: rgba(198, 40, 40, 0.15);
        color: #c62828;
      }
    }

    .images-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);

      h3 {
        margin: 0 0 15px 0;
        font-size: 18px;
        color: var(--text-primary);
      }
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 10px;

      img {
        width: 100%;
        height: 120px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        cursor: pointer;
        transition: transform 0.2s ease;

        &:hover {
          transform: scale(1.05);
        }
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      margin: 0;
    }
  `]
})
export class PlaceDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PlaceDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PlaceDetailsData
  ) {}

  getImageUrl(imagePath: string): string {
    return imagePath.startsWith('http') ? imagePath : `http://localhost:5000${imagePath}`;
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
  }
}
