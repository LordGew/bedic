import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log('🔐 Interceptor - Token:', token ? '✅ Presente' : '❌ No encontrado');
  console.log('📍 URL:', req.url);

  if (token) {
    console.log('✅ Agregando token al header');
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else {
    console.log('❌ Sin token, request sin autenticación');
  }

  return next(req);
};
