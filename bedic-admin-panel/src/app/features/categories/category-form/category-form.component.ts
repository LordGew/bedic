import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../category.model';
import { CategoryService } from '../category.service';

export interface CategoryFormData {
  mode: 'create' | 'edit';
  category?: Category;
}

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent implements OnInit {
  categoryForm: FormGroup;
  isLoading = false;
  isEditMode = false;
  predefinedIcons = [
    'restaurant', 'store', 'home', 'business', 'school', 'local_hospital',
    'local_mall', 'local_cafe', 'local_bar', 'local_parking', 'local_gas_station',
    'local_atm', 'local_pharmacy', 'local_grocery_store', 'local_convenience_store',
    'fitness_center', 'sports_bar', 'nightlife', 'theater', 'museum', 'park',
    'beach_access', 'terrain', 'forest', 'landscape', 'category', 'label',
    'bookmark', 'star', 'favorite', 'place', 'location_city', 'apartment'
  ];

  predefinedColors = [
    '#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#f57c00', '#00796b',
    '#c2185b', '#0288d1', '#689f38', '#e64a19', '#455a64', '#5d4037',
    '#6a1b9a', '#00897b', '#2e7d32', '#c62828', '#ad1457', '#4527a0'
  ];

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private dialogRef: MatDialogRef<CategoryFormComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: CategoryFormData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.categoryForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.category) {
      this.patchFormValues();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      icon: ['category', Validators.required],
      color: ['#1976d2', Validators.required],
      isActive: [true]
    });
  }

  patchFormValues(): void {
    if (this.data.category) {
      this.categoryForm.patchValue({
        name: this.data.category.name,
        description: this.data.category.description || '',
        icon: this.data.category.icon,
        color: this.data.category.color,
        isActive: this.data.category.isActive
      });
    }
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const formValue = this.categoryForm.value;

    if (this.isEditMode) {
      const updateData: UpdateCategoryRequest = {
        name: formValue.name,
        description: formValue.description,
        icon: formValue.icon,
        color: formValue.color,
        isActive: formValue.isActive
      };

      this.categoryService.updateCategory(this.data.category!._id, updateData)
        .subscribe({
          next: (response) => {
            this.snackBar.open('Categoría actualizada exitosamente', 'Cerrar', {
              duration: 3000
            });
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.snackBar.open('Error al actualizar categoría', 'Cerrar', {
              duration: 3000
            });
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false;
          }
        });
    } else {
      const createData: CreateCategoryRequest = {
        name: formValue.name,
        description: formValue.description,
        icon: formValue.icon,
        color: formValue.color
      };

      this.categoryService.createCategory(createData)
        .subscribe({
          next: (response) => {
            this.snackBar.open('Categoría creada exitosamente', 'Cerrar', {
              duration: 3000
            });
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.snackBar.open('Error al crear categoría', 'Cerrar', {
              duration: 3000
            });
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false;
          }
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getErrorMessage(field: string): string {
    const control = this.categoryForm.get(field);
    if (control?.errors) {
      if (control.errors['required']) {
        return 'Este campo es requerido';
      }
      if (control.errors['minlength']) {
        return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
      }
      if (control.errors['maxlength']) {
        return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  selectIcon(icon: string): void {
    this.categoryForm.patchValue({ icon });
  }

  selectColor(color: string): void {
    this.categoryForm.patchValue({ color });
  }
}
