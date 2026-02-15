import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminAuthService } from '../services/admin-auth.service';

/**
 * Injeta token JWT nas chamadas para API local quando sessao admin existir.
 *
 * Motivo:
 * centralizar envio do header `Authorization` e evitar repeticao nos servicos.
 */
export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AdminAuthService);
  const token = authService.token();

  // Limitamos o header a chamadas da API local para nao vazar token em
  // requests externas (imagens/CDN/servicos de terceiros).
  if (!token || !req.url.startsWith('http://localhost:3000/')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
