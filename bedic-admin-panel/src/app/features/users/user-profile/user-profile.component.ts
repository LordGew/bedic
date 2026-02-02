import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { LanguageService } from '../../../core/services/language.service';

@Pipe({
  name: 'translate',
  standalone: true
})
export class TranslatePipe implements PipeTransform {
  constructor(private languageService: LanguageService) {}
  transform(key: string): string {
    return this.languageService.translate(key);
  }
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="profile-container">
      <div *ngIf="loading" class="loading">{{ 'user_profile.loading' | translate }}</div>

      <div *ngIf="!loading && user" class="profile-card">
        <div class="profile-header">
          <div class="profile-avatar">
            <img *ngIf="user.avatar" [src]="user.avatar" alt="{{ user.name }}" />
            <div *ngIf="!user.avatar" class="avatar-placeholder">
              {{ user.name?.charAt(0)?.toUpperCase() }}
            </div>
          </div>
          <div class="profile-info">
            <h1>{{ user.name || user.username }}</h1>
            <p class="email">{{ user.email }}</p>
            <div class="badges">
              <span class="role-badge" [ngClass]="'role-' + user.role">{{ user.role }}</span>
              <span *ngIf="user.isBanned" class="status-badge banned">{{ 'user_profile.banned' | translate }}</span>
              <span *ngIf="user.isMuted && !user.isBanned" class="status-badge muted">{{ 'user_profile.muted' | translate }}</span>
              <span *ngIf="!user.isBanned && !user.isMuted" class="status-badge active">{{ 'user_profile.active' | translate }}</span>
            </div>
          </div>
        </div>

