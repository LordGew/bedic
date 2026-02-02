import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Category } from '../category.model';
import { CategoryService } from '../category.service';
import { CategoryFormComponent } from '../category-form/category-form.component';
import { CategoryDeleteComponent } from '../category-delete/category-delete.component';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  templateUrl: './categories-list.component.html',
  styleUrls: ['./categories-list.component.scss']
})
export class CategoriesListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'description', 'icon', 'color', 'placeCount', 'isActive', 'actions'];
  dataSource: Category[] = [];
  isLoading = false;
  totalItems = 0;
  pageSize = 10;
  currentPage = 1;
  searchTerm = '';
  filterActive: boolean | null = true;

  constructor(
    private categoryService: CategoryService,
    private dialog: MatDialog,
    public languageService: LanguageService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    if (this.filterActive !== null) {
      params.isActive = this.filterActive;
    }

    this.categoryService.getCategories(params.page, params.limit, params.search, params.isActive)
      .subscribe({
        next: (response) => {
          this.dataSource = response.data as Category[];
          this.totalItems = response.pagination?.total || 0;
          this.isLoading = false;
        },
        error: (error: unknown) => {
          console.error('Error loading categories:', error);
          this.isLoading = false;
        }
      });
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.currentPage = 1;
    this.loadCategories();
  }

  onFilterChange(filterActive: boolean | null): void {
    this.filterActive = filterActive;
    this.currentPage = 1;
    this.loadCategories();
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadCategories();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CategoryFormComponent, {
      width: '500px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  openEditDialog(category: Category): void {
    const dialogRef = this.dialog.open(CategoryFormComponent, {
      width: '500px',
      data: { mode: 'edit', category }
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  openDeleteDialog(category: Category): void {
    const dialogRef = this.dialog.open(CategoryDeleteComponent, {
      width: '400px',
      data: category
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  toggleCategoryStatus(category: Category): void {
    const action = category.isActive ? 'desactivada' : 'activada';
    const successMessage = `Categoría ${action} exitosamente`;
    
    this.categoryService.updateCategory(category._id, { isActive: !category.isActive })
      .subscribe({
        next: () => {
          this.snackBar.open(successMessage, 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.loadCategories();
        },
        error: (error: unknown) => {
          console.error('Error updating category status:', error);
          this.snackBar.open('Error al actualizar el estado de la categoría', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['snackbar-error']
          });
        }
      });
  }

  getColorPreview(color: string): string {
    return color || '#1976d2';
  }

  getIconPreview(icon: string): string {
    return icon || 'category';
  }
}
