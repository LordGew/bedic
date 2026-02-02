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
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlacesManagementService, Place } from '../../core/services/places-management.service';

interface PlaceForm {
  name: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  department: string;
  city: string;
  sector: string;
}

@Component({
  selector: 'app-places-management-full',
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
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './places-management-full.component.html',
  styleUrls: ['./places-management-full.component.scss']
})
export class PlacesManagementFullComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Datos
  dataSource = new MatTableDataSource<Place>([]);
  displayedColumns: string[] = ['name', 'category', 'city', 'verified', 'images', 'actions'];
  
  // Formulario
  placeForm!: FormGroup;
  editMode = false;
  currentPlaceId: string | null = null;
  showForm = false;

  // Estados
  loading = false;
  uploadingImage = false;
  
  // Filtros
  searchQuery = '';
  filterDepartment = '';
  filterCity = '';
  filterCategory = '';
  filterVerified: boolean | null = null;

  // Estadísticas
  stats = {
    total: 0,
    verified: 0,
    unverified: 0,
    byCity: [] as { city: string; count: number }[]
  };

  // Datos de selección
  departments: string[] = [];
  availableCities: string[] = [];
  selectedImages: File[] = [];

  departmentsCities: { [key: string]: string[] } = {
    'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia'],
    'Bogotá D.C.': ['Bogotá'],
    'Antioquia': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro'],
    'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá'],
    'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta'],
    'Bolívar': ['Cartagena', 'Magangué', 'Turbaco'],
    'Cundinamarca': ['Soacha', 'Facatativá', 'Zipaquirá', 'Chía', 'Mosquera']
  };

  categories = [
    { value: 'restaurant', label: 'Restaurante' },
    { value: 'cafe', label: 'Cafetería' },
    { value: 'bar', label: 'Bar' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'park', label: 'Parque' },
    { value: 'museum', label: 'Museo' },
    { value: 'cinema', label: 'Cine' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'pharmacy', label: 'Farmacia' },
    { value: 'bank', label: 'Banco' },
    { value: 'supermarket', label: 'Supermercado' },
    { value: 'mall', label: 'Centro Comercial' },
    { value: 'gym', label: 'Gimnasio' },
    { value: 'library', label: 'Biblioteca' },
    { value: 'store', label: 'Tienda' }
  ];

  constructor(
    private fb: FormBuilder,
    private placesService: PlacesManagementService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.departments = Object.keys(this.departmentsCities);
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
      latitude: [10.9685, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [-74.7813, [Validators.required, Validators.min(-180), Validators.max(180)]],
      address: ['', Validators.required],
      department: ['Atlántico', Validators.required],
      city: ['Barranquilla', Validators.required],
      sector: ['']
    });

    // Cargar ciudades iniciales
    this.onDepartmentChange('Atlántico');
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
        this.showMessage('Error al cargar lugares', 'error');
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

  onDepartmentChange(department: string): void {
    this.availableCities = this.departmentsCities[department] || [];
    if (this.editMode) {
      // No resetear ciudad si estamos editando
      return;
    }
    this.placeForm.patchValue({ city: this.availableCities[0] || '' });
  }

  openForm(place?: Place): void {
    this.showForm = true;
    if (place) {
      this.editMode = true;
      this.currentPlaceId = place._id || null;
      
      // Cargar ciudades del departamento
      if (place.department) {
        this.availableCities = this.departmentsCities[place.department] || [];
      }

      this.placeForm.patchValue({
        name: place.name,
        category: place.category,
        description: place.description,
        latitude: place.coordinates?.coordinates[1] || 0,
        longitude: place.coordinates?.coordinates[0] || 0,
        address: place.address,
        department: place.department,
        city: place.city,
        sector: place.sector
      });
    } else {
      this.editMode = false;
      this.currentPlaceId = null;
      this.placeForm.reset({
        latitude: 10.9685,
        longitude: -74.7813,
        department: 'Atlántico',
        city: 'Barranquilla'
      });
      this.onDepartmentChange('Atlántico');
    }
    this.selectedImages = [];
  }

  closeForm(): void {
    this.showForm = false;
    this.editMode = false;
    this.currentPlaceId = null;
    this.placeForm.reset();
    this.selectedImages = [];
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Validar tamaño (máx 5MB por imagen)
      const maxSize = 5 * 1024 * 1024;
      const validFiles: File[] = [];

      for (let i = 0; i < files.length; i++) {
        if (files[i].size > maxSize) {
          this.showMessage(`La imagen ${files[i].name} excede el tamaño máximo de 5MB`, 'error');
        } else if (!files[i].type.startsWith('image/')) {
          this.showMessage(`${files[i].name} no es una imagen válida`, 'error');
        } else {
          validFiles.push(files[i]);
        }
      }

      this.selectedImages = [...this.selectedImages, ...validFiles];
      
      if (validFiles.length > 0) {
        this.showMessage(`${validFiles.length} imagen(es) seleccionada(s)`, 'success');
      }
    }
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
  }

  async savePlace(): Promise<void> {
    if (this.placeForm.invalid) {
      this.showMessage('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    this.loading = true;
    const formData = this.placeForm.value;

    const placeData = {
      name: formData.name,
      category: formData.category,
      description: formData.description,
      latitude: formData.latitude,
      longitude: formData.longitude,
      address: formData.address,
      department: formData.department,
      city: formData.city,
      sector: formData.sector
    };

    if (this.editMode && this.currentPlaceId) {
      // Actualizar lugar existente
      this.placesService.updatePlace(this.currentPlaceId, placeData).subscribe({
        next: async (response) => {
          this.showMessage('Lugar actualizado exitosamente', 'success');
          
          // Subir imágenes si hay
          if (this.selectedImages.length > 0) {
            await this.uploadImages(this.currentPlaceId!);
          }
          
          this.closeForm();
          this.loadPlaces();
          this.loadStats();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating place:', error);
          this.showMessage('Error al actualizar lugar', 'error');
          this.loading = false;
        }
      });
    } else {
      // Crear nuevo lugar
      this.placesService.createPlace(placeData).subscribe({
        next: async (response) => {
          this.showMessage('Lugar creado exitosamente', 'success');
          const placeId = response.data._id;
          
          // Subir imágenes si hay
          if (this.selectedImages.length > 0 && placeId) {
            await this.uploadImages(placeId);
          }
          
          this.closeForm();
          this.loadPlaces();
          this.loadStats();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating place:', error);
          this.showMessage(error.error?.message || 'Error al crear lugar', 'error');
          this.loading = false;
        }
      });
    }
  }

  async uploadImages(placeId: string): Promise<void> {
    this.uploadingImage = true;
    
    for (const image of this.selectedImages) {
      try {
        await this.placesService.uploadPlaceImage(placeId, image).toPromise();
      } catch (error) {
        console.error('Error uploading image:', error);
        this.showMessage(`Error al subir imagen ${image.name}`, 'error');
      }
    }
    
    this.uploadingImage = false;
    this.showMessage('Imágenes subidas exitosamente', 'success');
  }

  deletePlace(place: Place): void {
    if (!confirm(`¿Estás seguro de eliminar "${place.name}"?`)) {
      return;
    }

    if (!place._id) return;

    this.loading = true;
    this.placesService.deletePlace(place._id).subscribe({
      next: () => {
        this.showMessage('Lugar eliminado exitosamente', 'success');
        this.loadPlaces();
        this.loadStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error deleting place:', error);
        this.showMessage('Error al eliminar lugar', 'error');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadPlaces();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.filterDepartment = '';
    this.filterCity = '';
    this.filterCategory = '';
    this.filterVerified = null;
    this.loadPlaces();
  }

  getCategoryLabel(value: string): string {
    const category = this.categories.find(c => c.value === value);
    return category ? category.label : value;
  }

  showMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }
}
