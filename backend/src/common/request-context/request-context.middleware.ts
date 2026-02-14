import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
/**
 * Garante um identificador de correlacao por request.
 *
 * Regra:
 * - reaproveita `x-request-id` se vier do cliente/gateway;
 * - cria um novo UUID quando nao informado.
 */
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incomingRequestId = req.header('x-request-id');
    const requestId = incomingRequestId?.trim() || randomUUID();

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    next();
  }
}
