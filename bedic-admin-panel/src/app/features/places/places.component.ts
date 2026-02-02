import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';
import { PlaceDetailsDialogComponent } from '../../shared/components/place-details-dialog/place-details-dialog.component';
import { CategoryService } from '../categories/category.service';
import { Category } from '../categories/category.model';

interface Place {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  coordinates: {
    type: string;
    coordinates: [number, number];
  };
  source: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  officialImages: string[];
  department?: string;
  city?: string;
  sector?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Department {
  name: string;
  cities: City[];
}

interface City {
  name: string;
  sectors: string[];
}

@Component({
  selector: 'app-places',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslatePipe
  ],
  template: `
    <div class="places-container">
      <div class="header">
        <h1>{{ languageService.translate('places.title') }}</h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="addPlace()">
            <mat-icon>add</mat-icon>
            {{ languageService.translate('places.add') }}
          </button>
          <button mat-raised-button (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            {{ languageService.translate('common.refresh') }}
          </button>
        </div>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>{{ languageService.translate('places.search') }}</mat-label>
          <input matInput (keyup)="applyFilter($event)" [placeholder]="languageService.translate('places.search')">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ languageService.translate('places.department') }}</mat-label>
          <mat-select [(value)]="selectedDepartment" (selectionChange)="onDepartmentChange($event.value)">
            <mat-option value="">{{ languageService.translate('common.all') }}</mat-option>
            <mat-option *ngFor="let dept of departments" [value]="dept.name">
              {{ dept.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ languageService.translate('places.city') }}</mat-label>
          <mat-select [(value)]="selectedCity" (selectionChange)="onCityChange($event.value)" [disabled]="!selectedDepartment">
            <mat-option value="">{{ languageService.translate('common.all') }}</mat-option>
            <mat-option *ngFor="let city of availableCities" [value]="city.name">
              {{ city.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ languageService.translate('places.sector') }}</mat-label>
          <mat-select [(value)]="selectedSector" (selectionChange)="onSectorChange($event.value)" [disabled]="!selectedCity">
            <mat-option value="">{{ languageService.translate('common.all') }}</mat-option>
            <mat-option *ngFor="let sector of availableSectors" [value]="sector">
              {{ sector }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ languageService.translate('places.category') }}</mat-label>
          <mat-select [(value)]="selectedCategory" (selectionChange)="applyFilters()">
            <mat-option value="">{{ languageService.translate('common.all') }}</mat-option>
            <mat-option *ngFor="let c of activeCategories" [value]="getCategoryKey(c)">
              {{ c.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ languageService.translate('places.photo_status') }}</mat-label>
          <mat-select [(value)]="selectedPhotoStatus" (selectionChange)="applyFilters()">
            <mat-option value="">{{ languageService.translate('common.all') }}</mat-option>
            <mat-option value="with_photos">{{ languageService.translate('places.with_photos') }}</mat-option>
            <mat-option value="without_photos">{{ languageService.translate('places.without_photos') }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select [(value)]="selectedVerification" (selectionChange)="applyFilters()">
            <mat-option value="">Todos</mat-option>
            <mat-option value="verified">Verificado</mat-option>
            <mat-option value="unverified">Sin verificar</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-raised-button color="accent" (click)="clearFilters()" class="clear-filters-btn">
          <mat-icon>clear</mat-icon>
          {{ languageService.translate('places.clear_filters') }}
        </button>
      </div>

      <div class="filter-summary" *ngIf="hasActiveFilters()">
        <mat-chip-listbox>
          <mat-chip *ngIf="selectedDepartment" (removed)="removeDepartmentFilter()">
            Departamento: {{ selectedDepartment }}
            <button matChipRemove><mat-icon>cancel</mat-icon></button>
          </mat-chip>
          <mat-chip *ngIf="selectedCity" (removed)="removeCityFilter()">
            Ciudad: {{ selectedCity }}
            <button matChipRemove><mat-icon>cancel</mat-icon></button>
          </mat-chip>
          <mat-chip *ngIf="selectedSector" (removed)="removeSectorFilter()">
            Sector: {{ selectedSector }}
            <button matChipRemove><mat-icon>cancel</mat-icon></button>
          </mat-chip>
          <mat-chip *ngIf="selectedCategory" (removed)="removeCategoryFilter()">
            Categoría: {{ selectedCategory }}
            <button matChipRemove><mat-icon>cancel</mat-icon></button>
          </mat-chip>
          <mat-chip *ngIf="selectedPhotoStatus" (removed)="removePhotoStatusFilter()">
            Estado de fotos: {{ getPhotoStatusLabel(selectedPhotoStatus) }}
            <button matChipRemove><mat-icon>cancel</mat-icon></button>
          </mat-chip>
        </mat-chip-listbox>
        <span class="results-count">{{ dataSource.filteredData.length }} resultados</span>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="dataSource" matSort class="places-table">
          <!-- Name Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Nombre</th>
            <td mat-cell *matCellDef="let element">
              <a class="place-name-link" (click)="viewPlaceDetails(element)">
                {{ element.name }}
              </a>
            </td>
          </ng-container>

          <!-- Category Column -->
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Categoría</th>
            <td mat-cell *matCellDef="let element">
              <mat-chip>{{ getCategoryLabel(element.category) }}</mat-chip>
            </td>
          </ng-container>

          <!-- Images Column -->
          <ng-container matColumnDef="images">
            <th mat-header-cell *matHeaderCellDef>Imágenes</th>
            <td mat-cell *matCellDef="let element">
              <div class="image-count">
                <mat-icon>image</mat-icon>
                <span>{{ element.officialImages?.length || 0 }}</span>
              </div>
            </td>
          </ng-container>

          <!-- Rating Column -->
          <ng-container matColumnDef="rating">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Calificación</th>
            <td mat-cell *matCellDef="let element">
              <div class="rating">
                <mat-icon class="star">star</mat-icon>
                <span>{{ element.rating.toFixed(1) }}</span>
                <span class="review-count">({{ element.reviewCount }})</span>
              </div>
            </td>
          </ng-container>

          <!-- Verified Column -->
          <ng-container matColumnDef="verified">
            <th mat-header-cell *matHeaderCellDef>Verificado</th>
            <td mat-cell *matCellDef="let element">
              <mat-chip [ngClass]="element.verified ? 'verified' : 'unverified'">
                <mat-icon>{{ element.verified ? 'check_circle' : 'cancel' }}</mat-icon>
                {{ element.verified ? 'Sí' : 'No' }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Date Column -->
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Creado</th>
            <td mat-cell *matCellDef="let element">
              {{ element.createdAt | date:'short' }}
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Acciones">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="editPlace(element)">
                  <mat-icon>edit</mat-icon>
                  <span>Editar</span>
                </button>
                <button mat-menu-item (click)="verifyPlace(element)" *ngIf="!element.verified">
                  <mat-icon>verified</mat-icon>
                  <span>Verificar</span>
                </button>
                <button mat-menu-item (click)="deletePlace(element)">
                  <mat-icon>delete</mat-icon>
                  <span>Eliminar</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator
          [pageSizeOptions]="[10, 25, 50, 100]"
          showFirstLastButtons
          aria-label="Select page of places">
        </mat-paginator>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>{{ languageService.translate('places.loading') }}</p>
      </div>
    </div>
  `,
  styles: [`
    .places-container {
      padding: 20px;
      background-color: var(--background-color);
      color: var(--text-primary);
      min-height: 100vh;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;

      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
        color: var(--text-primary);
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }
    }

    .filters {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
      align-items: start;

      mat-form-field {
        width: 100%;
      }

      .clear-filters-btn {
        height: 56px;
        margin-top: 0;
      }
    }

    .filter-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background-color: rgba(102, 126, 234, 0.1);
      border-radius: 8px;
      margin-bottom: 20px;
      border: 1px solid var(--border-color);

      mat-chip-listbox {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      mat-chip {
        background-color: var(--primary-color);
        color: white;
        font-size: 13px;

        button {
          color: white;
          opacity: 0.8;

          &:hover {
            opacity: 1;
          }
        }
      }

      .results-count {
        font-weight: 600;
        color: var(--primary-color);
        white-space: nowrap;
        margin-left: 15px;
      }
    }

    .table-container {
      background-color: var(--surface-color);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid var(--border-color);

      table {
        width: 100%;
      }

      th {
        background-color: var(--background-color);
        color: var(--text-primary);
        font-weight: 600;
        border-bottom: 1px solid var(--border-color);
      }

      td {
        padding: 12px;
        color: var(--text-primary);
        border-bottom: 1px solid var(--border-color);
      }

      tr:hover {
        background-color: rgba(102, 126, 234, 0.05);
      }
    }

    .place-name-link {
      color: var(--primary-color);
      cursor: pointer;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        text-decoration: underline;
        color: #5568d3;
      }
    }

    .image-count {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--primary-color);
      }

      span {
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 5px;

      .star {
        color: #ffc107;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .review-count {
        color: var(--text-secondary);
        font-size: 12px;
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

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 20px;

      p {
        color: var(--text-secondary);
        font-size: 16px;
      }
    }

    /* Dark theme overrides */
    :root.dark-theme {
      .places-container {
        background-color: var(--background-color);
        color: var(--text-primary);
      }

      .header {
        h1 {
          color: var(--text-primary);
        }
      }

      .filters {
        mat-form-field {
          .mat-form-field-label {
            color: var(--text-secondary) !important;
          }

          .mat-input-element {
            color: var(--text-primary) !important;
            background-color: #2a2a2a !important;
          }

          .mat-form-field-underline {
            background-color: var(--border-color) !important;
          }
        }
      }

      .table-container {
        background-color: var(--surface-color);
        border-color: var(--border-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

        table {
          background-color: var(--surface-color);
        }

        th {
          background-color: var(--background-color);
          color: var(--text-primary);
          border-bottom-color: var(--border-color);
          font-weight: 600;
        }

        td {
          color: var(--text-primary);
          border-bottom-color: var(--border-color);
          padding: 12px;
        }

        tr:hover {
          background-color: rgba(102, 126, 234, 0.1);
        }
      }

      .image-preview {
        .thumbnail {
          border-color: var(--border-color);
          background-color: #2a2a2a;
        }

        span {
          color: var(--text-secondary);
        }
      }

      .rating {
        .star {
          color: #ffc107;
        }

        .review-count {
          color: var(--text-secondary);
        }
      }

      mat-chip {
        &.verified {
          background-color: rgba(76, 175, 80, 0.15);
          color: #81c784;
        }

        &.unverified {
          background-color: rgba(244, 67, 54, 0.15);
          color: #ef5350;
        }
      }

      .loading {
        p {
          color: var(--text-secondary);
        }
      }

      /* Material components styling */
      .mat-mdc-button,
      .mat-mdc-raised-button {
        color: var(--text-primary) !important;

        &[color="primary"] {
          background-color: var(--primary-color) !important;
          color: white !important;
        }
      }

      .mat-mdc-icon-button {
        color: var(--text-primary) !important;
      }

      .mat-mdc-menu-panel {
        background-color: var(--surface-color) !important;
        color: var(--text-primary) !important;
      }

      .mat-mdc-menu-item {
        color: var(--text-primary) !important;
      }

      .mat-mdc-paginator {
        background-color: var(--surface-color) !important;
        color: var(--text-primary) !important;

        .mat-mdc-paginator-container {
          background-color: var(--surface-color) !important;
          color: var(--text-primary) !important;
        }
      }

      .mat-sort-header-button {
        color: var(--text-primary) !important;
      }

      .mat-mdc-form-field {
        .mat-mdc-form-field-label {
          color: var(--text-secondary) !important;
        }

        .mat-mdc-input-element {
          color: var(--text-primary) !important;
          caret-color: var(--text-primary) !important;
        }

        .mat-mdc-form-field-underline {
          background-color: var(--border-color) !important;
        }
      }

      .mat-mdc-select {
        color: var(--text-primary) !important;
      }

      .mat-mdc-select-panel {
        background-color: var(--surface-color) !important;

        .mat-mdc-option {
          color: var(--text-primary) !important;
        }
      }
    }
  `]
})
export class PlacesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['name', 'category', 'images', 'rating', 'verified', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Place>([]);
  loading = false;
  allPlaces: Place[] = [];

  // Filtros
  selectedDepartment = '';
  selectedCity = '';
  selectedSector = '';
  selectedCategory = '';
  selectedPhotoStatus = '';
  selectedVerification = '';

  activeCategories: Category[] = [];
  private categoryLabelByKey: Record<string, string> = {};

  // Datos de departamentos y ciudades de Colombia
  departments: Department[] = [
    {
      name: 'Cundinamarca',
      cities: [
        {
          name: 'Bogotá',
          sectors: ['Norte', 'Sur', 'Centro', 'Oriente', 'Occidente', 'Usaquén', 'Chapinero', 'Santa Fe', 'San Cristóbal', 'Usme', 'Tunjuelito', 'Bosa', 'Kennedy', 'Fontibón', 'Engativá', 'Suba', 'Barrios Unidos', 'Teusaquillo', 'Los Mártires', 'Antonio Nariño', 'Puente Aranda']
        }
      ]
    },
    {
      name: 'Antioquia',
      cities: [
        {
          name: 'Medellín',
          sectors: ['El Poblado', 'Laureles', 'La Candelaria', 'Buenos Aires', 'Castilla', 'Aranjuez', 'Manrique', 'Belén', 'Robledo']
        },
        {
          name: 'Bello',
          sectors: ['Centro', 'Norte', 'Sur']
        }
      ]
    },
    {
      name: 'Valle del Cauca',
      cities: [
        {
          name: 'Cali',
          sectors: ['Norte', 'Centro', 'Sur', 'Oeste', 'Este', 'Aguablanca']
        },
        {
          name: 'Jamundí',
          sectors: ['Centro']
        },
        {
          name: 'Yumbo',
          sectors: ['Centro']
        },
        {
          name: 'Palmira',
          sectors: ['Centro']
        }
      ]
    },
    {
      name: 'Atlántico',
      cities: [
        {
          name: 'Barranquilla',
          sectors: ['Norte', 'Centro', 'Sur', 'Suroccidente']
        },
        {
          name: 'Soledad',
          sectors: ['Centro']
        }
      ]
    },
    {
      name: 'Bolívar',
      cities: [
        {
          name: 'Cartagena',
          sectors: ['Centro Histórico', 'Bocagrande', 'Norte', 'Sureste', 'Manga']
        }
      ]
    },
    {
      name: 'Santander',
      cities: [
        {
          name: 'Bucaramanga',
          sectors: ['Centro', 'Norte', 'Sur', 'Cabecera']
        },
        {
          name: 'Floridablanca',
          sectors: ['Centro']
        },
        {
          name: 'Girón',
          sectors: ['Centro']
        }
      ]
    },
    {
      name: 'Risaralda',
      cities: [
        {
          name: 'Pereira',
          sectors: ['Centro', 'Norte', 'Sur']
        },
        {
          name: 'Dosquebradas',
          sectors: ['Centro']
        }
      ]
    },
    {
      name: 'Magdalena',
      cities: [
        {
          name: 'Santa Marta',
          sectors: ['Centro', 'Rodadero', 'Bello Horizonte']
        }
      ]
    },
    {
      name: 'Norte de Santander',
      cities: [
        {
          name: 'Cúcuta',
          sectors: ['Centro', 'Norte', 'Sur']
        }
      ]
    },
    {
      name: 'Caldas',
      cities: [
        {
          name: 'Manizales',
          sectors: ['Centro', 'Norte']
        }
      ]
    },
    {
      name: 'Tolima',
      cities: [
        {
          name: 'Ibagué',
          sectors: ['Centro', 'Norte']
        }
      ]
    },
    {
      name: 'Nariño',
      cities: [
        {
          name: 'Pasto',
          sectors: ['Centro']
        }
      ]
    },
    {
      name: 'Meta',
      cities: [
        {
          name: 'Villavicencio',
          sectors: ['Centro']
        }
      ]
    },
    {
      name: 'Quindío',
      cities: [
        {
          name: 'Armenia',
          sectors: ['Centro']
        }
      ]
    },
    {
      name: 'Huila',
      cities: [
        {
          name: 'Neiva',
          sectors: ['Centro']
        }
      ]
    },
    {
      name: 'Cauca',
      cities: [
        {
          name: 'Popayán',
          sectors: ['Centro']
        }
      ]
    },
    {
      name: 'Cesar',
      cities: [
        {
          name: 'Valledupar',
          sectors: ['Centro']
        }
      ]
    },
    {
      name: 'Córdoba',
      cities: [
        {
          name: 'Montería',
          sectors: ['Centro']
        }
      ]
    },
    {
      name: 'Sucre',
      cities: [
        {
          name: 'Sincelejo',
          sectors: ['Centro']
        }
      ]
    },
    {
      name: 'Boyacá',
      cities: [
        {
          name: 'Tunja',
          sectors: ['Centro']
        }
      ]
    },
    {
      name: 'La Guajira',
      cities: [
        {
          name: 'Riohacha',
          sectors: ['Centro']
        }
      ]
    }
  ];

  availableCities: City[] = [];
  availableSectors: string[] = [];

constructor(
  private adminService: AdminService,
  private router: Router,
  private snackBar: MatSnackBar,
  private dialog: MatDialog,
  private categoryService: CategoryService,
  public languageService: LanguageService
) {}

ngOnInit(): void {
  this.loadActiveCategories();
  this.loadPlaces();
}

private loadActiveCategories(): void {
    this.categoryService.getActiveCategories().subscribe({
      next: (res) => {
        this.activeCategories = (res.data as Category[]) || [];
        const map: Record<string, string> = {};

        for (const c of this.activeCategories) {
          const key = ((c as any).slug || (c as any).key || c.name) as string;
          map[key] = c.name;
        }

        this.categoryLabelByKey = map;
      },
      error: (err: unknown) => {
        console.error('Error loading active categories:', err);
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadPlaces(): void {
    this.loading = true;
    this.adminService.getPlaces().subscribe({
      next: (places: any[]) => {
        this.allPlaces = places.map(p => this.extractLocationFromAddress(p));
        this.dataSource.data = this.allPlaces;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading places:', err);
        this.loading = false;
      }
    });
  }

  // Extraer departamento, ciudad y sector de la dirección
  extractLocationFromAddress(place: any): Place {
    const address = place.address || '';
    
    // Buscar ciudad en la dirección
    let foundDepartment = '';
    let foundCity = '';
    let foundSector = '';

    for (const dept of this.departments) {
      for (const city of dept.cities) {
        if (address.toLowerCase().includes(city.name.toLowerCase())) {
          foundDepartment = dept.name;
          foundCity = city.name;
          
          // Buscar sector
          for (const sector of city.sectors) {
            if (address.toLowerCase().includes(sector.toLowerCase())) {
              foundSector = sector;
              break;
            }
          }
          break;
        }
      }
      if (foundCity) break;
    }

    return {
      ...place,
      department: foundDepartment,
      city: foundCity,
      sector: foundSector,
      createdAt: new Date(place.createdAt),
      updatedAt: new Date(place.updatedAt)
    };
  }

  // Filtros en cascada
  onDepartmentChange(department: string): void {
    this.selectedDepartment = department;
    this.selectedCity = '';
    this.selectedSector = '';
    this.availableSectors = [];
    
    if (department) {
      const dept = this.departments.find(d => d.name === department);
      this.availableCities = dept ? dept.cities : [];
    } else {
      this.availableCities = [];
    }
    
    this.applyFilters();
  }

  onCityChange(city: string): void {
    this.selectedCity = city;
    this.selectedSector = '';
    
    if (city) {
      const dept = this.departments.find(d => d.name === this.selectedDepartment);
      const cityData = dept?.cities.find(c => c.name === city);
      this.availableSectors = cityData ? cityData.sectors : [];
    } else {
      this.availableSectors = [];
    }
    
    this.applyFilters();
  }

  onSectorChange(sector: string): void {
    this.selectedSector = sector;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.allPlaces];

    // Filtro por departamento
    if (this.selectedDepartment) {
      filtered = filtered.filter(p => p.department === this.selectedDepartment);
    }

    // Filtro por ciudad
    if (this.selectedCity) {
      filtered = filtered.filter(p => p.city === this.selectedCity);
    }

    // Filtro por sector
    if (this.selectedSector) {
      filtered = filtered.filter(p => p.sector === this.selectedSector);
    }

    // Filtro por categoría
    if (this.selectedCategory) {
      const selectedLabel = this.categoryLabelByKey[this.selectedCategory];
      filtered = filtered.filter(p =>
        p.category === this.selectedCategory ||
        (selectedLabel ? p.category === selectedLabel : false)
      );
    }

    // Filtro por estado de fotos
    if (this.selectedPhotoStatus === 'with_photos') {
      filtered = filtered.filter(p => p.officialImages && p.officialImages.length > 0);
    } else if (this.selectedPhotoStatus === 'without_photos') {
      filtered = filtered.filter(p => !p.officialImages || p.officialImages.length === 0);
    }

    // Filtro por verificación
    if (this.selectedVerification === 'verified') {
      filtered = filtered.filter(p => p.verified);
    } else if (this.selectedVerification === 'unverified') {
      filtered = filtered.filter(p => !p.verified);
    }

    this.dataSource.data = filtered;
  }

  clearFilters(): void {
    this.selectedDepartment = '';
    this.selectedCity = '';
    this.selectedSector = '';
    this.selectedCategory = '';
    this.selectedPhotoStatus = '';
    this.selectedVerification = '';
    this.availableCities = [];
    this.availableSectors = [];
    this.dataSource.data = this.allPlaces;
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedDepartment || this.selectedCity || this.selectedSector || 
              this.selectedCategory || this.selectedPhotoStatus || this.selectedVerification);
  }

  removeDepartmentFilter(): void {
    this.selectedDepartment = '';
    this.selectedCity = '';
    this.selectedSector = '';
    this.availableCities = [];
    this.availableSectors = [];
    this.applyFilters();
  }

  removeCityFilter(): void {
    this.selectedCity = '';
    this.selectedSector = '';
    this.availableSectors = [];
    this.applyFilters();
  }

  removeSectorFilter(): void {
    this.selectedSector = '';
    this.applyFilters();
  }

  removeCategoryFilter(): void {
    this.selectedCategory = '';
    this.applyFilters();
  }

  removePhotoStatusFilter(): void {
    this.selectedPhotoStatus = '';
    this.applyFilters();
  }

  getPhotoStatusLabel(status: string): string {
    return status === 'with_photos' ? 'Con fotos' : 'Sin fotos';
  }

  refreshData(): void {
    this.loadPlaces();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getCategoryLabel(category: string): string {
    return this.categoryLabelByKey[category] || category || 'N/A';
  }

  getCategoryKey(category: Category): string {
    return (category as any).slug || (category as any).key || category.name;
  }

  addPlace(): void {
    this.router.navigate(['/dashboard/places/new']);
  }

  editPlace(place: Place): void {
    this.router.navigate(['/dashboard/places', place.id]);
  }

  manageImages(place: Place): void {
    // Navegar a la pantalla de edición del lugar donde se pueden gestionar imágenes
    this.router.navigate(['/dashboard/places', place.id]);
  }

  viewPlaceDetails(place: Place): void {
    this.dialog.open(PlaceDetailsDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: place,
      panelClass: 'place-details-dialog'
    });
  }

  verifyPlace(place: Place): void {
    this.adminService.verifyPlace(place.id).subscribe({
      next: () => {
        place.verified = true;
        this.loadPlaces();
        this.showSnackBar('Lugar verificado exitosamente', 'success');
      },
      error: (err: any) => {
        console.error('Error verifying place:', err);
        this.showSnackBar('Error al verificar el lugar', 'error');
      }
    });
  }

  deletePlace(place: Place): void {
    // Mostrar confirmación con snackbar
    const snackBarRef = this.snackBar.open(
      `¿Eliminar "${place.name}"?`,
      'ELIMINAR',
      {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-warning']
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.adminService.deletePlace(place.id).subscribe({
        next: () => {
          this.allPlaces = this.allPlaces.filter(p => p.id !== place.id);
          this.dataSource.data = this.allPlaces;
          this.showSnackBar('Lugar eliminado exitosamente', 'success');
        },
        error: (err: any) => {
          console.error('Error deleting place:', err);
          this.showSnackBar('Error al eliminar el lugar', 'error');
        }
      });
    });
  }

  showSnackBar(message: string, snackType: 'success' | 'error' | 'warning' = 'success'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${snackType}`]
    });
  }
}
