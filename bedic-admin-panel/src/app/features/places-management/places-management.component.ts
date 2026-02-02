import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { PlacesManagementService, Place } from '../../core/services/places-management.service';

// Departamentos y ciudades de Colombia
const DEPARTMENTS_CITIES = {
  'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia'],
  'Bogotá D.C.': ['Bogotá'],
  'Antioquia': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro'],
  'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá'],
  'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta'],
  'Bolívar': ['Cartagena', 'Magangué', 'Turbaco'],
  'Cundinamarca': ['Soacha', 'Facatativá', 'Zipaquirá', 'Chía', 'Mosquera']
};

// Categorías de lugares
const CATEGORIES = [
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'cafe', label: 'Cafetería' },
  { value: 'bar', label: 'Bar' },
  { value: 'shop', label: 'Tienda' },
  { value: 'supermarket', label: 'Supermercado' },
  { value: 'shopping_mall', label: 'Centro Comercial' },
  { value: 'bank', label: 'Banco' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'pharmacy', label: 'Farmacia' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'park', label: 'Parque' },
  { value: 'gym', label: 'Gimnasio' },
  { value: 'cinema', label: 'Cine' },
  { value: 'museum', label: 'Museo' },
  { value: 'library', label: 'Biblioteca' },
  { value: 'security', label: 'Seguridad' },
  { value: 'taxi_station', label: 'Estación de Taxis' },
  { value: 'bus_station', label: 'Estación de Buses' },
  { value: 'point_of_interest', label: 'Punto de Interés' }
];

