import { ApplicationRef, inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize, tap } from 'rxjs';

/**
 * Sincroniza render da UI apos requests HTTP em modo zoneless.
 *
 * Motivo:
 * sem zone.js, callbacks assincronos podem atualizar estado sem disparar
 * deteccao automaticamente. Este interceptor centraliza o tick apos cada
 * request finalizado para evitar "UI so atualiza quando clico".
 */
export const httpUiSyncInterceptor: HttpInterceptorFn = (req, next) => {
  const appRef = inject(ApplicationRef);

  return next(req).pipe(
    tap({
      next: () => appRef.tick(),
      error: () => appRef.tick(),
    }),
    finalize(() => {
      appRef.tick();
    }),
  );
};
