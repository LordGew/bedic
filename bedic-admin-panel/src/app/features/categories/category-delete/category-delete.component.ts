import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { Category } from '../category.model';
import { CategoryService } from '../category.service';

@Component({
  selector: 'app-category-delete',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './category-delete.component.html',
  styleUrls: ['./category-delete.component.scss']
})
export class CategoryDeleteComponent {
  isLoading = false;

  constructor(
    private categoryService: CategoryService,
    private dialogRef: MatDialogRef<CategoryDeleteComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public category: Category
  ) {}

  onConfirm(): void {
    this.isLoading = true;

    this.categoryService.deleteCategory(this.category._id)
      .subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'Categoría eliminada exitosamente', 'Cerrar', {
            duration: 3000
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.snackBar.open('Error al eliminar categoría', 'Cerrar', {
            duration: 3000
          });
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getWarningMessage(): string {
    if (this.category.placeCount > 0) {
      return `Esta categoría tiene ${this.category.placeCount} lugar(es) asociado(s). Al eliminarla, los lugares serán movidos a "uncategorized".`;
    }
    return 'Esta categoría no tiene lugares asociados y será eliminada permanentemente.';
  }

  getConfirmButtonText(): string {
    return this.category.placeCount > 0 ? 'Desactivar y mover lugares' : 'Eliminar permanentemente';
  }
}
