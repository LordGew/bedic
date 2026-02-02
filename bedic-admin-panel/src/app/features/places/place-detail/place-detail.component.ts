import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlacesManagementService } from '../../../core/services/places-management.service';
import { CategoryService } from '../../categories/category.service';
import { Category } from '../../categories/category.model';

interface PlaceImage {
  id: string;
  url: string;
  isMain: boolean;
  uploadedAt: Date;
}

interface Place {
  id?: string;
  name: string;
  description: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  images: PlaceImage[];
  verified: boolean;
  rating: number;
  reviewCount: number;
}

@Component({
  selector: 'app-place-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="place-detail-container" *ngIf="!loading">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ isNew ? 'Nuevo Lugar' : 'Editar Lugar' }}</h1>
        <div class="spacer"></div>
      </div>

      <div class="content">
        <!-- Place Info Form -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Información del Lugar</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="placeForm" class="place-form" (ngSubmit)="savePlace()" (submit)="$event.preventDefault()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="name" placeholder="Nombre del lugar">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Descripción</mat-label>
                <textarea matInput formControlName="description" rows="4" placeholder="Descripción..."></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Categoría</mat-label>
                <mat-select formControlName="category">
                  <mat-option *ngFor="let c of activeCategories" [value]="getCategoryKey(c)">
                    {{ c.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Coordenadas de Google Maps -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>📍 Pegar coordenadas de Google Maps</mat-label>
                <input matInput #googleCoords placeholder="Ej: 10.941890428695375, -74.7915938677832" 
                       (blur)="parseGoogleCoordinates(googleCoords.value)">
                <mat-hint>Copia y pega las coordenadas directamente desde Google Maps</mat-hint>
              </mat-form-field>

              <!-- Coordenadas -->
              <div class="location-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Latitud</mat-label>
                  <input matInput type="number" formControlName="latitude" placeholder="0.0000" step="0.000001">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Longitud</mat-label>
                  <input matInput type="number" formControlName="longitude" placeholder="0.0000" step="0.000001">
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Dirección</mat-label>
                <input matInput formControlName="address" placeholder="Dirección completa">
              </mat-form-field>

              <div class="location-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Departamento</mat-label>
                  <mat-select formControlName="department" (selectionChange)="onDepartmentChange($event.value)">
                    <mat-option value="Atlántico">Atlántico</mat-option>
                    <mat-option value="Bogotá D.C.">Bogotá D.C.</mat-option>
                    <mat-option value="Antioquia">Antioquia</mat-option>
                    <mat-option value="Valle del Cauca">Valle del Cauca</mat-option>
                    <mat-option value="Santander">Santander</mat-option>
                    <mat-option value="Bolívar">Bolívar</mat-option>
                    <mat-option value="Cundinamarca">Cundinamarca</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Ciudad</mat-label>
                  <mat-select formControlName="city">
                    <mat-option *ngFor="let city of availableCities" [value]="city">
                      {{ city }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Sector (opcional)</mat-label>
                <input matInput formControlName="sector" placeholder="Ej: Norte, Centro, Sur">
              </mat-form-field>

              <div class="button-group">
                <button mat-raised-button color="primary" (click)="savePlace()" [disabled]="loading">
                  <mat-icon>{{ loading ? 'hourglass_empty' : 'save' }}</mat-icon>
                  {{ loading ? 'Guardando...' : 'Guardar' }}
                </button>
                <button mat-raised-button (click)="goBack()" [disabled]="loading">
                  <mat-icon>cancel</mat-icon>
                  Cancelar
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Images Gallery -->
        <mat-card class="images-card">
          <mat-card-header>
            <mat-card-title>Galería de Imágenes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <!-- Upload Area -->
            <div class="upload-area" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
              <mat-icon>cloud_upload</mat-icon>
              <p>Arrastra imágenes aquí o haz clic para seleccionar</p>
              <input #fileInput type="file" multiple accept="image/*" (change)="onFileSelected($event)" hidden>
              <button mat-raised-button (click)="fileInput.click()">
                <mat-icon>add_photo_alternate</mat-icon>
                Seleccionar Imágenes
              </button>
            </div>

            <!-- Upload Progress -->
            <div *ngIf="uploadProgress > 0" class="upload-progress">
              <mat-progress-bar mode="determinate" [value]="uploadProgress"></mat-progress-bar>
              <span>{{ uploadProgress }}%</span>
            </div>

            <!-- Images Grid -->
            <div class="images-grid">
              <div *ngFor="let image of place.images" class="image-item">
                <img [src]="image.url" 
                     alt="Place image"
                     (error)="onImageError($event, image)"
                     loading="lazy">
                <div class="image-overlay">
                  <button mat-icon-button (click)="setMainImage(image)" 
                          [class.active]="image.isMain"
                          matTooltip="Establecer como principal">
                    <mat-icon>{{ image.isMain ? 'star' : 'star_border' }}</mat-icon>
                  </button>
                  <button mat-icon-button (click)="deleteImage(image)" matTooltip="Eliminar">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
                <div *ngIf="image.isMain" class="main-badge">Principal</div>
              </div>
            </div>

            <p *ngIf="place.images.length === 0" class="no-images">
              No hay imágenes. Sube algunas para comenzar.
            </p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <div *ngIf="loading" class="loading">
      <mat-spinner diameter="40"></mat-spinner>
      <p>Cargando...</p>
    </div>
  `,
  styles: [`
    .place-detail-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 30px;

      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
      }

      .spacer {
        flex: 1;
      }
    }

    .content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    mat-card {
      background-color: var(--surface-color);
      color: var(--text-primary);

      mat-card-header {
        margin-bottom: 20px;

        mat-card-title {
          font-size: 18px;
          font-weight: 600;
        }
      }
    }

    .form-card {
      grid-column: 1 / -1;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    mat-form-field {
      width: 100%;
    }

    .full-width {
      width: 100%;
    }

    .location-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;

      mat-form-field {
        width: 100%;
      }
    }

    .button-group {
      display: flex;
      gap: 10px;
      margin-top: 20px;

      button {
        flex: 1;
      }
    }

    .upload-area {
      border: 2px dashed var(--border-color);
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: var(--background-color);

      &:hover {
        border-color: var(--primary-color);
        background-color: rgba(102, 126, 234, 0.05);
      }

      &.drag-over {
        border-color: var(--primary-color);
        background-color: rgba(102, 126, 234, 0.1);
      }

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--text-secondary);
        margin-bottom: 10px;
      }

      p {
        color: var(--text-secondary);
        margin: 10px 0;
      }

      button {
        margin-top: 10px;
      }
    }

    .upload-progress {
      margin: 20px 0;
      display: flex;
      align-items: center;
      gap: 10px;

      mat-progress-bar {
        flex: 1;
      }

      span {
        min-width: 50px;
        text-align: right;
        font-weight: 600;
      }
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 20px;

      .image-item {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        aspect-ratio: 1;
        background-color: var(--background-color);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          opacity: 0;
          transition: opacity 0.3s ease;

          button {
            color: white;

            &.active {
              color: #ffc107;
            }
          }
        }

        &:hover .image-overlay {
          opacity: 1;
        }

        .main-badge {
          position: absolute;
          top: 5px;
          right: 5px;
          background-color: #ffc107;
          color: #000;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
      }
    }

    .no-images {
      text-align: center;
      color: var(--text-secondary);
      padding: 40px 20px;
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
  `]
})
export class PlaceDetailComponent implements OnInit {
  activeCategories: Category[] = [];
  categoriesLoading = false;
  categoriesLoadError = false;
  private categoryKeyByLegacy: Record<string, string> = {};
  placeForm!: FormGroup;
  place: Place = {
    name: '',
    description: '',
    category: 'restaurant',
    location: { latitude: 0, longitude: 0, address: '' },
    images: [],
    verified: false,
    rating: 0,
    reviewCount: 0
  };
  loading = false;
  isNew = true;
  uploadProgress = 0;
  placeId = '';
  availableCities: string[] = [];
  
  // Bandera para prevenir múltiples guardados
  private isSaving = false;
  
  // Archivos pendientes de subir (para lugares nuevos)
  private pendingFiles: File[] = [];

  departmentsCities: { [key: string]: string[] } = {
    'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia'],
    'Bogotá D.C.': ['Bogotá'],
    'Antioquia': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro'],
    'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá'],
    'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta'],
    'Bolívar': ['Cartagena', 'Magangué', 'Turbaco'],
    'Cundinamarca': ['Soacha', 'Facatativá', 'Zipaquirá', 'Chía', 'Mosquera']
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private placesService: PlacesManagementService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar
  ) {
    this.placeForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      category: ['restaurant', Validators.required],
      latitude: [0, Validators.required],
      longitude: [0, Validators.required],
      address: ['', Validators.required],
      department: ['', Validators.required],
      city: ['', Validators.required],
      sector: ['']
    });
  }

  onDepartmentChange(department: string): void {
    this.availableCities = this.departmentsCities[department] || [];
    
    const cityControl = this.placeForm.get('city');
    if (department && this.availableCities.length > 0) {
      cityControl?.enable();
      if (this.isNew) {
        this.placeForm.patchValue({ city: this.availableCities[0] });
      }
    } else {
      cityControl?.disable();
      this.placeForm.patchValue({ city: '' });
    }
  }

  ngOnInit(): void {
    this.loadActiveCategories();
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isNew = false;
        this.placeId = params['id'];
        this.loadPlace();
      }
    });
  }

  private loadActiveCategories(): void {
    this.categoriesLoading = true;
    this.categoriesLoadError = false;

    this.categoryService.getActiveCategories().subscribe({
      next: (res) => {
        this.activeCategories = (res.data as Category[]) || [];
        this.rebuildLegacyCategoryMap();
        this.categoriesLoading = false;
        if (!this.activeCategories.length) {
          this.applyLegacyCategoryFallback();
        }
      },
      error: (err: unknown) => {
        console.error('Error loading active categories:', err);
        this.categoriesLoading = false;
        this.categoriesLoadError = true;
        this.applyLegacyCategoryFallback();
      }
    });
  }

  private rebuildLegacyCategoryMap(): void {
    const keyByName: Record<string, string> = {};
    for (const c of this.activeCategories) {
      keyByName[c.name] = this.getCategoryKey(c);
    }

    // Legacy keys used previously in the app/admin
    const candidate = {
      restaurant: 'Restaurantes',
      cafe: 'Café',
      bar: 'Bar',
      hotel: 'Hoteles',
      attraction: 'Atracciones Turísticas',
      other: 'uncategorized',
      uncategorized: 'uncategorized'
    } as Record<string, string>;

    const map: Record<string, string> = {};
    for (const [legacy, display] of Object.entries(candidate)) {
      if (display === 'uncategorized') {
        map[legacy] = 'uncategorized';
        continue;
      }
      if (keyByName[display]) map[legacy] = keyByName[display];
    }
    this.categoryKeyByLegacy = map;
  }

  private applyLegacyCategoryFallback(): void {
    // Minimal fallback so the select is always usable even if API fails.
    this.activeCategories = [
      { _id: 'legacy_restaurantes', name: 'Restaurantes', icon: 'restaurant', color: '#f44336', isActive: true, placeCount: 0, createdBy: { _id: '', username: '', email: '' }, createdAt: '', updatedAt: '' } as Category,
      { _id: 'legacy_atracciones', name: 'Atracciones Turísticas', icon: 'landscape', color: '#4caf50', isActive: true, placeCount: 0, createdBy: { _id: '', username: '', email: '' }, createdAt: '', updatedAt: '' } as Category,
      { _id: 'legacy_hoteles', name: 'Hoteles', icon: 'hotel', color: '#2196f3', isActive: true, placeCount: 0, createdBy: { _id: '', username: '', email: '' }, createdAt: '', updatedAt: '' } as Category,
      { _id: 'legacy_otros', name: 'Otro', icon: 'category', color: '#607d8b', isActive: true, placeCount: 0, createdBy: { _id: '', username: '', email: '' }, createdAt: '', updatedAt: '' } as Category
    ];
    this.rebuildLegacyCategoryMap();
  }

  private normalizeCategoryValue(value: string): string {
    if (!value) return value;
    if (this.categoryKeyByLegacy[value]) return this.categoryKeyByLegacy[value];

    // If value equals a category name, normalize to its key
    const matchByName = this.activeCategories.find(c => c.name === value);
    if (matchByName) return this.getCategoryKey(matchByName);

    return value;
  }

  getCategoryKey(category: Category): string {
    return (category as any).slug || (category as any).key || category.name;
  }

  loadPlace(): void {
    this.loading = true;
    
    // Cargar lugar real desde el servicio
    this.placesService.getPlaceById(this.placeId).subscribe({
      next: (response) => {
        const placeData = response.data;
        
        // Cargar ciudades del departamento si existe
        if (placeData.department) {
          this.availableCities = this.departmentsCities[placeData.department] || [];
        }
        
        this.placeForm.patchValue({
          name: placeData.name,
          description: placeData.description || '',
          category: this.normalizeCategoryValue(placeData.category),
          latitude: placeData.coordinates?.coordinates[1] || 0,
          longitude: placeData.coordinates?.coordinates[0] || 0,
          address: placeData.address || '',
          department: placeData.department || '',
          city: placeData.city || '',
          sector: placeData.sector || ''
        });
        
        // Convertir imágenes al formato esperado
        console.log('Official Images from backend:', placeData.officialImages);
        this.place.images = (placeData.officialImages || []).map((img: string, index: number) => {
          // Si la imagen ya tiene el protocolo http, usarla tal cual
          const imageUrl = img.startsWith('http') ? img : `http://localhost:5000${img}`;
          console.log('Image URL:', imageUrl);
          return {
            id: `${index}`,
            url: imageUrl,
            isMain: index === 0,
            uploadedAt: new Date()
          };
        });
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading place:', error);
        this.showMessage('Error al cargar el lugar', 'error');
        this.loading = false;
        this.goBack();
      }
    });
  }

  savePlace(): void {
    console.log('🔵 savePlace() llamado - isSaving:', this.isSaving, 'loading:', this.loading);
    
    // PROTECCIÓN TRIPLE contra múltiples guardados
    if (this.isSaving || this.loading) {
      console.warn('⚠️ GUARDADO YA EN PROGRESO - Ignorando llamada duplicada');
      return;
    }

    if (this.placeForm.invalid) {
      this.showMessage('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    // Marcar como guardando INMEDIATAMENTE
    this.isSaving = true;
    this.loading = true;
    
    const formValue = this.placeForm.value;
    const placeData = {
      name: formValue.name,
      category: formValue.category,
      description: formValue.description,
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      address: formValue.address,
      department: formValue.department,
      city: formValue.city,
      sector: formValue.sector
    };

    console.log('💾 Guardando lugar:', this.isNew ? 'CREAR' : 'ACTUALIZAR', placeData);

    // Si es nuevo, crear. Si no, actualizar
    const operation = this.isNew 
      ? this.placesService.createPlace(placeData)
      : this.placesService.updatePlace(this.placeId, placeData);

    operation.subscribe({
      next: (response) => {
        console.log('✅ Respuesta del servidor:', response);
        const wasNew = this.isNew;
        
        // Si era nuevo y hay imágenes pendientes, subirlas
        if (wasNew && this.pendingFiles.length > 0) {
          const newPlaceId = response.data._id;
          console.log(`📤 Subiendo ${this.pendingFiles.length} imágenes pendientes al lugar ${newPlaceId}...`);
          
          this.uploadPendingImages(newPlaceId).then(() => {
            this.showMessage(
              `Lugar creado con ${this.pendingFiles.length} imagen(es) exitosamente`, 
              'success'
            );
            this.loading = false;
            this.isSaving = false;
            this.router.navigate(['/dashboard/places']);
          }).catch((error) => {
            console.error('❌ Error subiendo imágenes:', error);
            this.showMessage('Lugar creado pero algunas imágenes fallaron', 'warning');
            this.loading = false;
            this.isSaving = false;
            this.router.navigate(['/dashboard/places']);
          });
        } else {
          this.showMessage(
            this.isNew ? 'Lugar creado exitosamente' : 'Lugar actualizado exitosamente', 
            'success'
          );
          this.loading = false;
          this.isSaving = false;
          this.router.navigate(['/dashboard/places']);
        }
      },
      error: (error) => {
        console.error('❌ Error al guardar lugar:', error);
        this.showMessage(error.error?.message || 'Error al guardar lugar', 'error');
        this.loading = false;
        this.isSaving = false;
      }
    });
  }

  private uploadPendingImages(placeId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.pendingFiles.length === 0) {
        resolve();
        return;
      }

      let uploadedCount = 0;
      let hasError = false;

      this.pendingFiles.forEach((file, index) => {
        this.uploadProgress = Math.round(((index) / this.pendingFiles.length) * 100);
        
        this.placesService.uploadPlaceImage(placeId, file).subscribe({
          next: (response) => {
            uploadedCount++;
            console.log(`✅ Imagen ${uploadedCount}/${this.pendingFiles.length} subida:`, response);
            
            this.uploadProgress = Math.round((uploadedCount / this.pendingFiles.length) * 100);
            
            if (uploadedCount === this.pendingFiles.length) {
              this.uploadProgress = 0;
              this.pendingFiles = [];
              if (hasError) {
                reject(new Error('Algunas imágenes fallaron'));
              } else {
                resolve();
              }
            }
          },
          error: (error: any) => {
            console.error(`❌ Error subiendo imagen ${index + 1}:`, error);
            hasError = true;
            uploadedCount++;
            
            if (uploadedCount === this.pendingFiles.length) {
              this.uploadProgress = 0;
              this.pendingFiles = [];
              reject(error);
            }
          }
        });
      });
    });
  }

  parseGoogleCoordinates(coords: string): void {
    if (!coords || coords.trim() === '') return;

    // Limpiar espacios y separar por coma
    const parts = coords.trim().split(',').map(p => p.trim());
    
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);

      if (!isNaN(lat) && !isNaN(lng)) {
        this.placeForm.patchValue({
          latitude: lat,
          longitude: lng
        });
        this.showMessage('Coordenadas cargadas correctamente', 'success');
      } else {
        this.showMessage('Formato de coordenadas inválido', 'error');
      }
    } else {
      this.showMessage('Formato incorrecto. Usa: latitud, longitud', 'error');
    }
  }

  showMessage(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/places']);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files) {
      this.uploadFiles(files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.uploadFiles(input.files);
    }
  }

  uploadFiles(files: FileList): void {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      this.showMessage('No se seleccionaron imágenes válidas', 'error');
      return;
    }

    // Si es un lugar nuevo, guardar archivos para subir después
    if (this.isNew) {
      console.log(`📦 Guardando ${fileArray.length} imágenes para subir después de crear el lugar`);
      
      fileArray.forEach((file) => {
        this.pendingFiles.push(file);
        
        // Crear preview local
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const newImage: PlaceImage = {
            id: `pending_${Date.now()}_${Math.random()}`,
            url: e.target.result,
            isMain: this.place.images.length === 0,
            uploadedAt: new Date()
          };
          this.place.images.push(newImage);
        };
        reader.readAsDataURL(file);
      });
      
      this.showMessage(`${fileArray.length} imagen(es) lista(s) para subir`, 'success');
      return;
    }

    // Si el lugar ya existe, subir inmediatamente
    console.log(`📤 Subiendo ${fileArray.length} imágenes...`);
    let uploadedCount = 0;

    fileArray.forEach((file, index) => {
      this.uploadProgress = Math.round(((index) / fileArray.length) * 100);
      
      this.placesService.uploadPlaceImage(this.placeId, file).subscribe({
        next: (response) => {
          uploadedCount++;
          console.log(`✅ Imagen ${uploadedCount}/${fileArray.length} subida:`, response);
          
          // Agregar imagen a la vista
          const newImage: PlaceImage = {
            id: response.data.path,
            url: `http://localhost:5000${response.data.path}`,
            isMain: this.place.images.length === 0,
            uploadedAt: new Date()
          };
          this.place.images.push(newImage);
          
          this.uploadProgress = Math.round((uploadedCount / fileArray.length) * 100);
          
          if (uploadedCount === fileArray.length) {
            this.showMessage(`${uploadedCount} imagen(es) subida(s) exitosamente`, 'success');
            setTimeout(() => {
              this.uploadProgress = 0;
            }, 1000);
          }
        },
        error: (error) => {
          console.error(`❌ Error subiendo imagen ${index + 1}:`, error);
          this.showMessage(`Error subiendo imagen: ${error.error?.message || 'Error desconocido'}`, 'error');
          this.uploadProgress = 0;
        }
      });
    });
  }

  setMainImage(image: PlaceImage): void {
    this.place.images.forEach(img => img.isMain = false);
    image.isMain = true;
  }

  deleteImage(image: PlaceImage): void {
    if (!this.placeId || this.isNew) {
      this.showMessage('No se puede eliminar la imagen', 'error');
      return;
    }

    const snackBarRef = this.snackBar.open(
      '¿Eliminar esta imagen?',
      'ELIMINAR',
      {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-warning']
      }
    );

    snackBarRef.onAction().subscribe(() => {
      // El ID de la imagen es la ruta completa (ej: /uploads/places/xxx.avif)
      // Extraer solo la ruta relativa si es una URL completa
      let imagePath = image.id;
      if (imagePath.startsWith('http://localhost:5000')) {
        imagePath = imagePath.replace('http://localhost:5000', '');
      }
      
      console.log('🗑️ Eliminando imagen:', imagePath);
      
      this.placesService.deletePlaceImage(this.placeId, imagePath).subscribe({
        next: (response) => {
          console.log('✅ Imagen eliminada:', response);
          this.place.images = this.place.images.filter(img => img.id !== image.id);
          
          if (this.place.images.length > 0 && !this.place.images.some(img => img.isMain)) {
            this.place.images[0].isMain = true;
          }
          
          this.showMessage('Imagen eliminada exitosamente', 'success');
        },
        error: (error) => {
          console.error('❌ Error eliminando imagen:', error);
          this.showMessage(`Error: ${error.error?.message || 'No se pudo eliminar'}`, 'error');
        }
      });
    });
  }

  onImageError(event: Event, image: PlaceImage): void {
    console.error('Error loading image:', image.url);
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
  }
}
