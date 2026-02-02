import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, MatListModule, MatIconModule, MatExpansionModule, RouterLink, TranslatePipe],
  template: `
    <mat-nav-list>
      <mat-list-item routerLink="/dashboard" routerLinkActive="active">
        <mat-icon matListItemIcon>dashboard</mat-icon>
        <span matListItemTitle>{{ 'nav.dashboard' | translate }}</span>
      </mat-list-item>

      <mat-divider></mat-divider>

      <h2 matSubheader>{{ 'nav.moderation' | translate }}</h2>
      <mat-list-item routerLink="/dashboard/appeals" routerLinkActive="active">
        <mat-icon matListItemIcon>gavel</mat-icon>
        <span matListItemTitle>{{ 'nav.appeals' | translate }}</span>
      </mat-list-item>

      <mat-list-item routerLink="/dashboard/reports" routerLinkActive="active">
        <mat-icon matListItemIcon>assessment</mat-icon>
        <span matListItemTitle>{{ 'nav.reports' | translate }}</span>
      </mat-list-item>

      <mat-list-item routerLink="/dashboard/reviews" routerLinkActive="active">
        <mat-icon matListItemIcon>rate_review</mat-icon>
        <span matListItemTitle>{{ 'nav.reviews' | translate }}</span>
      </mat-list-item>

      <mat-list-item routerLink="/dashboard/verifications" routerLinkActive="active">
        <mat-icon matListItemIcon>verified_user</mat-icon>
        <span matListItemTitle>{{ 'nav.verifications' | translate }}</span>
      </mat-list-item>

      <mat-list-item routerLink="/dashboard/announcements" routerLinkActive="active">
        <mat-icon matListItemIcon>campaign</mat-icon>
        <span matListItemTitle>{{ 'announcements.title' | translate }}</span>
      </mat-list-item>

      <mat-divider></mat-divider>

      <h2 matSubheader>{{ 'nav.users' | translate }}</h2>
      
      <mat-list-item routerLink="/dashboard/categories" routerLinkActive="active">
        <mat-icon matListItemIcon>category</mat-icon>
        <span matListItemTitle>{{ 'nav.categories' | translate }}</span>
      </mat-list-item>

      <mat-list-item routerLink="/dashboard/places" routerLinkActive="active">
        <mat-icon matListItemIcon>location_on</mat-icon>
        <span matListItemTitle>{{ 'nav.places' | translate }}</span>
      </mat-list-item>

      <mat-list-item routerLink="/dashboard/users" routerLinkActive="active">
        <mat-icon matListItemIcon>people</mat-icon>
        <span matListItemTitle>{{ 'nav.users' | translate }}</span>
      </mat-list-item>

      <mat-divider></mat-divider>

      <h2 matSubheader>{{ 'nav.system' | translate }}</h2>
      <mat-list-item routerLink="/dashboard/settings" routerLinkActive="active">
        <mat-icon matListItemIcon>settings</mat-icon>
        <span matListItemTitle>{{ 'nav.settings' | translate }}</span>
      </mat-list-item>
    </mat-nav-list>
  `,
  styles: [`
    mat-nav-list {
      padding: 0;
    }

    mat-list-item {
      height: 56px;

      &.active {
        background-color: rgba(102, 126, 234, 0.1);
        color: #667eea;
      }
    }

    h2 {
      padding: 16px 16px 8px 16px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin: 0;
    }

    mat-divider {
      margin: 8px 0;
    }
  `]
})
export class SidebarComponent {}
