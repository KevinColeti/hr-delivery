import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AdminAuthService } from '../services/admin-auth.service';

/**
 * Injeta token JWT nas chamadas para API local quando sessao admin existir.
 *
 * Motivo:
 * centralizar envio do header `Authorization` e evitar repeticao nos servicos.
 */
export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);
  const token = authService.token();
  const hasAuthenticatedSession = authService.isAuthenticated();
  const isLocalApiRequest = req.url.startsWith('http://localhost:3000/');
  const shouldAttachAuthorization =
    Boolean(token) && hasAuthenticatedSession && isLocalApiRequest;

  // Limitamos o header a chamadas da API local para nao vazar token em
  // requests externas (imagens/CDN/servicos de terceiros).
  const request = shouldAttachAuthorization
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(request).pipe(
    catchError((error) => {
      if (shouldAttachAuthorization && error?.status === 401) {
        authService.logout();
        if (!router.url.startsWith('/admin/login')) {
          // Guardamos returnUrl somente quando a rota atual e do admin,
          // porque em contexto publico o retorno apos login deve ser dashboard.
          const queryParams = router.url.startsWith('/admin')
            ? { returnUrl: router.url }
            : undefined;
          void router.navigate(['/admin/login'], { queryParams });
        }
      }

      return throwError(() => error);
    }),
  );
};