@Component({
  selector: 'app-places-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatCardModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatListModule
  ],
  templateUrl: './places-management.component.html',
  styleUrls: ['./places-management.component.scss']
})
export class PlacesManagementComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Datos
  dataSource = new MatTableDataSource<Place>([]);
  displayedColumns: string[] = ['name', 'category', 'city', 'verified', 'images', 'actions'];
  
  // Estados
  loading = false;
  showForm = false;
  editMode = false;
  
  // Formulario
  placeForm!: FormGroup;
  selectedPlace: Place | null = null;
  
  // Imágenes
  selectedImages: File[] = [];
  imagePreviewUrls: string[] = [];
  uploadingImages = false;
  
  // Filtros
  filterDepartment = '';
  filterCity = '';
  filterCategory = '';
  filterVerified: boolean | null = null;
  searchQuery = '';
  
  // Datos de referencia
  departments = Object.keys(DEPARTMENTS_CITIES);
  cities: string[] = [];
  categories = CATEGORIES;
  
  // Estadísticas
  stats = {
    total: 0,
    verified: 0,
    unverified: 0,
    byCity: [] as any[],
    byCategory: [] as any[]
  };

  constructor(
    private placesService: PlacesManagementService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadPlaces();
    this.loadStats();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  initForm(): void {
    this.placeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      description: [''],
      department: ['Atlántico', Validators.required], // Por defecto Atlántico
      city: ['Barranquilla', Validators.required], // Por defecto Barranquilla
      sector: [''],
      address: [''],
      latitude: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
      verified: [true]
    });

    // Actualizar ciudades cuando cambia el departamento
    this.placeForm.get('department')?.valueChanges.subscribe(dept => {
      this.onDepartmentChange(dept);
    });

    // Inicializar ciudades con Atlántico
    this.onDepartmentChange('Atlántico');
  }

  onDepartmentChange(department: string): void {
    this.cities = DEPARTMENTS_CITIES[department as keyof typeof DEPARTMENTS_CITIES] || [];
    
    // Si la ciudad actual no está en el nuevo departamento, resetear
    const currentCity = this.placeForm.get('city')?.value;
    if (!this.cities.includes(currentCity)) {
      this.placeForm.patchValue({ city: this.cities[0] || '' });
    }
  }

  loadPlaces(): void {
    this.loading = true;
    
    const filters: any = {};
    if (this.filterDepartment) filters.department = this.filterDepartment;
    if (this.filterCity) filters.city = this.filterCity;
    if (this.filterCategory) filters.category = this.filterCategory;
    if (this.filterVerified !== null) filters.verified = this.filterVerified;
    if (this.searchQuery) filters.search = this.searchQuery;

    this.placesService.getPlaces(filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading places:', error);
        this.snackBar.open('Error al cargar lugares', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.placesService.getStats().subscribe({
      next: (response) => {
        this.stats = response.data;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  applyFilters(): void {
    this.loadPlaces();
  }

  resetFilters(): void {
    this.filterDepartment = '';
    this.filterCity = '';
    this.filterCategory = '';
    this.filterVerified = null;
    this.searchQuery = '';
    this.loadPlaces();
  }

  openForm(place?: Place): void {
    this.showForm = true;
    this.editMode = !!place;
    this.selectedPlace = place || null;
    this.selectedImages = [];
    this.imagePreviewUrls = [];

    if (place) {
      // Modo edición
      const [lng, lat] = place.coordinates.coordinates;
      this.placeForm.patchValue({
        name: place.name,
        category: place.category,
        description: place.description || '',
        department: place.department || 'Atlántico',
        city: place.city || 'Barranquilla',
        sector: place.sector || '',
        address: place.address || '',
        latitude: lat,
        longitude: lng,
        verified: place.verified
      });
    } else {
      // Modo creación - valores por defecto
      this.placeForm.reset({
        department: 'Atlántico',
        city: 'Barranquilla',
        verified: true,
        latitude: 10.9685, // Centro de Barranquilla
        longitude: -74.7813
      });
    }
  }

  closeForm(): void {
    this.showForm = false;
    this.editMode = false;
    this.selectedPlace = null;
    this.placeForm.reset();
    this.selectedImages = [];
    this.imagePreviewUrls = [];
  }

  onImageSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Validar tamaño total (máximo 10MB por imagen)
      for (let file of files) {
        if (file.size > 10 * 1024 * 1024) {
          this.snackBar.open(`La imagen ${file.name} es muy grande (máx 10MB)`, 'Cerrar', { duration: 3000 });
          return;
        }
      }

      this.selectedImages = Array.from(files);
      
      // Generar previews
      this.imagePreviewUrls = [];
      this.selectedImages.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.imagePreviewUrls.splice(index, 1);
  }

  async savePlaceAndUploadImages(): Promise<void> {
    if (this.placeForm.invalid) {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading = true;

    try {
      const formValue = this.placeForm.value;
      const placeData = {
        name: formValue.name,
        category: formValue.category,
        description: formValue.description,
        latitude: parseFloat(formValue.latitude),
        longitude: parseFloat(formValue.longitude),
        address: formValue.address,
        city: formValue.city,
        department: formValue.department,
        sector: formValue.sector
      };

      let placeId: string;

      if (this.editMode && this.selectedPlace) {
        // Actualizar lugar existente
        const response = await this.placesService.updatePlace(
          this.selectedPlace._id,
          { ...placeData, verified: formValue.verified }
        ).toPromise();
        
        placeId = this.selectedPlace._id;
        this.snackBar.open('Lugar actualizado exitosamente', 'Cerrar', { duration: 3000 });
      } else {
        // Crear nuevo lugar
        const response = await this.placesService.createPlace(placeData).toPromise();
        placeId = response!.data._id;
        this.snackBar.open('Lugar creado exitosamente', 'Cerrar', { duration: 3000 });
      }

      // Subir imágenes si hay alguna seleccionada
      if (this.selectedImages.length > 0) {
        this.uploadingImages = true;
        
        for (const image of this.selectedImages) {
          try {
            await this.placesService.uploadPlaceImage(placeId, image).toPromise();
          } catch (error) {
            console.error('Error uploading image:', error);
            this.snackBar.open(`Error al subir imagen ${image.name}`, 'Cerrar', { duration: 3000 });
          }
        }
        
        this.uploadingImages = false;
        this.snackBar.open(`${this.selectedImages.length} imagen(es) subida(s) exitosamente`, 'Cerrar', { duration: 3000 });
      }

      this.closeForm();
      this.loadPlaces();
      this.loadStats();
    } catch (error: any) {
      console.error('Error saving place:', error);
      this.snackBar.open(error.error?.message || 'Error al guardar lugar', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  deletePlace(place: Place): void {
    if (confirm(`¿Estás seguro de eliminar "${place.name}"? Esta acción no se puede deshacer.`)) {
      this.loading = true;
      
      this.placesService.deletePlace(place._id).subscribe({
        next: () => {
          this.snackBar.open('Lugar eliminado exitosamente', 'Cerrar', { duration: 3000 });
          this.loadPlaces();
          this.loadStats();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error deleting place:', error);
          this.snackBar.open('Error al eliminar lugar', 'Cerrar', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }

  deleteImage(place: Place, imagePath: string): void {
    if (confirm('¿Eliminar esta imagen?')) {
      this.placesService.deletePlaceImage(place._id, imagePath).subscribe({
        next: () => {
          this.snackBar.open('Imagen eliminada', 'Cerrar', { duration: 2000 });
          this.loadPlaces();
        },
        error: (error) => {
          console.error('Error deleting image:', error);
          this.snackBar.open('Error al eliminar imagen', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  getCategoryLabel(value: string): string {
    const category = this.categories.find(c => c.value === value);
    return category ? category.label : value;
  }

  // Método para obtener coordenadas desde el mapa (integración futura)
  openMapPicker(): void {
    // TODO: Implementar selector de mapa interactivo
    this.snackBar.open('Selector de mapa próximamente disponible', 'Cerrar', { duration: 2000 });
  }
}
