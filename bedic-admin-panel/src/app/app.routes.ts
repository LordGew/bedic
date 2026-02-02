import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardEnhancedComponent } from './features/dashboard/dashboard-enhanced.component';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from './core/auth/auth.guard';
import { RoleGuard } from './core/auth/role.guard';
import { APPEALS_ROUTES } from './features/appeals/appeals.routes';
import { USERS_ROUTES } from './features/users/users.routes';
import { UserProfileComponent } from './features/users/user-profile/user-profile.component';
import { UserEditComponent } from './features/users/user-edit/user-edit.component';
import { UserManagementComponent } from './features/users/user-management/user-management.component';
import { PlacesComponent } from './features/places/places.component';
import { PlaceDetailComponent } from './features/places/place-detail/place-detail.component';
import { ReportsComponent } from './features/reports/reports.component';
import { SettingsComponent } from './features/settings/settings.component';
import { VerificationsComponent } from './features/verifications/verifications.component';
import { BadgesComponent } from './features/badges/badges.component';
import { ReviewsComponent } from './features/reviews/reviews.component';
import { AnnouncementsComponent } from './features/announcements/announcements.component';
import { ScriptActivityComponent } from './features/script-activity/script-activity.component';
import { PlacesManagementSimpleComponent } from './features/places-management-simple/places-management-simple.component';
import { CategoriesListComponent } from './features/categories/categories-list/categories-list.component';
// import { PlacesManagementFullComponent } from './features/places-management-full/places-management-full.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardEnhancedComponent },
      {
        path: 'appeals',
        loadChildren: () => APPEALS_ROUTES,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'moderator', 'support_agent'] }
      },
      {
        path: 'users',
        loadChildren: () => USERS_ROUTES,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'profile/:id',
        component: UserProfileComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'users/:id/edit',
        component: UserEditComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'places-management',
        redirectTo: 'places',
        pathMatch: 'full'
      },
      {
        path: 'places',
        component: PlacesComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'moderator', 'support_agent'] }
      },
      {
        path: 'places/:id',
        component: PlaceDetailComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'moderator', 'support_agent'] }
      },
      {
        path: 'places/new',
        component: PlaceDetailComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'moderator', 'support_agent'] }
      },
      {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'moderator'] }
      },
      {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'verifications',
        component: VerificationsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'moderator'] }
      },
      {
        path: 'badges',
        component: BadgesComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'user-management',
        component: UserManagementComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'moderator'] }
      },
      {
        path: 'reviews',
        component: ReviewsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'moderator'] }
      },
      {
        path: 'announcements',
        component: AnnouncementsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'script-activity',
        component: ScriptActivityComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'categories',
        component: CategoriesListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      }
    ]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
