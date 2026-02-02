import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

interface UserData {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  badges: string[];
  level: number;
  isVerified: boolean;
  isBanned: boolean;
  isMuted: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
    MatTabsModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['name', 'username', 'email', 'role', 'verified', 'status', 'actions'];
  dataSource = new MatTableDataSource<UserData>([]);
  loading = false;
  allUsers: UserData[] = [];

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (data: any) => {
        this.allUsers = data || [];
        this.dataSource.data = this.allUsers;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading users:', err);
        this.loading = false;
      }
    });
  }

  refreshData(): void {
    this.loadUsers();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByRole(role: string): void {
    if (!role) {
      this.dataSource.data = this.allUsers;
    } else {
      this.dataSource.data = this.allUsers.filter(u => u.role === role);
    }
  }

  filterByStatus(status: string): void {
    if (!status) {
      this.dataSource.data = this.allUsers;
    } else {
      this.dataSource.data = this.allUsers.filter(u => {
        if (status === 'active') return !u.isBanned && !u.isMuted;
        if (status === 'banned') return u.isBanned;
        if (status === 'muted') return u.isMuted;
        return false;
      });
    }
  }

  viewProfile(user: UserData): void {
    this.showSnackBar(`Abriendo perfil de ${user.name}`, 'success');
  }

  editProfile(user: UserData): void {
    this.showSnackBar(`Función de edición en desarrollo`, 'warning');
  }

  manageBadges(user: UserData): void {
    this.showSnackBar(`Gestión de insignias para ${user.name}`, 'success');
  }

  viewSavedPlaces(user: UserData): void {
    this.adminService.getUserSavedPlaces(user.id).subscribe({
      next: (data: any) => {
        const count = data.data?.length || 0;
        this.showSnackBar(`${user.name} tiene ${count} lugares guardados`, 'success');
      },
      error: (err: any) => {
        console.error('Error loading saved places:', err);
        this.showSnackBar('Error al cargar lugares guardados', 'error');
      }
    });
  }

  muteUser(user: UserData): void {
    const hours = prompt('¿Cuántas horas silenciar al usuario?', '24');
    if (hours) {
      this.adminService.muteUser(user.id, parseInt(hours)).subscribe({
        next: () => {
          this.loadUsers();
          this.showSnackBar(`${user.name} ha sido silenciado por ${hours} horas`, 'success');
        },
        error: (err: any) => {
          console.error('Error muting user:', err);
          this.showSnackBar('Error al silenciar usuario', 'error');
        }
      });
    }
  }

  banUser(user: UserData): void {
    const reason = prompt('Razón del baneo:');
    if (reason) {
      this.adminService.banUser(user.id, reason).subscribe({
        next: () => {
          this.loadUsers();
          this.showSnackBar(`${user.name} ha sido baneado`, 'success');
        },
        error: (err: any) => {
          console.error('Error banning user:', err);
          this.showSnackBar('Error al banear usuario', 'error');
        }
      });
    }
  }

  private showSnackBar(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }
}
