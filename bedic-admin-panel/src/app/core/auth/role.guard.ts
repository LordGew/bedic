import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] as string[];
    const hasRole = requiredRoles?.some(role => this.auth.hasRole(role));

    if (!hasRole) {
      this.router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }
}
