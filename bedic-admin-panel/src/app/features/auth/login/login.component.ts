import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <h1>BDIC Admin Panel</h1>
          <p>Inicia sesión para acceder</p>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" required>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput formControlName="password" type="password" required>
            </mat-form-field>

            <div class="error-message" *ngIf="error">{{ error }}</div>

            <button mat-raised-button color="primary" type="submit" [disabled]="loading || form.invalid" class="full-width">
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              <span *ngIf="!loading">Iniciar Sesión</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 40px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }
    .error-message {
      color: red;
      margin-bottom: 20px;
      text-align: center;
    }
    h1 {
      margin: 0;
      text-align: center;
    }
    p {
      text-align: center;
      color: #666;
    }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';

    this.auth.login(this.form.value.email, this.form.value.password)
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err: any) => {
          this.error = err.error?.message || 'Error al iniciar sesión';
          this.loading = false;
        }
      });
  }
}