        <div class="profile-details">
          <div class="detail-row">
            <span class="label">{{ 'user_profile.username' | translate }}</span>
            <span class="value">{{ user.username || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'user_profile.internal_id' | translate }}</span>
            <span class="value">{{ user._id || user.id }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'user_profile.email' | translate }}</span>
            <span class="value">{{ user.email }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'user_profile.role' | translate }}</span>
            <span class="value">{{ user.role }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'user_profile.status' | translate }}</span>
            <span class="value">
              <span *ngIf="user.isBanned" class="status-badge banned">{{ 'user_profile.banned' | translate }}</span>
              <span *ngIf="user.isMuted && !user.isBanned" class="status-badge muted">{{ 'user_profile.muted' | translate }}</span>
              <span *ngIf="!user.isBanned && !user.isMuted" class="status-badge active">{{ 'user_profile.active' | translate }}</span>
            </span>
          </div>
          <div class="detail-row" *ngIf="user.isBanned">
            <span class="label">{{ 'user_profile.ban_reason' | translate }}</span>
            <span class="value">{{ user.banReason || ('user_profile.not_specified' | translate) }}</span>
          </div>
          <div class="detail-row" *ngIf="user.isMuted">
            <span class="label">{{ 'user_profile.muted_until' | translate }}</span>
            <span class="value">{{ user.muted_until || user.muteUntil | date:'medium' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'user_profile.created' | translate }}</span>
            <span class="value">{{ user.createdAt | date:'medium' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'user_profile.updated' | translate }}</span>
            <span class="value">{{ user.updatedAt | date:'medium' }}</span>
          </div>
          <div class="detail-row" *ngIf="user.bio">
            <span class="label">{{ 'user_profile.bio' | translate }}</span>
            <span class="value">{{ user.bio }}</span>
          </div>
          <div class="detail-row" *ngIf="user.location">
            <span class="label">{{ 'user_profile.location' | translate }}</span>
            <span class="value">{{ user.location }}</span>
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat">
            <span class="stat-value">{{ userStats.totalPlaces }}</span>
            <span class="stat-label">{{ 'user_profile.places' | translate }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ userStats.totalReviews }}</span>
            <span class="stat-label">{{ 'user_profile.reviews' | translate }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ userStats.averageRating | number:'1.1-1' }}</span>
            <span class="stat-label">{{ 'user_profile.rating' | translate }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ userStats.reportsCount }}</span>
            <span class="stat-label">{{ 'user_profile.reports' | translate }}</span>
          </div>
        </div>

        <div class="profile-actions">
          <button (click)="goBack()" class="btn-secondary">{{ 'user_profile.back' | translate }}</button>
          <button (click)="editUser()" class="btn-primary">{{ 'user_profile.edit' | translate }}</button>
        </div>
      </div>

      <div *ngIf="!loading && !user" class="error">
        {{ 'user_profile.error' | translate }}
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
    }

    .loading, .error {
      text-align: center;
      padding: 40px;
      font-size: 16px;
      color: var(--text-secondary);
    }

    .error {
      color: var(--error-color);
    }

    .profile-card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .profile-header {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .profile-avatar {
      flex-shrink: 0;
    }

    .profile-avatar img,
    .avatar-placeholder {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background-color: var(--primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      font-weight: bold;
      color: white;
    }

    .profile-info {
      flex: 1;
    }

    .profile-info h1 {
      margin: 0 0 5px 0;
      font-size: 28px;
      color: var(--text-primary);
    }

    .profile-info .email {
      margin: 0 0 10px 0;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .role-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .role-badge.role-admin {
      background-color: #ff6b6b;
      color: white;
    }

    .role-badge.role-moderator {
      background-color: #4ecdc4;
      color: white;
    }

    .role-badge.role-user {
      background-color: #95e1d3;
      color: #333;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-badge.active {
      background-color: #51cf66;
      color: white;
    }

    .status-badge.muted {
      background-color: #ffd43b;
      color: #333;
    }

    .status-badge.banned {
      background-color: #ff6b6b;
      color: white;
    }

    .profile-details {
      margin-bottom: 30px;
    }

    .detail-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-row .label {
      font-weight: 600;
      color: var(--text-secondary);
      min-width: 150px;
    }

    .detail-row .value {
      color: var(--text-primary);
      flex: 1;
      word-break: break-all;
    }

    .profile-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
      padding: 20px;
      background-color: var(--background-color);
      border-radius: 8px;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 24px;
      font-weight: bold;
      color: var(--primary-color);
      margin-bottom: 5px;
    }

    .stat-label {
      display: block;
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    .profile-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-primary {
      background-color: var(--primary-color);
      color: white;
    }

    .btn-primary:hover {
      background-color: var(--primary-dark);
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
      background-color: var(--secondary-color);
      color: white;
    }

    .btn-secondary:hover {
      opacity: 0.8;
    }

    @media (max-width: 600px) {
      .profile-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .profile-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .detail-row {
        flex-direction: column;
      }

      .detail-row .label {
        min-width: auto;
        margin-bottom: 5px;
      }
    }
  `]
})
export class UserProfileComponent implements OnInit {
  user: any;
  loading = true;
  userStats = {
    totalPlaces: 0,
    totalReviews: 0,
    averageRating: 0,
    reportsCount: 0
  };

  private toAbsoluteAssetUrl(raw?: string | null): string | null {
    if (!raw) return null;
    const s = String(raw);
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) return s;
    const base = this.admin.getBackendBaseUrl();
    if (s.startsWith('/')) return `${base}${s}`;
    return `${base}/${s}`;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private admin: AdminService
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUserProfile(userId);
      this.loadUserStats(userId);
    }
  }

  loadUserProfile(userId: string): void {
    this.loading = true;
    this.admin.getUserById(userId).subscribe({
      next: (user: any) => {
        const mutedUntil = user?.muted_until || user?.muteUntil;
        const isMuted = user?.isMuted ?? (mutedUntil ? new Date(mutedUntil).getTime() > Date.now() : false);
        const rawAvatar = user?.avatar || user?.avatar_url;
        this.user = {
          ...user,
          id: user?._id || user?.id,
          avatar: this.toAbsoluteAssetUrl(rawAvatar),
          muted_until: mutedUntil,
          muteUntil: mutedUntil,
          isMuted,
        };
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading user profile:', err);
        this.loading = false;
      }
    });
  }

  loadUserStats(userId: string): void {
    this.admin.getUserStats(userId).subscribe({
      next: (stats: any) => {
        this.userStats = {
          totalPlaces: stats.totalPlaces || 0,
          totalReviews: stats.totalReviews || 0,
          averageRating: stats.averageRating || 0,
          reportsCount: stats.reportsCount || 0
        };
      },
      error: (err: any) => {
        console.error('Error loading user stats:', err);
        this.userStats = {
          totalPlaces: 0,
          totalReviews: 0,
          averageRating: 0,
          reportsCount: 0
        };
      }
    });
  }

  editUser(): void {
    const userId = this.user._id || this.user.id;
    if (userId) {
      this.router.navigate(['/dashboard/users', userId, 'edit']);
    }
  }

  goBack(): void {
    window.history.back();
  }
}
