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
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-badges',
  standalone: true,
  imports: [
    CommonModule,
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
    MatDialogModule,
    MatCardModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="badges-container">
      <div class="header">
        <h1>Insignias y Logros</h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Nueva Insignia
          </button>
          <button mat-raised-button (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
        </div>
      </div>

      <div class="badges-grid">
        <mat-card *ngFor="let badge of badges" class="badge-card">
          <mat-card-header>
            <div class="badge-icon">{{ badge.icon }}</div>
          </mat-card-header>
          <mat-card-content>
            <h3>{{ badge.name }}</h3>
            <p>{{ badge.description }}</p>
          </mat-card-content>
          <mat-card-footer>
            <button mat-icon-button (click)="editBadge(badge)" matTooltip="Editar">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button (click)="deleteBadge(badge)" matTooltip="Eliminar">
              <mat-icon>delete</mat-icon>
            </button>
          </mat-card-footer>
        </mat-card>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Cargando insignias...</p>
      </div>

      <div *ngIf="badges.length === 0 && !loading" class="empty-state">
        <mat-icon>emoji_events</mat-icon>
        <p>No hay insignias creadas</p>
      </div>
    </div>
  `,
  styleUrls: ['./badges.component.scss']
})
export class BadgesComponent implements OnInit {
  badges: Badge[] = [];
  loading = false;

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadBadges();
  }

  loadBadges(): void {
    this.loading = true;
    this.adminService.getBadges().subscribe({
      next: (data: any) => {
        this.badges = data.data || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading badges:', err);
        this.loading = false;
      }
    });
  }

  refreshData(): void {
    this.loadBadges();
  }

  openCreateDialog(): void {
    alert('Crear nueva insignia - Funcionalidad en desarrollo');
  }

  editBadge(badge: Badge): void {
    alert(`Editar insignia: ${badge.name}`);
  }

  deleteBadge(badge: Badge): void {
    if (confirm(`¿Eliminar insignia "${badge.name}"?`)) {
      alert('Insignia eliminada - Funcionalidad en desarrollo');
    }
  }
}
