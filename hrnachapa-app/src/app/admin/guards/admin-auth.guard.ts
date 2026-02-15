import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AdminAuthService, AdminUserRole } from '../services/admin-auth.service';

/**
 * Guarda de autenticacao e autorizacao por papel para rotas administrativas.
 *
 * Estrategia:
 * - sem sessao: redireciona para `/admin/login`;
 * - com sessao sem papel exigido: redireciona para `/admin/forbidden`.
 */
export const adminAuthGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    // Preservamos returnUrl para que o operador volte exatamente ao destino
    // original apos autenticar, reduzindo retrabalho no fluxo admin.
    return router.createUrlTree(['/admin/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const requiredRoles = route.data['roles'] as AdminUserRole[] | undefined;
  if (requiredRoles && requiredRoles.length > 0 && !authService.hasAnyRole(requiredRoles)) {
    return router.createUrlTree(['/admin/forbidden']);
  }

  return true;
};
