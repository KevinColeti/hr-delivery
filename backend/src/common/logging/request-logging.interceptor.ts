import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { StructuredLoggerService } from './structured-logger.service';

@Injectable()
/**
 * Registra logs estruturados de ciclo de request HTTP.
 *
 * Eventos emitidos:
 * - `http.request.started`
 * - `http.request.completed`
 * - `http.request.failed`
 */
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const startedAt = Date.now();
    const requestMetadata = this.buildRequestMetadata(req);

    this.logger.info('http.request.started', requestMetadata);

    return next.handle().pipe(
      tap(() => {
        this.logger.info('http.request.completed', {
          ...requestMetadata,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
        });
      }),
      catchError((error: unknown) => {
        const statusCode = this.extractStatusCode(error) ?? 500;
        this.logger.error('http.request.failed', {
          ...requestMetadata,
          statusCode,
          durationMs: Date.now() - startedAt,
          errorName: error instanceof Error ? error.name : 'UnknownError',
          errorMessage: error instanceof Error ? error.message : String(error),
        });

        return throwError(() => error);
      }),
    );
  }

  /**
   * Coleta metadados relevantes para correlacao operacional.
   */
  private buildRequestMetadata(req: Request) {
    return {
      requestId: req.requestId ?? null,
      method: req.method,
      path: req.originalUrl || req.url,
      userId: req.user?.id ?? null,
      userRole: req.user?.role ?? null,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? null,
    };
  }

  /**
   * Extrai status HTTP de excecoes padrao do Nest.
   */
  private extractStatusCode(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'getStatus' in error &&
      typeof (error as { getStatus: unknown }).getStatus === 'function'
    ) {
      return (error as { getStatus: () => number }).getStatus();
    }

    return null;
  }
}
